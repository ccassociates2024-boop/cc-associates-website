"use client";

import { useState, useMemo } from "react";
import { Clock, ArrowLeft, AlertCircle, Download } from "lucide-react";
import Link from "next/link";

const RETURN_TYPES = [
  { value: "GSTR1", label: "GSTR-1 (Outward Supplies)" },
  { value: "GSTR3B", label: "GSTR-3B (Monthly Return)" },
  { value: "GSTR4", label: "GSTR-4 (Composition Dealer)" },
  { value: "GSTR9", label: "GSTR-9 (Annual Return)" },
  { value: "GSTR9C", label: "GSTR-9C (Reconciliation)" },
];

const TAXPAYER_CATEGORIES = [
  { value: "regular", label: "Regular Taxpayer" },
  { value: "composition", label: "Composition Dealer" },
  { value: "nil", label: "Nil Return Filer" },
];

export default function GSTLateFeePage() {
  const [form, setForm] = useState({
    returnType: "GSTR3B",
    taxpayerCategory: "regular",
    annualTurnover: "",
    dueDate: "",
    filingDate: "",
    state: "Maharashtra",
    taxLiability: "",
  });

  const result = useMemo(() => {
    if (!form.dueDate || !form.filingDate) return null;
    const due = new Date(form.dueDate);
    const filed = new Date(form.filingDate);
    if (filed <= due) return { days: 0, cgstFee: 0, sgstFee: 0, totalFee: 0, interest: 0, grand: 0 };

    const days = Math.floor((filed.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    const taxLiability = parseFloat(form.taxLiability) || 0;

    let dailyFeePerComponent = 25; // CGST + SGST = 25+25 = 50/day
    if (form.taxpayerCategory === "nil" || taxLiability === 0) {
      dailyFeePerComponent = 10; // Nil: 20/day (10+10)
    }

    // Max late fee caps per CGST Act
    const maxCap = form.taxpayerCategory === "nil"
      ? 500 // 250+250 for nil
      : form.annualTurnover && parseFloat(form.annualTurnover) <= 1500000
      ? 2000 // 1000+1000 per return for small taxpayers
      : 10000; // 5000+5000 per return

    const rawFeePerComponent = days * dailyFeePerComponent;
    const cappedFeePerComponent = Math.min(rawFeePerComponent, maxCap / 2);

    const cgstFee = cappedFeePerComponent;
    const sgstFee = cappedFeePerComponent;
    const totalFee = cgstFee + sgstFee;

    // Interest @18% p.a. on unpaid tax
    const interest = taxLiability > 0 ? (taxLiability * 0.18 * days) / 365 : 0;

    return { days, cgstFee, sgstFee, totalFee, interest, grand: totalFee + interest };
  }, [form]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted hover:text-dark mb-6">
          <ArrowLeft size={15} /> Back to Tools
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <Clock className="text-primary" size={22} /> GST Late Fee Calculator
          </h1>
          <p className="text-muted text-sm mt-1">Calculate late fee and interest for delayed GST return filing as per CGST Act provisions.</p>
        </div>

        <div className="bg-white rounded-card shadow-card border border-gray-100 p-6 mb-5">
          <h2 className="font-semibold text-dark mb-4 pb-2 border-b border-gray-100">Filing Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Return Type</label>
              <select className="input-field" value={form.returnType} onChange={e => setForm({ ...form, returnType: e.target.value })}>
                {RETURN_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Taxpayer Category</label>
              <select className="input-field" value={form.taxpayerCategory} onChange={e => setForm({ ...form, taxpayerCategory: e.target.value })}>
                {TAXPAYER_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Annual Turnover (₹)</label>
              <input
                type="number"
                className="input-field"
                value={form.annualTurnover}
                onChange={e => setForm({ ...form, annualTurnover: e.target.value })}
                placeholder="Annual turnover (optional)"
              />
              <p className="text-xs text-muted mt-1">Affects late fee cap — ≤₹1.5Cr: max ₹2,000/return</p>
            </div>
            <div>
              <label className="label">State</label>
              <input
                type="text"
                className="input-field"
                value={form.state}
                onChange={e => setForm({ ...form, state: e.target.value })}
                placeholder="Maharashtra"
              />
            </div>
            <div>
              <label className="label">Return Due Date</label>
              <input
                type="date"
                className="input-field"
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Actual Filing Date</label>
              <input
                type="date"
                className="input-field"
                value={form.filingDate}
                onChange={e => setForm({ ...form, filingDate: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Tax Liability (₹) — for Interest Calculation</label>
              <input
                type="number"
                className="input-field"
                value={form.taxLiability}
                onChange={e => setForm({ ...form, taxLiability: e.target.value })}
                placeholder="Unpaid tax amount (leave 0 if paid on time, only for interest)"
              />
              <p className="text-xs text-muted mt-1">Interest @18% p.a. u/s 50(1) on unpaid tax liability</p>
            </div>
          </div>
        </div>

        {result !== null && form.dueDate && form.filingDate && (
          <div className="bg-white rounded-card shadow-card border border-gray-100 p-6">
            <h2 className="font-semibold text-dark mb-5 pb-2 border-b border-gray-100">Calculation Result</h2>

            {result.days === 0 ? (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <span className="text-lg">✓</span>
                <span className="font-medium">Filed on time! No late fee applies.</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg col-span-2 sm:col-span-1">
                    <div className="text-xs text-red-600 mb-1">Days Delayed</div>
                    <div className="text-2xl font-bold text-red-700">{result.days}</div>
                  </div>
                  <div className="p-4 bg-background rounded-lg border border-gray-100">
                    <div className="text-xs text-muted mb-1">CGST Late Fee</div>
                    <div className="text-xl font-bold text-dark">₹{fmt(result.cgstFee)}</div>
                  </div>
                  <div className="p-4 bg-background rounded-lg border border-gray-100">
                    <div className="text-xs text-muted mb-1">SGST Late Fee</div>
                    <div className="text-xl font-bold text-dark">₹{fmt(result.sgstFee)}</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted">CGST Late Fee</span>
                    <span className="font-medium">₹{fmt(result.cgstFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">SGST Late Fee</span>
                    <span className="font-medium">₹{fmt(result.sgstFee)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-dark">
                    <span>Total Late Fee</span>
                    <span>₹{fmt(result.totalFee)}</span>
                  </div>
                  {result.interest > 0 && (
                    <div className="flex justify-between text-orange-600 font-semibold">
                      <span>Interest @18% p.a.</span>
                      <span>₹{fmt(result.interest)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-base text-primary">
                    <span>Grand Total</span>
                    <span>₹{fmt(result.grand)}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2 text-xs text-yellow-800">
                    <AlertCircle size={12} className="mt-0.5 flex-shrink-0 text-yellow-600" />
                    <span>
                      Late fee: ₹50/day (₹25 CGST + ₹25 SGST) for regular returns. Nil return: ₹20/day.
                      Max cap applies based on turnover and return type.
                    </span>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                    Pay late fee while filing the return. Interest on tax liability is additional.
                  </div>
                </div>
              </>
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
