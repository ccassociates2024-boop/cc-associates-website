"use client";

import { useState, useCallback } from "react";
import {
  Building2, Upload, Download, AlertCircle, CheckCircle,
  Loader2, ArrowLeft, Shield, RefreshCw, Eye, EyeOff, ChevronDown, Tag
} from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";

// ─── Types ────────────────────────────────────────────────────────────────────
type BankId = "auto" | "hdfc" | "pnb" | "bom" | "kotak" | "union";
type Step    = "upload" | "processing" | "preview";

interface Transaction {
  srNo: number;
  date: string;
  particulars: string;
  chequeNo: string;
  credit: number;
  debit: number;
  balance: number;
  category: string;
  ledger: string;
}

interface RawCell { text: string; x: number; y: number; }

// ─── Transaction Classification ───────────────────────────────────────────────
const CLASSIFY_RULES: { kw: string[]; cat: string; led: string }[] = [
  { kw: ["gst","igst","cgst","sgst","tds","income tax","advance tax"],          cat: "Tax",        led: "GST / Tax Ledger" },
  { kw: ["salary","payroll","wages","stipend","remuneration"],                   cat: "Salary",     led: "Salary Ledger" },
  { kw: ["amazon","flipkart","myntra","swiggy","zomato","purchase","shop","mart"], cat: "Purchase", led: "Purchase Ledger" },
  { kw: ["rent","lease","property"],                                              cat: "Rent",       led: "Rent Ledger" },
  { kw: ["loan","emi","equated","repayment","mortgage"],                          cat: "Loan",       led: "Loan Ledger" },
  { kw: ["insurance","lic","premium","policy"],                                   cat: "Insurance",  led: "Insurance Ledger" },
  { kw: ["electricity","water","gas","utility","bill","bescom","msedcl","mahadiscom","tata power"], cat: "Utilities", led: "Utilities Ledger" },
  { kw: ["neft","imps","rtgs","upi","received","receipt","income","dividend","interest"], cat: "Income", led: "Sales / Income Ledger" },
  { kw: ["cash","atm","withdrawal"],                                              cat: "Cash",       led: "Cash Ledger" },
  { kw: ["refund","reversal","cashback"],                                         cat: "Refund",     led: "Creditors Ledger" },
  { kw: ["mutual fund","mf","sip","equity","share","stock","investment"],         cat: "Investment", led: "Investment Ledger" },
  { kw: ["travel","hotel","flight","irctc","makemytrip","oyo"],                   cat: "Travel",     led: "Travel Expense Ledger" },
];
function classify(desc: string): { category: string; ledger: string } {
  const low = desc.toLowerCase();
  for (const r of CLASSIFY_RULES) if (r.kw.some(k => low.includes(k))) return { category: r.cat, ledger: r.led };
  return { category: "Uncategorized", ledger: "Suspense Ledger" };
}
const BADGE: Record<string, string> = {
  Tax: "bg-yellow-100 text-yellow-800", Salary: "bg-green-100 text-green-800",
  Purchase: "bg-red-100 text-red-800", Income: "bg-cyan-100 text-cyan-800",
  Rent: "bg-purple-100 text-purple-800", Utilities: "bg-orange-100 text-orange-800",
  Loan: "bg-pink-100 text-pink-800", Insurance: "bg-blue-100 text-blue-800",
  Cash: "bg-gray-100 text-gray-700", Travel: "bg-emerald-100 text-emerald-800",
  Investment: "bg-sky-100 text-sky-800", Refund: "bg-lime-100 text-lime-800",
  Uncategorized: "bg-gray-100 text-gray-400",
};
const CAT_CLR: Record<string, string> = {
  Tax:"FFF3CD", Salary:"D4EDDA", Purchase:"F8D7DA", Income:"D1ECF1",
  Rent:"E2D9F3", Utilities:"FDEBD0", Loan:"FCE4EC", Insurance:"E8F4FD",
  Cash:"F5F5F5", Travel:"E8F8E8", Investment:"EAF4FB", Refund:"FFFDE7",
};

// ─── Bank definitions ─────────────────────────────────────────────────────────
const BANKS: { id: BankId; label: string; color: string; keywords: string[] }[] = [
  { id: "auto",  label: "Auto Detect",           color: "#6366F1", keywords: [] },
  { id: "hdfc",  label: "HDFC Bank",              color: "#004C8F", keywords: ["hdfc bank","hdfc bank ltd","hdfcbank"] },
  { id: "pnb",   label: "Punjab National Bank",   color: "#E31837", keywords: ["punjab national bank","pnb","panjab national"] },
  { id: "bom",   label: "Bank of Maharashtra",    color: "#1B4F8A", keywords: ["bank of maharashtra","mahabank"] },
  { id: "kotak", label: "Kotak Mahindra Bank",    color: "#EE3124", keywords: ["kotak mahindra","kotak bank","811"] },
  { id: "union", label: "Union Bank of India",    color: "#00529B", keywords: ["union bank of india","union bank"] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cleanAmt(s: string): number {
  if (!s || s === "-" || s === "—") return 0;
  const n = parseFloat(s.replace(/[,\s₹]/g, "").replace(/[DdCc][Rr]\.?\s*$/i, ""));
  return isNaN(n) ? 0 : Math.abs(n);
}

const MONTHS: Record<string, string> = {
  jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",
  jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12",
};

function normalizeDate(s: string): string {
  if (!s) return "";
  const t = s.trim();
  // DD/MM/YY → DD/MM/YYYY
  const m1 = t.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (m1) { const yr = parseInt(m1[3]) >= 50 ? `19${m1[3]}` : `20${m1[3]}`; return `${m1[1]}/${m1[2]}/${yr}`; }
  // DD-MM-YYYY → DD/MM/YYYY
  const m2 = t.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m2) return `${m2[1]}/${m2[2]}/${m2[3]}`;
  // DD Mon YYYY → DD/MM/YYYY
  const m3 = t.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (m3) { const mo = MONTHS[m3[2].toLowerCase()] ?? "01"; return `${m3[1].padStart(2,"0")}/${mo}/${m3[3]}`; }
  // DD/MM/YYYY passthrough
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) return t;
  return t;
}

