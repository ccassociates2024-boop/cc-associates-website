"use client";

import { useState, useMemo } from "react";
import { BarChart3, ArrowLeft, ChevronRight, ChevronLeft, CheckCircle, Info } from "lucide-react";
import Link from "next/link";

const STEPS = ["Basic Info", "Income Details", "Deductions (Old)", "Results"];

type Regime = "old" | "new" | "both";
type TaxpayerType = "individual" | "senior" | "supersenior" | "huf";

// ── FY 2026-27: New Regime (Income-tax Act, 2025) ──────────────────────────
function calcNewRegimeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  const slabs: [number, number, number][] = [
    [0,        400000,   0.00],
    [400000,   800000,   0.05],
    [800000,   1200000,  0.10],
    [1200000,  1600000,  0.15],
    [1600000,  2000000,  0.20],
    [2000000,  2400000,  0.25],
    [2400000,  Infinity, 0.30],
  ];
  let tax = 0;
  for (const [low, high, rate] of slabs) {
    if (taxableIncome > low) {
      tax += (Math.min(taxableIncome, high) - low) * rate;
    }
  }
  // Rebate u/s 87A: income ≤ ₹12,00,000 → zero tax
  if (taxableIncome <= 1200000) tax = 0;
  return tax;
}

// ── FY 2026-27: Old Regime ─────────────────────────────────────────────────
function calcOldRegimeTax(taxableIncome: number, type: TaxpayerType): number {
  if (taxableIncome <= 0) return 0;
  // Basic exemption limits
  const exemption =
    type === "supersenior" ? 500000 :
    type === "senior"      ? 300000 : 250000;

  const net = Math.max(0, taxableIncome - exemption);
  if (net <= 0) return 0;

  let tax = 0;
  let rem = net;
  // 5% slab: next ₹2,50,000 after exemption
  const s1 = Math.min(rem, 250000); tax += s1 * 0.05; rem -= s1;
  // 20% slab: next ₹5,00,000
  if (rem > 0) { const s2 = Math.min(rem, 500000); tax += s2 * 0.20; rem -= s2; }
  // 30% slab: above ₹10,00,000
  if (rem > 0) { tax += rem * 0.30; }

  // Rebate u/s 87A: income ≤ ₹5,00,000 → rebate up to ₹12,500
  if (taxableIncome <= 500000) tax = Math.max(0, tax - 12500);
  return tax;
}

// ── Surcharge + Cess ───────────────────────────────────────────────────────
function addSurchargeAndCess(baseTax: number, income: number, isNewRegime: boolean): {
  surcharge: number; cess: number; total: number;
} {
  let surchargeRate = 0;
  if      (income > 50000000) surchargeRate = isNewRegime ? 0.25 : 0.37; // >5Cr: 25% new / 37% old
  else if (income > 20000000) surchargeRate = 0.25; // >2Cr–5Cr
  else if (income > 10000000) surchargeRate = 0.15; // >1Cr–2Cr
  else if (income > 5000000)  surchargeRate = 0.10; // >50L–1Cr
  const surcharge = baseTax * surchargeRate;
  const cess = (baseTax + surcharge) * 0.04;
  return { surcharge, cess, total: Math.round(baseTax + surcharge + cess) };
}

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n));

