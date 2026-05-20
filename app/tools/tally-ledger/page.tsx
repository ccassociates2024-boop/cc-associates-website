"use client";

import { useState, useCallback, useRef } from "react";
import {
  LayoutDashboard, List, ShieldAlert, Users, Calendar,
  ArrowLeft, Upload, Download, Shield, AlertCircle,
  CheckCircle, ChevronDown, ChevronRight, Flag,
  TrendingUp, TrendingDown, Search, AlertTriangle, Zap
} from "lucide-react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface LedgerEntry {
  date: string;
  particulars: string;
  vchType: string;
  vchNo: string;
  debit: number;
  credit: number;
  amount: number;
  flags: string[];
  rowIdx: number;
}

type TabId = "summary" | "ledger" | "party" | "monthly" | "forensic";

// ─── Flag Definitions ─────────────────────────────────────────────────────────
const FLAG_DEFS: { key: string; label: string; desc: string; enabled: boolean; severity: "high" | "medium" | "low" }[] = [
  { key: "sec269st",     label: "Sec 269ST Violation",    desc: "Cash/payment > ₹2,00,000 in a single day to one person",           enabled: true,  severity: "high" },
  { key: "highValue",    label: "High Value Transaction",  desc: "Single transaction > ₹10,00,000",                                  enabled: true,  severity: "high" },
  { key: "suspense",     label: "Suspense Account",        desc: "Transaction routed through Suspense / Suspence A/c",               enabled: true,  severity: "high" },
  { key: "roundTrip",    label: "Round-Trip / Loan Cycle", desc: "Payment to a party on same/next day as Receipt from same party",   enabled: true,  severity: "high" },
  { key: "splitPay",     label: "Split Payment (269ST)",   desc: "Multiple payments to same party on same day, total > ₹2,00,000",   enabled: true,  severity: "high" },
  { key: "roundAmt",     label: "Round Figure",            desc: "Exact round number ≥ ₹50,000 (divisible by ₹1,000)",              enabled: true,  severity: "medium" },
  { key: "weekend",      label: "Weekend Transaction",     desc: "Voucher dated Saturday or Sunday",                                 enabled: true,  severity: "medium" },
  { key: "sameDay",      label: "Same-Day Multi Payment",  desc: "3 or more payments to the same party on the same day",            enabled: true,  severity: "medium" },
  { key: "journalEntry", label: "Manual Journal Entry",    desc: "Journal vouchers — potential balance manipulation",                enabled: true,  severity: "medium" },
  { key: "monthEnd",     label: "Month-End Entry",         desc: "Voucher dated in last 2 days of a month — window dressing risk",  enabled: true,  severity: "low" },
  { key: "statutory",    label: "Statutory Payment",       desc: "GST / TDS / ESIC / PF / PT payment — flag for compliance review", enabled: false, severity: "low" },
];

// ─── Style Maps ───────────────────────────────────────────────────────────────
const SEV_BADGE: Record<string, string> = {
  high:   "bg-red-100 text-red-800 border border-red-200",
  medium: "bg-amber-100 text-amber-800 border border-amber-200",
  low:    "bg-yellow-100 text-yellow-800 border border-yellow-200",
};
const SEV_DOT: Record<string, string> = {
  high: "bg-red-500", medium: "bg-amber-400", low: "bg-yellow-400",
};
const SEV_ROW: Record<string, string> = {
  high:   "bg-red-50 border-l-4 border-l-red-500",
  medium: "bg-amber-50 border-l-4 border-l-amber-400",
  low:    "bg-yellow-50 border-l-4 border-l-yellow-400",
};
const CHART_COLORS = ["#1E40AF","#C9A84C","#DC2626","#16A34A","#7C3AED","#0891B2","#DB2777"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getFlagSeverity(flagStr: string): "high" | "medium" | "low" {
  const f = flagStr.toLowerCase();
  if (f.includes("269st") || f.includes("high value") || f.includes("suspense") ||
      f.includes("round-trip") || f.includes("split payment")) return "high";
  if (f.includes("round figure") || f.includes("weekend") ||
      f.includes("same-day") || f.includes("journal")) return "medium";
  return "low";
}

function calcRisk(entries: LedgerEntry[]) {
  if (!entries.length) return { score: 0, level: "NO DATA", gradient: "from-gray-700 to-gray-600" };
  let pts = 0;
  entries.forEach(e => e.flags.forEach(f => {
    pts += getFlagSeverity(f) === "high" ? 3 : getFlagSeverity(f) === "medium" ? 2 : 1;
  }));
  const score = Math.min(100, Math.round((pts / (entries.length * 1.5)) * 100));
  if (score >= 65) return { score, level: "CRITICAL RISK", gradient: "from-red-900 to-red-700" };
  if (score >= 35) return { score, level: "HIGH RISK",     gradient: "from-orange-800 to-orange-600" };
  if (score >= 12) return { score, level: "MODERATE RISK", gradient: "from-yellow-700 to-amber-600" };
  return              { score, level: "LOW RISK",      gradient: "from-emerald-700 to-green-600" };
}

function excelSerialToDate(serial: number): string {
  const d = new Date(new Date(Date.UTC(1899, 11, 30)).getTime() + serial * 86400000);
  return `${String(d.getUTCDate()).padStart(2,"0")}/${String(d.getUTCMonth()+1).padStart(2,"0")}/${d.getUTCFullYear()}`;
}

function parseDateStr(s: string): string {
  const MONTHS: Record<string,string> = { jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12" };
  const m1 = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
  if (m1) { const yr = m1[3].length===2?`20${m1[3]}`:m1[3]; return `${m1[1].padStart(2,"0")}/${MONTHS[m1[2].toLowerCase()]||"01"}/${yr}`; }
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m2) return `${m2[3]}/${m2[2]}/${m2[1]}`;
  const m3 = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{2,4})$/);
  if (m3) { const yr = m3[3].length===2?`20${m3[3]}`:m3[3]; return `${m3[1]}/${m3[2]}/${yr}`; }
  return s;
}

function toDateObj(d: string): Date | null {
  const [dd,mm,yyyy] = d.split("/").map(Number);
  return (dd&&mm&&yyyy) ? new Date(yyyy,mm-1,dd) : null;
}

const fmt = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cleanAmt = (v: string|number) => parseFloat(String(v).replace(/[,₹\s]/g,"")) || 0;