function extractCells(items: any[]): RawCell[] {
  return items
    .filter((it: any) => it.str?.trim())
    .map((it: any) => ({ text: it.str.trim(), x: Math.round(it.transform[4]), y: Math.round(it.transform[5]) }));
}

function groupByRow(cells: RawCell[], yTol = 5): RawCell[][] {
  const map = new Map<number, RawCell[]>();
  for (const c of cells) {
    let ky = -1;
    const keys = Array.from(map.keys());
    for (const k of keys) if (Math.abs(k - c.y) <= yTol) { ky = k; break; }
    if (ky === -1) map.set(c.y, [c]);
    else map.get(ky)!.push(c);
  }
  return Array.from(map.entries())
    .sort((a: [number, RawCell[]], b: [number, RawCell[]]) => b[0] - a[0])
    .map(([, cs]: [number, RawCell[]]) => cs.sort((a: RawCell, b: RawCell) => a.x - b.x));
}

function nearest(row: RawCell[], x: number): string {
  if (x < 0 || !row.length) return "";
  return row.reduce<RawCell | null>((b, c) =>
    b === null || Math.abs(c.x - x) < Math.abs(b.x - x) ? c : b, null
  )?.text ?? "";
}

function findHdrX(hdr: RawCell[], kws: string[]): number {
  const c = [...hdr].sort((a, b) => a.x - b.x).find(h => kws.some(k => h.text.toLowerCase().includes(k)));
  return c ? c.x : -1;
}

// ─── Bank Detection ───────────────────────────────────────────────────────────
function detectBank(text: string): BankId {
  const t = text.toLowerCase();
  for (const bank of BANKS) {
    if (bank.id === "auto") continue;
    if (bank.keywords.some(k => t.includes(k))) return bank.id;
  }
  return "hdfc"; // default fallback
}

// ─── HDFC Parser ──────────────────────────────────────────────────────────────
// Format: Date | Narration | Value Dt | Withdrawal Amt (Dr) | Deposit Amt (Cr) | Closing Balance
// Dates: DD/MM/YY (2-digit year) e.g. 01/10/25
const HDFC_DATE = /^\d{2}\/\d{2}\/\d{2}(\d{2})?$/;
const HDFC_AMOUNT = /^[\d,]+\.\d{2}$/;

function parseHDFC(rows: RawCell[][]): Transaction[] {
  const txns: Transaction[] = [];

  // Find header
  let hdrIdx = rows.findIndex(row =>
    row.some(c => /narration|withdrawal amt|deposit amt/i.test(c.text))
  );
  if (hdrIdx === -1) {
    hdrIdx = rows.findIndex(row =>
      row.some(c => /date/i.test(c.text)) &&
      row.some(c => /withdrawal|debit/i.test(c.text))
    );
  }
  if (hdrIdx === -1) return txns;

  const hdr = rows[hdrIdx];
  const dateX    = findHdrX(hdr, ["date"]);
  const narX     = findHdrX(hdr, ["narration","particulars","description","details"]);
  const valDtX   = findHdrX(hdr, ["value dt","value date"]);
  const drX      = findHdrX(hdr, ["withdrawal","debit"]);
  const crX      = findHdrX(hdr, ["deposit","credit"]);
  const balX     = findHdrX(hdr, ["closing","balance"]);

  let pending: Partial<Transaction> | null = null;

  for (let i = hdrIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row.length) continue;

    const dateCell = row.find(c => HDFC_DATE.test(c.text));
    if (dateCell) {
      if (pending?.date) {
        txns.push(pending as Transaction);
      }
      // Narration: cells between date and value-date (or withdrawal) columns
      const narCells = row.filter(c => {
        const afterDate  = c.x > dateX + 20;
        const beforeDr   = drX < 0 || c.x < drX - 10;
        const beforeValDt= valDtX < 0 || c.x < valDtX - 5;
        return c !== dateCell && afterDate && beforeDr && beforeValDt;
      });
      const narration = narCells.map(c => c.text).join(" ").trim() || nearest(row, narX);

      const dr  = cleanAmt(nearest(row, drX));
      const cr  = cleanAmt(nearest(row, crX));
      const bal = cleanAmt(nearest(row, balX));

      pending = {
        srNo: txns.length + 1,
        date: normalizeDate(dateCell.text),
        particulars: narration,
        chequeNo: "",
        credit: cr,
        debit: dr,
        balance: bal,
      };
    } else if (pending) {
      // Continuation row — append narration unless it looks like totals
      const text = row.map(c => c.text).join(" ").trim();
      if (text && !HDFC_AMOUNT.test(text) && !/opening|closing|total|balance/i.test(text)) {
        pending.particulars = ((pending.particulars ?? "") + " " + text).trim();
      }
    }
  }
  if (pending?.date) txns.push(pending as Transaction);
  txns.forEach((t, i) => (t.srNo = i + 1));
  return txns;
}

