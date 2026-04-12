"use client";

import { useState, useMemo } from "react";
import { Calculator, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

interface TDSSection {
  section: string;
  nature: string;
  rateIndividual: number;
  rateCompany: number;
  threshold: number;
  form: string;
  notes: string;
}

const TDS_SECTIONS: TDSSection[] = [
  { section: "192", nature: "Salary", rateIndividual: 0, rateCompany: 0, threshold: 250000, form: "24Q", notes: "Rate based on tax slab; as per Form 12BA" },
  { section: "194", nature: "Dividend", rateIndividual: 10, rateCompany: 10, threshold: 5000, form: "26Q", notes: "" },
  { section: "194A", nature: "Interest (Bank/Others)", rateIndividual: 10, rateCompany: 10, threshold: 40000, form: "26Q", notes: "Threshold ₹50,000 for senior citizens" },
  { section: "194B", nature: "Lottery Winnings", rateIndividual: 30, rateCompany: 30, threshold: 10000, form: "26Q", notes: "No surcharge threshold for individuals" },
  { section: "194C", nature: "Contractor/Subcontractor", rateIndividual: 1, rateCompany: 2, threshold: 30000, form: "26Q", notes: "Aggregate ₹1,00,000 in FY" },
  { section: "194D", nature: "Insurance Commission", rateIndividual: 5, rateCompany: 10, threshold: 15000, form: "26Q", notes: "" },
  { section: "194H", nature: "Commission/Brokerage", rateIndividual: 5, rateCompany: 5, threshold: 15000, form: "26Q", notes: "" },
  { section: "194I", nature: "Rent (Land & Building)", rateIndividual: 10, rateCompany: 10, threshold: 240000, form: "26Q", notes: "Plant & Machinery: 2%" },
  { section: "194IA", nature: "Purchase of Immovable Property", rateIndividual: 1, rateCompany: 1, threshold: 5000000, form: "26QB", notes: "Threshold ₹50,00,000" },
  { section: "194J", nature: "Professional/Technical Fees", rateIndividual: 10, rateCompany: 10, threshold: 30000, form: "26Q", notes: "Royalty/Director fees: 10%; Technical: 2%" },
  { section: "194N", nature: "Cash Withdrawal (Bank)", rateIndividual: 2, rateCompany: 2, threshold: 2000000, form: "26Q", notes: "Higher rate if ITR not filed: 5% above ₹20L" },
  { section: "194Q", nature: "Purchase of Goods", rateIndividual: 0.1, rateCompany: 0.1, threshold: 5000000, form: "26Q", notes: "Buyer TDS; aggregate purchase > ₹50L in FY" },
];

const PAYEE_TYPES = [
  { value: "individual", label: "Individual / HUF" },
  { value: "company", label: "Company / LLP / Firm" },
];

const FY_OPTIONS = ["2025-26", "2024-25", "2023-24"];

export default function TDSCalculatorPage() {
  const [sectionKey, setSectionKey] = useState("194J");
  const [payeeType, setPayeeType] = useState("individual");
  const [amount, setAmount] = useState("");
  const [panAvailable, setPanAvailable] = useState("yes");
  const [fy, setFY] = useState("2025-26");

  const selected = useMemo(() =>
    TDS_SECTIONS.find(s => s.section === sectionKey) || TDS_SECTIONS[0],
    [sectionKey]
  );

  const result = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    if (!amt) return null;

    let rate = payeeType === "individual" ? selected.rateIndividual : selected.rateCompany;
    if (panAvailable === "no") rate = Math.max(rate, 20);

    const tds = (amt * rate) / 100;
    const netPayment = amt - tds;

    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    let dueDate = "";
    // TDS due: 7th of next month (govt: same month), for March: 30th April
    if (month === 3) dueDate = "30th April";
    else {
      const nextMonth = new Date(today.getFullYear(), month, 7);
      dueDate = nextMonth.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    }

    return { rate, tds, netPayment, dueDate, section: selected };
  }, [amount, payeeType, panAvailable, selected]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(n);

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted hover:text-dark mb-6">
          <ArrowLeft size={15} /> Back to Tools
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <Calculator className="text-primary" size={22} /> TDS Calculator
          </h1>
          <p className="text-muted text-sm mt-1">Calculate TDS rate, amount, net payment, and due date for all payment sections.</p>
        </div>

        <div className="bg-white rounded-card shadow-card border border-gray-100 p-6 mb-5">
          <h2 className="font-semibold text-dark mb-5 pb-2 border-b border-gray-100">Payment Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nature of Payment (Section)</label>
              <select className="input-field" value={sectionKey} onChange={e => setSectionKey(e.target.value)}>
                {TDS_SECTIONS.map(s => (
                  <option key={s.section} value={s.section}>
                    Sec {s.section} — {s.nature}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Payee Type</label>
              <select className="input-field" value={payeeType} onChange={e => setPayeeType(e.target.value)}>
                {PAYEE_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Financial Year</label>
              <select className="input-field" value={fy} onChange={e => setFY(e.target.value)}>
                {FY_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Payment Amount (₹)</label>
              <input
                type="number"
                className="input-field"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Enter gross payment amount"
                min="0"
              />
            </div>

            <div>
              <label className="label">PAN Available?</label>
              <select className="input-field" value={panAvailable} onChange={e => setPanAvailable(e.target.value)}>
                <option value="yes">Yes — PAN Available</option>
                <option value="no">No — PAN Not Available (20% applies)</option>
              </select>
            </div>
          </div>

          {/* Section Info */}
          <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <div className="text-muted mb-0.5">Threshold Limit</div>
                <div className="font-semibold text-dark">₹{selected.threshold.toLocaleString("en-IN")}</div>
              </div>
              <div>
                <div className="text-muted mb-0.5">Individual Rate</div>
                <div className="font-semibold text-dark">{selected.rateIndividual}%</div>
              </div>
              <div>
                <div className="text-muted mb-0.5">Company Rate</div>
                <div className="font-semibold text-dark">{selected.rateCompany}%</div>
              </div>
              <div>
                <div className="text-muted mb-0.5">TDS Return Form</div>
                <div className="font-semibold text-dark">Form {selected.form}</div>
              </div>
            </div>
            {selected.notes && (
              <div className="mt-2 flex items-start gap-1.5 text-xs text-muted">
                <AlertCircle size={12} className="text-gold mt-0.5 flex-shrink-0" />
                <span>{selected.notes}</span>
              </div>
            )}
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-card shadow-card border border-gray-100 p-6">
            <h2 className="font-semibold text-dark mb-5 pb-2 border-b border-gray-100">
              Calculation Result
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div className="p-4 bg-background rounded-lg border border-gray-100">
                <div className="text-xs text-muted mb-1">Gross Payment Amount</div>
                <div className="text-2xl font-bold text-dark">₹{fmt(parseFloat(amount))}</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <div className="text-xs text-red-600 mb-1">TDS to be Deducted ({result.rate}%)</div>
                <div className="text-2xl font-bold text-red-700">₹{fmt(result.tds)}</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="text-xs text-green-600 mb-1">Net Payment to Payee</div>
                <div className="text-2xl font-bold text-green-700">₹{fmt(result.netPayment)}</div>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                <div className="text-xs text-primary mb-1">TDS Deposit Due Date</div>
                <div className="text-lg font-bold text-dark">{result.dueDate}</div>
              </div>
            </div>

            <div className="bg-background rounded-lg p-4 text-sm">
              <h3 className="font-semibold text-dark mb-3 flex items-center gap-1.5">
                <CheckCircle size={14} className="text-green-500" /> Compliance Checklist
              </h3>
              <ul className="space-y-1.5 text-muted text-xs">
                <li className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">→</span>
                  <span>Deduct TDS of <strong>₹{fmt(result.tds)}</strong> from gross payment under <strong>Section {result.section.section}</strong></span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">→</span>
                  <span>Deposit via Challan 281 by <strong>{result.dueDate}</strong>. Late deposit interest: <strong>1.5% per month</strong></span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">→</span>
                  <span>File <strong>Form {result.section.form}</strong> quarterly TDS return</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">→</span>
                  <span>Issue <strong>Form 16A</strong> (TDS certificate) to payee within 15 days of return due date</span>
                </li>
                {panAvailable === "no" && (
                  <li className="flex items-start gap-1.5 text-red-600">
                    <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                    <span><strong>Higher rate of 20%</strong> applied as PAN not available (u/s 206AA)</span>
                  </li>
                )}
              </ul>
            </div>

            {parseFloat(amount) < selected.threshold && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2 text-xs text-yellow-800">
                <AlertCircle size={12} className="mt-0.5 flex-shrink-0 text-yellow-600" />
                <span>
                  Payment amount (₹{fmt(parseFloat(amount))}) is below the threshold limit (₹{selected.threshold.toLocaleString("en-IN")}). TDS may not be required if this is a single payment, but note the <strong>annual aggregate limit</strong> for Section {selected.section}.
                </span>
              </div>
            )}
          </div>
        )}

        <p className="tool-disclaimer">
          Results are indicative only. Always consult a qualified tax professional for final decisions. Associate Piyush is not liable for any decisions made based on tool outputs. © 2026 Associate Piyush, Pune.
        </p>
      </div>
    </div>
  );
}