// ─── Parser ───────────────────────────────────────────────────────────────────
function parseDayBook(allRows: any[][]): LedgerEntry[] {
  let hdrIdx = -1;
  for (let i = 0; i < Math.min(allRows.length, 30); i++) {
    const txt = allRows[i].join(" ").toLowerCase();
    if (txt.includes("date") && (txt.includes("debit") || txt.includes("credit"))) { hdrIdx = i; break; }
  }
  if (hdrIdx === -1) throw new Error("Could not find header row. Ensure the file has Date, Debit, Credit columns.");
  const hdrs = allRows[hdrIdx].map((h: any) => String(h).toLowerCase().replace(/[^a-z0-9]/g,""));
  const ci = (...keys: string[]) => { for (const k of keys) { const i = hdrs.findIndex((h:string)=>h===k||h.includes(k)); if(i>=0)return i; } return -1; };
  const dateCol = ci("date"), partCol = ci("particulars","narration","description","party","ledgername");
  const vTypeCol = ci("vchtype","vouchertype","vtype","type"), vNoCol = ci("vchno","voucherno","vno","refno");
  const drCol = ci("debitamount","debit","dramt","dr"), crCol = ci("creditamount","credit","cramt","cr");
  const entries: LedgerEntry[] = [];
  let currentDate = "";
  for (let i = hdrIdx+1; i < allRows.length; i++) {
    const row = allRows[i]; if (!row?.length) continue;
    const col0 = row[dateCol>=0?dateCol:0];
    if (typeof col0==="number"&&col0>40000&&col0<60000) currentDate = excelSerialToDate(col0);
    else if (typeof col0==="string") { const c = parseDateStr(col0.trim()); if(/^\d{2}\/\d{2}\/\d{4}$/.test(c)) currentDate=c; }
    const particulars = String(row[partCol>=0?partCol:1]??"").trim();
    const vchType     = String(row[vTypeCol>=0?vTypeCol:2]??"").trim();
    const vchNo       = String(row[vNoCol>=0?vNoCol:3]??"").trim();
    const debit       = drCol>=0?cleanAmt(row[drCol]):0;
    const credit      = crCol>=0?cleanAmt(row[crCol]):0;
    if (!vchType||vchType.toLowerCase().includes("vch")||(!debit&&!credit)) continue;
    if (!currentDate) continue;
    entries.push({ date:currentDate, particulars, vchType, vchNo, debit, credit, amount:debit||credit, flags:[], rowIdx:i });
  }
  return entries;
}

// ─── Forensic Engine ──────────────────────────────────────────────────────────
const STATUTORY_KW = ["gst","tds","esic","pf payable","pt payable","profession tax","income tax payable","esi","provident fund","epf"];
const SUSPENSE_KW  = ["suspense","suspence","suspens"];

function applyForensicFlags(entries: LedgerEntry[], enabledKeys: Set<string>): LedgerEntry[] {
  const partyDayDebits: Record<string,number[]> = {};
  const partyDayIdxs:   Record<string,number[]> = {};
  entries.forEach((e,i) => {
    const key = `${e.particulars.toLowerCase()}__${e.date}`;
    if (e.debit>0) { partyDayDebits[key]=[...(partyDayDebits[key]||[]),e.debit]; partyDayIdxs[key]=[...(partyDayIdxs[key]||[]),i]; }
  });
  const partyReceiptDates: Record<string,string[]> = {};
  entries.forEach(e => { if(e.credit>0){ const p=e.particulars.toLowerCase(); partyReceiptDates[p]=[...(partyReceiptDates[p]||[]),e.date]; }});
  return entries.map((e) => {
    const flags: string[] = [];
    const party = e.particulars.toLowerCase();
    const dateObj = toDateObj(e.date);
    if (enabledKeys.has("highValue")  && e.amount>1000000)  flags.push("High Value (>₹10L)");
    if (enabledKeys.has("sec269st")   && e.debit>200000)    flags.push("Sec 269ST — Payment >₹2L");
    if (enabledKeys.has("suspense")   && SUSPENSE_KW.some(k=>party.includes(k))) flags.push("Suspense A/c — Unidentified Route");
    if (enabledKeys.has("roundAmt")   && e.amount>=50000&&e.amount%1000===0) flags.push("Round Figure (≥₹50K, ÷₹1K)");
    if (enabledKeys.has("weekend")    && dateObj&&[0,6].includes(dateObj.getDay())) flags.push("Weekend Transaction");
    if (enabledKeys.has("monthEnd")   && dateObj) {
      const last = new Date(dateObj.getFullYear(),dateObj.getMonth()+1,0).getDate();
      if (dateObj.getDate()>=last-1) flags.push("Month-End Entry");
    }
    if (enabledKeys.has("journalEntry") && e.vchType.toLowerCase()==="journal") flags.push("Manual Journal Entry");
    if (enabledKeys.has("statutory")  && STATUTORY_KW.some(k=>party.includes(k))) flags.push("Statutory Payment — Compliance Review");
    if (enabledKeys.has("sameDay")    && e.debit>0) {
      const key=`${party}__${e.date}`; if((partyDayDebits[key]?.length||0)>=3) flags.push("Same-Day Multi-Payment (≥3 txns)");
    }
    if (enabledKeys.has("splitPay")   && e.debit>0) {
      const key=`${party}__${e.date}`; const total=(partyDayDebits[key]||[]).reduce((s,a)=>s+a,0); const count=(partyDayDebits[key]||[]).length;
      if (count>1&&total>200000&&e.debit<=200000) flags.push(`Split Payment — Daily total ₹${fmt(total)} across ${count} txns`);
    }
    if (enabledKeys.has("roundTrip")  && e.debit>0) {
      const receipts = partyReceiptDates[party]||[];
      if (dateObj&&receipts.length>0) for (const rd of receipts) { const r=toDateObj(rd); if(r&&Math.abs(dateObj.getTime()-r.getTime())/86400000<=3){flags.push("Round-Trip — Receipt & Payment within 3 days");break;} }
    }
    return { ...e, flags };
  });
}

// ─── Summaries ────────────────────────────────────────────────────────────────
function partyWise(entries: LedgerEntry[]) {
  const map: Record<string,{debit:number;credit:number;count:number;flags:number}> = {};
  entries.forEach(e => {
    if (!map[e.particulars]) map[e.particulars]={debit:0,credit:0,count:0,flags:0};
    map[e.particulars].debit+=e.debit; map[e.particulars].credit+=e.credit;
    map[e.particulars].count+=1; map[e.particulars].flags+=e.flags.length>0?1:0;
  });
  return Object.entries(map).map(([party,v])=>({party,...v,net:v.credit-v.debit})).sort((a,b)=>(b.debit+b.credit)-(a.debit+a.credit));
}

function monthWise(entries: LedgerEntry[]) {
  const map: Record<string,{debit:number;credit:number;count:number}> = {};
  entries.forEach(e => {
    const [,mm,yyyy]=e.date.split("/"); const key=`${yyyy}-${mm}`;
    if (!map[key]) map[key]={debit:0,credit:0,count:0};
    map[key].debit+=e.debit; map[key].credit+=e.credit; map[key].count+=1;
  });
  return Object.entries(map).sort(([a],[b])=>a.localeCompare(b)).map(([month,v])=>({month,...v,net:v.credit-v.debit}));
}

function voucherWise(entries: LedgerEntry[]) {
  const map: Record<string,{debit:number;credit:number;count:number}> = {};
  entries.forEach(e => { const k=e.vchType||"Unknown"; if(!map[k])map[k]={debit:0,credit:0,count:0}; map[k].debit+=e.debit;map[k].credit+=e.credit;map[k].count+=1; });
  return Object.entries(map).map(([type,v])=>({type,...v})).sort((a,b)=>b.count-a.count);
}

