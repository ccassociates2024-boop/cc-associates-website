"use client";

import { useState, useCallback } from "react";
import { FileSpreadsheet, ArrowLeft, Upload, CheckCircle, AlertCircle, Shield } from "lucide-react";
import Link from "next/link";

interface ReconRow {
  gstin: string;
  invoiceNo: string;
  date: string;
  taxable: number;
  gst: number;
  source: "books" | "2a";
}

interface MatchResult {
  matched: ReconRow[];
  inBooksOnly: ReconRow[];
  in2AOnly: ReconRow[];
  summary: { matched: number; booksOnly: number; twoAOnly: number; totalBooksGST: number; total2AGST: number };
}

type TabType = "matched" | "booksOnly" | "2aOnly" | "summary";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
  return lines.slice(1).map(line => {
    const cols = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (cols[i] || "").trim(); });
    return row;
  });
}

function findCol(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    if (row[k] !== undefined) return row[k];
  }
  return "";
}

export default function GSTR2AReconPage() {
  const [booksFile, setBooksFile] = useState<File | null>(null);
  const [twoAFile, setTwoAFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("summary");
  const [error, setError] = useState("");

  const handleFiles = useCallback(async () => {
    if (!booksFile || !twoAFile) { setError("Please upload both files."); return; }
    setProcessing(true);
    setError("");
    try {
      const XLSX = await import("xlsx");

      const readXlsx = (file: File): Promise<Record<string, string>[]> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const wb = XLSX.read(e.target?.result, { type: "binary" });
              const ws = wb.Sheets[wb.SheetNames[0]];
              const data = XLSX.utils.sheet_to_json(ws, { raw: false, defval: "" }) as Record<string, string>[];
              resolve(data);
            } catch (err) { reject(err); }
          };
          reader.readAsBinaryString(file);
        });

      const readFile = async (file: File): Promise<Record<string, string>[]> => {
        if (file.name.endsWith(".csv")) {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(parseCSV(e.target?.result as string || ""));
            reader.readAsText(file);
          });
        }
        return readXlsx(file);
      };

      const booksData = await readFile(booksFile);
      const twoAData = await readFile(twoAFile);

      const toRow = (d: Record<string, string>, source: "books" | "2a"): ReconRow => {
        const keys = Object.keys(d).reduce((acc, k) => { acc[k.toLowerCase().replace(/[^a-z0-9]/g, "")] = d[k]; return acc; }, {} as Record<string, string>);
        return {
          gstin: findCol(keys, "gstin", "suppliergstin", "gstin2", "vendorgstin") || "",
          invoiceNo: findCol(keys, "invoiceno", "invno", "billno", "docno", "invoice") || "",
          date: findCol(keys, "invoicedate", "date", "billdate", "docdate") || "",
          taxable: parseFloat(findCol(keys, "taxablevalue", "taxable", "taxableamt", "assessablevalue") || "0") || 0,
          gst: parseFloat(findCol(keys, "totalgst", "gstamount", "igst", "cgst", "totalgsttax", "taxamount") || "0") || 0,
          source,
        };
      };

      const booksRows = booksData.map(d => toRow(d, "books"));
      const twoARows = twoAData.map(d => toRow(d, "2a"));

      const matched: ReconRow[] = [];
      const inBooksOnly: ReconRow[] = [];
      const in2AOnly: ReconRow[] = [...twoARows];

      booksRows.forEach(br => {
        const idx = in2AOnly.findIndex(
          ar =>
            ar.gstin === br.gstin &&
            ar.invoiceNo.toLowerCase() === br.invoiceNo.toLowerCase()
        );
        if (idx !== -1) {
          matched.push(br);
          in2AOnly.splice(idx, 1);
        } else {
          inBooksOnly.push(br);
        }
      });

      setResult({
        matched,
        inBooksOnly,
        in2AOnly,
        summary: {
          matched: matched.length,
          booksOnly: inBooksOnly.length,
          twoAOnly: in2AOnly.length,
          totalBooksGST: booksRows.reduce((s, r) => s + r.gst, 0),
          total2AGST: twoARows.reduce((s, r) => s + r.gst, 0),
        },
      });
      setActiveTab("summary");
    } catch (e: any) {
      setError("Error processing files: " + (e?.message || "Unknown error. Ensure CSV/XLSX format."));
    } finally {
      setProcessing(false);
    }
  }, [booksFile, twoAFile]);

  const fmt = (n: number) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(n);

  const ReconTable = ({ rows }: { rows: ReconRow[] }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-primary text-white">
            {["GSTIN", "Invoice No", "Date", "Taxable (₹)", "GST (₹)"].map(h => (
              <th key={h} className="text-left py-2 px-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={5} className="py-8 text-center text-muted">No records</td></tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-background"}>
                <td className="py-2 px-3">{r.gstin || "—"}</td>
                <td className="py-2 px-3">{r.invoiceNo || "—"}</td>
                <td className="py-2 px-3">{r.date || "—"}</td>
                <td className="py-2 px-3 text-right">₹{fmt(r.taxable)}</td>
                <td className="py-2 px-3 text-right">₹{fmt(r.gst)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted hover:text-dark mb-6">
          <ArrowLeft size={15} /> Back to Tools
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <FileSpreadsheet className="text-primary" size={22} /> GSTR-2A / 2B Reconciliation
          </h1>
          <p className="text-muted text-sm mt-1">Upload your Purchase Register and GSTR-2A/2B export to find ITC mismatches instantly.</p>
        </div>

        {/* Privacy badge */}
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-5 text-xs text-green-800">
          <Shield size={14} className="text-green-600 flex-shrink-0" />
          <span>Your financial data never leaves your device. All processing happens 100% in your browser.</span>
        </div>

        <div className="bg-white rounded-card shadow-card border border-gray-100 p-6 mb-5">
          <h2 className="font-semibold text-dark mb-4 pb-2 border-b border-gray-100">Upload Files</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                label: "Purchase Register (Books)",
                hint: "Required columns: GSTIN, Invoice No, Date, Taxable Value, GST Amount",
                file: booksFile,
                setFile: setBooksFile,
                id: "books",
              },
              {
                label: "GSTR-2A / 2B Download",
                hint: "Download from GST Portal. Required: GSTIN, Invoice No, Date, Taxable, GST",
                file: twoAFile,
                setFile: setTwoAFile,
                id: "twoa",
              },
            ].map(({ label, hint, file, setFile, id }) => (
              <div key={id}>
                <label className="label">{label}</label>
                <label className="block cursor-pointer border-2 border-dashed border-gray-200 rounded-lg p-5 hover:border-primary/50 hover:bg-primary/3 transition-colors">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                  {file ? (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-dark font-medium">{file.name}</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload size={24} className="mx-auto text-muted mb-2" />
                      <p className="text-sm text-muted">Drop file or click to browse</p>
                      <p className="text-xs text-muted mt-1">.xlsx, .xls, .csv</p>
                    </div>
                  )}
                </label>
                <p className="text-xs text-muted mt-1">{hint}</p>
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleFiles}
            disabled={processing || !booksFile || !twoAFile}
            className="btn-primary mt-5 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? "Processing..." : "Reconcile Now"}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-card shadow-card border border-gray-100 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {[
                { key: "summary", label: "Summary", count: null },
                { key: "matched", label: "Matched", count: result.summary.matched, color: "text-green-600" },
                { key: "booksOnly", label: "In Books Not in 2A", count: result.summary.booksOnly, color: "text-red-600" },
                { key: "2aOnly", label: "In 2A Not in Books", count: result.summary.twoAOnly, color: "text-orange-600" },
              ].map(({ key, label, count, color }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as TabType)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-dark"
                  }`}
                >
                  {label}
                  {count !== null && (
                    <span className={`text-xs font-bold ${color}`}>{count}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-5">
              {activeTab === "summary" && (
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                    {[
                      { label: "Matched Invoices", value: result.summary.matched, color: "text-green-600 bg-green-50 border-green-200" },
                      { label: "In Books Only", value: result.summary.booksOnly, color: "text-red-600 bg-red-50 border-red-200" },
                      { label: "In 2A Only", value: result.summary.twoAOnly, color: "text-orange-600 bg-orange-50 border-orange-200" },
                      { label: "Total Invoices", value: result.matched.length + result.inBooksOnly.length + result.in2AOnly.length, color: "text-primary bg-primary/5 border-primary/20" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className={`p-4 rounded-lg border ${color}`}>
                        <div className="text-2xl font-bold mb-1">{value}</div>
                        <div className="text-xs">{label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div className="p-4 bg-background rounded-lg">
                      <div className="text-muted text-xs mb-1">Total GST in Books</div>
                      <div className="font-bold text-dark text-lg">₹{fmt(result.summary.totalBooksGST)}</div>
                    </div>
                    <div className="p-4 bg-background rounded-lg">
                      <div className="text-muted text-xs mb-1">Total GST in 2A/2B</div>
                      <div className="font-bold text-dark text-lg">₹{fmt(result.summary.total2AGST)}</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                    <strong>ITC at Risk:</strong> ₹{fmt(result.inBooksOnly.reduce((s, r) => s + r.gst, 0))} — These invoices are in your books but not reflected in GSTR-2A. Vendor may not have filed returns.
                  </div>
                </div>
              )}
              {activeTab === "matched" && <ReconTable rows={result.matched} />}
              {activeTab === "booksOnly" && <ReconTable rows={result.inBooksOnly} />}
              {activeTab === "2aOnly" && <ReconTable rows={result.in2AOnly} />}
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