// ─── PNB Parser ───────────────────────────────────────────────────────────────
// Format: Txn No | Txn Date | Description | Branch | Cheque No | Dr Amount | Cr Amount | Balance
// Dates: DD-MM-YYYY. PNB often has two-row headers ("Dr." / "Amount" split across rows).
// Strategy: detect columns from merged header, then fall back to balance-delta inference.
const PNB_DATE = /^\d{2}-\d{2}-\d{4}$/;
const PNB_AMT  = /^[\d,]+\.\d{2}$/;

function parsePNB(rows: RawCell[][]): Transaction[] {
  const txns: Transaction[] = [];

  // ── Step 1: Find header row(s) ──────────────────────────────────────────────
  let hdrIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const txt = rows[i].map(c => c.text.toLowerCase()).join(" ");
    if (
      txt.includes("txn date") || txt.includes("txn no") ||
      (txt.includes("dr") && txt.includes("cr") && txt.includes("balance")) ||
      (txt.includes("debit") && txt.includes("credit") && txt.includes("balance"))
    ) { hdrIdx = i; break; }
  }
  if (hdrIdx === -1) return txns;

  // ── Step 2: Merge two-row header if next row has "Amount" sub-labels ────────
  // PNB puts "Dr." on row 1 and "Amount" on row 2 at the same X position
  const hdr: RawCell[] = rows[hdrIdx].map(c => ({ ...c })); // clone
  if (hdrIdx + 1 < rows.length) {
    const nextRow = rows[hdrIdx + 1];
    const nextTxt = nextRow.map(c => c.text.toLowerCase()).join(" ");
    const isSubHeader = nextTxt.includes("amount") && !PNB_DATE.test(nextRow[0]?.text ?? "");
    if (isSubHeader) {
      for (const cell of nextRow) {
        const match = hdr.reduce<RawCell | null>((b, c) =>
          b === null || Math.abs(c.x - cell.x) < Math.abs(b.x - cell.x) ? c : b, null
        );
        if (match && Math.abs(match.x - cell.x) < 60) {
          match.text = (match.text + " " + cell.text).trim();
        }
      }
    }
  }

  // ── Step 3: Extract column X positions from merged header ───────────────────
  const dateX = findHdrX(hdr, ["txn date","date"]);
  const descX = findHdrX(hdr, ["description","particulars","narration","details"]);
  const cheqX = findHdrX(hdr, ["cheque","chq"]);
  let   drX   = findHdrX(hdr, ["dr amount","dr. amount","dr amt","withdrawal","dr"]);
  let   crX   = findHdrX(hdr, ["cr amount","cr. amount","cr amt","deposit","cr"]);
  let   balX  = findHdrX(hdr, ["balance"]);

  // ── Step 4: Position-based fallback for Dr/Cr/Balance columns ───────────────
  // If columns not found from header, look at first few data rows and infer
  // PNB layout (right → left): Balance | Cr Amount | Dr Amount
  if (balX < 0 || drX < 0 || crX < 0) {
    for (let i = hdrIdx + 2; i < Math.min(rows.length, hdrIdx + 15); i++) {
      const row = rows[i];
      const dateCell = row.find(c => PNB_DATE.test(c.text));
      if (!dateCell) continue;
      const amtCells = row
        .filter(c => PNB_AMT.test(c.text.replace(/,/g, "")))
        .sort((a, b) => b.x - a.x); // rightmost first
      if (amtCells.length >= 2) {
        if (balX < 0) balX = amtCells[0].x;
        if (crX  < 0 && amtCells.length >= 2) crX = amtCells[1].x;
        if (drX  < 0 && amtCells.length >= 3) drX = amtCells[2].x;
        break;
      }
    }
  }

  // ── Step 5: Parse transaction rows ─────────────────────────────────────────
  let pending: Partial<Transaction> | null = null;
  let pendingRowCount = 0;
  let prevBalance = 0;

  const dataStart = hdrIdx + (
    hdrIdx + 1 < rows.length &&
    rows[hdrIdx + 1].map(c => c.text.toLowerCase()).join(" ").includes("amount") &&
    !PNB_DATE.test(rows[hdrIdx + 1][0]?.text ?? "")
      ? 2 : 1
  );

  for (let i = dataStart; i < rows.length; i++) {
    const row = rows[i];
    if (!row.length) continue;

    const dateCell = row.find(c => PNB_DATE.test(c.text));
    if (dateCell) {
      if (pending?.date) { txns.push(pending as Transaction); }

      // Get balance first (rightmost known amount column)
      const bal = balX >= 0 ? cleanAmt(nearest(row, balX)) : 0;

      // Get Dr and Cr amounts
      let dr = drX >= 0 ? cleanAmt(nearest(row, drX)) : 0;
      let cr = crX >= 0 ? cleanAmt(nearest(row, crX)) : 0;

      // Fallback: if both dr and cr are 0, infer from balance delta
      if (dr === 0 && cr === 0 && prevBalance > 0 && bal > 0) {
        // Find all amount cells excluding the balance
        const balCell = balX >= 0 ? row.find(c => c.x >= balX - 20 && c.x <= balX + 20) : null;
        const amtCells = row
          .filter(c => PNB_AMT.test(c.text.replace(/,/g, "")) && c !== balCell && c !== dateCell)
          .sort((a, b) => b.x - a.x);

        if (amtCells.length === 1) {
          const amt = cleanAmt(amtCells[0].text);
          // Use balance delta: if balance increased → credit, else → debit
          if (bal > prevBalance) cr = amt; else dr = amt;
        } else if (amtCells.length >= 2) {
          // rightmost non-balance = Cr, next = Dr (PNB column order)
          cr = cleanAmt(amtCells[0].text);
          dr = cleanAmt(amtCells[1].text);
        }
      }

      const desc   = descX >= 0 ? nearest(row, descX) : "";
      const cheque = cheqX >= 0 ? nearest(row, cheqX) : "";

      pending = {
        srNo: txns.length + 1,
        date: normalizeDate(dateCell.text),
        particulars: desc,
        chequeNo: cheque === "-" ? "" : cheque,
        credit: cr,
        debit: dr,
        balance: bal,
      };
      prevBalance = bal;
      pendingRowCount = 0;
    } else if (pending && pendingRowCount < 2) {
      const rowText = row.map(c => c.text).join(" ").trim();
      const isAmt   = PNB_AMT.test(rowText.replace(/,/g, ""));
      const isMeta  = /opening|closing|total|page|statement|balance b\/f/i.test(rowText);
      if (!isAmt && !isMeta && rowText) {
        pending.particulars = ((pending.particulars ?? "") + " " + rowText).trim();
        pendingRowCount++;
      }
    }
  }
  if (pending?.date) txns.push(pending as Transaction);
  txns.forEach((t, i) => (t.srNo = i + 1));
  return txns;
}

