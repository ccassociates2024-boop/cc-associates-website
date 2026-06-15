"use client";

import { useState, useMemo } from "react";
import { Home, ArrowLeft, Info, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

// ── Cost Inflation Index (CII) — Base Year 2001-02 = 100 ───────────────────────
// Source: CBDT Notifications. FY 2025-26 is estimated (~380); verify official CBDT notification.
const CII: Record<string, number> = {
  "2001-02": 100, "2002-03": 105, "2003-04": 109, "2004-05": 113,
  "2005-06": 117, "2006-07": 122, "2007-08": 129, "2008-09": 137,
  "2009-10": 148, "2010-11": 167, "2011-12": 184, "2012-13": 200,
  "2013-14": 220, "2014-15": 240, "2015-16": 254, "2016-17": 264,
  "2017-18": 272, "2018-19": 280, "2019-20": 289, "2020-21": 301,
  "2021-22": 317, "2022-23": 331, "2023-24": 348, "2024-25": 363,
  "2025-26": 380, // Estimated — confirm CBDT notification
};

const FY_LIST = Object.keys(CII).sort();

const fmtN = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n));
const fmtL = (n: number) =>
  n >= 10000000 ? `₹${(n / 10000000).toFixed(2)} Cr` :
  n >= 100000   ? `₹${(n / 100000).toFixed(2)} L`   : `₹${fmtN(n)}`;

