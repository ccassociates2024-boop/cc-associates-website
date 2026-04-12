"use client";

import { useState, useMemo } from "react";
import { TrendingUp, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

const FY_OPTIONS = [
  { value: "2025-26", installments: [
    { label: "1st Installment", dueDate: "15 June 2025", percent: 15 },
    { label: "2nd Installment", dueDate: "15 September 2025", percent: 45 },
    { label: "3rd Installment", dueDate: "15 December 2025", percent: 75 },
    { label: "4th Installment", dueDate: "15 March 2026", percent: 100 },
  ]},
  { value: "2024-25", installments: [
    { label: "1st Installment", dueDate: "15 June 2024", percent: 15 },
    { label: "2nd Installment", dueDate: "15 September 2024", percent: 45 },
    { label: "3rd Installment", dueDate: "15 December 2024", percent: 75 },
    { label: "4th Installment", dueDate: "15 March 2025", percent: 100 },
  ]},
];

function calcNewRegimeTax(income: number): number {
  let tax = 0;
  const slabs = [[0,300000,0],[300000,700000,0.05],[700000,1000000,0.10],[1000000,1200000,0.15],[1200000,1500000,0.20],[1500000,Infinity,0.30]];
  for (const [l,h,r] of slabs) if (income > l) tax += (Math.min(income,h)-l)*r;
  if (income <= 700000) tax = 0;
  return tax;
}

function calcOldRegimeTax(income: number): number {
  if (income <= 250000) return 0;
  let tax = 0;
  const excess = income - 250000;
  tax += Math.min(excess, 250000) * 0.05;
  const r2 = Math.max(0, excess - 250000);
  tax += Math.min(r2, 500000) * 0.20;
  const r3 = Math.max(0, r2 - 500000);
  tax += r3 * 0.30;
  if (income <= 500000) tax = Math.max(0, tax - 12500);
  return tax;
}

export default function AdvanceTaxPage() {
  const [form, setForm] = useState({
    fy: "2025-26",
    regime: "new",
    salary: "",
    business: "",
    capitalGains: "",
    other: "",
    tdsDeducted: "",
    existingAdvTax: "",
  });

  const fyData = FY_OPTIONS.find(f => f.value === form.fy) || FY_OPTIONS[0];

  const result = useMemo(() => {
    const totalIncome =
      (parseFloat(form.salary) || 0) +
      (parseFloat(form.business) || 0) +
      (parseFloat(form.capitalGains) || 0) +
      (parseFloat(form.other) || 0);

    const baseTax = form.regime === "new"
      ? calcNewRegimeTax(totalIncome)
      : calcOldRegimeTax(totalIncome);
    const withCess = baseTax * 1.04; // 4% cess

    const tdsDeducted = parseFloat(form.tdsDeducted) || 0;
    const existingAdvTax = parseFloat(form.existingAdvTax) || 0;
    const netTaxLiability = Math.max(0, withCess - tdsDeducted - existingAdvTax);

    // Advance tax required if net liability > ₹10,000
    const advanceTaxRequired = netTaxLiability > 10000;

    const installments = fyData.installments.map((inst, i) => {
      const requiredCumulative = (netTaxLiability * inst.percent) / 100;
      const previousCumulative = i === 0 ? 0 : (netTaxLiability * fyData.installments[i - 1].percent) / 100;
      const amountDue = requiredCumulative - previousCumulative;
      return {
        ...inst,
        cumulativePercent: inst.percent,
        cumulativeAmount: requiredCumulative,
        amountDue,
      };
    });

    return {
      totalIncome,
      baseTax,
      withCess,
      tdsDeducted,
      netTaxLiability,
      advanceTaxRequired,
      installments,
    };
  }, [form, fyData]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(n));

  const fmt2 = (n: number) =>
    new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted hover:text-dark mb-6">
          <ArrowLeft size={15} /> Back to Tools
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <TrendingUp className="text-primary" size={22} /> Advance Tax Calculator
          </h1>
          <p className="text-muted text-sm mt-1">Calculate advance tax installments with Sec 234C interest for missed deadlines.</p>
        </div>

        <div className="bg-white rounded-card shadow-card border border-gray-100 p-6 mb-5">
          <h2 className="font-semibold text-dark mb-5 pb-2 border-b border-gray-100">Income & Tax Details</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Financial Year</label>
              <select className="input-field" value={form.fy} onChange={e => setForm({ ...form, fy: e.target.value })}>
                {FY_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.value}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tax Regime</label>
              <select className="input-field" value={form.regime} onChange={e => setForm({ ...form, regime: e.target.value })}>
                <option value="new">New Regime (FY 2025-26 Default)</option>
                <option value="old">Old Regime</option>
              </select>
            </div>

            <div>
              <label className="label">Estimated Salary Income (₹)</label>
              <input type="number" className="input-field" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} placeholder="0" min="0" />
            </div>
            <div>
              <label className="label">Business / Profession Income (₹)</label>
              <input type="number" className="input-field" value={form.business} onChange={e => setForm({ ...form, business: e.target.value })} placeholder="0" min="0" />
            </div>
            <div>
              <label className="label">Capital Gains (₹)</label>
              <input type="number" className="input-field" value={form.capitalGains} onChange={e => setForm({ ...form, capitalGains: e.target.value })} placeholder="0" min="0" />
            </div>
            <div>
              <label className="label">Other Income (₹)</label>
              <input type="number" className="input-field" value={form.other} onChange={e => setForm({ ...form, other: e.target.value })} placeholder="0" min="0" />
            </div>

            <div>
              <label className="label">TDS Already Deducted (₹)</label>
              <input type="number" className="input-field" value={form.tdsDeducted} onChange={e => setForm({ ...form, tdsDeducted: e.target.value })} placeholder="0" min="0" />
            </div>
            <div>
              <label className="label">Advance Tax Already Paid (₹)</label>
              <input type="number" className="input-field" value={form.existingAdvTax} onChange={e => setForm({ ...form, existingAdvTax: e.target.value })} placeholder="0" min="0" />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-card shadow-card border border-gray-100 p-6 mb-5">
          <h2 className="font-semibold text-dark mb-5 pb-2 border-b border-gray-100">Tax Summary</h2>
          <div className="grid grid-cols-2 gap-3 text-sm mb-5">
            {[
              { label: "Estimated Gross Income", value: `₹${fmt(result.totalIncome)}` },
              { label: "Income Tax (before cess)", value: `₹${fmt(result.baseTax)}` },
              { label: "Tax + 4% Education Cess", value: `₹${fmt(result.withCess)}` },
              { label: "Less: TDS Deducted", value: `- ₹${fmt(result.tdsDeducted)}` },
              { label: "Net Advance Tax Required", value: `₹${fmt(result.netTaxLiability)}`, bold: true },
            ].map(({ label, value, bold }) => (
              <div key={label} className={`flex justify-between p-3 bg-background rounded-lg ${bold ? "col-span-2 border-2 border-primary/20" : ""}`}>
                <span className="text-muted">{label}</span>
                <span className={bold ? "font-bold text-primary text-base" : "font-medium text-dark"}>{value}</span>
              </div>
            ))}
          </div>

          {!result.advanceTaxRequired ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <CheckCircle size={16} />
              <span>Net tax liability ≤ ₹10,000. <strong>Advance tax not required</strong> under Sec 208.</span>
            </div>
          ) : (
            <>
              <h3 className="font-semibold text-dark mb-3 text-sm">Advance Tax Installment Schedule — FY {form.fy}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="text-left py-2.5 px-3 font-medium">Installment</th>
                      <th className="text-left py-2.5 px-3 font-medium">Due Date</th>
                      <th className="text-right py-2.5 px-3 font-medium">Cumulative %</th>
                      <th className="text-right py-2.5 px-3 font-medium">Amount Due (₹)</th>
                      <th className="text-right py-2.5 px-3 font-medium">Cumulative Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.installments.map((inst, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-background"}>
                        <td className="py-2.5 px-3">{inst.label}</td>
                        <td className="py-2.5 px-3 font-medium text-primary">{inst.dueDate}</td>
                        <td className="py-2.5 px-3 text-right">{inst.cumulativePercent}%</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-dark">₹{fmt(inst.amountDue)}</td>
                        <td className="py-2.5 px-3 text-right text-muted">₹{fmt(inst.cumulativeAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Sec 234C Info */}
        <div className="bg-white rounded-card shadow-card border border-gray-100 p-5">
          <h3 className="font-semibold text-dark mb-3 text-sm flex items-center gap-1.5">
            <AlertCircle size={14} className="text-gold" /> Section 234C — Interest for Default in Installments
          </h3>
          <div className="text-xs text-muted space-y-1.5">
            <p>Interest @1% per month for shortfall in each installment:</p>
            <ul className="space-y-1 ml-3">
              <li>• <strong>1st Installment (15 Jun):</strong> If paid &lt;15% → 1% × 3 months on shortfall</li>
              <li>• <strong>2nd Installment (15 Sep):</strong> If paid &lt;45% cumulative → 1% × 3 months</li>
              <li>• <strong>3rd Installment (15 Dec):</strong> If paid &lt;75% cumulative → 1% × 3 months</li>
              <li>• <strong>4th Installment (15 Mar):</strong> If paid &lt;100% → 1% × 1 month</li>
            </ul>
            <p className="mt-2 text-dark font-medium">Note: Senior citizens (60+) without business income are exempt from advance tax.</p>
          </div>
        </div>

        <p className="tool-disclaimer">
          Results are indicative only. Always consult a qualified tax professional for final decisions. Associate Piyush is not liable for any decisions made based on tool outputs. © 2026 Associate Piyush, Pune.
        </p>
      </div>
    </div>
  );
}