// ─── Bank of Maharashtra Parser ───────────────────────────────────────────────
// Format: Sr No | Date | Particulars | Cheque/Ref No | Debit | Credit | Balance | Channel
// Dates: DD/MM/YYYY  Empty cells: dash "-"
const BOM_DATE = /^\d{2}\/\d{2}\/\d{4}$/;

function parseBOM(rows: RawCell[][]): Transaction[] {
  const txns: Transaction[] = [];

  let hdrIdx = rows.findIndex(row =>
    row.some(c => /particulars/i.test(c.text)) &&
    row.some(c => /debit|credit/i.test(c.text))
  );
  if (hdrIdx === -1) {
    hdrIdx = rows.findIndex(row =>
      row.some(c => /date/i.test(c.text)) &&
      row.some(c => /balance/i.test(c.text)) &&
      row.some(c => /debit|withdrawal/i.test(c.text))
    );
  }
  if (hdrIdx === -1) return txns;

  const hdr = rows[hdrIdx];
  const dateX   = findHdrX(hdr, ["date"]);
  const partX   = findHdrX(hdr, ["particulars","description","narration"]);
  const cheqX   = findHdrX(hdr, ["cheque","chq/ref","ref no","ref"]);
  const debitX  = findHdrX(hdr, ["debit","withdrawal"]);
  const creditX = findHdrX(hdr, ["credit","deposit"]);
  const balX    = findHdrX(hdr, ["balance"]);

  for (let i = hdrIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row.length) continue;
    const dateCell = row.find(c => BOM_DATE.test(c.text));
    if (!dateCell) continue;

    const debit  = cleanAmt(nearest(row, debitX));
    const credit = cleanAmt(nearest(row, creditX));
    const bal    = cleanAmt(nearest(row, balX));
    const part   = nearest(row, partX);
    const cheque = nearest(row, cheqX);

    if (debit === 0 && credit === 0 && bal === 0) continue;

    txns.push({
      srNo: txns.length + 1,
      date: normalizeDate(dateCell.text),
      particulars: part,
      chequeNo: cheque === "-" ? "" : cheque,
      credit,
      debit,
      balance: bal,
    });
  }
  txns.forEach((t, i) => (t.srNo = i + 1));
  return txns;
}

// ─── Kotak Parser ─────────────────────────────────────────────────────────────
// Format: # | Transaction Date | Value Date | Transaction Details | CHQ/REF NO | DEBIT/CREDIT(₹) | BALANCE(₹)
// Dates: DD Mon YYYY (e.g. "15 Oct 2025")
// Amounts: single col — positive = credit, negative = debit
const KOTAK_DATE = /^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/;

function parseKotak(rows: RawCell[][]): Transaction[] {
  const txns: Transaction[] = [];

  let hdrIdx = rows.findIndex(row =>
    row.some(c => /transaction date/i.test(c.text)) ||
    (row.some(c => /transaction details/i.test(c.text)) && row.some(c => /balance/i.test(c.text)))
  );
  if (hdrIdx === -1) return txns;

  const hdr = rows[hdrIdx];
  const dateX   = findHdrX(hdr, ["transaction date","date"]);
  const detailX = findHdrX(hdr, ["transaction details","particulars","description","narration"]);
  const cheqX   = findHdrX(hdr, ["chq/ref","chq","ref"]);
  const amtX    = findHdrX(hdr, ["debit/credit","amount","dr/cr"]);
  const balX    = findHdrX(hdr, ["balance"]);

  for (let i = hdrIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row.length) continue;
    const dateCell = row.find(c => KOTAK_DATE.test(c.text));
    if (!dateCell) continue;

    const amtStr = nearest(row, amtX).replace(/[,\s₹]/g, "");
    const amtVal = parseFloat(amtStr);
    const credit = !isNaN(amtVal) && amtVal > 0 ? amtVal : 0;
    const debit  = !isNaN(amtVal) && amtVal < 0 ? Math.abs(amtVal) : 0;
    const bal    = cleanAmt(nearest(row, balX));

    txns.push({
      srNo: txns.length + 1,
      date: normalizeDate(dateCell.text),
      particulars: nearest(row, detailX),
      chequeNo: nearest(row, cheqX),
      credit,
      debit,
      balance: bal,
    });
  }
  txns.forEach((t, i) => (t.srNo = i + 1));
  return txns;
}