export default function LTCGPropertyPage() {
  const [form, setForm] = useState({
    salePrice: "",
    costOfAcquisition: "",
    improvementCost: "",
    purchaseFY: "2010-11",
    saleFY: "2025-26",
    preJuly2024: "yes",     // "yes" = acquired before July 23, 2024 → two options
    sec54Investment: "",    // Sec 54: new residential house
    sec54EC: "",            // Sec 54EC: NHAI/REC bonds (max ₹50L)
  });

  const u = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }));

  const result = useMemo(() => {
    const sale = parseFloat(form.salePrice) || 0;
    const cost = parseFloat(form.costOfAcquisition) || 0;
    const impr = parseFloat(form.improvementCost) || 0;
    if (!sale || !cost) return null;

    const purchaseCII = CII[form.purchaseFY] || 100;
    const saleCII     = CII[form.saleFY] || 363;

    // ── Without indexation (12.5%) ────────────────────────────────────────────
    const ltcg_noindex = Math.max(0, sale - cost - impr);
    const tax_noindex_gross = ltcg_noindex * 0.125;

    // ── With indexation (20%) — only if pre-July 23, 2024 ────────────────────
    let ltcg_indexed = 0;
    let indexedCost = 0;
    let tax_indexed_gross = 0;
    if (form.preJuly2024 === "yes") {
      indexedCost = cost * (saleCII / purchaseCII);
      const indexedImpr = impr > 0 ? impr * (saleCII / purchaseCII) : 0;
      ltcg_indexed = Math.max(0, sale - indexedCost - indexedImpr);
      tax_indexed_gross = ltcg_indexed * 0.20;
    }

    // ── Exemptions ────────────────────────────────────────────────────────────
    const sec54Invest  = Math.min(parseFloat(form.sec54Investment) || 0, ltcg_noindex);
    const sec54ECInvest = Math.min(
      parseFloat(form.sec54EC) || 0,
      Math.max(0, ltcg_noindex - sec54Invest),
      5000000   // Max ₹50L per Sec 54EC
    );
    const totalExempt = sec54Invest + sec54ECInvest;

    // Taxable LTCG after exemptions
    const taxable_noindex = Math.max(0, ltcg_noindex - totalExempt);
    const tax_noindex_net = taxable_noindex * 0.125;
    const final_noindex   = tax_noindex_net * 1.04; // + 4% cess

    let taxable_indexed = 0;
    let tax_indexed_net = 0;
    let final_indexed   = 0;
    if (form.preJuly2024 === "yes") {
      const totalExempt_indexed = Math.min(totalExempt, ltcg_indexed);
      taxable_indexed = Math.max(0, ltcg_indexed - totalExempt_indexed);
      tax_indexed_net = taxable_indexed * 0.20;
      final_indexed   = tax_indexed_net * 1.04;
    }

    const better = form.preJuly2024 === "yes"
      ? (final_indexed <= final_noindex ? "indexed" : "noindex")
      : "noindex";

    return {
      sale, cost, impr, indexedCost, purchaseCII, saleCII,
      ltcg_noindex, ltcg_indexed,
      tax_noindex_gross, tax_indexed_gross,
      sec54Invest, sec54ECInvest, totalExempt,
      taxable_noindex, taxable_indexed,
      tax_noindex_net, tax_indexed_net,
      final_noindex, final_indexed,
      better,
    };
  }, [form]);

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted hover:text-dark mb-6">
          <ArrowLeft size={15} /> Back to Tools
        </Link>

        <div className="mb-4">
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <Home className="text-primary" size={22} /> LTCG on Property Sale Calculator
          </h1>
          <p className="text-muted text-sm mt-1">
            Calculate Long Term Capital Gain tax on sale of house / flat / plot. Includes CII indexation,
            Section 54 & 54EC exemptions. Updated for Finance Act 2024 (12.5% / 20% with indexation).
          </p>
        </div>

        <div className="flex items-start gap-2 bg-gold/10 border border-gold/30 rounded-lg px-4 py-3 mb-5 text-xs text-dark">
          <Info size={13} className="text-gold flex-shrink-0 mt-0.5" />
          <span>
            <strong>Finance Act 2024 change:</strong> Property acquired <strong>before July 23, 2024</strong> — you can choose
            20% with CII indexation OR 12.5% without indexation (whichever is lower).
            Acquired <strong>on/after July 23, 2024</strong> — only 12.5% without indexation applies.
            Holding period must be <strong>at least 24 months</strong> for LTCG treatment (reduced from 36 months).
          </span>
        </div>

        {/* Inputs */}
        <div className="bg-white rounded-card shadow-card border border-gray-100 p-6 mb-5">
          <h2 className="font-semibold text-dark mb-5 pb-2 border-b border-gray-100">Property & Sale Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">

            <div>
              <label className="label">Sale Price / Net Sale Consideration (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₹</span>
                <input type="number" className="input-field pl-7" value={form.salePrice}
                  onChange={e => u("salePrice", e.target.value)} placeholder="0" min="0" />
              </div>
              <p className="text-xs text-muted mt-1">Enter actual sale price or stamp duty value, whichever is higher (Sec 50C)</p>
            </div>

            <div>
              <label className="label">Original Cost of Acquisition (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₹</span>
                <input type="number" className="input-field pl-7" value={form.costOfAcquisition}
                  onChange={e => u("costOfAcquisition", e.target.value)} placeholder="0" min="0" />
              </div>
              <p className="text-xs text-muted mt-1">Purchase price + stamp duty + registration. For pre-2001 property, use FMV as on 01-Apr-2001</p>
            </div>

            <div>
              <label className="label">Cost of Improvement (₹) <span className="text-muted font-normal">(optional)</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₹</span>
                <input type="number" className="input-field pl-7" value={form.improvementCost}
                  onChange={e => u("improvementCost", e.target.value)} placeholder="0" min="0" />
              </div>
              <p className="text-xs text-muted mt-1">Major renovation / structural improvements (with bills). Improvement cost is also indexed.</p>
            </div>

            <div>
              <label className="label">Was property acquired before July 23, 2024?</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {[{ v: "yes", label: "Yes — Pre July 23, 2024", sub: "Two tax options available" },
                  { v: "no",  label: "No — On/After July 23, 2024", sub: "12.5% only (no indexation)" }].map(o => (
                  <button key={o.v} onClick={() => u("preJuly2024", o.v)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${form.preJuly2024 === o.v ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}>
                    <div className="text-xs font-semibold text-dark">{o.label}</div>
                    <div className="text-[10px] text-muted mt-0.5">{o.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Year of Purchase (FY)</label>
              <select className="input-field" value={form.purchaseFY} onChange={e => u("purchaseFY", e.target.value)}>
                {FY_LIST.map(fy => (
                  <option key={fy} value={fy}>{fy} (CII: {CII[fy]}{fy === "2025-26" ? " — est." : ""})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Year of Sale (FY)</label>
              <select className="input-field" value={form.saleFY} onChange={e => u("saleFY", e.target.value)}>
                {FY_LIST.map(fy => (
                  <option key={fy} value={fy}>{fy} (CII: {CII[fy]}{fy === "2025-26" ? " — est." : ""})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Exemptions */}
        <div className="bg-white rounded-card shadow-card border border-gray-100 p-6 mb-5">
          <h2 className="font-semibold text-dark mb-1 pb-2 border-b border-gray-100">Exemptions (Optional)</h2>
          <p className="text-xs text-muted mb-5">Enter 0 if you are not claiming any exemption. Both can be claimed together.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Sec 54 — Investment in New Residential House (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₹</span>
                <input type="number" className="input-field pl-7" value={form.sec54Investment}
                  onChange={e => u("sec54Investment", e.target.value)} placeholder="0" min="0" />
              </div>
              <p className="text-xs text-muted mt-1">Buy: 1 year before or 2 years after sale. Build: 3 years after. Max exempt = LTCG amount. For LTCG ≤ ₹2 Cr: can claim 2 houses (once in lifetime).</p>
            </div>
            <div>
              <label className="label">Sec 54EC — NHAI / REC Bonds Investment (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₹</span>
                <input type="number" className="input-field pl-7" value={form.sec54EC}
                  onChange={e => u("sec54EC", e.target.value)} placeholder="0" min="0" />
              </div>
              <p className="text-xs text-muted mt-1">Maximum ₹50 lakh per FY. Must invest within 6 months of sale. Lock-in: 5 years.</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle size={12} className="mt-0.5 flex-shrink-0 text-amber-600" />
            <span>
              <strong>Capital Gains Account Scheme (CGAS):</strong> If the exemption amount is not invested before the ITR due date (31 July / 31 Oct),
              deposit the unutilised amount in a CGAS account at a designated bank before filing ITR. This preserves the exemption while you finalize the investment.
            </span>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">

            {/* Summary banner */}
            <div className="bg-primary text-white rounded-xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-gold/80 mb-1">LTCG Computation Summary</p>
              <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                <div>
                  <div className="text-blue-200 text-xs mb-0.5">Sale Price</div>
                  <div className="font-bold text-base">{fmtL(result.sale)}</div>
                </div>
                <div>
                  <div className="text-blue-200 text-xs mb-0.5">Original Cost</div>
                  <div className="font-bold text-base">{fmtL(result.cost)}</div>
                </div>
                {result.impr > 0 && (
                  <div>
                    <div className="text-blue-200 text-xs mb-0.5">Improvement Cost</div>
                    <div className="font-bold text-base">{fmtL(result.impr)}</div>
                  </div>
                )}
                {form.preJuly2024 === "yes" && (
                  <div>
                    <div className="text-blue-200 text-xs mb-0.5">Indexed Cost (CII {result.saleCII}/{result.purchaseCII})</div>
                    <div className="font-bold text-base">{fmtL(result.indexedCost)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Two option cards */}
            <div className={`grid ${form.preJuly2024 === "yes" ? "sm:grid-cols-2" : "grid-cols-1"} gap-4`}>

              {/* Option A: 12.5% without indexation */}
              <div className={`bg-white rounded-xl border-2 p-5 ${result.better === "noindex" ? "border-green-400" : "border-gray-200"}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-dark text-sm">12.5% — Without Indexation</h3>
                    {form.preJuly2024 === "no" && <p className="text-xs text-muted mt-0.5">Only option available (post July 23, 2024 acquisition)</p>}
                  </div>
                  {result.better === "noindex" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500 text-white">BETTER OPTION</span>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <Row label="LTCG (Sale − Cost − Improvement)"  value={`₹${fmtN(result.ltcg_noindex)}`} />
                  {result.totalExempt > 0 && <Row label="Less: Exemptions (Sec 54 / 54EC)" value={`− ₹${fmtN(Math.min(result.totalExempt, result.ltcg_noindex))}`} vc="text-green-600" />}
                  <Row label="Taxable LTCG" value={`₹${fmtN(result.taxable_noindex)}`} />
                  <Row label="Tax @ 12.5%"  value={`₹${fmtN(result.tax_noindex_net)}`} />
                  <Row label="Add: 4% Cess" value={`₹${fmtN(result.final_noindex - result.tax_noindex_net)}`} />
                  <div className="flex justify-between border-t border-gray-200 pt-2 mt-2 font-bold">
                    <span className="text-dark">Total Tax</span>
                    <span className="text-primary text-base">₹{fmtN(result.final_noindex)}</span>
                  </div>
                </div>
              </div>

              {/* Option B: 20% with indexation — only for pre-July 23, 2024 */}
              {form.preJuly2024 === "yes" && (
                <div className={`bg-white rounded-xl border-2 p-5 ${result.better === "indexed" ? "border-green-400" : "border-gray-200"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-dark text-sm">20% — With CII Indexation</h3>
                      <p className="text-xs text-muted mt-0.5">Available: pre-July 23, 2024 acquisitions</p>
                    </div>
                    {result.better === "indexed" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500 text-white">BETTER OPTION</span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <Row label={`Indexed Cost (÷ CII ${result.purchaseCII} × ${result.saleCII})`} value={`₹${fmtN(result.indexedCost)}`} />
                    <Row label="LTCG (Sale − Indexed Cost)" value={`₹${fmtN(result.ltcg_indexed)}`} />
                    {result.totalExempt > 0 && <Row label="Less: Exemptions (Sec 54 / 54EC)" value={`− ₹${fmtN(Math.min(result.totalExempt, result.ltcg_indexed))}`} vc="text-green-600" />}
                    <Row label="Taxable LTCG" value={`₹${fmtN(result.taxable_indexed)}`} />
                    <Row label="Tax @ 20%"    value={`₹${fmtN(result.tax_indexed_net)}`} />
                    <Row label="Add: 4% Cess" value={`₹${fmtN(result.final_indexed - result.tax_indexed_net)}`} />
                    <div className="flex justify-between border-t border-gray-200 pt-2 mt-2 font-bold">
                      <span className="text-dark">Total Tax</span>
                      <span className="text-primary text-base">₹{fmtN(result.final_indexed)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Exemption breakdown */}
            {result.totalExempt > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-green-700 mb-3 flex items-center gap-1.5">
                  <CheckCircle size={12} /> Exemptions Applied
                </p>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  {result.sec54Invest > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-700">Sec 54 — New House</span>
                      <span className="font-semibold text-green-800">₹{fmtN(result.sec54Invest)}</span>
                    </div>
                  )}
                  {result.sec54ECInvest > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-700">Sec 54EC — Bonds</span>
                      <span className="font-semibold text-green-800">₹{fmtN(result.sec54ECInvest)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t border-green-300 pt-2 sm:col-span-2">
                    <span className="text-green-800">Total Exempt</span>
                    <span className="text-green-800">₹{fmtN(result.totalExempt)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold text-dark text-sm mb-1">Need help with property LTCG or Section 54 planning?</p>
                <p className="text-xs text-muted">We specialise in LTCG on property sale — including Section 54/54F/54EC tax planning, CGAS deposits, and ITR filing for capital gains.</p>
              </div>
              <a
                href="https://wa.me/918421465966?text=Hello%2C%20I%20need%20help%20with%20LTCG%20on%20property%20sale%20and%20Section%2054%20planning."
                target="_blank" rel="noopener noreferrer"
                className="btn-gold gap-2 flex-shrink-0 text-sm"
              >
                WhatsApp Us
              </a>
            </div>

            {/* CII note */}
            {(form.purchaseFY === "2025-26" || form.saleFY === "2025-26") && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <AlertCircle size={12} className="mt-0.5 flex-shrink-0 text-amber-600" />
                <span>CII for FY 2025-26 is estimated at 380. The official CII is notified by CBDT each year — please verify the notified value before filing your ITR.</span>
              </div>
            )}
          </div>
        )}

        <p className="tool-disclaimer mt-6">
          Results are indicative only. Does not account for Sec 50C (stamp duty valuation), Sec 54B (agricultural land), or NRI-specific TDS rules (Sec 195). Always consult a CA for final computation and ITR filing. © 2026 CC Associates, Pune.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, vc = "text-dark" }: { label: string; value: string; vc?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted text-xs sm:text-sm">{label}</span>
      <span className={`font-medium text-xs sm:text-sm ${vc}`}>{value}</span>
    </div>
  );
}
