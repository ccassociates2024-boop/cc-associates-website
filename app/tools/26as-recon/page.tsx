"use client";

import { useState, useCallback } from "react";
import { RefreshCw, ArrowLeft, Upload, CheckCircle, AlertCircle, Shield } from "lucide-react";
import Link from "next/link";

interface TDSEntry {
  tan: string;
  deductorName: string;
  section: string;
  quarter: string;
  amount: number;
  tdsDeducted: number;
  source: "26as" | "books";
}

interface ReconResult {
  matched: Array<TDSEntry & { booksEntry: TDSEntry }>;
  in26asOnly: TDSEntry[];
  inBooksOnly: TDSEntry[];
  amountMismatch: Array<{ as26: TDSEntry; books: TDSEntry; diff: number }>;
  summary: { matched: number; in26asOnly: number; inBooksOnly: number; mismatch: number; total26asTDS: number; totalBooksTDS: number };
}

type TabType = "summary" | "matched" | "26asOnly" | "booksOnly" | "mismatch";

function parseData(data: Record<string, string>[], source: "26as" | "books"): TDSEntry[] {
  return data.map(d => {
    const keys: Record<string, string> = {};
    Object.keys(d).forEach(k => { keys[k.toLowerCase().replace(/[^a-z0-9]/g, "")] = d[k]; });
    const get = (...ks: string[]) => { for (const k of ks) if (keys[k]) return keys[k]; return ""; };
    return {
      tan: get("tan", "deductortan", "tanno"),
      deductorName: get("deductorname", "name", "employername"),
      section: get("section", "tassection", "sectioncode"),
      quarter: get("quarter", "quartertype", "q"),
      amount: parseFloat(get("amount", "grossamount", "paidamount", "totalamount") || "0") || 0,
      tdsDeducted: parseFloat(get("tdsdeducted", "tds", "taxdeducted", "tdsamt") || "0") || 0,
      source,
    };
  });
}