// ─── Excel Export (Professional 6-Sheet) ─────────────────────────────────────
async function exportToExcel(entries: LedgerEntry[]) {
  // xlsx-js-style is a drop-in replacement for xlsx with full cell colour support
  const XLSX = await import("xlsx-js-style" as any) as any;
  const wb   = XLSX.utils.book_new();

  const flagged     = entries.filter(e=>e.flags.length>0);
  const totalDebit  = entries.reduce((s,e)=>s+e.debit,0);
  const totalCredit = entries.reduce((s,e)=>s+e.credit,0);
  const risk        = calcRisk(entries);
  const pw          = partyWise(entries);
  const mw          = monthWise(entries);
  const vw          = voucherWise(entries);

  // Flag counts
  const fCounts: Record<string,{count:number;sev:string}> = {};
  entries.forEach(e=>e.flags.forEach(f=>{
    const k=f.split("—")[0].trim().split("(")[0].trim();
    if (!fCounts[k]) fCounts[k]={count:0,sev:getFlagSeverity(f)};
    fCounts[k].count++;
  }));

  // ── Shared Style Objects ───────────────────────────────────────────────────
  const NAVY="0A1628", BLUE="1E3A8A", DKRED="7F1D1D", WHT="FFFFFF";
  const HIGHBG="FEE2E2", MEDBG="FEF3C7", LOWBG="FEF9C3", ALTBG="EFF6FF", TOTBG="DBEAFE", LBLBG="F1F5F9";

  const mkFill = (rgb: string) => ({ patternType:"solid" as const, fgColor:{rgb} });
  const mkFont = (opts: any) => ({ name:"Arial", sz:10, ...opts });

  const ST = {
    title:  { font:mkFont({sz:16,bold:true,color:{rgb:WHT}}), fill:mkFill(NAVY), alignment:{horizontal:"center",vertical:"center"} },
    sub:    { font:mkFont({sz:10,color:{rgb:WHT}}),            fill:mkFill(NAVY), alignment:{horizontal:"center",vertical:"center"} },
    hdrBlu: { font:mkFont({bold:true,color:{rgb:WHT}}),        fill:mkFill(BLUE), alignment:{horizontal:"center",vertical:"center",wrapText:false} },
    hdrRed: { font:mkFont({bold:true,color:{rgb:WHT}}),        fill:mkFill(DKRED),alignment:{horizontal:"center",vertical:"center"} },
    secHdr: { font:mkFont({bold:true,color:{rgb:WHT}}),        fill:mkFill("334155"),alignment:{horizontal:"left",vertical:"center"} },
    lbl:    { font:mkFont({bold:true,color:{rgb:NAVY}}),       fill:mkFill(LBLBG),alignment:{horizontal:"left",vertical:"center"} },
    val:    { font:mkFont({color:{rgb:"1E293B"}}),             fill:mkFill(WHT),  alignment:{horizontal:"left",vertical:"center"} },
    norm0:  { font:mkFont({color:{rgb:"1E293B"}}),             fill:mkFill(WHT),  alignment:{horizontal:"left",vertical:"center"} },
    norm1:  { font:mkFont({color:{rgb:"1E293B"}}),             fill:mkFill(ALTBG),alignment:{horizontal:"left",vertical:"center"} },
    high:   { font:mkFont({color:{rgb:"991B1B"}}),             fill:mkFill(HIGHBG),alignment:{horizontal:"left",vertical:"center"} },
    med:    { font:mkFont({color:{rgb:"92400E"}}),             fill:mkFill(MEDBG),alignment:{horizontal:"left",vertical:"center"} },
    low:    { font:mkFont({color:{rgb:"713F12"}}),             fill:mkFill(LOWBG),alignment:{horizontal:"left",vertical:"center"} },
    tot:    { font:mkFont({bold:true,color:{rgb:NAVY}}),       fill:mkFill(TOTBG),alignment:{horizontal:"left",vertical:"center"} },
    muted:  { font:mkFont({color:{rgb:"64748B"},italic:true}), fill:mkFill(WHT),  alignment:{horizontal:"left",vertical:"center"} },
  };

  const rgt   = (base: any) => ({...base, alignment:{...base.alignment, horizontal:"right"}});
  const bold  = (base: any) => ({...base, font:{...base.font, bold:true}});
  const AMT   = "#,##0.00";
  const IAMT  = "#,##0";

  function sc(ws: any, r: number, c: number, st: any, numFmt?: string) {
    const addr = XLSX.utils.encode_cell({r,c});
    if (!ws[addr]) ws[addr]={t:"z",v:""};
    ws[addr].s = st;
    if (numFmt) ws[addr].z = numFmt;
  }
  function sr(ws: any, row: number, ncols: number, st: any, amtCols: number[]=[]) {
    for (let c=0;c<ncols;c++) sc(ws,row,c, amtCols.includes(c)?rgt(st):st, amtCols.includes(c)?AMT:undefined);
  }
  function setHdr(ws:any, row:number, ncols:number, st:any) { sr(ws,row,ncols,st); }

  const today = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
  const highFl = flagged.filter(e=>e.flags.some(f=>getFlagSeverity(f)==="high")).length;
  const medFl  = flagged.filter(e=>!e.flags.some(f=>getFlagSeverity(f)==="high")&&e.flags.some(f=>getFlagSeverity(f)==="medium")).length;
  const lowFl  = flagged.length - highFl - medFl;

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 1 — 📋 Cover Page
  // ══════════════════════════════════════════════════════════════════════════
  {
    const data: any[][] = [
      ["FORENSIC DAYBOOK ANALYSIS REPORT","","","",""],
      ["Tally DayBook Forensic Audit  ·  Generated by AssociatePiyush.in","","","",""],
      ["","","","",""],
      ["REPORT SUMMARY","","","",""],
      ["Report Date",          today,                            "","",""],
      ["Total Transactions",   entries.length,                   "","",""],
      ["Total Debit (₹)",      totalDebit,                       "","",""],
      ["Total Credit (₹)",     totalCredit,                      "","",""],
      ["Net Flow (₹)",         totalCredit - totalDebit,         "","",""],
      ["Flagged Transactions",  flagged.length,                  "","",""],
      ["  ↳  High Severity",   highFl,                           "","",""],
      ["  ↳  Medium Severity", medFl,                            "","",""],
      ["  ↳  Low Severity",    lowFl,                            "","",""],
      ["Risk Score",           `${risk.score} / 100`,            "","",""],
      ["Risk Level",           risk.level,                       "","",""],
      ["","","","",""],
      ["FORENSIC FLAG BREAKDOWN","","","",""],
      ["Flag Type","Occurrences","Severity","",""],
      ...Object.entries(fCounts).sort(([,a],[,b])=>b.count-a.count).map(([k,v])=>[k, v.count, v.sev.toUpperCase(),"",""]),
      ["","","","",""],
      ["DISCLAIMER: This report is for investigative purposes only. Consult a qualified CA / forensic accountant for decisions.","","","",""],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = [{wch:38},{wch:22},{wch:14},{wch:10},{wch:10}];
    ws["!rows"] = [{hpt:44},{hpt:22},{hpt:8},{hpt:20}];
    const NC = 5;
    // Title rows
    for(let c=0;c<NC;c++){sc(ws,0,c,ST.title);sc(ws,1,c,ST.sub);}
    // Section header
    for(let c=0;c<NC;c++) sc(ws,3,c,ST.secHdr);
    // Label/value rows
    for(let r=4;r<=14;r++){sc(ws,r,0,ST.lbl);sc(ws,r,1,r>=7&&r<=9?rgt(ST.val):ST.val,r>=7&&r<=9?AMT:undefined);}
    // Flag breakdown section
    for(let c=0;c<NC;c++) sc(ws,16,c,ST.secHdr);
    setHdr(ws,17,NC,ST.hdrBlu);
    let fr=18;
    Object.entries(fCounts).sort(([,a],[,b])=>b.count-a.count).forEach(([,v],i)=>{
      const sev=v.sev; const base=sev==="high"?ST.high:sev==="medium"?ST.med:ST.low;
      for(let c=0;c<NC;c++) sc(ws,fr+i,c,c===1?rgt(base):base,c===1?IAMT:undefined);
    });
    // Disclaimer
    const discRow=19+Object.keys(fCounts).length;
    for(let c=0;c<NC;c++) sc(ws,discRow,c,ST.muted);
    XLSX.utils.book_append_sheet(wb,ws,"Cover Page");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 2 — ⚡ Forensic Flags (sorted: high → medium → low)
  // ══════════════════════════════════════════════════════════════════════════
  {
    const sorted = [...flagged].sort((a,b)=>{
      const sa=Math.max(...a.flags.map(f=>getFlagSeverity(f)==="high"?3:getFlagSeverity(f)==="medium"?2:1));
      const sb=Math.max(...b.flags.map(f=>getFlagSeverity(f)==="high"?3:getFlagSeverity(f)==="medium"?2:1));
      return sb-sa;
    });
    const COLS=["#","Date","Particulars / Party","Voucher Type","Vch No.","Amount (₹)","Dr / Cr","Forensic Flags Raised"];
    const rows: any[][] = [
      COLS,
      ...sorted.map((e,i)=>[i+1, e.date, e.particulars, e.vchType, e.vchNo, e.amount, e.debit>0?"Debit":"Credit", e.flags.join("  |  ")]),
      ["","","","","","Total Flagged Amount:",sorted.reduce((s,e)=>s+e.amount,0),""],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"]=[{wch:5},{wch:12},{wch:42},{wch:14},{wch:10},{wch:16},{wch:10},{wch:72}];
    ws["!rows"]=[{hpt:26}];
    ws["!freeze"]={xSplit:0,ySplit:1};
    ws["!autofilter"]={ref:`A1:H1`};
    setHdr(ws,0,8,ST.hdrRed);
    sorted.forEach((e,i)=>{
      const sev=Math.max(...e.flags.map(f=>getFlagSeverity(f)==="high"?3:getFlagSeverity(f)==="medium"?2:1));
      const base=sev===3?ST.high:sev===2?ST.med:ST.low;
      for(let c=0;c<8;c++) sc(ws,i+1,c,c===5?rgt(bold(base)):c===6?{...base,alignment:{horizontal:"center",vertical:"center"}}:base,c===5?AMT:undefined);
    });
    const tr=sorted.length+1;
    for(let c=0;c<8;c++) sc(ws,tr,c,c===6?rgt(ST.tot):ST.tot,c===6?AMT:undefined);
    XLSX.utils.book_append_sheet(wb,ws,"Forensic Flags");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 3 — 📊 Ledger Detail (all transactions, color-coded)
  // ══════════════════════════════════════════════════════════════════════════
  {
    const COLS=["#","Date","Particulars / Party","Voucher Type","Vch No.","Debit (₹)","Credit (₹)","Amount (₹)","Forensic Flags"];
    const rows: any[][] = [
      COLS,
      ...entries.map((e,i)=>[i+1,e.date,e.particulars,e.vchType,e.vchNo,e.debit||"",e.credit||"",e.amount,e.flags.join("  |  ")]),
      ["","","","","",totalDebit,totalCredit,"",""],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"]=[{wch:5},{wch:12},{wch:42},{wch:14},{wch:10},{wch:16},{wch:16},{wch:16},{wch:65}];
    ws["!rows"]=[{hpt:26}];
    ws["!freeze"]={xSplit:0,ySplit:1};
    ws["!autofilter"]={ref:`A1:I1`};
    setHdr(ws,0,9,ST.hdrBlu);
    const amtC=[5,6,7];
    entries.forEach((e,i)=>{
      const r=i+1;
      let base: any;
      if (e.flags.length>0) {
        const topSev=Math.max(...e.flags.map(f=>getFlagSeverity(f)==="high"?3:getFlagSeverity(f)==="medium"?2:1));
        base=topSev===3?ST.high:topSev===2?ST.med:ST.low;
      } else { base=r%2===0?ST.norm1:ST.norm0; }
      for(let c=0;c<9;c++) sc(ws,r,c,amtC.includes(c)?rgt(base):base,amtC.includes(c)?AMT:undefined);
    });
    const tr=entries.length+1;
    for(let c=0;c<9;c++) sc(ws,tr,c,amtC.includes(c)?rgt(ST.tot):ST.tot,amtC.includes(c)?AMT:undefined);
    XLSX.utils.book_append_sheet(wb,ws,"Ledger Detail");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 4 — 👥 Party-Wise Summary
  // ══════════════════════════════════════════════════════════════════════════
  {
    const COLS=["#","Party / Account Name","Transactions","Total Debit (₹)","Total Credit (₹)","Net Balance (₹)","Flagged Txns","Risk Signal"];
    const rows: any[][] = [
      COLS,
      ...pw.map((p,i)=>[i+1,p.party,p.count,p.debit||"",p.credit||"",p.net,p.flags,p.flags>0?"⚠ Flagged":"✓ Clean"]),
      ["","Grand Total",pw.reduce((s,p)=>s+p.count,0),totalDebit,totalCredit,totalCredit-totalDebit,flagged.length,""],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"]=[{wch:5},{wch:42},{wch:14},{wch:16},{wch:16},{wch:16},{wch:14},{wch:14}];
    ws["!rows"]=[{hpt:26}];
    ws["!freeze"]={xSplit:0,ySplit:1};
    ws["!autofilter"]={ref:`A1:H1`};
    setHdr(ws,0,8,ST.hdrBlu);
    const amtC=[3,4,5];
    pw.forEach((p,i)=>{
      const r=i+1; const base=p.flags>0?(r%2===0?{...ST.norm1,fill:mkFill("FFF7ED")}:{...ST.norm0,fill:mkFill("FFFBF2")}):r%2===0?ST.norm1:ST.norm0;
      for(let c=0;c<8;c++) sc(ws,r,c,amtC.includes(c)?rgt(base):c===7&&p.flags>0?{...base,font:{...base.font,bold:true,color:{rgb:"92400E"}}}:base,amtC.includes(c)?AMT:undefined);
    });
    const tr=pw.length+1;
    for(let c=0;c<8;c++) sc(ws,tr,c,amtC.includes(c)?rgt(ST.tot):ST.tot,amtC.includes(c)?AMT:undefined);
    XLSX.utils.book_append_sheet(wb,ws,"Party-Wise Summary");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 5 — 📅 Monthly Summary
  // ══════════════════════════════════════════════════════════════════════════
  {
    const MONTHS: Record<string,string> = {"01":"April","02":"May","03":"June","04":"July","05":"August","06":"September","07":"October","08":"November","09":"December","10":"January","11":"February","12":"March"};
    const COLS=["#","Month","Month Name","Transactions","Total Debit (₹)","Total Credit (₹)","Net Flow (₹)","Dr > Cr?"];
    const rows: any[][] = [
      COLS,
      ...mw.map((m,i)=>{
        const [yr,mm]=m.month.split("-");
        return [i+1,m.month,`${MONTHS[mm]||mm} ${yr}`,m.count,m.debit,m.credit,m.net,m.debit>m.credit?"⬆ Outflow Heavy":"⬇ Inflow Heavy"];
      }),
      ["","","Grand Total",mw.reduce((s,m)=>s+m.count,0),totalDebit,totalCredit,totalCredit-totalDebit,""],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"]=[{wch:5},{wch:10},{wch:18},{wch:14},{wch:16},{wch:16},{wch:16},{wch:16}];
    ws["!rows"]=[{hpt:26}];
    ws["!freeze"]={xSplit:0,ySplit:1};
    setHdr(ws,0,8,ST.hdrBlu);
    const amtC=[4,5,6];
    mw.forEach((m,i)=>{
      const r=i+1; const base=r%2===0?ST.norm1:ST.norm0;
      for(let c=0;c<8;c++) sc(ws,r,c,amtC.includes(c)?rgt(base):c===7?{...base,font:{...base.font,color:{rgb:m.debit>m.credit?"991B1B":"166534"}}}:base,amtC.includes(c)?AMT:undefined);
    });
    const tr=mw.length+1;
    for(let c=0;c<8;c++) sc(ws,tr,c,amtC.includes(c)?rgt(ST.tot):ST.tot,amtC.includes(c)?AMT:undefined);
    XLSX.utils.book_append_sheet(wb,ws,"Monthly Summary");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 6 — 🏷️ Voucher Analysis
  // ══════════════════════════════════════════════════════════════════════════
  {
    const COLS=["#","Voucher Type","Count","% of Total","Total Debit (₹)","Total Credit (₹)","Net (₹)"];
    const total=entries.length;
    const rows: any[][] = [
      COLS,
      ...vw.map((v,i)=>[i+1,v.type,v.count,v.count/total,v.debit||"",v.credit||"",v.credit-v.debit]),
      ["","Grand Total",total,1,totalDebit,totalCredit,totalCredit-totalDebit],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"]=[{wch:5},{wch:20},{wch:10},{wch:12},{wch:16},{wch:16},{wch:16}];
    ws["!rows"]=[{hpt:26}];
    setHdr(ws,0,7,ST.hdrBlu);
    const amtC=[4,5,6];
    vw.forEach((_,i)=>{
      const r=i+1; const base=r%2===0?ST.norm1:ST.norm0;
      for(let c=0;c<7;c++) sc(ws,r,c,amtC.includes(c)?rgt(base):c===3?{...rgt(base),z:"0.0%"}:base,amtC.includes(c)?AMT:undefined);
    });
    const tr=vw.length+1;
    for(let c=0;c<7;c++) sc(ws,tr,c,amtC.includes(c)?rgt(ST.tot):c===3?{...rgt(ST.tot),z:"0.0%"}:ST.tot,amtC.includes(c)?AMT:undefined);
    XLSX.utils.book_append_sheet(wb,ws,"Voucher Analysis");
  }

  XLSX.writeFile(wb, `Forensic_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TallyLedgerPage() {
  const [file,       setFile]       = useState<File|null>(null);
  const [processing, setProcessing] = useState(false);
  const [entries,    setEntries]    = useState<LedgerEntry[]>([]);
  const [flagDefs,   setFlagDefs]   = useState(FLAG_DEFS);
  const [tab,        setTab]        = useState<TabId>("summary");
  const [error,      setError]      = useState("");
  const [showGuide,  setShowGuide]  = useState(false);
  const [partySearch,setPartySearch]= useState("");
  const [ledgerSearch,setLedgerSearch]=useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleFlag = (key: string) =>
    setFlagDefs(prev=>prev.map(f=>f.key===key?{...f,enabled:!f.enabled}:f));

  const processFile = useCallback(async () => {
    if (!file) return;
    setProcessing(true); setError("");
    try {
      const XLSX  = await import("xlsx");
      const buf   = await file.arrayBuffer();
      const wb    = XLSX.read(buf,{type:"array"});
      const ws    = wb.Sheets[wb.SheetNames[0]];
      const allRows = XLSX.utils.sheet_to_json(ws,{header:1,defval:""}) as any[][];
      const parsed  = parseDayBook(allRows);
      if (parsed.length===0) throw new Error("No transactions found. Verify this is a Tally DayBook or Ledger export with Date, Debit, Credit columns.");
      const withFlags = applyForensicFlags(parsed, new Set(flagDefs.filter(f=>f.enabled).map(f=>f.key)));
      setEntries(withFlags); setTab("summary");
    } catch(e:any) { setError(e?.message||"Error processing file."); }
    finally { setProcessing(false); }
  }, [file, flagDefs]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const flagged      = entries.filter(e=>e.flags.length>0);
  const totalDebit   = entries.reduce((s,e)=>s+e.debit,0);
  const totalCredit  = entries.reduce((s,e)=>s+e.credit,0);
  const pw           = partyWise(entries);
  const mw           = monthWise(entries);
  const vw           = voucherWise(entries);
  const risk         = calcRisk(entries);
  const filteredParty  = pw.filter(p=>p.party.toLowerCase().includes(partySearch.toLowerCase()));
  const filteredLedger = entries.filter(e=>
    e.particulars.toLowerCase().includes(ledgerSearch.toLowerCase())||
    e.vchType.toLowerCase().includes(ledgerSearch.toLowerCase())||
    e.date.includes(ledgerSearch)
  );

  const flagCounts: Record<string,number> = {};
  entries.forEach(e=>e.flags.forEach(f=>{ const k=f.split("—")[0].trim().split("(")[0].trim(); flagCounts[k]=(flagCounts[k]||0)+1; }));

  const highFl = flagged.filter(e=>e.flags.some(f=>getFlagSeverity(f)==="high")).length;
  const medFl  = flagged.filter(e=>!e.flags.some(f=>getFlagSeverity(f)==="high")&&e.flags.some(f=>getFlagSeverity(f)==="medium")).length;
  const lowFl  = flagged.length - highFl - medFl;

  const chartMonthly = mw.map(m=>({
    name: m.month.replace(/^\d{4}-/,"").replace(/^0/,"") + "/" + m.month.substring(0,4).substring(2),
    Debit: Math.round(m.debit), Credit: Math.round(m.credit),
  }));
  const chartVoucher = vw.map((v,i)=>({ name:v.type, value:v.count, fill:CHART_COLORS[i%CHART_COLORS.length] }));

  const TABS = [
    { id:"summary"  as TabId, label:"Summary",               icon:LayoutDashboard },
    { id:"ledger"   as TabId, label:`Ledger (${entries.length})`,  icon:List },
    { id:"forensic" as TabId, label:`Flags (${flagged.length})`,   icon:ShieldAlert, alert:flagged.length>0 },
    { id:"party"    as TabId, label:`Party (${pw.length})`,        icon:Users },
    { id:"monthly"  as TabId, label:"Monthly",               icon:Calendar },
  ];

  // ── Upload Screen ──────────────────────────────────────────────────────────
  if (entries.length===0) return (
    <div className="min-h-screen pt-20 pb-12" style={{background:"var(--ap-bg)"}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-dark mb-6 transition-colors">
          <ArrowLeft size={14}/> Back to Tools
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <ShieldAlert size={20} className="text-white"/>
            </div>
            <div>
              <h1 className="text-2xl font-black text-dark tracking-tight">Tally DayBook — Forensic Analyser</h1>
              <p className="text-muted text-sm">Upload any Tally DayBook or Ledger export · Auto-detect red flags · Export professional 6-sheet audit report</p>
            </div>
          </div>
        </div>

        {/* Privacy strip */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl mb-6 text-xs text-emerald-800">
          <Shield size={13} className="text-emerald-600 flex-shrink-0"/>
          100% browser-based — your Tally data never leaves your device. Zero server upload.
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upload + Format Guide */}
          <div className="lg:col-span-2 space-y-4">
            {/* Format Guide */}
            <div className="ap-card">
              <button onClick={()=>setShowGuide(!showGuide)}
                className="w-full flex items-center justify-between p-4 text-sm font-semibold" style={{color:"var(--ap-text)"}}>
                <span className="flex items-center gap-2"><ChevronRight size={15} className={`transition-transform ${showGuide?"rotate-90":""}`}/>How to export from Tally?</span>
              </button>
              {showGuide&&(
                <div className="px-5 pb-4 text-xs space-y-1.5" style={{color:"var(--ap-text-muted)"}}>
                  <p><strong style={{color:"var(--ap-text)"}}>DayBook:</strong> Gateway of Tally → Display More Reports → Day Book → Export (Alt+E) → Excel Format</p>
                  <p><strong style={{color:"var(--ap-text)"}}>Ledger:</strong> Gateway → Display More Reports → Account Books → Ledger → Export → Excel</p>
                  <p className="pt-1" style={{color:"#1E40AF"}}>Expected columns: Date · Particulars · Vch Type · Vch No. · Debit Amount · Credit Amount</p>
                </div>
              )}
            </div>

            {/* Drop Zone */}
            <div className="ap-card p-6">
              <div
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${file?"border-primary/50 bg-primary/5":"border-gray-200 hover:border-primary/40 hover:bg-gray-50/50"}`}
                onClick={()=>inputRef.current?.click()}
                onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)setFile(f);}}
                onDragOver={e=>e.preventDefault()}
              >
                <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv,.txt,.xml" className="hidden"
                  onChange={e=>setFile(e.target.files?.[0]||null)}/>
                {file ? (
                  <div>
                    <CheckCircle size={44} className="mx-auto text-emerald-500 mb-3"/>
                    <p className="font-bold text-dark text-lg">{file.name}</p>
                    <p className="text-xs text-muted mt-1">{(file.size/1024).toFixed(1)} KB · Click to change file</p>
                  </div>
                ) : (
                  <div>
                    <Upload size={44} className="mx-auto mb-3" style={{color:"var(--ap-text-muted)"}}/>
                    <p className="font-bold text-dark text-lg mb-1">Drop Tally Export Here</p>
                    <p className="text-sm text-muted">.xlsx · .xls · .csv · .txt · .xml</p>
                  </div>
                )}
              </div>

              {error&&(
                <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0"/>{error}
                </div>
              )}

              <button onClick={processFile} disabled={!file||processing}
                className="mt-5 w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl font-bold text-base transition-all duration-200 disabled:opacity-50"
                style={{background:file?"#0A1628":"#94A3B8",color:"#fff",boxShadow:file?"0 8px 24px rgba(10,22,40,0.25)":"none"}}>
                {processing
                  ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> Analysing Ledger…</>
                  : <><Zap size={18}/> Run Forensic Analysis</>}
              </button>
            </div>
          </div>

          {/* Flag Options */}
          <div className="ap-card p-5">
            <h3 className="font-bold text-dark text-sm mb-4 pb-2 border-b border-gray-100">Forensic Flags to Check</h3>
            <div className="space-y-3.5">
              {flagDefs.map(f=>(
                <label key={f.key} className="flex items-start gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={f.enabled} onChange={()=>toggleFlag(f.key)}
                    className="mt-0.5 accent-primary flex-shrink-0 w-4 h-4"/>
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SEV_DOT[f.severity]}`}/>
                      <span className="text-xs font-semibold text-dark group-hover:text-primary transition-colors">{f.label}</span>
                    </div>
                    <p className="text-[11px] text-muted leading-snug">{f.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex gap-4 text-[11px]">
              {["high","medium","low"].map(s=>(
                <span key={s} className="flex items-center gap-1 text-muted capitalize">
                  <span className={`w-2 h-2 rounded-full ${SEV_DOT[s]}`}/>{s}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="tool-disclaimer mt-8">
          Results are indicative only. Always consult a qualified CA for final decisions. © 2026 CC Associates, Pune.
        </p>
      </div>
    </div>
  );

  // ── Results Screen ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-20 pb-12" style={{background:"var(--ap-bg)"}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Risk Score Banner ─────────────────────────────────────────────── */}
        <div className={`rounded-2xl p-5 mb-6 bg-gradient-to-r ${risk.gradient} text-white shadow-lg`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={28} className="text-white"/>
              </div>
              <div>
                <div className="text-3xl font-black tracking-tight leading-none">{risk.level}</div>
                <div className="text-sm text-white/75 mt-1">
                  {flagged.length} of {entries.length} transactions flagged · {highFl} critical · {medFl} medium · {lowFl} low
                </div>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-right">
                <div className="text-5xl font-black opacity-90">{risk.score}</div>
                <div className="text-xs text-white/60 uppercase tracking-widest">Risk Score</div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>{setEntries([]);setFile(null);setError("");}}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/20 hover:bg-white/30 transition-all">
                  <ArrowLeft size={14}/> New File
                </button>
                <button onClick={()=>exportToExcel(entries)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white text-primary hover:bg-white/90 transition-all shadow-md">
                  <Download size={15}/> Export Report
                </button>
              </div>
            </div>
          </div>
          <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-2 bg-white/70 rounded-full transition-all duration-1000" style={{width:`${risk.score}%`}}/>
          </div>
        </div>

        {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label:"Transactions", value:entries.length.toLocaleString("en-IN"),    icon:"📄", color:"text-primary" },
            { label:"Total Debit",  value:`₹${fmt(totalDebit)}`,                     icon:"🔴", color:"text-red-600" },
            { label:"Total Credit", value:`₹${fmt(totalCredit)}`,                    icon:"🟢", color:"text-emerald-600" },
            { label:"Net Flow",     value:`₹${fmt(Math.abs(totalCredit-totalDebit))}`,icon:totalCredit>=totalDebit?"📈":"📉",
              color:totalCredit>=totalDebit?"text-emerald-600":"text-red-600" },
            { label:"Flagged",      value:flagged.length.toLocaleString("en-IN"),    icon:"🚩", color:"text-orange-600" },
            { label:"Parties",      value:pw.length.toLocaleString("en-IN"),         icon:"👥", color:"text-violet-600" },
          ].map(c=>(
            <div key={c.label} className="ap-card p-4">
              <div className="text-2xl mb-1.5">{c.icon}</div>
              <div className={`font-black text-base leading-tight ${c.color}`}>{c.value}</div>
              <div className="text-[11px] text-muted mt-0.5 font-medium">{c.label}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────────── */}
        <div className="ap-card overflow-hidden">
          <div className="flex border-b overflow-x-auto" style={{borderColor:"var(--ap-border)"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  tab===t.id ? "border-primary text-primary" : "border-transparent text-muted hover:text-dark"
                }`}>
                <t.icon size={15}/>
                {t.label}
                {t.alert&&<span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>}
              </button>
            ))}
          </div>

          <div className="p-5">

            {/* ══ Summary Tab ══════════════════════════════════════════════════ */}
            {tab==="summary"&&(
              <div className="space-y-7">

                {/* Flag severity breakdown */}
                {flagged.length>0&&(
                  <div>
                    <h3 className="text-sm font-bold text-dark mb-4 flex items-center gap-2">
                      <Flag size={15} className="text-red-500"/> Forensic Flag Breakdown
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {Object.entries(flagCounts).sort(([,a],[,b])=>b-a).map(([flag,count])=>{
                        const sev=getFlagSeverity(flag+" ");
                        const maxCount=Math.max(...Object.values(flagCounts));
                        return (
                          <div key={flag} className={`p-3 rounded-xl ${SEV_BADGE[sev]}`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-semibold leading-tight">{flag}</span>
                              <span className="text-base font-black ml-2">{count}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
                              <div className="h-1.5 rounded-full bg-current opacity-40" style={{width:`${(count/maxCount)*100}%`}}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {[{label:"Critical / High",count:highFl,cls:"bg-red-50 border-red-200 text-red-700"},{label:"Medium",count:medFl,cls:"bg-amber-50 border-amber-200 text-amber-700"},{label:"Low",count:lowFl,cls:"bg-yellow-50 border-yellow-200 text-yellow-700"}].map(s=>(
                        <div key={s.label} className={`border rounded-xl p-3 text-center ${s.cls}`}>
                          <div className="text-2xl font-black">{s.count}</div>
                          <div className="text-xs font-semibold mt-0.5">{s.label} Severity</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Charts Row */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Monthly Bar Chart */}
                  <div>
                    <h3 className="text-sm font-bold text-dark mb-3 flex items-center gap-2">
                      <TrendingUp size={14} className="text-primary"/> Monthly Debit vs Credit
                    </h3>
                    <div style={{height:220}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartMonthly} margin={{top:4,right:4,bottom:4,left:4}}>
                          <XAxis dataKey="name" tick={{fontSize:10}} tickLine={false} axisLine={false}/>
                          <YAxis tick={{fontSize:9}} tickLine={false} axisLine={false}
                            tickFormatter={v=>v>=10000000?`${(v/10000000).toFixed(1)}Cr`:v>=100000?`${(v/100000).toFixed(1)}L`:`${(v/1000).toFixed(0)}K`}/>
                          <Tooltip formatter={(v:any)=>`₹${Number(v).toLocaleString("en-IN")}`} contentStyle={{fontSize:11,borderRadius:8}}/>
                          <Bar dataKey="Debit" fill="#DC2626" radius={[3,3,0,0]}/>
                          <Bar dataKey="Credit" fill="#16A34A" radius={[3,3,0,0]}/>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Voucher Pie */}
                  <div>
                    <h3 className="text-sm font-bold text-dark mb-3 flex items-center gap-2">
                      <LayoutDashboard size={14} className="text-primary"/> Voucher Type Distribution
                    </h3>
                    <div style={{height:220}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartVoucher} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2}>
                            {chartVoucher.map((c,i)=><Cell key={i} fill={c.fill}/>)}
                          </Pie>
                          <Tooltip formatter={(v:any,n:any)=>[`${v} txns`,n]} contentStyle={{fontSize:11,borderRadius:8}}/>
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Top 10 Parties */}
                <div>
                  <h3 className="text-sm font-bold text-dark mb-3 flex items-center gap-2">
                    <Users size={14} className="text-primary"/> Top 10 Parties by Volume
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-primary text-white">
                          {["#","Party","Txns","Total Debit","Total Credit","Flags"].map(h=>(
                            <th key={h} className="text-left py-2.5 px-3 font-semibold whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pw.slice(0,10).map((p,i)=>(
                          <tr key={p.party} className={`border-b transition-colors hover:bg-gray-50 ${p.flags>0?"bg-amber-50/50":i%2===0?"bg-white":"bg-gray-50/40"}`}>
                            <td className="py-2 px-3 text-muted font-medium">{i+1}</td>
                            <td className="py-2 px-3 font-medium text-dark max-w-[200px]"><span className="block truncate" title={p.party}>{p.party}</span></td>
                            <td className="py-2 px-3 text-muted">{p.count}</td>
                            <td className="py-2 px-3 text-right text-red-600 font-medium">{p.debit>0?`₹${fmt(p.debit)}`:"—"}</td>
                            <td className="py-2 px-3 text-right text-emerald-600 font-medium">{p.credit>0?`₹${fmt(p.credit)}`:"—"}</td>
                            <td className="py-2 px-3 text-right">
                              {p.flags>0?<span className="inline-flex items-center gap-1 font-bold text-orange-600">🚩{p.flags}</span>:<span className="text-emerald-500 font-semibold">✓</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ══ Ledger Tab ════════════════════════════════════════════════════ */}
            {tab==="ledger"&&(
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
                    <input type="text" placeholder="Search party, type or date…" value={ledgerSearch} onChange={e=>setLedgerSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-primary"/>
                  </div>
                  <span className="text-xs text-muted">{filteredLedger.length} rows</span>
                </div>
                <div className="overflow-x-auto max-h-[580px] rounded-xl border border-gray-100">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-primary text-white">
                        {["#","Date","Particulars","Vch Type","Vch No.","Debit (₹)","Credit (₹)","Flags"].map(h=>(
                          <th key={h} className="text-left py-2.5 px-3 font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLedger.map((e,i)=>{
                        const sev=e.flags.length>0?getFlagSeverity(e.flags[0]):null;
                        return (
                          <tr key={i} className={`border-b border-gray-50 ${sev?SEV_ROW[sev]:i%2===0?"bg-white":"bg-gray-50/40"}`}>
                            <td className="py-1.5 px-3 text-muted">{i+1}</td>
                            <td className="py-1.5 px-3 whitespace-nowrap font-semibold">{e.date}</td>
                            <td className="py-1.5 px-3 max-w-[180px]"><span className="block truncate font-medium" title={e.particulars}>{e.particulars}</span></td>
                            <td className="py-1.5 px-3 whitespace-nowrap text-muted">{e.vchType}</td>
                            <td className="py-1.5 px-3 text-muted">{e.vchNo}</td>
                            <td className="py-1.5 px-3 text-right text-red-600 font-semibold whitespace-nowrap">{e.debit>0?`₹${fmt(e.debit)}`:""}</td>
                            <td className="py-1.5 px-3 text-right text-emerald-600 font-semibold whitespace-nowrap">{e.credit>0?`₹${fmt(e.credit)}`:""}</td>
                            <td className="py-1.5 px-3 max-w-[200px] text-[10px] font-medium text-orange-800">
                              {e.flags.length>0&&<span>🚩 {e.flags.join(" · ")}</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══ Forensic Flags Tab ════════════════════════════════════════════ */}
            {tab==="forensic"&&(
              <div>
                {flagged.length===0?(
                  <div className="py-16 text-center text-muted text-sm">
                    <CheckCircle size={40} className="mx-auto text-emerald-500 mb-3"/>
                    No forensic flags raised. Books appear clean.
                  </div>
                ):(
                  <div className="overflow-x-auto max-h-[580px] rounded-xl border border-gray-100">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-red-800 text-white">
                          {["#","Date","Particulars","Vch Type","Vch No.","Amount (₹)","Dr/Cr","Forensic Flags Raised"].map(h=>(
                            <th key={h} className="text-left py-2.5 px-3 font-semibold whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...flagged].sort((a,b)=>{
                          const sa=Math.max(...a.flags.map(f=>getFlagSeverity(f)==="high"?3:getFlagSeverity(f)==="medium"?2:1));
                          const sb=Math.max(...b.flags.map(f=>getFlagSeverity(f)==="high"?3:getFlagSeverity(f)==="medium"?2:1));
                          return sb-sa;
                        }).map((e,i)=>{
                          const sev=getFlagSeverity(e.flags[0]);
                          return (
                            <tr key={i} className={`border-b ${sev==="high"?"bg-red-50 border-red-100":sev==="medium"?"bg-amber-50 border-amber-100":"bg-yellow-50 border-yellow-100"}`}>
                              <td className="py-2 px-3 text-muted font-medium">{i+1}</td>
                              <td className="py-2 px-3 whitespace-nowrap font-bold">{e.date}</td>
                              <td className="py-2 px-3 font-medium max-w-[160px]"><span className="block truncate" title={e.particulars}>{e.particulars}</span></td>
                              <td className="py-2 px-3 whitespace-nowrap text-muted">{e.vchType}</td>
                              <td className="py-2 px-3 text-muted">{e.vchNo}</td>
                              <td className="py-2 px-3 text-right font-bold whitespace-nowrap">₹{fmt(e.amount)}</td>
                              <td className="py-2 px-3 font-bold text-center">{e.debit>0?<span className="text-red-600">Dr</span>:<span className="text-emerald-600">Cr</span>}</td>
                              <td className="py-2 px-3 max-w-[260px]">
                                <div className="flex flex-wrap gap-1">
                                  {e.flags.map((f,fi)=>(
                                    <span key={fi} className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${SEV_BADGE[getFlagSeverity(f)]}`}>{f}</span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ══ Party Tab ════════════════════════════════════════════════════ */}
            {tab==="party"&&(
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
                    <input type="text" placeholder="Search party name…" value={partySearch} onChange={e=>setPartySearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-primary"/>
                  </div>
                  <span className="text-xs text-muted">{filteredParty.length} parties</span>
                </div>
                <div className="overflow-x-auto max-h-[540px] rounded-xl border border-gray-100">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-primary text-white">
                        {["#","Party / Account","Txns","Total Debit","Total Credit","Net","Flagged"].map(h=>(
                          <th key={h} className="text-left py-2.5 px-3 font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParty.map((p,i)=>(
                        <tr key={p.party} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${p.flags>0?"bg-amber-50/40":i%2===0?"bg-white":"bg-gray-50/30"}`}>
                          <td className="py-2 px-3 text-muted">{i+1}</td>
                          <td className="py-2 px-3 font-medium max-w-[200px]"><span className="block truncate" title={p.party}>{p.party}</span></td>
                          <td className="py-2 px-3 text-muted">{p.count}</td>
                          <td className="py-2 px-3 text-right text-red-600 font-medium">{p.debit>0?`₹${fmt(p.debit)}`:"—"}</td>
                          <td className="py-2 px-3 text-right text-emerald-600 font-medium">{p.credit>0?`₹${fmt(p.credit)}`:"—"}</td>
                          <td className={`py-2 px-3 text-right font-bold ${p.net>=0?"text-emerald-600":"text-red-600"}`}>
                            {p.net>=0?"+":"-"}₹{fmt(Math.abs(p.net))}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {p.flags>0?<span className="inline-flex items-center gap-1 text-orange-600 font-bold">🚩{p.flags}</span>:<span className="text-emerald-500 font-semibold">✓</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══ Monthly Tab ════════════════════════════════════════════════════ */}
            {tab==="monthly"&&(
              <div className="space-y-5">
                <div style={{height:220}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartMonthly} margin={{top:4,right:4,bottom:4,left:4}}>
                      <XAxis dataKey="name" tick={{fontSize:10}} tickLine={false} axisLine={false}/>
                      <YAxis tick={{fontSize:9}} tickLine={false} axisLine={false}
                        tickFormatter={v=>v>=10000000?`${(v/10000000).toFixed(1)}Cr`:v>=100000?`${(v/100000).toFixed(1)}L`:`${(v/1000).toFixed(0)}K`}/>
                      <Tooltip formatter={(v:any)=>`₹${Number(v).toLocaleString("en-IN")}`} contentStyle={{fontSize:11,borderRadius:8}}/>
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
                      <Bar dataKey="Debit" fill="#DC2626" radius={[4,4,0,0]}/>
                      <Bar dataKey="Credit" fill="#16A34A" radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-primary text-white">
                        {["Month","Transactions","Total Debit (₹)","Total Credit (₹)","Net Flow (₹)","Status"].map(h=>(
                          <th key={h} className="text-left py-2.5 px-3 font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mw.map((m,i)=>(
                        <tr key={m.month} className={`border-b border-gray-50 ${i%2===0?"bg-white":"bg-gray-50/40"}`}>
                          <td className="py-2.5 px-3 font-bold text-dark">{m.month}</td>
                          <td className="py-2.5 px-3 text-muted">{m.count}</td>
                          <td className="py-2.5 px-3 text-right text-red-600 font-semibold">₹{fmt(m.debit)}</td>
                          <td className="py-2.5 px-3 text-right text-emerald-600 font-semibold">₹{fmt(m.credit)}</td>
                          <td className={`py-2.5 px-3 text-right font-bold ${m.net>=0?"text-emerald-600":"text-red-600"}`}>
                            {m.net>=0?"+":"-"}₹{fmt(Math.abs(m.net))}
                          </td>
                          <td className="py-2.5 px-3">
                            {m.debit>m.credit
                              ? <span className="inline-flex items-center gap-1 text-red-600 font-semibold"><TrendingDown size={11}/>Outflow heavy</span>
                              : <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold"><TrendingUp size={11}/>Inflow heavy</span>}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-primary/5 border-t-2 border-primary/20 font-bold">
                        <td className="py-2.5 px-3 text-dark font-bold">Grand Total</td>
                        <td className="py-2.5 px-3 text-muted font-bold">{entries.length}</td>
                        <td className="py-2.5 px-3 text-right text-red-600 font-bold">₹{fmt(totalDebit)}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-600 font-bold">₹{fmt(totalCredit)}</td>
                        <td className={`py-2.5 px-3 text-right font-black ${totalCredit>=totalDebit?"text-emerald-600":"text-red-600"}`}>
                          {totalCredit>=totalDebit?"+":"-"}₹{fmt(Math.abs(totalCredit-totalDebit))}
                        </td>
                        <td className="py-2.5 px-3"/>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>

        <p className="tool-disclaimer mt-6">
          Results are indicative only. Always consult a qualified tax professional for final decisions.
          CC Associates is not liable for any decisions made based on tool outputs. © 2026 CC Associates, Pune.
        </p>
      </div>
    </div>
  );
}
