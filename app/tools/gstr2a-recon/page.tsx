"use client";

import { useState, useCallback } from "react";
import {
  FileSpreadsheet, ArrowLeft, Upload, CheckCircle, AlertCircle,
  Shield, Download, BookOpen, FileSearch, GitMerge, BarChart2,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PurchaseRow {
  party: string;
  date: string;
  vchNo: string;
  amount: number;
}

interface GSTR2ARow {
  period: string;
  supplier: string;
  gstin: string;
  invoiceNo: string;
  invoiceDate: string;
  invoiceValue: number;
  taxable: number;
  igst: number;
  cgst: number;
  sgst: number;
  itc: number;
  filingStatus: string;
}

interface MatchedRow { pr: PurchaseRow; ga: GSTR2ARow; }
interface MismatchRow { pr: PurchaseRow; ga: GSTR2ARow; diff: number; }

interface ReconResult {
  matched: MatchedRow[];
  onlyInBooks: PurchaseRow[];
  onlyIn2A: GSTR2ARow[];
  mismatch: MismatchRow[];
}

type TabType = "summary" | "matched" | "onlyIn2A" | "onlyInBooks" | "mismatch" | "period";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function norm(s: string) {
  return String(s || "").toUpperCase().replace(/[\s.\-\/&,()]/g, "");
}

function fuzzyMatch(a: string, b: string) {
  const na = norm(a); const nb = norm(b);
  if (!na || !nb) return false;
  return na.includes(nb) || nb.includes(na) || na === nb;
}

function fmtDate(raw: any): string {
  if (!raw) return "";
  if (typeof raw === "number") {
    const d = new Date(Math.round((raw - 25569) * 86400 * 1000));
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }
  return String(raw).trim();
}

function toNum(v: any) { return parseFloat(String(v || "0").replace(/,/g, "")) || 0; }

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

// ─── GSTR-2A Parser ───────────────────────────────────────────────────────────
// Handles the official GST portal B2B download format:
// - Multiple sheets (B2B, CDNR, ISD…); we use "B2B"
// - Rows 0-6 are metadata; row 7 is the actual header row

function parseGSTR2A(wb: any): GSTR2ARow[] {
  // Find B2B sheet (exact or partial name match)
  const sheetName =
    wb.SheetNames.find((s: string) => s.trim().toUpperCase() === "B2B") ||
    wb.SheetNames[0];
  const XLSX = (window as any).__XLSX__;
  const ws = wb.Sheets[sheetName];
  const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  // Find header row: first row that contains "Invoice No" or "Supplier Name"
  let hdrIdx = -1;
  for (let i = 0; i < Math.min(raw.length, 12); i++) {
    const rowStr = raw[i].map((c: any) => String(c).toLowerCase()).join("|");
    if (rowStr.includes("invoice no") || rowStr.includes("supplier name") || rowStr.includes("gstin")) {
      hdrIdx = i; break;
    }
  }
  if (hdrIdx === -1) return [];

  const hdrs = raw[hdrIdx].map((h: any) => String(h).trim().toLowerCase());
  const col = (...keys: string[]) => {
    for (const k of keys) {
      const idx = hdrs.findIndex((h: string) => h.includes(k));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const periodIdx   = col("period");
  const supplierIdx = col("supplier name", "trade name", "legal name");
  const gstinIdx    = col("gstin");
  const invNoIdx    = col("invoice no", "inv no", "document no");
  const invDateIdx  = col("invoice date", "document date");
  const invValIdx   = col("invoice value");
  const taxableIdx  = col("taxable value");
  const igstIdx     = col("igst");
  const cgstIdx     = col("cgst");
  const sgstIdx     = col("sgst");
  const filingIdx   = col("gstr-1/5 filling status", "filling status", "filing status");

  const rows: GSTR2ARow[] = [];
  for (let i = hdrIdx + 1; i < raw.length; i++) {
    const r = raw[i];
    if (r.every((c: any) => c === "")) continue;
    const period = String(r[periodIdx] ?? "").trim();
    if (!period) continue;
    const igst = toNum(r[igstIdx]);
    const cgst = toNum(r[cgstIdx]);
    const sgst = toNum(r[sgstIdx]);
    rows.push({
      period,
      supplier:     String(r[supplierIdx] ?? "").trim(),
      gstin:        String(r[gstinIdx]    ?? "").trim(),
      invoiceNo:    String(r[invNoIdx]    ?? "").trim(),
      invoiceDate:  fmtDate(r[invDateIdx]),
      invoiceValue: toNum(r[invValIdx]),
      taxable:      toNum(r[taxableIdx]),
      igst, cgst, sgst,
      itc: igst + cgst + sgst,
      filingStatus: String(r[filingIdx]   ?? "").trim(),
    });
  }
  return rows;
}

// ─── Purchase Register Parser ─────────────────────────────────────────────────
// Handles Tally export format:
// - Rows 0-5: company header / title
// - Row 6: column headers (Date, Particulars, Vch Type, Vch No., Debit, Credit)
// - Row 7: sub-headers (Amount, Amount)
// - Row 8+: data rows

function parsePurchaseReg(wb: any): PurchaseRow[] {
  const XLSX = (window as any).__XLSX__;
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  // Find header row: contains "date" AND ("particular" OR "party" OR "narration")
  let hdrIdx = -1;
  for (let i = 0; i < Math.min(raw.length, 12); i++) {
    const rowStr = raw[i].map((c: any) => String(c).toLowerCase()).join("|");
    if (rowStr.includes("date") && (rowStr.includes("particular") || rowStr.includes("party") || rowStr.includes("narration"))) {
      hdrIdx = i; break;
    }
  }
  if (hdrIdx === -1) return [];

  const hdrs = raw[hdrIdx].map((h: any) => String(h).trim().toLowerCase());
  const colIdx = (...keys: string[]) => {
    for (const k of keys) {
      const idx = hdrs.findIndex((h: string) => h.includes(k));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const dateIdx   = colIdx("date");
  const partyIdx  = colIdx("particular", "party", "narration", "description", "ledger");
  const debitIdx  = colIdx("debit", "dr");
  const creditIdx = colIdx("credit", "cr");
  const vchNoIdx  = colIdx("vch no", "voucher no", "bill no", "invoice no");

  // Skip header row + possible sub-header row
  const startRow = hdrIdx + (raw[hdrIdx + 1]?.every((c: any) => !c || String(c).toLowerCase().includes("amount")) ? 2 : 1);

  const rows: PurchaseRow[] = [];
  for (let i = startRow; i < raw.length; i++) {
    const r = raw[i];
    const party = String(r[partyIdx] ?? "").trim();
    if (!party || party.toLowerCase().startsWith("total") || party.toLowerCase().startsWith("grand")) continue;
    const dateRaw = r[dateIdx];
    if (!dateRaw) continue;
    const credit = toNum(r[creditIdx]);
    const debit  = toNum(r[debitIdx]);
    const amount = credit > 0 ? credit : debit;
    if (amount <= 0) continue;
    rows.push({
      party,
      date:  fmtDate(dateRaw),
      vchNo: String(r[vchNoIdx] ?? "").trim(),
      amount,
    });
  }
  return rows;
}

// ─── Reconcile ────────────────────────────────────────────────────────────────

function reconcile(books: PurchaseRow[], gstr2a: GSTR2ARow[]): ReconResult {
  const matched: MatchedRow[]  = [];
  const onlyInBooks: PurchaseRow[] = [];
  const mismatch: MismatchRow[] = [];
  const used2A = new Set<number>();

  books.forEach(pr => {
    let bestIdx = -1, bestScore = 0;

    gstr2a.forEach((ga, gi) => {
      if (used2A.has(gi)) return;
      const nameMatch  = fuzzyMatch(pr.party, ga.supplier);
      const amtExact   = Math.abs(ga.invoiceValue - pr.amount) < 1;
      const amtClose   = Math.abs(ga.invoiceValue - pr.amount) < pr.amount * 0.02; // within 2%
      const score = (nameMatch ? 4 : 0) + (amtExact ? 5 : amtClose ? 2 : 0);
      if (score > bestScore) { bestScore = score; bestIdx = gi; }
    });

    if (bestIdx >= 0 && bestScore >= 4) {
      const ga = gstr2a[bestIdx];
      used2A.add(bestIdx);
      const diff = ga.invoiceValue - pr.amount;
      if (Math.abs(diff) < 1) {
        matched.push({ pr, ga });
      } else {
        mismatch.push({ pr, ga, diff });
      }
    } else {
      onlyInBooks.push(pr);
    }
  });

  const onlyIn2A = gstr2a.filter((_, i) => !used2A.has(i));

  return { matched, onlyInBooks, onlyIn2A, mismatch };
}

// ─── Excel Download ───────────────────────────────────────────────────────────

function downloadExcel(result: ReconResult, gstr2a: GSTR2ARow[]) {
  const XLSX = (window as any).__XLSX__;
  const wb = XLSX.utils.book_new();

  // Summary
  const totalITC2A = gstr2a.reduce((s, r) => s + r.itc, 0);
  const matchedITC = result.matched.reduce((s, r) => s + r.ga.itc, 0);
  const unbookedITC = result.onlyIn2A.reduce((s, r) => s + r.itc, 0);
  const summaryData = [
    ["GST PURCHASE RECONCILIATION — FY 2025-26"],
    ["Entity: SHRIVINAYAK FACILITIES MANAGEMENT SERVICES"],
    [],
    ["Category", "Count", "Remarks"],
    ["Matched Invoices", result.matched.length, "In both books and GSTR-2A"],
    ["Only in GSTR-2A (Unbooked)", result.onlyIn2A.length, "Book in Tally to claim ITC"],
    ["Only in Books", result.onlyInBooks.length, "Supplier may not have filed"],
    ["Amount Mismatch", result.mismatch.length, "Investigate discrepancy"],
    [],
    ["ITC Confirmed (Matched)", `₹${inr(matchedITC)}`],
    ["ITC Pending (Only in 2A)", `₹${inr(unbookedITC)}`],
    ["Total ITC in GSTR-2A", `₹${inr(totalITC2A)}`],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Summary");

  // Matched
  if (result.matched.length) {
    const data = result.matched.map(({ pr, ga }) => ({
      "Books Party": pr.party, "Books Date": pr.date, "Books Amount (₹)": pr.amount,
      "2A Supplier": ga.supplier, "GSTIN": ga.gstin, "Invoice No": ga.invoiceNo,
      "Invoice Date": ga.invoiceDate, "Taxable (₹)": ga.taxable,
      "IGST (₹)": ga.igst, "CGST (₹)": ga.cgst, "SGST (₹)": ga.sgst,
      "ITC (₹)": ga.itc, "Period": ga.period, "Supplier Filed?": ga.filingStatus,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Matched");
  }

  // Only in 2A
  if (result.onlyIn2A.length) {
    const data = result.onlyIn2A.map(ga => ({
      "Supplier": ga.supplier, "GSTIN": ga.gstin, "Invoice No": ga.invoiceNo,
      "Invoice Date": ga.invoiceDate, "Invoice Value (₹)": ga.invoiceValue,
      "Taxable (₹)": ga.taxable, "IGST (₹)": ga.igst, "CGST (₹)": ga.cgst,
      "SGST (₹)": ga.sgst, "ITC (₹)": ga.itc, "Period": ga.period,
      "Supplier Filed?": ga.filingStatus, "Action": "Book in Tally — ITC available",
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Only_In_2A");
  }

  // Only in Books
  if (result.onlyInBooks.length) {
    const data = result.onlyInBooks.map(pr => ({
      "Party": pr.party, "Date": pr.date, "Vch No": pr.vchNo, "Amount (₹)": pr.amount,
      "Remark": "Not found in GSTR-2A — verify if supplier filed",
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Only_In_Books");
  }

  // Mismatch
  if (result.mismatch.length) {
    const data = result.mismatch.map(({ pr, ga, diff }) => ({
      "Books Party": pr.party, "Books Amount (₹)": pr.amount,
      "2A Supplier": ga.supplier, "2A Invoice Value (₹)": ga.invoiceValue,
      "Difference (₹)": diff, "Invoice No": ga.invoiceNo, "Period": ga.period,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Amount_Mismatch");
  }

  XLSX.writeFile(wb, "GST_Purchase_Reconciliation.xlsx");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GSTR2AReconPage() {
  const [booksFile,  setBooksFile]  = useState<File | null>(null);
  const [twoAFile,   setTwoAFile]   = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result,     setResult]     = useState<ReconResult | null>(null);
  const [gstr2aRows, setGstr2aRows] = useState<GSTR2ARow[]>([]);
  const [activeTab,  setActiveTab]  = useState<TabType>("summary");
  const [error,      setError]      = useState("");

  const handleReconcile = useCallback(async () => {
    if (!booksFile || !twoAFile) { setError("Please upload both files."); return; }
    setProcessing(true); setError(""); setResult(null);
    try {
      const XLSX = await import("xlsx");
      (window as any).__XLSX__ = XLSX;

      const readWb = (file: File): Promise<any> =>
        new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try { res(XLSX.read(e.target?.result, { type: "binary" })); }
            catch (err) { rej(err); }
          };
          reader.readAsBinaryString(file);
        });

      const [booksWb, twoAWb] = await Promise.all([readWb(booksFile), readWb(twoAFile)]);

      const books  = parsePurchaseReg(booksWb);
      const gst2a  = parseGSTR2A(twoAWb);

      if (!books.length)  throw new Error("Could not read purchase register. Ensure it's a Tally export with Date, Particulars, and Credit/Debit columns.");
      if (!gst2a.length)  throw new Error("Could not read GSTR-2A. Ensure it's the official GST Portal B2B download (xlsx format with B2B sheet).");

      const r = reconcile(books, gst2a);
      setGstr2aRows(gst2a);
      setResult(r);
      setActiveTab("summary");
    } catch (e: any) {
      setError(e?.message || "Error processing files. Please check the file formats.");
    } finally {
      setProcessing(false);
    }
  }, [booksFile, twoAFile]);

  // Period-wise summary from GSTR-2A
  const periodMap = gstr2aRows.reduce<Record<string, { invoices: number; value: number; itc: number }>>((acc, r) => {
    if (!acc[r.period]) acc[r.period] = { invoices: 0, value: 0, itc: 0 };
    acc[r.period].invoices++;
    acc[r.period].value += r.invoiceValue;
    acc[r.period].itc   += r.itc;
    return acc;
  }, {});

  const totalITC2A   = gstr2aRows.reduce((s, r) => s + r.itc, 0);
  const matchedITC   = result?.matched.reduce((s, r) => s + r.ga.itc, 0) ?? 0;
  const unbookedITC  = result?.onlyIn2A.reduce((s, r) => s + r.itc, 0) ?? 0;
  const booksOnlyAmt = result?.onlyInBooks.reduce((s, r) => s + r.amount, 0) ?? 0;

  const PERIOD_ORDER = [
    "April, 2025","May, 2025","June, 2025","July, 2025","August, 2025",
    "September, 2025","October, 2025","November, 2025","December, 2025",
    "January, 2026","February, 2026","March, 2026",
  ];

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted hover:text-dark mb-6">
          <ArrowLeft size={15} /> Back to Tools
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <FileSpreadsheet className="text-primary" size={22} />
            GSTR-2A / 2B Purchase Reconciliation
          </h1>
          <p className="text-muted text-sm mt-1">
            Upload your Tally Purchase Register and GST Portal GSTR-2A download to identify ITC mismatches, unbooked purchases, and filing gaps.
          </p>
        </div>

        {/* Privacy badge */}
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-5 text-xs text-green-800">
          <Shield size={14} className="text-green-600 flex-shrink-0" />
          Your financial data never leaves your device. All processing happens 100% in your browser.
        </div>

        {/* Format guide */}
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          {[
            {
              icon: BookOpen, title: "Purchase Register (Tally)", color: "text-blue-600 bg-blue-50 border-blue-200",
              items: ["Tally export: Purchase Register", "Columns: Date, Particulars, Vch Type, Vch No., Credit"],
            },
            {
              icon: FileSearch, title: "GSTR-2A / 2B (GST Portal)", color: "text-purple-600 bg-purple-50 border-purple-200",
              items: ["Download from GST Portal → Returns → View/Download GSTR-2A", "Must be .xlsx format with B2B sheet"],
            },
          ].map(({ icon: Icon, title, color, items }) => (
            <div key={title} className={`p-3 rounded-lg border text-xs ${color}`}>
              <div className="flex items-center gap-1.5 font-semibold mb-1.5">
                <Icon size={13} /> {title}
              </div>
              {items.map(i => <div key={i} className="flex gap-1"><span className="opacity-60">→</span>{i}</div>)}
            </div>
          ))}
        </div>

        {/* Upload */}
        <div className="bg-white rounded-card shadow-card border border-gray-100 p-6 mb-5">
          <h2 className="font-semibold text-dark mb-4 pb-2 border-b border-gray-100">Upload Files</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { label: "Purchase Register (Books)", file: booksFile, setFile: setBooksFile, id: "books", hint: "Tally export .xls/.xlsx" },
              { label: "GSTR-2A / 2B (Portal Download)", file: twoAFile, setFile: setTwoAFile, id: "twoa", hint: "GST Portal .xlsx with B2B sheet" },
            ].map(({ label, file, setFile, id, hint }) => (
              <div key={id}>
                <label className="label">{label}</label>
                <label className="block cursor-pointer border-2 border-dashed border-gray-200 rounded-lg p-5 hover:border-primary/50 hover:bg-primary/3 transition-colors">
                  <input
                    type="file" accept=".xlsx,.xls,.csv" className="hidden"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                  {file ? (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-dark font-medium truncate">{file.name}</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload size={24} className="mx-auto text-muted mb-2" />
                      <p className="text-sm text-muted">Drop file or click to browse</p>
                      <p className="text-xs text-muted mt-1">{hint}</p>
                    </div>
                  )}
                </label>
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> {error}
            </div>
          )}

          <button
            onClick={handleReconcile}
            disabled={processing || !booksFile || !twoAFile}
            className="btn-primary mt-5 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GitMerge size={16} />
            {processing ? "Processing…" : "Reconcile Now"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Matched", value: result.matched.length,    color: "text-green-700  bg-green-50  border-green-200",  sub: `ITC ₹${inr(matchedITC)}`   },
                { label: "Only in 2A", value: result.onlyIn2A.length,  color: "text-orange-700 bg-orange-50 border-orange-200", sub: `ITC ₹${inr(unbookedITC)}`  },
                { label: "Only in Books", value: result.onlyInBooks.length, color: "text-red-700    bg-red-50    border-red-200",    sub: `₹${inr(booksOnlyAmt)} value` },
                { label: "Mismatch", value: result.mismatch.length,   color: "text-yellow-700 bg-yellow-50 border-yellow-200", sub: "Amount differs"          },
              ].map(({ label, value, color, sub }) => (
                <div key={label} className={`p-4 rounded-lg border ${color}`}>
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-xs font-semibold mt-0.5">{label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{sub}</div>
                </div>
              ))}
            </div>

            {/* ITC banner */}
            <div className="grid sm:grid-cols-3 gap-3 mb-5">
              {[
                { label: "ITC Confirmed (Matched)",      value: matchedITC,  color: "text-green-700  bg-green-50  border-green-200"  },
                { label: "ITC Pending (Unbooked in 2A)", value: unbookedITC, color: "text-orange-700 bg-orange-50 border-orange-200" },
                { label: "Total ITC in GSTR-2A",         value: totalITC2A,  color: "text-primary    bg-primary/5 border-primary/20" },
              ].map(({ label, value, color }) => (
                <div key={label} className={`p-4 rounded-lg border ${color}`}>
                  <div className="text-xs font-medium opacity-70 mb-1">{label}</div>
                  <div className="text-lg font-bold">₹{inr(value)}</div>
                </div>
              ))}
            </div>

            {/* Download button */}
            <div className="flex justify-end mb-3">
              <button
                onClick={() => downloadExcel(result, gstr2aRows)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={15} /> Download Excel Report
              </button>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-card shadow-card border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-100 overflow-x-auto">
                {[
                  { key: "summary",    label: "Summary",          icon: BarChart2,      count: null,                       color: "" },
                  { key: "matched",    label: "Matched",          icon: CheckCircle,    count: result.matched.length,      color: "text-green-600" },
                  { key: "onlyIn2A",  label: "Only in 2A",       icon: FileSearch,     count: result.onlyIn2A.length,     color: "text-orange-600" },
                  { key: "onlyInBooks",label: "Only in Books",   icon: BookOpen,       count: result.onlyInBooks.length,  color: "text-red-600" },
                  { key: "mismatch",   label: "Amount Mismatch", icon: AlertCircle,    count: result.mismatch.length,     color: "text-yellow-600" },
                  { key: "period",     label: "Period-wise",     icon: BarChart2,      count: null,                       color: "" },
                ].map(({ key, label, count, color }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as TabType)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === key ? "border-primary text-primary" : "border-transparent text-muted hover:text-dark"
                    }`}
                  >
                    {label}
                    {count !== null && <span className={`font-bold ${color}`}>{count}</span>}
                  </button>
                ))}
              </div>

              <div className="p-5">

                {/* ── Summary tab ── */}
                {activeTab === "summary" && (
                  <div className="space-y-4">
                    {unbookedITC > 0 && (
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                        <strong>⚠️ Action Required:</strong> ₹{inr(unbookedITC)} ITC is available in GSTR-2A but not booked in your Purchase Register.
                        Book {result.onlyIn2A.length} invoice(s) in Tally immediately to claim this ITC.
                      </div>
                    )}
                    {result.onlyInBooks.length > 0 && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                        <strong>🔴 ITC at Risk:</strong> {result.onlyInBooks.length} book entries not found in GSTR-2A.
                        Supplier may not have filed GSTR-1. Follow up immediately.
                      </div>
                    )}
                    {result.matched.length > 0 && result.onlyIn2A.length === 0 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                        <strong>✅ Clean:</strong> All purchase entries matched with GSTR-2A. ITC of ₹{inr(matchedITC)} is confirmed.
                      </div>
                    )}
                    <table className="w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left py-2 px-3 text-muted font-medium">Category</th>
                          <th className="text-right py-2 px-3 text-muted font-medium">Count</th>
                          <th className="text-right py-2 px-3 text-muted font-medium">ITC / Amount</th>
                          <th className="text-left py-2 px-3 text-muted font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: "Matched", count: result.matched.length,      amt: matchedITC,  action: "None — ITC confirmed",               cls: "text-green-700"  },
                          { label: "Only in GSTR-2A", count: result.onlyIn2A.length,   amt: unbookedITC, action: "Book in Tally to claim ITC",         cls: "text-orange-700" },
                          { label: "Only in Books",   count: result.onlyInBooks.length, amt: booksOnlyAmt, action: "Verify supplier GSTR-1 filing",       cls: "text-red-700"    },
                          { label: "Amount Mismatch", count: result.mismatch.length,    amt: 0,           action: "Investigate & correct the difference", cls: "text-yellow-700" },
                        ].map(({ label, count, amt, action, cls }) => (
                          <tr key={label} className="border-t border-gray-100">
                            <td className={`py-2 px-3 font-medium ${cls}`}>{label}</td>
                            <td className={`py-2 px-3 text-right font-bold ${cls}`}>{count}</td>
                            <td className="py-2 px-3 text-right text-dark">₹{inr(amt)}</td>
                            <td className="py-2 px-3 text-muted">{action}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── Matched tab ── */}
                {activeTab === "matched" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-green-600 text-white">
                          {["Books Party","Books Date","Books Amt (₹)","2A Supplier","GSTIN","Invoice No","Invoice Date","Taxable (₹)","ITC (₹)","Period","Filed?"].map(h => (
                            <th key={h} className="text-left py-2 px-3 font-medium whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.matched.length === 0 ? (
                          <tr><td colSpan={11} className="py-8 text-center text-muted">No matched records</td></tr>
                        ) : result.matched.map(({ pr, ga }, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-green-50/40"}>
                            <td className="py-2 px-3 font-medium">{pr.party}</td>
                            <td className="py-2 px-3 whitespace-nowrap">{pr.date}</td>
                            <td className="py-2 px-3 text-right">₹{inr(pr.amount)}</td>
                            <td className="py-2 px-3">{ga.supplier}</td>
                            <td className="py-2 px-3 font-mono text-xs">{ga.gstin}</td>
                            <td className="py-2 px-3">{ga.invoiceNo}</td>
                            <td className="py-2 px-3 whitespace-nowrap">{ga.invoiceDate}</td>
                            <td className="py-2 px-3 text-right">₹{inr(ga.taxable)}</td>
                            <td className="py-2 px-3 text-right font-semibold text-green-700">₹{inr(ga.itc)}</td>
                            <td className="py-2 px-3 whitespace-nowrap">{ga.period}</td>
                            <td className="py-2 px-3">{ga.filingStatus === "Yes" ? <span className="text-green-600 font-semibold">✓ Yes</span> : <span className="text-red-600">✗ No</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── Only in 2A tab ── */}
                {activeTab === "onlyIn2A" && (
                  <div>
                    <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-800">
                      <strong>These invoices are in GSTR-2A but NOT in your Purchase Register.</strong> All have been filed by suppliers.
                      Book them in Tally to claim ITC of <strong>₹{inr(unbookedITC)}</strong>.
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-orange-500 text-white">
                            {["Supplier","GSTIN","Invoice No","Invoice Date","Invoice Value (₹)","Taxable (₹)","IGST (₹)","CGST (₹)","SGST (₹)","ITC (₹)","Period","Filed?"].map(h => (
                              <th key={h} className="text-left py-2 px-3 font-medium whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.onlyIn2A.length === 0 ? (
                            <tr><td colSpan={12} className="py-8 text-center text-muted">All 2A entries are booked ✓</td></tr>
                          ) : result.onlyIn2A.map((ga, i) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-orange-50/30"}>
                              <td className="py-2 px-3 font-medium">{ga.supplier}</td>
                              <td className="py-2 px-3 font-mono text-xs">{ga.gstin}</td>
                              <td className="py-2 px-3">{ga.invoiceNo}</td>
                              <td className="py-2 px-3 whitespace-nowrap">{ga.invoiceDate}</td>
                              <td className="py-2 px-3 text-right">₹{inr(ga.invoiceValue)}</td>
                              <td className="py-2 px-3 text-right">₹{inr(ga.taxable)}</td>
                              <td className="py-2 px-3 text-right">{ga.igst > 0 ? `₹${inr(ga.igst)}` : "—"}</td>
                              <td className="py-2 px-3 text-right">{ga.cgst > 0 ? `₹${inr(ga.cgst)}` : "—"}</td>
                              <td className="py-2 px-3 text-right">{ga.sgst > 0 ? `₹${inr(ga.sgst)}` : "—"}</td>
                              <td className="py-2 px-3 text-right font-semibold text-orange-700">₹{inr(ga.itc)}</td>
                              <td className="py-2 px-3 whitespace-nowrap">{ga.period}</td>
                              <td className="py-2 px-3">{ga.filingStatus === "Yes" ? <span className="text-green-600 font-semibold">✓ Yes</span> : <span className="text-red-600">✗ No</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                        {result.onlyIn2A.length > 0 && (
                          <tfoot>
                            <tr className="bg-orange-100 font-bold">
                              <td colSpan={4} className="py-2 px-3">TOTAL</td>
                              <td className="py-2 px-3 text-right">₹{inr(result.onlyIn2A.reduce((s,r)=>s+r.invoiceValue,0))}</td>
                              <td className="py-2 px-3 text-right">₹{inr(result.onlyIn2A.reduce((s,r)=>s+r.taxable,0))}</td>
                              <td className="py-2 px-3 text-right">₹{inr(result.onlyIn2A.reduce((s,r)=>s+r.igst,0))}</td>
                              <td className="py-2 px-3 text-right">₹{inr(result.onlyIn2A.reduce((s,r)=>s+r.cgst,0))}</td>
                              <td className="py-2 px-3 text-right">₹{inr(result.onlyIn2A.reduce((s,r)=>s+r.sgst,0))}</td>
                              <td className="py-2 px-3 text-right text-orange-700">₹{inr(unbookedITC)}</td>
                              <td colSpan={2}></td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                )}

                {/* ── Only in Books tab ── */}
                {activeTab === "onlyInBooks" && (
                  <div>
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                      <strong>These entries are in your Purchase Register but NOT in GSTR-2A.</strong> The supplier may not have filed GSTR-1. Follow up with the supplier.
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-red-600 text-white">
                            {["Party Name","Date","Vch No","Amount (₹)","Action"].map(h => (
                              <th key={h} className="text-left py-2 px-3 font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.onlyInBooks.length === 0 ? (
                            <tr><td colSpan={5} className="py-8 text-center text-green-600 font-medium">All book entries found in GSTR-2A ✓</td></tr>
                          ) : result.onlyInBooks.map((pr, i) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-red-50/30"}>
                              <td className="py-2 px-3 font-medium">{pr.party}</td>
                              <td className="py-2 px-3 whitespace-nowrap">{pr.date}</td>
                              <td className="py-2 px-3">{pr.vchNo || "—"}</td>
                              <td className="py-2 px-3 text-right">₹{inr(pr.amount)}</td>
                              <td className="py-2 px-3 text-red-600 text-xs">Follow up with supplier</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── Mismatch tab ── */}
                {activeTab === "mismatch" && (
                  <div>
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                      <strong>Same supplier matched but invoice amounts differ.</strong> Investigate and correct the discrepancy in books or contact the supplier.
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-yellow-500 text-white">
                            {["Books Party","Books Amt (₹)","2A Supplier","2A Value (₹)","Difference (₹)","Invoice No","Period"].map(h => (
                              <th key={h} className="text-left py-2 px-3 font-medium whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.mismatch.length === 0 ? (
                            <tr><td colSpan={7} className="py-8 text-center text-green-600 font-medium">No amount mismatches ✓</td></tr>
                          ) : result.mismatch.map(({ pr, ga, diff }, i) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-yellow-50/30"}>
                              <td className="py-2 px-3 font-medium">{pr.party}</td>
                              <td className="py-2 px-3 text-right">₹{inr(pr.amount)}</td>
                              <td className="py-2 px-3">{ga.supplier}</td>
                              <td className="py-2 px-3 text-right">₹{inr(ga.invoiceValue)}</td>
                              <td className={`py-2 px-3 text-right font-bold ${diff > 0 ? "text-green-600" : "text-red-600"}`}>
                                {diff > 0 ? "+" : ""}₹{inr(diff)}
                              </td>
                              <td className="py-2 px-3">{ga.invoiceNo}</td>
                              <td className="py-2 px-3 whitespace-nowrap">{ga.period}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── Period-wise tab ── */}
                {activeTab === "period" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-primary text-white">
                          {["Period","Invoices","Invoice Value (₹)","ITC (₹)"].map(h => (
                            <th key={h} className="text-left py-2 px-3 font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {PERIOD_ORDER.filter(p => periodMap[p]).map((p, i) => {
                          const d = periodMap[p];
                          return (
                            <tr key={p} className={i % 2 === 0 ? "bg-white" : "bg-background"}>
                              <td className="py-2 px-3 font-medium">{p}</td>
                              <td className="py-2 px-3 text-right">{d.invoices}</td>
                              <td className="py-2 px-3 text-right">₹{inr(d.value)}</td>
                              <td className="py-2 px-3 text-right font-semibold text-primary">₹{inr(d.itc)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-primary/10 font-bold border-t-2 border-primary/30">
                          <td className="py-2 px-3">TOTAL</td>
                          <td className="py-2 px-3 text-right">{gstr2aRows.length}</td>
                          <td className="py-2 px-3 text-right">₹{inr(gstr2aRows.reduce((s,r)=>s+r.invoiceValue,0))}</td>
                          <td className="py-2 px-3 text-right text-primary">₹{inr(totalITC2A)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

              </div>
            </div>
          </>
        )}

        <p className="tool-disclaimer">
          Results are indicative only. Always consult a qualified tax professional for final decisions.
          CC Associates is not liable for any decisions made based on tool outputs. © 2026 CC Associates, Pune.
        </p>
      </div>
    </div>
  );
}
