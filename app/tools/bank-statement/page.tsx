"use client";

import { useState, useCallback, useRef } from "react";
import { Database, ArrowLeft, Upload, Download, Shield, Eye, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

interface Transaction {
  date: string;
  description: string;
  cheque: string;
  debit: number;
  credit: number;
  balance: number;
}

type Step = "upload" | "processing" | "preview";

export default function BankStatementPage() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [editCell, setEditCell] = useState<{ row: number; col: keyof Transaction } | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const parseTransactions = (text: string): Transaction[] => {
    const lines = text.split("\n").filter(l => l.trim());
    const txns: Transaction[] = [];

    // Common date patterns: DD/MM/YYYY, DD-MM-YYYY, DD MMM YYYY
    const dateRegex = /(\d{2}[\/\-]\d{2}[\/\-]\d{2,4}|\d{2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4})/i;
    // Amount pattern: 1,23,456.78 or 123456.78
    const amountRegex = /[\d,]+\.\d{2}/g;
    // Cheque number: 6+ digit number
    const chequeRegex = /\b(\d{6,9})\b/;

    lines.forEach(line => {
      const dateMatch = line.match(dateRegex);
      if (!dateMatch) return;

      const amounts = line.match(amountRegex) || [];
      if (amounts.length === 0) return;

      const parsedAmounts = amounts.map(a => parseFloat(a.replace(/,/g, "")));
      const chequeMatch = line.match(chequeRegex);

      // Try to determine debit/credit based on position and keywords
      const lineUpper = line.toUpperCase();
      const isDebit = lineUpper.includes("DR") || lineUpper.includes("DEBIT") || lineUpper.includes("WITHDRAWAL");
      const isCredit = lineUpper.includes("CR") || lineUpper.includes("CREDIT") || lineUpper.includes("DEPOSIT");

      // Remove date and amounts from description
      let desc = line
        .replace(dateRegex, "")
        .replace(amountRegex, "")
        .replace(chequeRegex, "")
        .replace(/\b(DR|CR|DEBIT|CREDIT)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();

      let debit = 0, credit = 0, balance = 0;
      if (parsedAmounts.length >= 3) {
        // Likely: debit, credit, balance columns
        debit = parsedAmounts[0] || 0;
        credit = parsedAmounts[1] || 0;
        balance = parsedAmounts[2] || 0;
        // If both debit and credit non-zero, check keywords
        if (debit > 0 && credit > 0) {
          if (isCredit) { credit = debit; debit = 0; }
        }
      } else if (parsedAmounts.length === 2) {
        if (isDebit) debit = parsedAmounts[0];
        else if (isCredit) credit = parsedAmounts[0];
        else debit = parsedAmounts[0]; // assume debit
        balance = parsedAmounts[1];
      } else if (parsedAmounts.length === 1) {
        if (isCredit) credit = parsedAmounts[0];
        else debit = parsedAmounts[0];
      }

      txns.push({
        date: dateMatch[0],
        description: desc || "—",
        cheque: chequeMatch ? chequeMatch[1] : "",
        debit,
        credit,
        balance,
      });
    });

    return txns;
  };

  const processFile = useCallback(async () => {
    if (!file) return;
    setStep("processing");
    setError("");
    setProgress("Loading PDF...");

    try {
      let text = "";

      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setProgress("Extracting text from PDF...");
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

        let allText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          setProgress(`Extracting page ${i} of ${pdf.numPages}...`);
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map((item: any) => item.str).join(" ");
          allText += pageText + "\n";
        }
        text = allText;

        // If text extraction yielded nothing meaningful, try OCR
        if (text.replace(/\s/g, "").length < 100) {
          setProgress("PDF appears to be scanned. Running OCR...");
          // OCR using tesseract (simplified — full OCR from canvas in real impl)
          const Tesseract = await import("tesseract.js");
          const worker = await Tesseract.createWorker("eng");
          const url = URL.createObjectURL(file);
          const { data: { text: ocrText } } = await worker.recognize(url);
          await worker.terminate();
          URL.revokeObjectURL(url);
          text = ocrText;
        }
      }

      setProgress("Parsing transactions...");
      const txns = parseTransactions(text);

      if (txns.length === 0) {
        setError("No transactions detected. The PDF format may not be supported. Try a text-based PDF bank statement.");
        setStep("upload");
        return;
      }

      setTransactions(txns);
      setStep("preview");
    } catch (e: any) {
      setError("Error processing file: " + (e?.message || "Unknown error"));
      setStep("upload");
    }
  }, [file]);

  const updateCell = (row: number, col: keyof Transaction, val: string) => {
    const updated = [...transactions];
    if (col === "debit" || col === "credit" || col === "balance") {
      (updated[row] as any)[col] = parseFloat(val) || 0;
    } else {
      (updated[row] as any)[col] = val;
    }
    setTransactions(updated);
    setEditCell(null);
  };

  const downloadExcel = useCallback(async () => {
    const XLSX = await import("xlsx");

    // Sheet 1: Transactions
    const headers = ["Date", "Description", "Cheque No", "Debit (₹)", "Credit (₹)", "Balance (₹)"];
    const rows = transactions.map(t => [t.date, t.description, t.cheque, t.debit || "", t.credit || "", t.balance || ""]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Style header row
    const hdrRange = XLSX.utils.decode_range(ws["!ref"] || "A1");
    for (let c = hdrRange.s.c; c <= hdrRange.e.c; c++) {
      const cell = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[cell]) {
        ws[cell].s = { fill: { fgColor: { rgb: "1A3A6B" } }, font: { color: { rgb: "FFFFFF" }, bold: true } };
      }
    }

    ws["!cols"] = [{ wch: 14 }, { wch: 45 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];

    // Sheet 2: Summary
    const totalDebits = transactions.reduce((s, t) => s + (t.debit || 0), 0);
    const totalCredits = transactions.reduce((s, t) => s + (t.credit || 0), 0);
    const summaryData = [
      ["Bank Statement Summary", ""],
      ["", ""],
      ["Total Transactions", transactions.length],
      ["Total Debits (₹)", totalDebits],
      ["Total Credits (₹)", totalCredits],
      ["Net Cash Flow (₹)", totalCredits - totalDebits],
      ["Closing Balance (₹)", transactions[transactions.length - 1]?.balance || ""],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(summaryData);
    ws2["!cols"] = [{ wch: 25 }, { wch: 20 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.utils.book_append_sheet(wb, ws2, "Summary");
    XLSX.writeFile(wb, `bank_statement_${file?.name.replace(".pdf", "") || "export"}.xlsx`);
  }, [transactions, file]);

  const fmt = (n: number) => n ? new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(n) : "";

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted hover:text-dark mb-6">
          <ArrowLeft size={15} /> Back to Tools
        </Link>

        <div className="mb-4">
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <Database className="text-primary" size={22} /> PDF Bank Statement to Excel
          </h1>
          <p className="text-muted text-sm mt-1">Extract transactions from PDF bank statements to structured Excel with debit/credit columns.</p>
        </div>

        {/* Privacy */}
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-5 text-sm text-green-800 font-medium">
          <Shield size={16} className="text-green-600 flex-shrink-0" />
          <span>Your financial data is processed 100% in your browser. No data is uploaded to any server. Ever.</span>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-3 mb-6">
          {(["upload", "processing", "preview"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s ? "bg-primary text-white" :
                (step === "preview" && i < 2) || (step === "processing" && i < 1) ? "bg-green-500 text-white" : "bg-gray-200 text-muted"
              }`}>
                {(step === "preview" && i < 2) || (step === "processing" && i < 1) ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={`text-sm ${step === s ? "font-semibold text-dark" : "text-muted"}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
              {i < 2 && <div className="w-8 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        {step === "upload" && (
          <div className="bg-white rounded-card shadow-card border border-gray-100 p-6">
            <div
              className="border-2 border-dashed border-gray-200 rounded-lg p-10 text-center hover:border-primary/50 transition-colors cursor-pointer mb-5"
              onClick={() => inputRef.current?.click()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
              onDragOver={e => e.preventDefault()}
            >
              <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              {file ? (
                <div>
                  <Database size={40} className="mx-auto text-primary mb-3" />
                  <p className="font-medium text-dark">{file.name}</p>
                  <p className="text-muted text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <Upload size={40} className="mx-auto text-muted mb-3" />
                  <p className="font-medium text-dark mb-1">Upload PDF Bank Statement</p>
                  <p className="text-muted text-sm">Supports: SBI, HDFC, ICICI, Axis, Kotak, BOI, PNB and more</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> {error}
              </div>
            )}

            <button onClick={processFile} disabled={!file} className="btn-primary gap-2 w-full justify-center py-3.5 disabled:opacity-50">
              Extract Transactions
            </button>
          </div>
        )}

        {step === "processing" && (
          <div className="bg-white rounded-card shadow-card border border-gray-100 p-10 text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-semibold text-dark mb-2">Processing your PDF...</p>
            <p className="text-muted text-sm">{progress}</p>
            <p className="text-xs text-muted mt-3">This may take a moment for large files</p>
          </div>
        )}

        {step === "preview" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-dark">{transactions.length} transactions extracted</p>
                <p className="text-xs text-muted">Click any cell to edit</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setStep("upload"); setFile(null); setTransactions([]); }} className="btn-outline text-sm">
                  Start Over
                </button>
                <button onClick={downloadExcel} className="btn-primary gap-2 text-sm">
                  <Download size={15} /> Download Excel
                </button>
              </div>
            </div>

            {/* Summary bar */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Total Debits", value: transactions.reduce((s, t) => s + (t.debit || 0), 0), cls: "text-red-600" },
                { label: "Total Credits", value: transactions.reduce((s, t) => s + (t.credit || 0), 0), cls: "text-green-600" },
                { label: "Net Flow", value: transactions.reduce((s, t) => s + (t.credit || 0) - (t.debit || 0), 0), cls: "text-primary" },
              ].map(({ label, value, cls }) => (
                <div key={label} className="bg-white rounded-card shadow-card border border-gray-100 p-3 text-center">
                  <div className="text-xs text-muted mb-1">{label}</div>
                  <div className={`font-bold ${cls}`}>₹{fmt(Math.abs(value))}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-card shadow-card border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0">
                    <tr className="bg-primary text-white">
                      {["#", "Date", "Description", "Cheque No", "Debit (₹)", "Credit (₹)", "Balance (₹)"].map(h => (
                        <th key={h} className="text-left py-2.5 px-3 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-background"}>
                        <td className="py-2 px-3 text-muted">{i + 1}</td>
                        {(["date", "description", "cheque", "debit", "credit", "balance"] as (keyof Transaction)[]).map(col => (
                          <td
                            key={col}
                            className={`py-2 px-3 cursor-pointer hover:bg-yellow-50 transition-colors ${
                              col === "debit" && t.debit ? "text-red-600 font-medium text-right" :
                              col === "credit" && t.credit ? "text-green-600 font-medium text-right" :
                              col === "balance" ? "text-right" : ""
                            }`}
                            onClick={() => { setEditCell({ row: i, col }); setEditValue(String((t as any)[col])); }}
                          >
                            {editCell?.row === i && editCell.col === col ? (
                              <input
                                autoFocus
                                className="w-full border border-primary rounded px-1 py-0.5 text-xs"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={() => updateCell(i, col, editValue)}
                                onKeyDown={e => e.key === "Enter" && updateCell(i, col, editValue)}
                              />
                            ) : (
                              typeof (t as any)[col] === "number" && (t as any)[col] !== 0
                                ? fmt((t as any)[col])
                                : (t as any)[col] || "—"
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <p className="tool-disclaimer">
          Results are indicative only. Always consult a qualified tax professional for final decisions. Associate Piyush is not liable for any decisions made based on tool outputs. © 2026 Associate Piyush, Pune.
        </p>
      </div>
    </div>
  );
}
