"use client";

import { useState, useCallback, useRef } from "react";
import { Table, ArrowLeft, Upload, Download, Shield, ChevronDown, ChevronRight, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

interface LedgerEntry {
  date: string;
  voucherNo: string;
  voucherType: string;
  narration: string;
  debit: number;
  credit: number;
  balance: number;
  party: string;
  gstin: string;
  amount: number;
  flags: string[];
}

interface ForensicFlag {
  key: string;
  label: string;
  desc: string;
  enabled: boolean;
}

const FORENSIC_FLAGS: ForensicFlag[] = [
  { key: "roundAmt", label: "Round Amount", desc: "Exact round number transactions (e.g., ₹1,00,000 exact)", enabled: true },
  { key: "cashLimit", label: "Cash Limit", desc: "Cash transactions > ₹2,00,000 (Sec 269ST violation)", enabled: true },
  { key: "weekend", label: "Weekend Transaction", desc: "Transactions on Saturday or Sunday", enabled: true },
  { key: "highValue", label: "High Value", desc: "Single transaction > ₹10,00,000", enabled: true },
  { key: "sameDay", label: "Same Day Multi", desc: "Multiple payments to same party on same day", enabled: true },
  { key: "roundTrip", label: "Round Trip", desc: "Payment followed by reversal within 3 days", enabled: false },
];

const FORMAT_GUIDE = [
  { format: ".xlsx (Tally Export)", cols: "Date, Voucher No, Voucher Type, Narration, Debit, Credit, Balance" },
  { format: ".csv (Tally Export)", cols: "Same columns as Excel" },
  { format: ".xml (Tally XML)", cols: "Auto-parsed from Tally Prime XML export" },
  { format: ".txt (Tally TXT)", cols: "Tab/comma delimited with date, narration, amount" },
];

export default function TallyLedgerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [flags, setFlags] = useState<ForensicFlag[]>(FORENSIC_FLAGS);
  const [showGuide, setShowGuide] = useState(false);
  const [activeSheet, setActiveSheet] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleFlag = (key: string) => {
    setFlags(flags.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f));
  };

  const applyFlags = (entries: LedgerEntry[]): LedgerEntry[] => {
    const partyDateMap: Record<string, number> = {};
    const enabledFlags = flags.filter(f => f.enabled).map(f => f.key);

    return entries.map(e => {
      const entryFlags: string[] = [];

      if (enabledFlags.includes("roundAmt") && e.amount > 0 && e.amount % 1000 === 0 && e.amount >= 50000) {
        entryFlags.push("Round Amount");
      }
      if (enabledFlags.includes("cashLimit") && e.voucherType?.toLowerCase().includes("cash") && e.amount > 200000) {
        entryFlags.push("Cash Limit Breach (Sec 269ST)");
      }
      if (enabledFlags.includes("weekend") && e.date) {
        const parts = e.date.split(/[-\/]/);
        if (parts.length >= 3) {
          const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          const day = d.getDay();
          if (day === 0 || day === 6) entryFlags.push("Weekend Transaction");
        }
      }
      if (enabledFlags.includes("highValue") && e.amount > 1000000) {
        entryFlags.push("High Value (>₹10L)");
      }

      // Same-day multi
      if (enabledFlags.includes("sameDay") && e.party && e.date) {
        const key = `${e.party}_${e.date}`;
        partyDateMap[key] = (partyDateMap[key] || 0) + 1;
        if (partyDateMap[key] > 1) entryFlags.push("Same-Day Multi Payment");
      }

      return { ...e, flags: entryFlags };
    });
  };

  const parseXML = async (content: string): Promise<LedgerEntry[]> => {
    // Basic XML parsing for Tally XML format
    const { parseStringPromise } = await import("xml2js");
    const parsed = await parseStringPromise(content);
    const entries: LedgerEntry[] = [];
    // Navigate Tally XML structure
    const body = parsed?.ENVELOPE?.BODY?.[0]?.IMPORTDATA?.[0]?.REQUESTDATA?.[0]?.TALLYMESSAGE || [];
    body.forEach((msg: any) => {
      const voucher = msg?.VOUCHER?.[0];
      if (!voucher) return;
      const date = voucher.DATE?.[0] || "";
      const vtype = voucher.VOUCHERTYPENAME?.[0] || "";
      const vno = voucher.VOUCHERNUMBER?.[0] || "";
      const narration = voucher.NARRATION?.[0] || "";
      const allotees = voucher.ALLLEDGERENTRIES?.entry || [];
      allotees.forEach((e: any) => {
        const amt = parseFloat(e.AMOUNT?.[0] || "0");
        entries.push({
          date, voucherNo: vno, voucherType: vtype,
          narration, party: e.LEDGERNAME?.[0] || "",
          debit: amt < 0 ? Math.abs(amt) : 0,
          credit: amt > 0 ? amt : 0,
          balance: 0,
          gstin: e.GSTREGISTRATIONNUMBER?.[0] || "",
          amount: Math.abs(amt),
          flags: [],
        });
      });
    });
    return entries;
  };

  const processFile = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    setError("");
    try {
      let parsedEntries: LedgerEntry[] = [];

      if (file.name.endsWith(".xml")) {
        const text = await file.text();
        parsedEntries = await parseXML(text);
      } else {
        const XLSX = await import("xlsx");
        const arrayBuffer = await file.arrayBuffer();
        const wb = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { raw: false, defval: "" }) as Record<string, string>[];

        parsedEntries = data.map(row => {
          const keys: Record<string, string> = {};
          Object.keys(row).forEach(k => { keys[k.toLowerCase().replace(/[^a-z0-9]/g, "")] = row[k]; });
          const get = (...ks: string[]) => { for (const k of ks) if (keys[k]) return keys[k]; return ""; };

          const debit = parseFloat(get("debit", "dramt", "debitamt") || "0") || 0;
          const credit = parseFloat(get("credit", "cramt", "creditamt") || "0") || 0;
          return {
            date: get("date", "txndate", "voucherdate"),
            voucherNo: get("voucherno", "vno", "vchno", "vouchernumber"),
            voucherType: get("vouchertype", "vtype", "type"),
            narration: get("narration", "description", "particulars", "remarks"),
            party: get("partyname", "party", "ledgername", "accountname"),
            debit,
            credit,
            balance: parseFloat(get("balance", "closingbalance") || "0") || 0,
            gstin: get("gstin", "gstno", "gstregistration"),
            amount: debit || credit,
            flags: [],
          };
        }).filter(e => e.date || e.amount);
      }

      const withFlags = applyFlags(parsedEntries);
      setEntries(withFlags);
      setActiveSheet(0);
    } catch (e: any) {
      setError("Error processing file: " + (e?.message || "Check file format"));
    } finally {
      setProcessing(false);
    }
  }, [file, flags]);

  const monthlySummary = () => {
    const map: Record<string, { debit: number; credit: number; count: number }> = {};
    entries.forEach(e => {
      if (!e.date) return;
      const parts = e.date.split(/[-\/]/);
      const key = parts.length >= 3 ? `${parts[2]}-${parts[1].padStart(2,"0")}` : e.date.substring(0, 7);
      if (!map[key]) map[key] = { debit: 0, credit: 0, count: 0 };
      map[key].debit += e.debit;
      map[key].credit += e.credit;
      map[key].count++;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v }));
  };

  const voucherSummary = () => {
    const map: Record<string, { debit: number; credit: number; count: number }> = {};
    entries.forEach(e => {
      const key = e.voucherType || "Unknown";
      if (!map[key]) map[key] = { debit: 0, credit: 0, count: 0 };
      map[key].debit += e.debit;
      map[key].credit += e.credit;
      map[key].count++;
    });
    return Object.entries(map).map(([type, v]) => ({ type, ...v }));
  };

  const flaggedEntries = entries.filter(e => e.flags.length > 0);
  const fmt = (n: number) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: 0 }).format(Math.round(n));

  const downloadExcel = async () => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    // Sheet 1: Ledger Detail
    const ws1 = XLSX.utils.json_to_sheet(entries.map(e => ({
      Date: e.date, "Voucher No": e.voucherNo, "Voucher Type": e.voucherType,
      Narration: e.narration, Party: e.party, GSTIN: e.gstin,
      "Debit (₹)": e.debit || "", "Credit (₹)": e.credit || "", "Balance (₹)": e.balance || "",
      "Forensic Flags": e.flags.join(", "),
    })));
    ws1["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 40 }, { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws1, "Ledger Detail");

    // Sheet 2: Monthly Summary
    const ms = monthlySummary();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ms.map(m => ({
      "Month": m.month, "Count": m.count, "Total Debit (₹)": m.debit, "Total Credit (₹)": m.credit, "Net (₹)": m.credit - m.debit
    }))), "Monthly Summary");

    // Sheet 3: Voucher Type Summary
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(voucherSummary().map(v => ({
      "Voucher Type": v.type, "Count": v.count, "Total Debit (₹)": v.debit, "Total Credit (₹)": v.credit
    }))), "Voucher Type Summary");

    // Sheet 4: Forensic Flags
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flaggedEntries.map(e => ({
      Date: e.date, "Voucher No": e.voucherNo, Narration: e.narration, Party: e.party,
      "Amount (₹)": e.amount, "Flags": e.flags.join(", ")
    }))), "Forensic Analysis");

    XLSX.writeFile(wb, `tally_ledger_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted hover:text-dark mb-6">
          <ArrowLeft size={15} /> Back to Tools
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <Table className="text-primary" size={22} /> Tally Prime Ledger to Excel
          </h1>
          <p className="text-muted text-sm mt-1">Convert Tally ledger exports to structured Excel with forensic analysis flags.</p>
        </div>

        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-5 text-xs text-green-800">
          <Shield size={14} className="text-green-600 flex-shrink-0" />
          <span>100% browser-based. Your Tally data is never uploaded to any server.</span>
        </div>

        {/* Format Guide */}
        <div className="bg-white rounded-card shadow-card border border-gray-100 mb-5">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between p-4 text-sm font-medium text-dark"
          >
            <span>Supported Tally Export Formats</span>
            {showGuide ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {showGuide && (
            <div className="px-4 pb-4">
              <div className="grid sm:grid-cols-2 gap-3">
                {FORMAT_GUIDE.map(f => (
                  <div key={f.format} className="p-3 bg-background rounded-lg text-xs">
                    <div className="font-semibold text-dark mb-1">{f.format}</div>
                    <div className="text-muted">{f.cols}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted mt-3">
                In Tally Prime: Go to Gateway of Tally → Reports → Daybook / Ledger → Export (Alt+E) → Choose Excel or XML format.
              </p>
            </div>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Upload */}
            <div className="lg:col-span-2 bg-white rounded-card shadow-card border border-gray-100 p-6">
              <div
                className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer mb-5"
                onClick={() => inputRef.current?.click()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                onDragOver={e => e.preventDefault()}
              >
                <input ref={inputRef} type="file" accept=".xlsx,.xls,.xml,.csv,.txt" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                {file ? (
                  <div>
                    <CheckCircle size={32} className="mx-auto text-green-500 mb-2" />
                    <p className="font-medium text-dark">{file.name}</p>
                    <p className="text-xs text-primary mt-1">Click to change</p>
                  </div>
                ) : (
                  <div>
                    <Upload size={40} className="mx-auto text-muted mb-3" />
                    <p className="font-medium text-dark mb-1">Upload Tally Export File</p>
                    <p className="text-muted text-sm">.xlsx, .xml, .csv, .txt</p>
                  </div>
                )}
              </div>
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 mb-4">{error}</div>}
              <button onClick={processFile} disabled={!file || processing} className="btn-primary gap-2 w-full justify-center py-3.5 disabled:opacity-50">
                {processing ? "Processing..." : "Analyze Ledger"}
              </button>
            </div>

            {/* Forensic Flags */}
            <div className="bg-white rounded-card shadow-card border border-gray-100 p-5">
              <h3 className="font-semibold text-dark text-sm mb-3 border-b border-gray-100 pb-2">Forensic Flag Options</h3>
              <div className="space-y-3">
                {flags.map(f => (
                  <label key={f.key} className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={f.enabled}
                      onChange={() => toggleFlag(f.key)}
                      className="mt-0.5 accent-primary"
                    />
                    <div>
                      <div className="text-xs font-medium text-dark">{f.label}</div>
                      <div className="text-xs text-muted">{f.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-dark">{entries.length} entries processed</p>
                <p className="text-xs text-muted text-red-600">{flaggedEntries.length} forensic flags raised</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEntries([])} className="btn-outline text-sm">Start Over</button>
                <button onClick={downloadExcel} className="btn-primary gap-2 text-sm">
                  <Download size={15} /> Export 4-Sheet Excel
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { label: "Total Entries", value: entries.length, cls: "text-primary" },
                { label: "Total Debit", value: `₹${fmt(entries.reduce((s, e) => s + e.debit, 0))}`, cls: "text-red-600" },
                { label: "Total Credit", value: `₹${fmt(entries.reduce((s, e) => s + e.credit, 0))}`, cls: "text-green-600" },
                { label: "Forensic Flags", value: flaggedEntries.length, cls: "text-orange-600" },
              ].map(({ label, value, cls }) => (
                <div key={label} className="bg-white rounded-card shadow-card border border-gray-100 p-3 text-center">
                  <div className={`font-bold text-lg ${cls}`}>{value}</div>
                  <div className="text-xs text-muted">{label}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-card shadow-card border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-100 overflow-x-auto">
                {["Ledger Detail", "Monthly Summary", "Voucher Type", "Forensic Flags"].map((t, i) => (
                  <button key={t} onClick={() => setActiveSheet(i)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${activeSheet === i ? "border-primary text-primary" : "border-transparent text-muted hover:text-dark"}`}>
                    {t} {i === 3 && flaggedEntries.length > 0 && <span className="ml-1 text-xs font-bold text-red-500">{flaggedEntries.length}</span>}
                  </button>
                ))}
              </div>

              <div className="p-4 overflow-x-auto max-h-[500px]">
                {activeSheet === 0 && (
                  <table className="w-full text-xs">
                    <thead className="sticky top-0">
                      <tr className="bg-primary text-white">
                        {["Date", "Voucher No", "Type", "Narration", "Party", "Debit (₹)", "Credit (₹)", "Flags"].map(h => (
                          <th key={h} className="text-left py-2 px-2 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e, i) => (
                        <tr key={i} className={`${e.flags.length > 0 ? "bg-orange-50" : i % 2 === 0 ? "bg-white" : "bg-background"}`}>
                          <td className="py-1.5 px-2 whitespace-nowrap">{e.date}</td>
                          <td className="py-1.5 px-2">{e.voucherNo}</td>
                          <td className="py-1.5 px-2">{e.voucherType}</td>
                          <td className="py-1.5 px-2 max-w-[200px] truncate">{e.narration}</td>
                          <td className="py-1.5 px-2">{e.party}</td>
                          <td className="py-1.5 px-2 text-right text-red-600">{e.debit ? `₹${fmt(e.debit)}` : ""}</td>
                          <td className="py-1.5 px-2 text-right text-green-600">{e.credit ? `₹${fmt(e.credit)}` : ""}</td>
                          <td className="py-1.5 px-2">
                            {e.flags.length > 0 && (
                              <span className="text-orange-600 font-medium">{e.flags.join(", ")}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeSheet === 1 && (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-primary text-white">
                        {["Month", "Transactions", "Total Debit (₹)", "Total Credit (₹)", "Net (₹)"].map(h => (
                          <th key={h} className="text-left py-2 px-3 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {monthlySummary().map((m, i) => (
                        <tr key={m.month} className={i % 2 === 0 ? "bg-white" : "bg-background"}>
                          <td className="py-2 px-3 font-medium">{m.month}</td>
                          <td className="py-2 px-3">{m.count}</td>
                          <td className="py-2 px-3 text-right text-red-600">₹{fmt(m.debit)}</td>
                          <td className="py-2 px-3 text-right text-green-600">₹{fmt(m.credit)}</td>
                          <td className={`py-2 px-3 text-right font-semibold ${m.credit - m.debit >= 0 ? "text-green-600" : "text-red-600"}`}>
                            ₹{fmt(Math.abs(m.credit - m.debit))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeSheet === 2 && (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-primary text-white">
                        {["Voucher Type", "Count", "Total Debit (₹)", "Total Credit (₹)"].map(h => (
                          <th key={h} className="text-left py-2 px-3 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {voucherSummary().map((v, i) => (
                        <tr key={v.type} className={i % 2 === 0 ? "bg-white" : "bg-background"}>
                          <td className="py-2 px-3 font-medium">{v.type}</td>
                          <td className="py-2 px-3">{v.count}</td>
                          <td className="py-2 px-3 text-right text-red-600">₹{fmt(v.debit)}</td>
                          <td className="py-2 px-3 text-right text-green-600">₹{fmt(v.credit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeSheet === 3 && (
                  <div>
                    {flaggedEntries.length === 0 ? (
                      <div className="py-8 text-center text-muted text-sm">No forensic flags raised for this ledger.</div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-orange-600 text-white">
                            {["Date", "Voucher No", "Narration", "Party", "Amount (₹)", "Forensic Flags"].map(h => (
                              <th key={h} className="text-left py-2 px-3 font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {flaggedEntries.map((e, i) => (
                            <tr key={i} className="bg-orange-50 border-b border-orange-100">
                              <td className="py-2 px-3">{e.date}</td>
                              <td className="py-2 px-3">{e.voucherNo}</td>
                              <td className="py-2 px-3 max-w-[180px] truncate">{e.narration}</td>
                              <td className="py-2 px-3">{e.party}</td>
                              <td className="py-2 px-3 text-right font-semibold">₹{fmt(e.amount)}</td>
                              <td className="py-2 px-3 text-orange-700 font-medium">{e.flags.join(" | ")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
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