export default function TwentyFiveReconPage() {
  const [asFile, setAsFile] = useState<File | null>(null);
  const [booksFile, setBooksFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ReconResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("summary");
  const [error, setError] = useState("");

  const handleReconcile = useCallback(async () => {
    if (!asFile || !booksFile) { setError("Please upload both files."); return; }
    setProcessing(true);
    setError("");
    try {
      const XLSX = await import("xlsx");

      const readFile = (file: File): Promise<Record<string, string>[]> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              if (file.name.endsWith(".csv")) {
                const lines = (e.target?.result as string).split("\n");
                const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
                const rows = lines.slice(1).filter(l => l.trim()).map(line => {
                  const cols = line.split(",");
                  const row: Record<string, string> = {};
                  headers.forEach((h, i) => { row[h] = (cols[i] || "").trim(); });
                  return row;
                });
                resolve(rows);
              } else {
                const wb = XLSX.read(e.target?.result, { type: "binary" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                resolve(XLSX.utils.sheet_to_json(ws, { raw: false, defval: "" }) as Record<string, string>[]);
              }
            } catch (err) { reject(err); }
          };
          if (file.name.endsWith(".csv")) reader.readAsText(file);
          else reader.readAsBinaryString(file);
        });

      const asData = parseData(await readFile(asFile), "26as");
      const booksData = parseData(await readFile(booksFile), "books");

      const matched: ReconResult["matched"] = [];
      const amountMismatch: ReconResult["amountMismatch"] = [];
      const in26asOnly: TDSEntry[] = [];
      const remaining26as = [...asData];
      const inBooksOnly: TDSEntry[] = [];

      booksData.forEach(bEntry => {
        const idx = remaining26as.findIndex(
          a =>
            a.tan.toUpperCase() === bEntry.tan.toUpperCase() &&
            a.section === bEntry.section &&
            a.quarter === bEntry.quarter
        );
        if (idx !== -1) {
          const asEntry = remaining26as[idx];
          remaining26as.splice(idx, 1);
          const diff = Math.abs(asEntry.tdsDeducted - bEntry.tdsDeducted);
          if (diff < 1) {
            matched.push({ ...bEntry, booksEntry: asEntry });
          } else {
            amountMismatch.push({ as26: asEntry, books: bEntry, diff });
          }
        } else {
          inBooksOnly.push(bEntry);
        }
      });

      remaining26as.forEach(e => in26asOnly.push(e));

      setResult({
        matched, in26asOnly, inBooksOnly, amountMismatch,
        summary: {
          matched: matched.length,
          in26asOnly: in26asOnly.length,
          inBooksOnly: inBooksOnly.length,
          mismatch: amountMismatch.length,
          total26asTDS: asData.reduce((s, e) => s + e.tdsDeducted, 0),
          totalBooksTDS: booksData.reduce((s, e) => s + e.tdsDeducted, 0),
        },
      });
      setActiveTab("summary");
    } catch (e: any) {
      setError("Error: " + (e?.message || "Check file format"));
    } finally {
      setProcessing(false);
    }
  }, [asFile, booksFile]);

  const fmt = (n: number) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(n);

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted hover:text-dark mb-6">
          <ArrowLeft size={15} /> Back to Tools
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <RefreshCw className="text-primary" size={22} /> 26AS TDS Reconciliation
          </h1>
          <p className="text-muted text-sm mt-1">Match Form 26AS with your Books TDS Receivable ledger. Find mismatches, missing entries, and amount differences.</p>
        </div>

        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-5 text-xs text-green-800">
          <Shield size={14} className="text-green-600 flex-shrink-0" />
          <span>Your financial data is processed 100% in your browser. Nothing is uploaded anywhere.</span>
        </div>

        <div className="bg-white rounded-card shadow-card border border-gray-100 p-6 mb-5">
          <h2 className="font-semibold text-dark mb-4 pb-2 border-b border-gray-100">Upload Files</h2>
          <div className="grid sm:grid-cols-2 gap-5 mb-4">
            {[
              { label: "Form 26AS (Download from IT Portal)", hint: "Required: TAN, Section, Quarter, Amount, TDS Deducted", file: asFile, setFile: setAsFile },
              { label: "Books TDS Receivable Ledger", hint: "Required: Deductor TAN, Section, Quarter, TDS Amount", file: booksFile, setFile: setBooksFile },
            ].map(({ label, hint, file, setFile }, i) => (
              <div key={i}>
                <label className="label">{label}</label>
                <label className="block cursor-pointer border-2 border-dashed border-gray-200 rounded-lg p-5 hover:border-primary/50 transition-colors">
                  <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                  {file ? (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-dark font-medium">{file.name}</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload size={24} className="mx-auto text-muted mb-2" />
                      <p className="text-sm text-muted">Browse or drop .xlsx / .csv</p>
                    </div>
                  )}
                </label>
                <p className="text-xs text-muted mt-1">{hint}</p>
              </div>
            ))}
          </div>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> {error}
            </div>
          )}
          <button onClick={handleReconcile} disabled={processing || !asFile || !booksFile} className="btn-primary gap-2 disabled:opacity-50">
            {processing ? "Processing..." : "Start Reconciliation"}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-card shadow-card border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {[
                { key: "summary", label: "Summary" },
                { key: "matched", label: `Matched (${result.summary.matched})`, color: "text-green-600" },
                { key: "26asOnly", label: `In 26AS Only (${result.summary.in26asOnly})`, color: "text-orange-600" },
                { key: "booksOnly", label: `In Books Only (${result.summary.inBooksOnly})`, color: "text-red-600" },
                { key: "mismatch", label: `Amount Mismatch (${result.summary.mismatch})`, color: "text-purple-600" },
              ].map(({ key, label, color }) => (
                <button key={key} onClick={() => setActiveTab(key as TabType)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === key ? "border-primary text-primary" : "border-transparent text-muted hover:text-dark"} ${color || ""}`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {activeTab === "summary" && (
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                    {[
                      { label: "Matched", value: result.summary.matched, cls: "text-green-600 bg-green-50 border-green-200" },
                      { label: "26AS Only", value: result.summary.in26asOnly, cls: "text-orange-600 bg-orange-50 border-orange-200" },
                      { label: "Books Only", value: result.summary.inBooksOnly, cls: "text-red-600 bg-red-50 border-red-200" },
                      { label: "Amount Mismatch", value: result.summary.mismatch, cls: "text-purple-600 bg-purple-50 border-purple-200" },
                    ].map(({ label, value, cls }) => (
                      <div key={label} className={`p-4 rounded-lg border ${cls}`}>
                        <div className="text-2xl font-bold mb-1">{value}</div>
                        <div className="text-xs">{label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div className="p-4 bg-background rounded-lg border border-gray-100">
                      <div className="text-muted text-xs mb-1">Total TDS in 26AS</div>
                      <div className="font-bold text-dark text-lg">₹{fmt(result.summary.total26asTDS)}</div>
                    </div>
                    <div className="p-4 bg-background rounded-lg border border-gray-100">
                      <div className="text-muted text-xs mb-1">Total TDS in Books</div>
                      <div className="font-bold text-dark text-lg">₹{fmt(result.summary.totalBooksTDS)}</div>
                    </div>
                  </div>
                  {Math.abs(result.summary.total26asTDS - result.summary.totalBooksTDS) > 0.5 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                      <strong>Difference: ₹{fmt(Math.abs(result.summary.total26asTDS - result.summary.totalBooksTDS))}</strong> — TDS credit in 26AS does not match books. Reconcile before ITR filing to avoid denial of credit.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "matched" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-primary text-white">
                        {["TAN", "Deductor", "Section", "Quarter", "26AS TDS (₹)", "Books TDS (₹)"].map(h => (
                          <th key={h} className="text-left py-2 px-3 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.matched.map((r, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-background"}>
                          <td className="py-2 px-3">{r.tan}</td>
                          <td className="py-2 px-3">{r.deductorName}</td>
                          <td className="py-2 px-3">{r.section}</td>
                          <td className="py-2 px-3">{r.quarter}</td>
                          <td className="py-2 px-3 text-right">₹{fmt(r.booksEntry.tdsDeducted)}</td>
                          <td className="py-2 px-3 text-right">₹{fmt(r.tdsDeducted)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {(activeTab === "26asOnly" || activeTab === "booksOnly") && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-primary text-white">
                        {["TAN", "Deductor", "Section", "Quarter", "Amount (₹)", "TDS (₹)"].map(h => (
                          <th key={h} className="text-left py-2 px-3 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(activeTab === "26asOnly" ? result.in26asOnly : result.inBooksOnly).map((r, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-background"}>
                          <td className="py-2 px-3">{r.tan}</td>
                          <td className="py-2 px-3">{r.deductorName}</td>
                          <td className="py-2 px-3">{r.section}</td>
                          <td className="py-2 px-3">{r.quarter}</td>
                          <td className="py-2 px-3 text-right">₹{fmt(r.amount)}</td>
                          <td className="py-2 px-3 text-right">₹{fmt(r.tdsDeducted)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "mismatch" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-purple-700 text-white">
                        {["TAN", "Section", "Quarter", "26AS TDS (₹)", "Books TDS (₹)", "Difference (₹)"].map(h => (
                          <th key={h} className="text-left py-2 px-3 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.amountMismatch.map((r, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-purple-50"}>
                          <td className="py-2 px-3">{r.as26.tan}</td>
                          <td className="py-2 px-3">{r.as26.section}</td>
                          <td className="py-2 px-3">{r.as26.quarter}</td>
                          <td className="py-2 px-3 text-right">₹{fmt(r.as26.tdsDeducted)}</td>
                          <td className="py-2 px-3 text-right">₹{fmt(r.books.tdsDeducted)}</td>
                          <td className="py-2 px-3 text-right font-bold text-red-600">₹{fmt(r.diff)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