// ─── Generic Parser (Fallback + Union Bank after OCR) ─────────────────────────
// Detects columns from header keywords, handles most Indian bank formats
const ANY_DATE = /\b(\d{2}[\/\-]\d{2}[\/\-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\b/;
const HDR_MUST = ["date","narration","particulars","description","debit","credit","balance","withdrawal","deposit","amount","cheque","chq","ref","txn"];

function isHeaderRow(row: RawCell[]): boolean {
  const hits = HDR_MUST.filter(w => row.some(c => c.text.toLowerCase().includes(w)));
  return hits.length >= 3;
}

function parseGeneric(rows: RawCell[][]): Transaction[] {
  const txns: Transaction[] = [];

  // Find header
  let hdrIdx = rows.findIndex(isHeaderRow);
  if (hdrIdx === -1) return txns;

  const hdr = rows[hdrIdx];
  const dateX  = findHdrX(hdr, ["txn date","transaction date","date"]);
  const descX  = findHdrX(hdr, ["narration","particulars","description","transaction details","details"]);
  const cheqX  = findHdrX(hdr, ["cheque no","chq/ref","chq","ref no"]);
  const drX    = findHdrX(hdr, ["dr amount","dr amt","withdrawal amt","withdrawal","debit","paid out"]);
  const crX    = findHdrX(hdr, ["cr amount","cr amt","deposit amt","deposit","credit","paid in"]);
  const amtX   = findHdrX(hdr, ["debit/credit","amount"]);
  const balX   = findHdrX(hdr, ["closing balance","running balance","balance"]);

  const hasSeparate = crX >= 0 && drX >= 0;

  let pending: Partial<Transaction> | null = null;

  for (let i = hdrIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row.length) continue;

    const dateMatch = row.find(c => ANY_DATE.test(c.text));
    if (dateMatch) {
      if (pending?.date) txns.push(pending as Transaction);

      let credit = 0, debit = 0;
      if (hasSeparate) {
        credit = cleanAmt(nearest(row, crX));
        debit  = cleanAmt(nearest(row, drX));
      } else {
        const amtStr = nearest(row, amtX >= 0 ? amtX : drX).replace(/[,\s₹]/g, "");
        const amtVal = parseFloat(amtStr);
        if (!isNaN(amtVal)) {
          if (amtVal >= 0) credit = amtVal; else debit = Math.abs(amtVal);
        }
      }

      pending = {
        srNo: txns.length + 1,
        date: normalizeDate(dateMatch.text),
        particulars: nearest(row, descX),
        chequeNo: nearest(row, cheqX),
        credit,
        debit,
        balance: cleanAmt(nearest(row, balX)),
      };
    } else if (pending) {
      const text = row.map(c => c.text).join(" ").trim();
      if (text && !/^[\d,]+\.\d{2}$/.test(text) && !/opening|closing|total|page/i.test(text)) {
        pending.particulars = ((pending.particulars ?? "") + " " + text).trim();
      }
    }
  }
  if (pending?.date) txns.push(pending as Transaction);
  txns.forEach((t, i) => (t.srNo = i + 1));
  return txns;
}

// ─── Dispatch parser ──────────────────────────────────────────────────────────
function runParser(bank: BankId, rows: RawCell[][]): Transaction[] {
  switch (bank) {
    case "hdfc":  return parseHDFC(rows);
    case "pnb":   return parsePNB(rows);
    case "bom":   return parseBOM(rows);
    case "kotak": return parseKotak(rows);
    default:      return parseGeneric(rows);
  }
}

// ─── Excel Export ─────────────────────────────────────────────────────────────
function exportExcel(txns: Transaction[], bankLabel: string, fileName: string) {
  const header = ["Sr. No.", "Date", "Particulars", "Cheque Number", "Credit / Deposit (₹)", "Debit / Withdrawal (₹)", "Balance (₹)", "Category", "Ledger"];
  const data = txns.map(t => [
    t.srNo,
    t.date,
    t.particulars,
    t.chequeNo || "",
    t.credit  > 0 ? t.credit  : "",
    t.debit   > 0 ? t.debit   : "",
    t.balance > 0 ? t.balance : "",
    t.category || "Uncategorized",
    t.ledger   || "Suspense Ledger",
  ]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
  ws["!cols"] = [
    { wch: 8 }, { wch: 14 }, { wch: 50 }, { wch: 18 },
    { wch: 20 }, { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 24 },
  ];

  // Color rows by category
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let r = 1; r <= data.length; r++) {
    const cat = data[r - 1][7] as string;
    const bg  = CAT_CLR[cat] || (r % 2 === 0 ? "EBF3FB" : "FFFFFF");
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { t: "z" };
      ws[addr].s = { fill: { fgColor: { rgb: bg } } };
    }
  }

  // Summary sheet
  const totalCredit = txns.reduce((s, t) => s + (t.credit || 0), 0);
  const totalDebit  = txns.reduce((s, t) => s + (t.debit  || 0), 0);
  const ws2 = XLSX.utils.aoa_to_sheet([
    ["Summary", ""],
    ["", ""],
    ["Total Transactions", txns.length],
    ["Total Credits (₹)",  totalCredit],
    ["Total Debits (₹)",   totalDebit],
    ["Net Cash Flow (₹)",  totalCredit - totalDebit],
    ["", ""],
    ["Category Breakdown", ""],
    ...Object.entries(
      txns.reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      }, {})
    ).map(([cat, count]) => [cat, count]),
  ]);
  ws2["!cols"] = [{ wch: 25 }, { wch: 20 }];

  XLSX.utils.book_append_sheet(wb, ws, "Bank Statement");
  XLSX.utils.book_append_sheet(wb, ws2, "Summary");
  XLSX.writeFile(wb, fileName);
}

