"use client";

import { useState, useCallback, useRef } from "react";
import { Database, ArrowLeft, Upload, Download, Shield, AlertCircle, CheckCircle, Tag } from "lucide-react";
import Link from "next/link";

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface Transaction {
  date: string; description: string; cheque: string;
  debit: number; credit: number; balance: number;
  category: string; ledger: string;
}
interface RawCell { text: string; x: number; y: number; }
type ColType = "date"|"desc"|"ref"|"debit"|"credit"|"balance"|"amount"|"drcrtype"|"other";
interface ColDef { type: ColType; xLeft: number; xRight: number; }
type Step = "upload"|"processing"|"preview";

// ─── Classification ───────────────────────────────────────────────────────────
const CLASSIFY_RULES: { kw: string[]; cat: string; led: string }[] = [
  { kw:["gst","igst","cgst","sgst","tds","income tax","advance tax"], cat:"Tax",        led:"GST / Tax Ledger" },
  { kw:["salary","payroll","wages","stipend","remuneration"],          cat:"Salary",     led:"Salary Ledger" },
  { kw:["amazon","flipkart","myntra","swiggy","zomato","purchase","shop","mart"], cat:"Purchase", led:"Purchase Ledger" },
  { kw:["rent","lease","property"],                                    cat:"Rent",       led:"Rent Ledger" },
  { kw:["loan","emi","equated","repayment","mortgage"],                cat:"Loan",       led:"Loan Ledger" },
  { kw:["insurance","lic","premium","policy"],                         cat:"Insurance",  led:"Insurance Ledger" },
  { kw:["electricity","water","gas","utility","bill","bescom","msedcl","mahadiscom","tata power"], cat:"Utilities", led:"Utilities Ledger" },
  { kw:["neft","imps","rtgs","upi","received","receipt","income","dividend","interest"], cat:"Income", led:"Sales / Income Ledger" },
  { kw:["cash","atm","withdrawal"],                                    cat:"Cash",       led:"Cash Ledger" },
  { kw:["refund","reversal","cashback"],                               cat:"Refund",     led:"Creditors Ledger" },
  { kw:["mutual fund","mf","sip","equity","share","stock","investment"], cat:"Investment", led:"Investment Ledger" },
  { kw:["travel","hotel","flight","irctc","makemytrip","oyo"],         cat:"Travel",     led:"Travel Expense Ledger" },
  { kw:["electric","power","spack","automotives","labour","labor"],    cat:"Utilities",  led:"Utilities Ledger" },
];
function classify(desc: string) {
  const low = desc.toLowerCase();
  for (const r of CLASSIFY_RULES) if (r.kw.some(k => low.includes(k))) return { category: r.cat, ledger: r.led };
  return { category: "Uncategorized", ledger: "Suspense Ledger" };
}

// ─── Amount helpers ───────────────────────────────────────────────────────────
function cleanAmt(s: string): number {
  if (!s || s === "-" || s === "—") return 0;
  const n = parseFloat(s.replace(/[,\s]/g,"").replace(/[DdCc][Rr]\.?\s*$/i,""));
  return isNaN(n) ? 0 : Math.abs(n);
}
function parseSigned(s: string): [number, number] {
  const n = parseFloat(s.replace(/[,\s]/g,"").replace(/[DdCc][Rr]\.?\s*$/i,""));
  if (!n || isNaN(n)) return [0, 0];
  return n < 0 ? [Math.abs(n), 0] : [0, n];
}

// ─── pdfjs cell extraction ────────────────────────────────────────────────────
function extractCells(content: { items: any[] }): RawCell[] {
  return content.items
    .filter((it: any) => it.str?.trim())
    .map((it: any) => ({ text: it.str.trim(), x: Math.round(it.transform[4]), y: Math.round(it.transform[5]) }));
}