const fmtShort = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${fmt(n)}`;
};

const NEW_SLABS_FY2627 = [
  ["0 – 4L", "NIL"], ["4L – 8L", "5%"], ["8L – 12L", "10%"],
  ["12L – 16L", "15%"], ["16L – 20L", "20%"], ["20L – 24L", "25%"], ["Above 24L", "30%"],
];
const OLD_SLABS_FY2627 = [
  ["0 – 2.5L", "NIL"], ["2.5L – 5L", "5%"], ["5L – 10L", "20%"], ["Above 10L", "30%"],
];

// ──────────────────────────────────────────────────────────────────────────
export default function ITREstimatorPage() {
  const [step, setStep] = useState(0);

  const [basicInfo, setBasicInfo] = useState({
    taxpayerType: "individual" as TaxpayerType,
    regime: "both" as Regime,
  });

  const [income, setIncome] = useState({
    salary: "", houseProperty: "", business: "",
    stcg: "", ltcg: "", other: "",
  });

  const [ded, setDed] = useState({
    c80C: "", c80CCD1B: "", c80D: "", c80G: "",
    hra: "", interestHomeLoan: "",
  });

  // ── Tax calculation ──────────────────────────────────────────────────────
  const results = useMemo(() => {
    const gross =
      (parseFloat(income.salary)        || 0) +
      (parseFloat(income.houseProperty) || 0) +
      (parseFloat(income.business)      || 0) +
      (parseFloat(income.stcg)          || 0) +
      (parseFloat(income.ltcg)          || 0) +
      (parseFloat(income.other)         || 0);

    // Old regime deductions
    const isSenior = basicInfo.taxpayerType === "senior" || basicInfo.taxpayerType === "supersenior";
    const max80D = isSenior ? 50000 : 25000;
    const oldDeductions =
      50000 +                                               // Standard deduction (salaried)
      Math.min(parseFloat(ded.c80C)        || 0, 150000) + // 80C cap ₹1.5L
      Math.min(parseFloat(ded.c80CCD1B)   || 0, 50000)  + // 80CCD(1B) cap ₹50K
      Math.min(parseFloat(ded.c80D)        || 0, max80D) + // 80D cap
      (parseFloat(ded.c80G)               || 0) +          // 80G (no cap applied — user enters eligible amount)
      (parseFloat(ded.hra)                || 0) +          // HRA from Form 16
      Math.min(parseFloat(ded.interestHomeLoan) || 0, 200000); // 24(b) cap ₹2L

    const oldTaxable  = Math.max(0, gross - oldDeductions);
    const oldBase     = calcOldRegimeTax(oldTaxable, basicInfo.taxpayerType);
    const oldFull     = addSurchargeAndCess(oldBase, oldTaxable, false);

    // New regime — only ₹75,000 standard deduction
    const newTaxable  = Math.max(0, gross - 75000);
    const newBase     = calcNewRegimeTax(newTaxable);
    const newFull     = addSurchargeAndCess(newBase, newTaxable, true);

    // Rebate flag for callout
    const newRebateApplies = newTaxable <= 1200000 && newBase === 0 && gross > 0;
    const oldRebateApplies = oldTaxable <= 500000  && oldBase === 0 && gross > 0;

    const savings      = Math.abs(oldFull.total - newFull.total);
    const betterRegime = oldFull.total <= newFull.total ? "old" : "new";

    return {
      gross, oldDeductions, oldTaxable, oldBase, oldFull,
      newTaxable, newBase, newFull,
      savings, betterRegime, newRebateApplies, oldRebateApplies, isSenior, max80D,
    };
  }, [income, ded, basicInfo]);

  const isLastStep = step === 3;

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Back */}
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted hover:text-dark mb-6">
          <ArrowLeft size={15} /> Back to Tools
        </Link>

        {/* Title */}
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <BarChart3 className="text-primary" size={22} /> ITR Tax Estimator
          </h1>
          <p className="text-muted text-sm mt-1">
            Compare Old vs New Tax Regime for <strong>FY 2026-27</strong> (Tax Year 2026-27).
          </p>
        </div>

        {/* Act 2025 notice */}
        <div className="flex items-start gap-2 bg-gold/10 border border-gold/30 rounded-lg px-4 py-3 mb-6 text-xs text-dark">
          <Info size={13} className="text-gold flex-shrink-0 mt-0.5" />
          <span>
            <strong>Updated for Income-tax Act, 2025</strong> effective 1 April 2026.
            New regime is the default. New regime 87A rebate: zero tax up to ₹12,00,000 income.
          </span>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  i === step   ? "bg-primary text-white" :
                  i < step     ? "bg-green-100 text-green-700 cursor-pointer" :
                                 "bg-gray-100 text-muted cursor-default"
                }`}
              >
                {i < step ? <CheckCircle size={12} /> : <span>{i + 1}</span>}
                {s}
              </button>
              {i < STEPS.length - 1 && <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-card shadow-card border border-gray-100 p-6">

          {/* ── STEP 1: Basic Info ─────────────────────────────────────────── */}
          {step === 0 && (
            <div>
              <h2 className="font-semibold text-dark mb-5 pb-2 border-b border-gray-100">Basic Information</h2>
              <div className="space-y-5">
                <div>
                  <label className="label">Taxpayer Type</label>
                  <select
                    className="input-field"
                    value={basicInfo.taxpayerType}
                    onChange={e => setBasicInfo({ ...basicInfo, taxpayerType: e.target.value as TaxpayerType })}
                  >
                    <option value="individual">Individual (Below 60 yrs)</option>
                    <option value="senior">Senior Citizen (60–80 yrs)</option>
                    <option value="supersenior">Super Senior (80+ yrs)</option>
                    <option value="huf">HUF</option>
                  </select>
                  <p className="text-xs text-muted mt-1">Affects basic exemption limit under Old Regime</p>
                </div>

                <div>
                  <label className="label">Tax Regime</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v: "old",  label: "Old Regime",    sub: "With deductions" },
                      { v: "new",  label: "New Regime",    sub: "Default FY 2026-27" },
                      { v: "both", label: "Compare Both",  sub: "Recommended ✓" },
                    ].map(({ v, label, sub }) => (
                      <button
                        key={v}
                        onClick={() => setBasicInfo({ ...basicInfo, regime: v as Regime })}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          basicInfo.regime === v
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="text-sm font-semibold text-dark">{label}</div>
                        <div className="text-xs text-muted mt-0.5">{sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Income ─────────────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <h2 className="font-semibold text-dark mb-5 pb-2 border-b border-gray-100">
                Income Details — FY 2026-27
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { k: "salary",        label: "Gross Salary / Pension",          hint: "Before standard deduction" },
                  { k: "houseProperty", label: "Income from House Property",       hint: "Net Annual Value. Negative for self-occupied with loan." },
                  { k: "business",      label: "Business / Professional Income",   hint: "Net profit after all business expenses" },
                  { k: "stcg",          label: "Short-Term Capital Gains (STCG)",  hint: "Taxed at applicable slab rates" },
                  { k: "ltcg",          label: "Long-Term Capital Gains (LTCG)",   hint: "Above ₹1.25L taxed at 12.5% (equity)" },
                  { k: "other",         label: "Other Income",                     hint: "Interest, dividends, etc." },
                ].map(({ k, label, hint }) => (
                  <div key={k}>
                    <label className="label">{label}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₹</span>
                      <input
                        type="number"
                        className="input-field pl-7"
                        value={(income as Record<string,string>)[k]}
                        onChange={e => setIncome({ ...income, [k]: e.target.value })}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <p className="text-xs text-muted mt-1">{hint}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-primary/5 rounded-lg text-sm flex justify-between items-center">
                <span className="text-muted">Total Gross Income</span>
                <span className="font-bold text-primary text-base">{fmtShort(results.gross)}</span>
              </div>
            </div>
          )}

          {/* ── STEP 3: Deductions ─────────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <h2 className="font-semibold text-dark mb-1 pb-2 border-b border-gray-100">
                Deductions — Old Regime Only
              </h2>
              <p className="text-xs text-muted mb-5">
                These deductions apply only under the Old Regime. Under New Regime, only ₹75,000
                standard deduction is allowed (auto-applied).
              </p>
              <div className="grid sm:grid-cols-2 gap-4">

                {/* Standard deduction — auto applied, shown read-only */}
                <div className="sm:col-span-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm flex justify-between items-center">
                  <div>
                    <span className="font-medium text-dark">Standard Deduction (Salaried)</span>
                    <span className="text-xs text-muted block">Auto-applied for old regime</span>
                  </div>
                  <span className="font-bold text-green-600">- ₹50,000</span>
                </div>

                {/* 80C */}
                <div>
                  <label className="label">
                    Sec 80C &nbsp;<span className="text-gold text-xs font-normal">(Max ₹1,50,000)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₹</span>
                    <input type="number" className="input-field pl-7"
                      value={ded.c80C} onChange={e => setDed({ ...ded, c80C: e.target.value })}
                      placeholder="0" min="0" max="150000" />
                  </div>
                  <p className="text-xs text-muted mt-1">LIC, PPF, ELSS, PF, tuition fees, NSC</p>
                </div>

                {/* 80CCD(1B) */}
                <div>
                  <label className="label">
                    Sec 80CCD(1B) — NPS &nbsp;<span className="text-gold text-xs font-normal">(Max ₹50,000)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₹</span>
                    <input type="number" className="input-field pl-7"
                      value={ded.c80CCD1B} onChange={e => setDed({ ...ded, c80CCD1B: e.target.value })}
                      placeholder="0" min="0" max="50000" />
                  </div>
                  <p className="text-xs text-muted mt-1">Additional NPS contribution (over 80C)</p>
                </div>

                {/* 80D */}
                <div>
                  <label className="label">
                    Sec 80D — Health Insurance &nbsp;
                    <span className="text-gold text-xs font-normal">
                      (Max ₹{results.isSenior ? "50,000" : "25,000"})
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₹</span>
                    <input type="number" className="input-field pl-7"
                      value={ded.c80D} onChange={e => setDed({ ...ded, c80D: e.target.value })}
                      placeholder="0" min="0" max={results.max80D} />
                  </div>
                  <p className="text-xs text-muted mt-1">
                    Self + family health insurance premium.
                    {results.isSenior ? " Senior citizen limit: ₹50,000." : " Additional ₹25,000 for senior parent premium."}
                  </p>
                </div>

                {/* 80G */}
                <div>
                  <label className="label">Sec 80G — Donations</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₹</span>
                    <input type="number" className="input-field pl-7"
                      value={ded.c80G} onChange={e => setDed({ ...ded, c80G: e.target.value })}
                      placeholder="0" min="0" />
                  </div>
                  <p className="text-xs text-muted mt-1">Enter eligible amount (50% / 100% of donation)</p>
                </div>

                {/* HRA */}
                <div>
                  <label className="label">HRA Exemption — Sec 10(13A)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₹</span>
                    <input type="number" className="input-field pl-7"
                      value={ded.hra} onChange={e => setDed({ ...ded, hra: e.target.value })}
                      placeholder="0" min="0" />
                  </div>
                  <p className="text-xs text-muted mt-1">From Form 16 / employer certificate</p>
                </div>

                {/* Sec 24(b) */}
                <div>
                  <label className="label">
                    Sec 24(b) — Home Loan Interest &nbsp;<span className="text-gold text-xs font-normal">(Max ₹2,00,000)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₹</span>
                    <input type="number" className="input-field pl-7"
                      value={ded.interestHomeLoan} onChange={e => setDed({ ...ded, interestHomeLoan: e.target.value })}
                      placeholder="0" min="0" max="200000" />
                  </div>
                  <p className="text-xs text-muted mt-1">Interest on housing loan (self-occupied property)</p>
                </div>
              </div>

              <div className="mt-5 p-3 bg-primary/5 rounded-lg text-sm flex justify-between items-center">
                <span className="text-muted">Total Old Regime Deductions</span>
                <span className="font-bold text-primary text-base">{fmtShort(results.oldDeductions)}</span>
              </div>
            </div>
          )}

          {/* ── STEP 4: Results ────────────────────────────────────────────── */}
          {step === 3 && (
            <div>
              <h2 className="font-semibold text-dark mb-5 pb-2 border-b border-gray-100">
                Tax Results — FY 2026-27 (Tax Year 2026-27)
              </h2>

              {/* Side-by-side cards */}
              <div className="grid sm:grid-cols-2 gap-4 mb-5">

                {/* Old Regime */}
                <div className={`p-5 rounded-xl border-2 ${results.betterRegime === "old" ? "border-green-400 bg-green-50" : "border-gray-200 bg-background"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-dark">Old Regime</h3>
                    {results.betterRegime === "old" && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-500 text-white">SAVES MORE</span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <Row label="Gross Income"        value={`₹${fmt(results.gross)}`} />
                    <Row label="Total Deductions"    value={`- ₹${fmt(results.oldDeductions)}`} valueClass="text-green-600" />
                    <Row label="Taxable Income"      value={`₹${fmt(results.oldTaxable)}`} />
                    <Row label="Base Tax"            value={`₹${fmt(results.oldBase)}`} />
                    {results.oldFull.surcharge > 0 && (
                      <Row label="Surcharge"         value={`₹${fmt(results.oldFull.surcharge)}`} />
                    )}
                    <Row label="Health & Ed. Cess (4%)" value={`₹${fmt(results.oldFull.cess)}`} />
                    <div className="flex justify-between border-t border-gray-300 pt-2 mt-2 font-bold">
                      <span className="text-dark">Total Tax Payable</span>
                      <span className="text-primary text-base">₹{fmt(results.oldFull.total)}</span>
                    </div>
                    {results.oldRebateApplies && (
                      <p className="text-xs text-green-700 font-medium">✓ Rebate u/s 87A applied</p>
                    )}
                  </div>
                </div>

                {/* New Regime */}
                <div className={`p-5 rounded-xl border-2 ${results.betterRegime === "new" ? "border-green-400 bg-green-50" : "border-gray-200 bg-background"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-dark">New Regime</h3>
                    {results.betterRegime === "new" && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-500 text-white">SAVES MORE</span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <Row label="Gross Income"        value={`₹${fmt(results.gross)}`} />
                    <Row label="Std. Deduction"      value="- ₹75,000" valueClass="text-green-600" />
                    <Row label="Taxable Income"      value={`₹${fmt(results.newTaxable)}`} />
                    <Row label="Base Tax"            value={`₹${fmt(results.newBase)}`} />
                    {results.newFull.surcharge > 0 && (
                      <Row label="Surcharge"         value={`₹${fmt(results.newFull.surcharge)}`} />
                    )}
                    <Row label="Health & Ed. Cess (4%)" value={`₹${fmt(results.newFull.cess)}`} />
                    <div className="flex justify-between border-t border-gray-300 pt-2 mt-2 font-bold">
                      <span className="text-dark">Total Tax Payable</span>
                      <span className="text-primary text-base">₹{fmt(results.newFull.total)}</span>
                    </div>
                    {results.newRebateApplies && (
                      <p className="text-xs text-green-700 font-medium">✓ Rebate u/s 87A: Zero tax up to ₹12L</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recommendation banner */}
              <div className={`rounded-lg p-4 border mb-6 ${results.betterRegime === "old" ? "bg-green-50 border-green-300" : "bg-blue-50 border-blue-300"}`}>
                <div className="font-bold text-dark text-sm">
                  ✅ Choose{" "}
                  <span className="text-primary">
                    {results.betterRegime === "old" ? "Old Tax Regime" : "New Tax Regime (FY 2026-27 default)"}
                  </span>{" "}
                  — you save{" "}
                  <span className="text-green-600">₹{fmt(results.savings)}</span> in taxes.
                </div>
                {results.newRebateApplies && results.betterRegime === "new" && (
                  <p className="text-xs text-green-700 mt-1">
                    Income ≤ ₹12,00,000 — Sec 87A rebate makes your tax liability <strong>ZERO</strong> under New Regime.
                  </p>
                )}
              </div>

              {/* Slab reference tables */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-dark mb-2 uppercase tracking-wide">
                    New Regime Slabs — FY 2026-27
                  </h4>
                  <div className="space-y-1">
                    {NEW_SLABS_FY2627.map(([range, rate]) => (
                      <div key={range} className="flex justify-between px-3 py-1.5 bg-background rounded border border-gray-100 text-xs">
                        <span className="text-muted">{range}</span>
                        <span className="font-semibold text-dark">{rate}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted mt-1.5">87A rebate: Zero tax if income ≤ ₹12L</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-dark mb-2 uppercase tracking-wide">
                    Old Regime Slabs — FY 2026-27
                  </h4>
                  <div className="space-y-1">
                    {OLD_SLABS_FY2627.map(([range, rate]) => (
                      <div key={range} className="flex justify-between px-3 py-1.5 bg-background rounded border border-gray-100 text-xs">
                        <span className="text-muted">{range}</span>
                        <span className="font-semibold text-dark">{rate}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted mt-1.5">87A rebate: Up to ₹12,500 if income ≤ ₹5L</p>
                </div>
              </div>

              {/* Surcharge note */}
              <div className="mt-4 p-3 bg-background rounded-lg border border-gray-100 text-xs text-muted">
                <span className="font-semibold text-dark">Surcharge: </span>
                &gt;50L–1Cr: 10% &nbsp;|&nbsp; &gt;1Cr–2Cr: 15% &nbsp;|&nbsp;
                &gt;2Cr–5Cr: 25% &nbsp;|&nbsp; &gt;5Cr: 37% (old) / 25% (new) &nbsp;|&nbsp;
                + 4% Health &amp; Education Cess on (tax + surcharge).
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="btn-outline gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={15} /> Previous
            </button>
            {!isLastStep ? (
              <button onClick={() => setStep(s => s + 1)} className="btn-primary gap-2">
                {step === 2 ? "Calculate Tax" : "Next"} <ChevronRight size={15} />
              </button>
            ) : (
              <button onClick={() => setStep(0)} className="btn-outline">Start Over</button>
            )}
          </div>
        </div>

        <p className="tool-disclaimer">
          Results are indicative only. Figures based on Income-tax Act, 2025 effective 1 April 2026.
          Always consult a qualified tax professional for final decisions.
          Associate Piyush is not liable for any decisions made based on tool outputs.
          © 2026 Associate Piyush, Pune.
        </p>
      </div>
    </div>
  );
}

// Small helper row component
function Row({ label, value, valueClass = "font-medium" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