// ─── Format number ────────────────────────────────────────────────────────────
function fmt(n: number): string {
  if (!n) return "";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── UI Component ─────────────────────────────────────────────────────────────
export default function BankStatementPro() {
  const [bank, setBank]         = useState<BankId>("auto");
  const [step, setStep]         = useState<Step>("upload");
  const [error, setError]       = useState("");
  const [warning, setWarning]   = useState("");
  const [fileName, setFileName] = useState("");
  const [detectedBank, setDetectedBank] = useState<BankId | null>(null);
  const [txns, setTxns]         = useState<Transaction[]>([]);
  const [showAll, setShowAll]   = useState(false);
  const [progress, setProgress] = useState(0);

  const bankLabel = (id: BankId) => BANKS.find(b => b.id === id)?.label ?? id;

  const reset = () => {
    setStep("upload"); setError(""); setWarning(""); setFileName("");
    setDetectedBank(null); setTxns([]); setShowAll(false); setProgress(0);
  };

  const processFile = useCallback(async (file: File) => {
    setStep("processing");
    setError("");
    setWarning("");
    setProgress(5);

    try {
      const arrayBuffer = await file.arrayBuffer();
      setProgress(15);

      // @ts-ignore
      const pdfjs = await import("pdfjs-dist/webpack.mjs");
      const pdf = await pdfjs.getDocument({
        data: new Uint8Array(arrayBuffer),
        isEvalSupported: false,
        useSystemFonts: true,
        disableRange: true,
        disableStream: true,
        disableAutoFetch: true,
      }).promise;

      setProgress(30);

      // Extract all text + cells
      let fullText = "";
      const allRows: RawCell[][] = [];

      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const tc = await page.getTextContent();
        const cells = extractCells(tc.items);
        fullText += cells.map(c => c.text).join(" ") + " ";
        const rows = groupByRow(cells);
        allRows.push(...rows);
        setProgress(30 + Math.round((p / pdf.numPages) * 40));
      }

      setProgress(75);

      // Detect or use selected bank
      let resolvedBank: BankId = bank;
      if (bank === "auto") {
        resolvedBank = detectBank(fullText);
        setDetectedBank(resolvedBank);
      }

      // Check if scanned (very little text)
      // Helper: add category + ledger to any parsed result
      const withClassification = (rows: Transaction[]) =>
        rows.map(t => ({ ...t, ...classify(t.particulars) }));

      const isScanned = fullText.replace(/\s/g, "").length < 300;
      if (isScanned) {
        // OCR path — applies to Union Bank and any other scanned PDF
        setWarning("Scanned PDF detected. Applying OCR — this may take 1–2 minutes for large files.");
        const ocrLines = await runOCR(pdf);
        const parsed = parseOCRLines(ocrLines);
        if (!parsed.length) throw new Error("OCR ran but could not extract transactions. Please ensure the scan is clear and upright. For best results, use a text-based (non-scanned) bank PDF.");
        setTxns(withClassification(parsed));
      } else {
        // Text-based PDF
        const parsed = runParser(resolvedBank, allRows);
        if (!parsed.length) {
          // Fallback to generic
          const fallback = parseGeneric(allRows);
          if (!fallback.length) throw new Error(`No transactions found. The PDF format may differ from expected ${bankLabel(resolvedBank)} layout. Try selecting the correct bank manually.`);
          setWarning(`Specific ${bankLabel(resolvedBank)} parser found 0 rows — used generic parser instead.`);
          setTxns(withClassification(fallback));
        } else {
          setTxns(withClassification(parsed));
        }
      }

      setProgress(100);
      setStep("preview");
      setFileName(file.name.replace(/\.pdf$/i, ""));

    } catch (e: any) {
      setError(e?.message || String(e) || "Failed to process PDF.");
      setStep("upload");
      setProgress(0);
    }
  }, [bank]);

  // ── OCR line parser ──────────────────────────────────────────────────────────
  // After OCR, each line is a string. We look for lines that contain a date
  // and amount patterns using regex. Works for most scanned Indian bank statements.
  function parseOCRLines(lines: string[]): Transaction[] {
    const txns: Transaction[] = [];
    // Date patterns: DD/MM/YYYY, DD-MM-YYYY, DD/MM/YY
    const DATE_P = /\b(\d{2}[\/\-]\d{2}[\/\-]\d{2,4})\b/;
    // Amount pattern: 1,23,456.78  or  123456.78
    const AMT_P  = /\b(\d{1,3}(?:,\d{2,3})*\.\d{2})\b/g;

    for (const line of lines) {
      const trimmed = line.replace(/\s+/g, " ").trim();
      if (!trimmed) continue;

      const dateMatch = trimmed.match(DATE_P);
      if (!dateMatch) continue;

      // Extract all amounts from the line
      const amounts: number[] = [];
      let m: RegExpExecArray | null;
      const amtRe = new RegExp(AMT_P.source, "g");
      while ((m = amtRe.exec(trimmed)) !== null) {
        const n = parseFloat(m[1].replace(/,/g, ""));
        if (!isNaN(n)) amounts.push(n);
      }
      if (!amounts.length) continue;

      // Convention: rightmost = balance; next = cr or dr; leftmost = dr or cr
      const bal    = amounts[amounts.length - 1];
      const prevBal = txns.length > 0 ? txns[txns.length - 1].balance : 0;

      let cr = 0, dr = 0;
      if (amounts.length >= 3) {
        // Last=balance, second-last=cr, third-last=dr (common Indian bank layout)
        cr = amounts[amounts.length - 2];
        dr = amounts[amounts.length - 3];
        // Zero out whichever doesn't match balance change
        if (cr > 0 && dr > 0) {
          if (prevBal > 0) {
            if (bal > prevBal) dr = 0; else cr = 0;
          }
        }
      } else if (amounts.length === 2) {
        const txnAmt = amounts[0];
        if (prevBal > 0) {
          if (bal > prevBal) cr = txnAmt; else dr = txnAmt;
        } else {
          cr = txnAmt; // assume credit if no previous balance
        }
      }

      // Description: remove date + amounts from line → remaining text
      let desc = trimmed
        .replace(dateMatch[0], "")
        .replace(amtRe, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      txns.push({
        srNo: txns.length + 1,
        date: normalizeDate(dateMatch[1]),
        particulars: desc || "—",
        chequeNo: "",
        credit: cr,
        debit: dr,
        balance: bal,
      });
    }
    txns.forEach((t, i) => (t.srNo = i + 1));
    return txns;
  }

  // OCR via tesseract.js for scanned PDFs
  async function runOCR(pdf: any): Promise<string[]> {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    const lines: string[] = [];

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 2.5 }); // higher scale = better OCR
      const canvas = document.createElement("canvas");
      canvas.width  = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const { data } = await worker.recognize(canvas.toDataURL("image/png"));
      // Only keep lines with actual content
      lines.push(...data.lines.map((l: any) => l.text.trim()).filter(Boolean));
    }

    await worker.terminate();
    return lines;
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") processFile(file);
    else setError("Please upload a PDF file.");
  }, [processFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const doExport = () => {
    const label = detectedBank ? bankLabel(detectedBank) : bankLabel(bank);
    exportExcel(txns, label, `${fileName || "bank-statement"}_converted.xlsx`);
  };

  // ── Upload screen ──────────────────────────────────────────────────────────
  if (step === "upload") return (
    <div className="min-h-screen bg-background pt-20 pb-10">
      <div className="max-w-3xl mx-auto px-4">

        {/* Back */}
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary mb-6 transition-colors">
          <ArrowLeft size={15} /> Back to Tools
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Building2 size={13} /> Multi-Bank PDF Converter
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-dark mb-2">Bank Statement PDF → Excel</h1>
          <p className="text-muted text-sm max-w-xl mx-auto">
            Convert bank statement PDFs to Excel with correct columns: Sr. No., Date, Particulars, Cheque No., Credit, Debit, Balance.
            Supports HDFC, PNB, Bank of Maharashtra, Kotak & more.
          </p>
        </div>

        {/* Bank selector */}
        <div className="bg-white rounded-card shadow-card border border-gray-100 p-5 mb-4">
          <label className="block text-sm font-semibold text-dark mb-3">
            Select Bank <span className="text-muted font-normal">(or leave on Auto Detect)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BANKS.map(b => (
              <button
                key={b.id}
                onClick={() => setBank(b.id)}
                className={`text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  bank === b.id
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 text-muted hover:border-primary/40 hover:text-dark"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Drop zone */}
        <div
          className="bg-white rounded-card shadow-card border-2 border-dashed border-gray-200 hover:border-primary/40 transition-colors p-10 text-center cursor-pointer group"
          onDragOver={e => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => document.getElementById("bsp-file")?.click()}
        >
          <input id="bsp-file" type="file" accept=".pdf" className="hidden" onChange={onFileChange} />
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/15 transition-colors">
            <Upload size={26} className="text-primary" />
          </div>
          <p className="font-semibold text-dark mb-1">Drop your bank statement PDF here</p>
          <p className="text-sm text-muted">or click to browse — processed entirely in your browser</p>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Privacy note */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted">
          <Shield size={12} className="text-green-500" />
          100% browser-based — your PDF never leaves your device
        </div>

        {/* Bank format guide */}
        <div className="mt-8 bg-white rounded-card shadow-card border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-dark mb-3">Supported Bank Formats</h3>
          <div className="space-y-2">
            {[
              { bank:"HDFC Bank",            fmt:"Date | Narration | Value Dt | Withdrawal (Dr) | Deposit (Cr) | Closing Balance" },
              { bank:"Punjab National Bank", fmt:"Txn No | Txn Date | Description | Cheque No | Dr Amount | Cr Amount | Balance" },
              { bank:"Bank of Maharashtra",  fmt:"Sr No | Date | Particulars | Cheque/Ref No | Debit | Credit | Balance" },
              { bank:"Kotak Mahindra Bank",  fmt:"# | Transaction Date | Value Date | Details | CHQ/REF | Debit/Credit(₹) | Balance" },
              { bank:"Union Bank of India",  fmt:"Scanned PDF — OCR applied automatically" },
            ].map(r => (
              <div key={r.bank} className="text-xs">
                <span className="font-semibold text-dark">{r.bank}:</span>{" "}
                <span className="text-muted">{r.fmt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Processing screen ──────────────────────────────────────────────────────
  if (step === "processing") return (
    <div className="min-h-screen bg-background flex items-center justify-center pt-[60px]">
      <div className="text-center max-w-sm mx-auto px-4">
        <Loader2 size={40} className="animate-spin text-primary mx-auto mb-4" />
        <h2 className="font-bold text-dark text-lg mb-2">Processing PDF…</h2>
        <p className="text-sm text-muted mb-5">Extracting transactions from your bank statement</p>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted mt-2">{progress}% complete</p>
      </div>
    </div>
  );

  // ── Preview screen ─────────────────────────────────────────────────────────
  const displayTxns = showAll ? txns : txns.slice(0, 25);
  const totalCredit  = txns.reduce((s, t) => s + t.credit,  0);
  const totalDebit   = txns.reduce((s, t) => s + t.debit,   0);
  const activeBank   = detectedBank ?? (bank === "auto" ? "hdfc" : bank);

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4">

        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-dark hover:border-primary hover:text-primary transition-all shadow-sm"
          >
            <ArrowLeft size={15} /> New File
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            {detectedBank && (
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5">
                <CheckCircle size={12} /> Auto-detected: {bankLabel(detectedBank)}
              </span>
            )}
            {warning && (
              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                ⚠ {warning}
              </span>
            )}
          </div>
          <button
            onClick={doExport}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow"
          >
            <Download size={15} /> Download Excel
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label:"Transactions",   value: txns.length.toString(),    icon:"🔢" },
            { label:"Total Credit",   value: `₹${fmt(totalCredit)}`,    icon:"🟢" },
            { label:"Total Debit",    value: `₹${fmt(totalDebit)}`,     icon:"🔴" },
            { label:"Net Flow",       value: `₹${fmt(totalCredit - totalDebit)}`, icon: totalCredit >= totalDebit ? "📈" : "📉" },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-card shadow-card border border-gray-100 p-4">
              <div className="text-lg mb-1">{c.icon}</div>
              <div className="text-base font-bold text-dark truncate">{c.value}</div>
              <div className="text-xs text-muted">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Category legend */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Array.from(new Set(txns.map(t => t.category))).map(cat => (
            <span key={cat} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${BADGE[cat] || "bg-gray-100 text-gray-400"}`}>
              <Tag size={9} />{cat}
            </span>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-card shadow-card border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Sr.", "Date", "Particulars", "Cheque No.", "Credit (₹)", "Debit (₹)", "Balance (₹)", "Category", "Ledger"].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayTxns.map(t => (
                  <tr key={t.srNo} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-3 py-2.5 text-xs text-muted">{t.srNo}</td>
                    <td className="px-3 py-2.5 text-xs font-medium text-dark whitespace-nowrap">{t.date}</td>
                    <td className="px-3 py-2.5 text-xs text-dark max-w-xs" title={t.particulars}>
                      <span className="block truncate">{t.particulars || "—"}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted">{t.chequeNo || "—"}</td>
                    <td className="px-3 py-2.5 text-xs font-medium text-green-700 text-right">
                      {t.credit > 0 ? fmt(t.credit) : ""}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium text-red-600 text-right">
                      {t.debit > 0 ? fmt(t.debit) : ""}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-dark text-right">{t.balance > 0 ? fmt(t.balance) : ""}</td>
                    <td className="px-3 py-2.5 text-xs">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${BADGE[t.category] || "bg-gray-100 text-gray-400"}`}>
                        <Tag size={9} />{t.category || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted whitespace-nowrap">{t.ledger || "Suspense Ledger"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {txns.length > 25 && (
            <div className="border-t border-gray-100 p-3 text-center">
              <button
                onClick={() => setShowAll(v => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <ChevronDown size={13} className={showAll ? "rotate-180 transition-transform" : "transition-transform"} />
                {showAll ? "Show less" : `Show all ${txns.length} transactions`}
              </button>
            </div>
          )}
        </div>

        {/* Export again at bottom */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 justify-center">
          <button
            onClick={doExport}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg transition-colors shadow"
          >
            <Download size={16} /> Download Excel (.xlsx)
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-lg border border-gray-300 bg-white text-dark hover:border-primary hover:text-primary transition-all shadow-sm"
          >
            <RefreshCw size={14} /> Process Another File
          </button>
        </div>

        <p className="text-center text-xs text-muted mt-4 flex items-center justify-center gap-1.5">
          <Shield size={11} className="text-green-500" />
          All processing done in your browser — no data uploaded anywhere
        </p>
      </div>
    </div>
  );
}