function groupByRow(cells: RawCell[], yTol = 5): RawCell[][] {
  const map = new Map<number, RawCell[]>();
  for (const c of cells) {
    let ky = -1;
    for (const k of map.keys()) if (Math.abs(k - c.y) <= yTol) { ky = k; break; }
    if (ky === -1) map.set(c.y, [c]);
    else map.get(ky)!.push(c);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, cs]) => cs.sort((a, b) => a.x - b.x));
}

// ─── Column detection ─────────────────────────────────────────────────────────
const COL_MAP: { type: ColType; words: string[] }[] = [
  { type:"date",     words:["txn date","trans date","value date","value dt","posting date","transaction date","date"] },
  { type:"desc",     words:["narration","particulars","description","details","transaction detail","merchant"] },
  { type:"ref",      words:["txn no","transaction no","ref no","chq no","cheque no","instrument no","utr","chq/ref"] },
  { type:"debit",    words:["dr amount","dr. amount","dr amt","withdrawal amt","withdrawal amount","debit amount","debit","paid out","dr"] },
  { type:"credit",   words:["cr amount","cr. amount","cr amt","deposit amt","deposit amount","credit amount","credit","cr"] },
  { type:"balance",  words:["closing balance","running balance","available balance","balance"] },
  { type:"amount",   words:["transaction amount","txn amount","net amount","net amt","amount(inr)","tran amount","amount"] },
  { type:"drcrtype", words:["dr/cr","cr/dr","txn type","transaction type","d/c","indicator"] },
];
function colType(text: string): ColType {
  const low = text.toLowerCase();
  for (const { type, words } of COL_MAP) if (words.some(w => low.includes(w))) return type;
  return "other";
}

const HDR_WORDS = ["date","narration","particulars","description","debit","credit","balance","withdrawal","deposit","amount","cheque","chq","ref","txn"];
function isHdr(row: RawCell[]): boolean {
  const hits = HDR_WORDS.filter(w => row.some(c => c.text.toLowerCase().includes(w))).length;
  return hits >= 3;
}

function buildColDefs(hdr: RawCell[]): ColDef[] {
  const s = [...hdr].sort((a, b) => a.x - b.x);
  return s.map((c, i) => ({
    type: colType(c.text),
    xLeft:  i === 0           ? 0    : Math.round((s[i-1].x + c.x) / 2),
    xRight: i === s.length-1  ? 9999 : Math.round((c.x + s[i+1].x) / 2),
  }));
}

function assign(cells: RawCell[], defs: ColDef[]): Map<ColType, string> {
  const out = new Map<ColType, string>();
  for (const c of cells) {
    const def = defs.find(d => c.x >= d.xLeft && c.x <= d.xRight)
      ?? defs.reduce((b, d) => {
        const dc = Math.abs(c.x - (d.xLeft + d.xRight) / 2);
        const db = Math.abs(c.x - (b.xLeft + b.xRight) / 2);
        return dc < db ? d : b;
      });
    out.set(def.type, ((out.get(def.type) ?? "") + " " + c.text).trim());
  }
  return out;
}

// ─── Date pattern ─────────────────────────────────────────────────────────────
const DATE_RE = /\b(\d{2}[\/\-]\d{2}[\/\-]\d{2,4}|\d{2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4})\b/i;

// ─── Main transaction parser ──────────────────────────────────────────────────
function parseAllPages(allPageRows: RawCell[][][]): Transaction[] {
  // Find first header
  let defs: ColDef[] | null = null;
  let hpi = -1, hri = -1;
  outer: for (let pi = 0; pi < allPageRows.length; pi++) {
    for (let ri = 0; ri < allPageRows[pi].length; ri++) {
      if (isHdr(allPageRows[pi][ri])) {
        defs = buildColDefs(allPageRows[pi][ri]);
        hpi = pi; hri = ri;
        break outer;
      }
    }
  }
  if (!defs) return [];

  // ── Key layout flags ──────────────────────────────────────────────────────
  // Whether there's a SEPARATE credit column (PNB style: Dr Amount | Cr Amount)
  // vs a single amount/debit column where sign distinguishes Dr/Cr (PAN India style)
  const hasSeparateCreditCol = defs.some(d => d.type === "credit");
  const dateDef = defs.find(d => d.type === "date");

  // Date in the date COLUMN only (prevents reference numbers triggering false dates)
  function rowHasDateInCol(row: RawCell[]): boolean {
    if (!dateDef) return row.some(c => DATE_RE.test(c.text));
    return row.some(c =>
      c.x >= dateDef.xLeft && c.x <= dateDef.xRight && DATE_RE.test(c.text)
    );
  }

  // Row has a money value in a debit/credit/amount column
  function rowHasAmountInCol(row: RawCell[]): boolean {
    const amtTypes: ColType[] = ["debit", "credit", "amount"];
    return row.some(c => {
      const def = defs!.find(d => c.x >= d.xLeft && c.x <= d.xRight);
      return def && amtTypes.includes(def.type) && /^\d[\d,\.]+$/.test(c.text.trim());
    });
  }

  // Collect data rows after header (skip repeated headers on new pages)
  const dataRows: RawCell[][] = [];
  for (let pi = 0; pi < allPageRows.length; pi++) {
    const startRi = pi === hpi ? hri + 1 : 0;
    for (let ri = startRi; ri < allPageRows[pi].length; ri++) {
      const row = allPageRows[pi][ri];
      if (isHdr(row)) continue;
      dataRows.push(row);
    }
  }

  // ── Smart row merging ─────────────────────────────────────────────────────
  // • Has date in date column → new transaction (explicit date)
  // • Has amount but no date  → new transaction (same date, not reprinted — Indian bank style)
  //   Inject the last known date so parsing still finds a date
  // • Has neither             → continuation (extra description lines), merge text only
  const txnRows: RawCell[][] = [];
  let cur: RawCell[] | null = null;
  let lastDateText = "";

  for (const row of dataRows) {
    const hasDate = rowHasDateInCol(row);
    const hasAmt  = rowHasAmountInCol(row);

    if (hasDate) {
      if (cur) txnRows.push(cur);
      cur = [...row];
      // Remember date for same-date rows that don't reprint it
      const dateCell = row.find(c =>
        dateDef ? (c.x >= dateDef.xLeft && c.x <= dateDef.xRight && DATE_RE.test(c.text)) : DATE_RE.test(c.text)
      );
      if (dateCell) lastDateText = dateCell.text;
    } else if (hasAmt) {
      // Separate transaction — bank didn't reprint the date
      if (cur) txnRows.push(cur);
      // Inject a synthetic date cell so the parser can extract it
      const synthetic: RawCell = {
        text: lastDateText,
        x: dateDef ? Math.round((dateDef.xLeft + dateDef.xRight) / 2) : 0,
        y: row[0]?.y ?? 0,
      };
      cur = lastDateText ? [synthetic, ...row] : [...row];
    } else if (cur) {
      // Continuation: merge only description-type cells (avoid concatenating stray numbers)
      const descCells = row.filter(c => {
        const def = defs!.find(d => c.x >= d.xLeft && c.x <= d.xRight);
        return !def || def.type === "desc" || def.type === "other";
      });
      cur.push(...(descCells.length ? descCells : row));
    }
  }
  if (cur) txnRows.push(cur);

  // ── Parse each merged row into a Transaction ──────────────────────────────
  const txns: Transaction[] = [];
  for (const cells of txnRows) {
    const cols = assign(cells, defs);

    const dateRaw = cols.get("date") ?? cells.find(c => DATE_RE.test(c.text))?.text ?? "";
    const dm = dateRaw.match(DATE_RE);
    if (!dm) continue;

    const desc    = cols.get("desc")    ?? "—";
    const cheque  = cols.get("ref")     ?? "";
    const balance = cleanAmt(cols.get("balance") ?? "");

    if ((!desc || desc === "—") && balance === 0) continue;

    const amtRaw  = cols.get("amount")   ?? "";
    const drRaw   = cols.get("debit")    ?? "";
    const crRaw   = cols.get("credit")   ?? "";
    const typeRaw = cols.get("drcrtype") ?? "";

    let debit = 0, credit = 0;

    if (amtRaw && typeRaw) {
      // Explicit Dr/Cr type indicator (e.g. Axis, Kotak)
      const mag = cleanAmt(amtRaw);
      const t = typeRaw.toLowerCase();
      if (t.startsWith("d") || t.includes("dr")) debit = mag; else credit = mag;

    } else if (amtRaw) {
      // Single signed amount column: negative = debit, positive = credit
      [debit, credit] = parseSigned(amtRaw);

    } else if (hasSeparateCreditCol) {
      // Two distinct columns — PNB "Dr Amount" / "Cr Amount" style
      debit  = cleanAmt(drRaw);
      credit = cleanAmt(crRaw);

    } else if (drRaw) {
      // Only one column detected as "debit" — treat as signed (negative=Dr, positive=Cr)
      // Handles PAN India and similar banks where a single column holds all amounts
      [debit, credit] = parseSigned(drRaw);

    } else if (crRaw) {
      credit = cleanAmt(crRaw);
    }

    if (debit === 0 && credit === 0 && balance === 0) continue;

    const { category, ledger } = classify(desc);
    txns.push({ date: dm[0], description: desc, cheque, debit, credit, balance, category, ledger });
  }
  return txns;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function BankStatementPage() {
  const [step, setStep]             = useState<Step>("upload");
  const [file, setFile]             = useState<File | null>(null);
  const [transactions, setTxns]     = useState<Transaction[]>([]);
  const [error, setError]           = useState("");
  const [progress, setProgress]     = useState("");
  const [editCell, setEditCell]     = useState<{ row: number; col: keyof Transaction } | null>(null);
  const [editValue, setEditValue]   = useState("");
  const inputRef                    = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async () => {
    if (!file) return;
    setStep("processing"); setError(""); setProgress("Loading PDF…");
    try {
      const pdfjs = await import("pdfjs-dist" as any) as any;
      // Set worker source explicitly — required for pdfjs-dist v4.x in Next.js
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc =
          `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      }
      const buf   = await file.arrayBuffer();
      const pdf   = await pdfjs.getDocument({ data: new Uint8Array(buf), isEvalSupported:false, useSystemFonts:true, disableRange:true, disableStream:true, disableAutoFetch:true }).promise;

      const allPageRows: RawCell[][][] = [];
      let plainLen = 0;

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress(`Extracting page ${i} of ${pdf.numPages}…`);
        const page    = await pdf.getPage(i);
        const content = await page.getTextContent();
        const cells   = extractCells(content);
        plainLen += cells.reduce((s, c) => s + c.text.length, 0);
        allPageRows.push(groupByRow(cells));
      }

      // OCR fallback for scanned PDFs
      if (plainLen < 100) {
        setProgress("Scanned PDF detected — running OCR…");
        const Tesseract = await import("tesseract.js");
        const worker    = await Tesseract.createWorker("eng");
        const url       = URL.createObjectURL(file);
        const { data: { text } } = await worker.recognize(url);
        await worker.terminate(); URL.revokeObjectURL(url);
        // Convert plain OCR text to pseudo-rows
        const ocrRows = text.split("\n")
          .map((line, y) => line.split(/\s{2,}/).map((t, xi) => ({ text: t.trim(), x: xi * 120, y: -y })).filter(c => c.text));
        allPageRows.push(ocrRows);
      }

      setProgress("Parsing transactions…");
      const txns = parseAllPages(allPageRows);

      if (txns.length === 0) {
        setError("No transactions detected. Try a text-based (not scanned) bank statement PDF.");
        setStep("upload"); return;
      }
      setTxns(txns); setStep("preview");
    } catch (e: any) {
      setError("Error: " + (e?.message || String(e))); setStep("upload");
    }
  }, [file]);

  const updateCell = (row: number, col: keyof Transaction, val: string) => {
    const updated = [...transactions];
    if (["debit","credit","balance"].includes(col)) (updated[row] as any)[col] = parseFloat(val) || 0;
    else {
      (updated[row] as any)[col] = val;
      if (col === "description") {
        const { category, ledger } = classify(val);
        updated[row].category = category; updated[row].ledger = ledger;
      }
    }
    setTxns(updated); setEditCell(null);
  };

  const downloadExcel = useCallback(async () => {
    const EXM = await import("exceljs" as any) as any;
    const EX  = EXM.default ?? EXM;
    const wb  = new EX.Workbook();
    wb.creator = "CC Associates";

    // ── Category colour map ────────────────────────────────────────────────
    const CAT_ARGB: Record<string,string> = {
      Tax:"FFFFF3CD", Salary:"FFD4EDDA", Purchase:"FFF8D7DA", Income:"FFD1ECF1",
      Rent:"FFE2D9F3", Utilities:"FFFDEBD0", Loan:"FFFCE4EC", Insurance:"FFE8F4FD",
      Cash:"FFF5F5F5", Travel:"FFE8F8E8", Investment:"FFEAF4FB", Refund:"FFFFFFE7",
    };
    const sf = (argb: string) => ({ type: "pattern" as const, pattern: "solid" as const, fgColor: { argb } });

    // ── Sheet 1: Transactions ─────────────────────────────────────────────
    const ws = wb.addWorksheet("Transactions");
    ws.columns = [
      { width: 13 }, { width: 50 }, { width: 17 },
      { width: 14 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 24 },
    ];
    ws.views = [{ state: "frozen", ySplit: 1 }];

    // Title banner
    const titleRow = ws.addRow(["BANK STATEMENT — TRANSACTION REGISTER"]);
    titleRow.height = 28;
    ws.mergeCells("A1:H1");
    titleRow.getCell(1).fill = sf("FF1E3A5F");
    titleRow.getCell(1).font = { name: "Calibri", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
    titleRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

    // Header row
    const headers = ["Date","Description","Cheque / Ref No","Debit (₹)","Credit (₹)","Balance (₹)","Category","Ledger"];
    const hdrRow  = ws.addRow(headers);
    hdrRow.height = 22;
    headers.forEach((_, i) => {
      const cell = hdrRow.getCell(i + 1);
      cell.fill      = sf("FF2C5F8A");
      cell.font      = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: i >= 3 && i <= 5 ? "right" : "center", vertical: "middle" };
    });

    // Data rows
    const AMT = "#,##0.00";
    transactions.forEach((t, i) => {
      const row = ws.addRow([t.date, t.description, t.cheque,
        t.debit || "", t.credit || "", t.balance || "", t.category, t.ledger]);
      row.height = 17;
      const bg = CAT_ARGB[t.category] || (i % 2 === 0 ? "FFE8F0FE" : "FFFFFFFF");
      row.eachCell((cell: any, cn: number) => {
        cell.fill = sf(bg);
        cell.font = { name: "Calibri", size: 10, color: { argb: "FF1E293B" } };
        if (cn === 4) { // Debit — red
          cell.font = { name: "Calibri", size: 10, bold: !!t.debit, color: { argb: t.debit ? "FFC0392B" : "FF9CA3AF" } };
          cell.alignment = { horizontal: "right" };
          if (t.debit) cell.numFmt = AMT;
        } else if (cn === 5) { // Credit — green
          cell.font = { name: "Calibri", size: 10, bold: !!t.credit, color: { argb: t.credit ? "FF1B7B3F" : "FF9CA3AF" } };
          cell.alignment = { horizontal: "right" };
          if (t.credit) cell.numFmt = AMT;
        } else if (cn === 6) { // Balance
          cell.alignment = { horizontal: "right" };
          if (t.balance) cell.numFmt = AMT;
        } else if (cn === 1) {
          cell.alignment = { horizontal: "center" };
        }
      });
    });

    // Totals row
    const totD = transactions.reduce((s, t) => s + (t.debit  || 0), 0);
    const totC = transactions.reduce((s, t) => s + (t.credit || 0), 0);
    const totRow = ws.addRow(["TOTAL", "", "", totD, totC, transactions[transactions.length - 1]?.balance || "", "", ""]);
    totRow.height = 20;
    totRow.eachCell((cell: any, cn: number) => {
      cell.fill = sf("FF1E3A5F");
      cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      if ([4, 5, 6].includes(cn)) {
        cell.alignment = { horizontal: "right" };
        cell.numFmt = AMT;
      }
    });

    // ── Sheet 2: Summary ──────────────────────────────────────────────────
    const ws2 = wb.addWorksheet("Summary");
    ws2.columns = [{ width: 28 }, { width: 20 }];

    const s2Title = ws2.addRow(["TRANSACTION SUMMARY"]);
    s2Title.height = 28; ws2.mergeCells("A1:B1");
    s2Title.getCell(1).fill = sf("FF1E3A5F");
    s2Title.getCell(1).font = { name: "Calibri", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
    s2Title.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

    const s2Rows: [string, any][] = [
      ["Total Transactions",  transactions.length],
      ["Total Debits (₹)",    totD],
      ["Total Credits (₹)",   totC],
      ["Net Cash Flow (₹)",   totC - totD],
      ["Closing Balance (₹)", transactions[transactions.length - 1]?.balance || 0],
    ];
    s2Rows.forEach(([label, val], i) => {
      const row = ws2.addRow([label, val]);
      row.height = 20;
      const isAmt = i >= 1;
      row.getCell(1).fill = sf(i % 2 === 0 ? "FFE8F0FE" : "FFFFFFFF");
      row.getCell(1).font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF1E3A5F" } };
      row.getCell(2).fill = sf(i % 2 === 0 ? "FFE8F0FE" : "FFFFFFFF");
      row.getCell(2).font = { name: "Calibri", size: 11,
        bold: true, color: { argb: i === 3 ? (totC >= totD ? "FF1B7B3F" : "FFC0392B") : "FF1E3A5F" } };
      row.getCell(2).alignment = { horizontal: "right" };
      if (isAmt) row.getCell(2).numFmt = AMT;
    });

    // ── Category breakdown ────────────────────────────────────────────────
    ws2.addRow([]);
    const bkHdr = ws2.addRow(["Category", "Total Amount (₹)"]);
    bkHdr.height = 20;
    bkHdr.eachCell((cell: any) => {
      cell.fill = sf("FF2C5F8A");
      cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center" };
    });
    const catTotals: Record<string, number> = {};
    transactions.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + (t.debit || t.credit || 0); });
    Object.entries(catTotals).sort((a, b) => b[1] - a[1]).forEach(([cat, amt], i) => {
      const row = ws2.addRow([cat, amt]);
      row.height = 18;
      const bg = CAT_ARGB[cat] || (i % 2 === 0 ? "FFE8F0FE" : "FFFFFFFF");
      row.getCell(1).fill = sf(bg);
      row.getCell(1).font = { name: "Calibri", size: 10 };
      row.getCell(2).fill = sf(bg);
      row.getCell(2).font = { name: "Calibri", size: 10 };
      row.getCell(2).alignment = { horizontal: "right" };
      row.getCell(2).numFmt = AMT;
    });

    // ── Download ──────────────────────────────────────────────────────────
    const buf  = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `bank_statement_${(file?.name || "export").replace(".pdf", "")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }, [transactions, file]);

  const fmt = (n: number) => n ? new Intl.NumberFormat("en-IN",{minimumFractionDigits:2}).format(n) : "";

  const BADGE: Record<string,string> = {
    Tax:"bg-yellow-100 text-yellow-800", Salary:"bg-green-100 text-green-800",
    Purchase:"bg-red-100 text-red-800", Income:"bg-cyan-100 text-cyan-800",
    Rent:"bg-purple-100 text-purple-800", Utilities:"bg-orange-100 text-orange-800",
    Loan:"bg-pink-100 text-pink-800", Insurance:"bg-blue-100 text-blue-800",
    Cash:"bg-gray-100 text-gray-700", Travel:"bg-emerald-100 text-emerald-800",
    Investment:"bg-sky-100 text-sky-800", Refund:"bg-lime-100 text-lime-800",
    Uncategorized:"bg-gray-100 text-gray-400",
  };

  const totalDebit  = transactions.reduce((s,t)=>s+(t.debit||0),0);
  const totalCredit = transactions.reduce((s,t)=>s+(t.credit||0),0);

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted hover:text-dark mb-6">
          <ArrowLeft size={15}/> Back to Tools
        </Link>

        <div className="mb-4">
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <Database className="text-primary" size={22}/> PDF Bank Statement to Excel
          </h1>
          <p className="text-muted text-sm mt-1">
            Auto-extract &amp; classify transactions from any Indian bank PDF. Supports SBI, PNB, HDFC, ICICI, Axis, Kotak, Canara &amp; more.
          </p>
        </div>

        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-5 text-sm text-green-800 font-medium">
          <Shield size={16} className="text-green-600 flex-shrink-0"/>
          <span>100% browser-based — your financial data never leaves your device.</span>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-3 mb-6">
          {(["upload","processing","preview"] as Step[]).map((s,i)=>(
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step===s?"bg-primary text-white":
                (step==="preview"&&i<2)||(step==="processing"&&i<1)?"bg-green-500 text-white":"bg-gray-200 text-muted"
              }`}>
                {(step==="preview"&&i<2)||(step==="processing"&&i<1)?<CheckCircle size={14}/>:i+1}
              </div>
              <span className={`text-sm ${step===s?"font-semibold text-dark":"text-muted"}`}>
                {s.charAt(0).toUpperCase()+s.slice(1)}
              </span>
              {i<2&&<div className="w-8 h-px bg-gray-200"/>}
            </div>
          ))}
        </div>

        {/* Upload */}
        {step==="upload"&&(
          <div className="bg-white rounded-card shadow-card border border-gray-100 p-6">
            <div
              className="border-2 border-dashed border-gray-200 rounded-lg p-10 text-center hover:border-primary/50 transition-colors cursor-pointer mb-5"
              onClick={()=>inputRef.current?.click()}
              onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)setFile(f);}}
              onDragOver={e=>e.preventDefault()}
            >
              <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e=>setFile(e.target.files?.[0]||null)}/>
              {file?(
                <div><Database size={40} className="mx-auto text-primary mb-3"/>
                  <p className="font-medium text-dark">{file.name}</p>
                  <p className="text-muted text-sm">{(file.size/1024).toFixed(1)} KB</p>
                </div>
              ):(
                <div><Upload size={40} className="mx-auto text-muted mb-3"/>
                  <p className="font-medium text-dark mb-1">Upload PDF Bank Statement</p>
                  <p className="text-muted text-sm">SBI · PNB · HDFC · ICICI · Axis · Kotak · BOI · Canara · Union · Yes Bank</p>
                  <p className="text-xs text-muted mt-2">Handles Dr/Cr columns, signed amounts, multi-line narrations</p>
                </div>
              )}
            </div>
            {error&&(
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0"/>{error}
              </div>
            )}
            <button onClick={processFile} disabled={!file} className="btn-primary gap-2 w-full justify-center py-3.5 disabled:opacity-50">
              Extract &amp; Classify Transactions
            </button>
          </div>
        )}

        {/* Processing */}
        {step==="processing"&&(
          <div className="bg-white rounded-card shadow-card border border-gray-100 p-10 text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
            <p className="font-semibold text-dark mb-2">Processing your PDF…</p>
            <p className="text-muted text-sm">{progress}</p>
            <p className="text-xs text-muted mt-3">Large files may take a moment</p>
          </div>
        )}

        {/* Preview */}
        {step==="preview"&&(
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <p className="font-semibold text-dark">{transactions.length} transactions extracted &amp; classified</p>
                <p className="text-xs text-muted">Click any cell to edit · Description edits auto-update category</p>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>{setStep("upload");setFile(null);setTxns([]);}} className="btn-outline text-sm">Start Over</button>
                <button onClick={downloadExcel} className="btn-primary gap-2 text-sm"><Download size={15}/> Download Excel</button>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                {label:"Total Debits",  val:totalDebit,               cls:"text-red-600"},
                {label:"Total Credits", val:totalCredit,              cls:"text-green-600"},
                {label:"Net Flow",      val:totalCredit-totalDebit,   cls:"text-primary"},
              ].map(({label,val,cls})=>(
                <div key={label} className="bg-white rounded-card shadow-card border border-gray-100 p-3 text-center">
                  <div className="text-xs text-muted mb-1">{label}</div>
                  <div className={`font-bold text-sm ${cls}`}>₹{fmt(Math.abs(val))}</div>
                </div>
              ))}
            </div>

            {/* Category legend */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {Array.from(new Set(transactions.map(t=>t.category))).map(cat=>(
                <span key={cat} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${BADGE[cat]||"bg-gray-100 text-gray-400"}`}>
                  <Tag size={9}/>{cat}
                </span>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-card shadow-card border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto max-h-[520px]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0">
                    <tr className="bg-primary text-white">
                      {["#","Date","Description","Cheque/Ref","Debit (₹)","Credit (₹)","Balance (₹)","Category","Ledger"].map(h=>(
                        <th key={h} className="text-left py-2.5 px-3 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t,i)=>(
                      <tr key={i} className={i%2===0?"bg-white":"bg-background"}>
                        <td className="py-2 px-3 text-muted">{i+1}</td>
                        {(["date","description","cheque","debit","credit","balance","category","ledger"] as (keyof Transaction)[]).map(col=>(
                          <td key={col}
                            className={`py-2 px-3 cursor-pointer hover:bg-yellow-50 transition-colors ${
                              col==="debit"  &&t.debit  ?"text-red-600 font-medium text-right":
                              col==="credit" &&t.credit ?"text-green-600 font-medium text-right":
                              col==="balance"?"text-right text-muted":""
                            }`}
                            onClick={()=>{setEditCell({row:i,col});setEditValue(String((t as any)[col]));}}
                          >
                            {editCell?.row===i&&editCell.col===col?(
                              <input autoFocus
                                className="w-full border border-primary rounded px-1 py-0.5 text-xs min-w-[70px]"
                                value={editValue}
                                onChange={e=>setEditValue(e.target.value)}
                                onBlur={()=>updateCell(i,col,editValue)}
                                onKeyDown={e=>e.key==="Enter"&&updateCell(i,col,editValue)}
                              />
                            ):col==="category"?(
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${BADGE[t.category]||"bg-gray-100 text-gray-400"}`}>
                                <Tag size={9}/>{t.category}
                              </span>
                            ):(
                              typeof (t as any)[col]==="number"&&(t as any)[col]!==0
                                ?fmt((t as any)[col])
                                :(t as any)[col]||"—"
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
          Results are indicative only. Always consult a qualified tax professional for final decisions. CC Associates is not liable for any decisions made based on tool outputs. © 2026 CC Associates, Pune.
        </p>
      </div>
    </div>
  );
}
