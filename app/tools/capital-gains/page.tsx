"use client";

import { useState, useMemo } from "react";
import { TrendingUp, ArrowLeft, AlertTriangle, Info, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

// ── Cost Inflation Index (CII) ──────────────────────────────────────────────
const CII: Record<string, number> = {
  "2001-02": 100, "2002-03": 105, "2003-04": 109, "2004-05": 113,
  "2005-06": 117, "2006-07": 122, "2007-08": 129, "2008-09": 137,
  "2009-10": 148, "2010-11": 167, "2011-12": 184, "2012-13": 200,
  "2013-14": 220, "2014-15": 240, "2015-16": 254, "2016-17": 264,
  "2017-18": 272, "2018-19": 280, "2019-20": 289, "2020-21": 301,
  "2021-22": 317, "2022-23": 331, "2023-24": 348, "2024-25": 363,
  "2025-26": 380,
};

const CII_FYS = Object.keys(CII).sort();

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmtINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function holdingMonths(purchaseDate: string, saleDate: string): number {
  if (!purchaseDate || !saleDate) return 0;
  const p = new Date(purchaseDate);
  const s = new Date(saleDate);
  return (s.getFullYear() - p.getFullYear()) * 12 + (s.getMonth() - p.getMonth());
}

function dateToFY(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  if (month >= 4) return `${year}-${String(year + 1).slice(2)}`;
  return `${year - 1}-${String(year).slice(2)}`;
}

function saleCII(saleDate: string): { fy: string; cii: number; estimated: boolean } {
  const fy = dateToFY(saleDate);
  if (CII[fy]) return { fy, cii: CII[fy], estimated: false };
  // FY 2026-27 not yet notified — use estimate
  return { fy, cii: 396, estimated: true };
}

function calcSurcharge(totalIncome: number, isEquity: boolean): number {
  if (totalIncome <= 5000000) return 0;
  let rate = 0;
  if (totalIncome <= 10000000) rate = 0.10;
  else if (totalIncome <= 20000000) rate = 0.15;
  else if (totalIncome <= 50000000) rate = 0.25;
  else rate = 0.37;
  // Surcharge capped at 15% for equity (Sec 111A, 112A)
  if (isEquity && rate > 0.15) rate = 0.15;
  return rate;
}

// ── Asset types ──────────────────────────────────────────────────────────────
const ASSET_TYPES = [
  { value: "equity", label: "Listed Equity Shares / Equity Mutual Funds" },
  { value: "debt", label: "Debt Mutual Funds / Bonds (purchased after 1 Apr 2023)" },
  { value: "property", label: "Property / Land / House" },
];

const SLAB_RATES = [
  { value: 0, label: "Nil (below ₹3L — new regime)" },
  { value: 5, label: "5%" },
  { value: 20, label: "20%" },
  { value: 30, label: "30%" },
];

// ── Main Component ──────────────────────────────────────────────────────────
export default function CapitalGainsPage() {
  const [assetType, setAssetType] = useState("equity");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [saleDate, setSaleDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [brokerage, setBrokerage] = useState("");
  const [purchaseFY, setPurchaseFY] = useState("2020-21");
  const [useIndexation, setUseIndexation] = useState(false);
  const [slabRate, setSlabRate] = useState(30);
  const [otherIncome, setOtherIncome] = useState("");

  const isPropertyBeforeJul2024 = useMemo(() => {
    if (assetType !== "property" || !purchaseDate) return false;
    return new Date(purchaseDate) < new Date("2024-07-23");
  }, [assetType, purchaseDate]);

  const result = useMemo(() => {
    const pp = parseFloat(purchasePrice) || 0;
    const sp = parseFloat(salePrice) || 0;
    const exp = parseFloat(brokerage) || 0;
    const otherInc = parseFloat(otherIncome) || 0;

    if (!pp || !sp || !purchaseDate || !saleDate) return null;
    if (new Date(saleDate) <= new Date(purchaseDate)) return null;

    const months = holdingMonths(purchaseDate, saleDate);
    const netSalePrice = sp - exp;

    // ── EQUITY ──────────────────────────────────────────────────────────────
    if (assetType === "equity") {
      const isLTCG = months >= 12;
      const costOfAcquisition = pp;
      const capitalGain = netSalePrice - costOfAcquisition;

      if (capitalGain <= 0) {
        return {
          type: "loss",
          months,
          costOfAcquisition,
          capitalGain,
          netSalePrice,
        };
      }

      if (!isLTCG) {
        // STCG under Sec 111A @ 20%
        const taxableGain = capitalGain;
        const baseTax = taxableGain * 0.20;
        const totalInc = otherInc + taxableGain;
        const surchargeRate = calcSurcharge(totalInc, true);
        const surcharge = baseTax * surchargeRate;
        const cess = (baseTax + surcharge) * 0.04;
        const totalTax = baseTax + surcharge + cess;
        return {
          type: "stcg-equity",
          months,
          isLTCG: false,
          section: "Section 111A",
          costOfAcquisition,
          netSalePrice,
          capitalGain,
          exemption: 0,
          taxableGain,
          taxRate: 20,
          baseTax,
          surchargeRate: surchargeRate * 100,
          surcharge,
          cess,
          totalTax,
        };
      } else {
        // LTCG under Sec 112A @ 12.5% above ₹1,25,000
        const exemption = 125000;
        const taxableGain = Math.max(0, capitalGain - exemption);
        const baseTax = taxableGain * 0.125;
        const totalInc = otherInc + taxableGain;
        const surchargeRate = calcSurcharge(totalInc, true);
        const surcharge = baseTax * surchargeRate;
        const cess = (baseTax + surcharge) * 0.04;
        const totalTax = baseTax + surcharge + cess;
        const nearThreshold = capitalGain > 100000 && capitalGain < 150000;
        return {
          type: "ltcg-equity",
          months,
          isLTCG: true,
          section: "Section 112A",
          costOfAcquisition,
          netSalePrice,
          capitalGain,
          exemption,
          taxableGain,
          taxRate: 12.5,
          baseTax,
          surchargeRate: surchargeRate * 100,
          surcharge,
          cess,
          totalTax,
          nearThreshold,
        };
      }
    }

    // ── DEBT MF ──────────────────────────────────────────────────────────────
    if (assetType === "debt") {
      const capitalGain = netSalePrice - pp;
      if (capitalGain <= 0) return { type: "loss", months, costOfAcquisition: pp, capitalGain, netSalePrice };
      const taxableGain = capitalGain;
      const baseTax = taxableGain * (slabRate / 100);
      const totalInc = otherInc + taxableGain;
      const surchargeRate = calcSurcharge(totalInc, false);
      const surcharge = baseTax * surchargeRate;
      const cess = (baseTax + surcharge) * 0.04;
      const totalTax = baseTax + surcharge + cess;
      return {
        type: "debt",
        months,
        costOfAcquisition: pp,
        netSalePrice,
        capitalGain,
        exemption: 0,
        taxableGain,
        taxRate: slabRate,
        baseTax,
        surchargeRate: surchargeRate * 100,
        surcharge,
        cess,
        totalTax,
      };
    }

    // ── PROPERTY ─────────────────────────────────────────────────────────────
    if (assetType === "property") {
      const isLTCG = months >= 24;

      if (!isLTCG) {
        // STCG on property → slab rate
        const capitalGain = netSalePrice - pp;
        if (capitalGain <= 0) return { type: "loss", months, costOfAcquisition: pp, capitalGain, netSalePrice };
        const baseTax = capitalGain * (slabRate / 100);
        const totalInc = otherInc + capitalGain;
        const surchargeRate = calcSurcharge(totalInc, false);
        const surcharge = baseTax * surchargeRate;
        const cess = (baseTax + surcharge) * 0.04;
        const totalTax = baseTax + surcharge + cess;
        return {
          type: "stcg-property",
          months,
          isLTCG: false,
          section: "Slab Rate",
          costOfAcquisition: pp,
          netSalePrice,
          capitalGain,
          exemption: 0,
          taxableGain: capitalGain,
          taxRate: slabRate,
          baseTax,
          surchargeRate: surchargeRate * 100,
          surcharge,
          cess,
          totalTax,
        };
      }

      // LTCG on property
      const saleInfo = saleCII(saleDate);
      const purchaseCII = CII[purchaseFY] || 100;
      const saleCIIVal = saleInfo.cii;
      const indexedCost = pp * (saleCIIVal / purchaseCII);

      if (isPropertyBeforeJul2024 && useIndexation) {
        // 20% with indexation
        const capitalGainIndexed = netSalePrice - indexedCost;
        const capitalGainWithout = netSalePrice - pp;

        if (capitalGainIndexed <= 0 && capitalGainWithout <= 0) {
          return { type: "loss", months, costOfAcquisition: pp, capitalGain: capitalGainIndexed, netSalePrice };
        }

        const gainToUse = capitalGainIndexed;
        const taxableGain = Math.max(0, gainToUse);
        const baseTax = taxableGain * 0.20;
        const totalInc = otherInc + taxableGain;
        const surchargeRate = calcSurcharge(totalInc, false);
        const surcharge = baseTax * surchargeRate;
        const cess = (baseTax + surcharge) * 0.04;
        const totalTax = baseTax + surcharge + cess;

        // Also compute without-indexation option for comparison
        const gainWithout = Math.max(0, capitalGainWithout);
        const taxWithout = gainWithout * 0.125;

        return {
          type: "ltcg-property-indexed",
          months,
          isLTCG: true,
          section: "Section 112 (with Indexation)",
          costOfAcquisition: pp,
          indexedCost,
          purchaseCII,
          saleCII: saleCIIVal,
          saleCIIFY: saleInfo.fy,
          saleCIIEstimated: saleInfo.estimated,
          netSalePrice,
          capitalGain: capitalGainIndexed,
          capitalGainWithout,
          exemption: 0,
          taxableGain,
          taxRate: 20,
          baseTax,
          surchargeRate: surchargeRate * 100,
          surcharge,
          cess,
          totalTax,
          altTax: taxWithout * 1.04, // rough comparison (no surcharge for simplicity)
        };
      } else {
        // 12.5% without indexation
        const capitalGain = netSalePrice - pp;
        if (capitalGain <= 0) return { type: "loss", months, costOfAcquisition: pp, capitalGain, netSalePrice };
        const baseTax = capitalGain * 0.125;
        const totalInc = otherInc + capitalGain;
        const surchargeRate = calcSurcharge(totalInc, false);
        const surcharge = baseTax * surchargeRate;
        const cess = (baseTax + surcharge) * 0.04;
        const totalTax = baseTax + surcharge + cess;
        return {
          type: "ltcg-property-no-index",
          months,
          isLTCG: true,
          section: "Section 112A-style (12.5%, No Indexation)",
          costOfAcquisition: pp,
          netSalePrice,
          capitalGain,
          exemption: 0,
          taxableGain: capitalGain,
          taxRate: 12.5,
          baseTax,
          surchargeRate: surchargeRate * 100,
          surcharge,
          cess,
          totalTax,
        };
      }
    }

    return null;
  }, [
    assetType, purchaseDate, saleDate, purchasePrice, salePrice,
    brokerage, purchaseFY, useIndexation, slabRate, otherIncome,
    isPropertyBeforeJul2024,
  ]);

  const months = purchaseDate && saleDate ? holdingMonths(purchaseDate, saleDate) : null;

  const label = (text: string) => (
    <label className="block text-xs font-semibold text-dark mb-1.5 uppercase tracking-wide">
      {text}
    </label>
  );

  const input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      {...props}
      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
    />
  );

  const select = (props: React.SelectHTMLAttributes<HTMLSelectElement>, children: React.ReactNode) => (
    <select
      {...props}
      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white"
    >
      {children}
    </select>
  );

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Back */}
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Tools
        </Link>

        {/* Header */}
        <div className="bg-primary rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div>
              <div className="text-gold text-xs font-bold uppercase tracking-wider mb-1">Income Tax · FY 2026-27</div>
              <h1 className="text-2xl font-bold text-white mb-1">Capital Gains Tax Calculator</h1>
              <p className="text-blue-200 text-sm">
                Calculate STCG &amp; LTCG tax on equity, mutual funds, and property under Income-tax Act, 2025.
              </p>
            </div>
          </div>
          {/* Act 2025 notice */}
          <div className="mt-4 flex items-start gap-2 bg-gold/20 border border-gold/30 rounded-lg px-4 py-2.5 text-gold text-xs font-medium">
            <Info size={14} className="flex-shrink-0 mt-0.5" />
            Updated for Income-tax Act, 2025 effective 1 April 2026 — new STCG rate 20%, LTCG 12.5%, ₹1.25L exemption.
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 items-start">

          {/* ── LEFT: Inputs ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5 space-y-4">

              {/* Asset Type */}
              <div>
                {label("Asset Type")}
                {select({ value: assetType, onChange: e => setAssetType(e.target.value) },
                  ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)
                )}
              </div>

              {/* Debt MF note */}
              {assetType === "debt" && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                  <AlertTriangle size={13} className="flex-shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    Debt MFs purchased <strong>before 1 Apr 2023</strong> have grandfathered LTCG treatment —&nbsp;
                    <strong>consult your CA</strong> for those. This tool applies to purchases on/after 1 Apr 2023.
                  </span>
                </div>
              )}

              {/* Dates */}
              <div>
                {label("Date of Purchase")}
                {input({ type: "date", value: purchaseDate, onChange: e => setPurchaseDate(e.target.value) })}
              </div>
              <div>
                {label("Date of Sale")}
                {input({ type: "date", value: saleDate, onChange: e => setSaleDate(e.target.value) })}
              </div>

              {/* Holding period indicator */}
              {months !== null && months > 0 && (
                <div className={`text-xs font-semibold px-3 py-2 rounded-lg ${
                  assetType === "equity"
                    ? months >= 12 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    : assetType === "property"
                    ? months >= 24 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    : "bg-gray-50 text-gray-600"
                }`}>
                  Holding period: {Math.floor(months / 12) > 0 ? `${Math.floor(months / 12)}y ` : ""}{months % 12}m &nbsp;·&nbsp;
                  {assetType === "equity"
                    ? months >= 12 ? "LTCG (≥12 months)" : "STCG (<12 months)"
                    : assetType === "property"
                    ? months >= 24 ? "LTCG (≥24 months)" : "STCG (<24 months)"
                    : "Taxed at slab rate"}
                </div>
              )}

              {/* Prices */}
              <div>
                {label("Purchase Price (₹)")}
                {input({ type: "number", placeholder: "e.g. 500000", value: purchasePrice, onChange: e => setPurchasePrice(e.target.value) })}
              </div>
              <div>
                {label("Sale Price (₹)")}
                {input({ type: "number", placeholder: "e.g. 800000", value: salePrice, onChange: e => setSalePrice(e.target.value) })}
              </div>
              <div>
                {label("Brokerage / Transfer Expenses (₹)")}
                {input({ type: "number", placeholder: "e.g. 2000", value: brokerage, onChange: e => setBrokerage(e.target.value) })}
              </div>

              {/* Property-specific */}
              {assetType === "property" && months !== null && months >= 24 && (
                <>
                  <div>
                    {label("Purchase Financial Year (for CII)")}
                    {select({ value: purchaseFY, onChange: e => setPurchaseFY(e.target.value) },
                      CII_FYS.map(fy => (
                        <option key={fy} value={fy}>FY {fy} (CII: {CII[fy]})</option>
                      ))
                    )}
                  </div>
                  {isPropertyBeforeJul2024 && (
                    <div className="border border-primary/20 rounded-lg p-3 bg-primary/5">
                      <div className="text-xs font-semibold text-dark mb-2">Indexation Option (pre-23 Jul 2024)</div>
                      <div className="flex gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="idx" checked={!useIndexation} onChange={() => setUseIndexation(false)} className="accent-primary" />
                          <span className="text-xs text-dark">12.5% (no indexation)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="idx" checked={useIndexation} onChange={() => setUseIndexation(true)} className="accent-primary" />
                          <span className="text-xs text-dark">20% (with CII indexation)</span>
                        </label>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Slab rate (for debt MF and STCG property) */}
              {(assetType === "debt" || (assetType === "property" && months !== null && months < 24)) && (
                <div>
                  {label("Your Applicable Income Tax Slab Rate")}
                  {select({ value: slabRate, onChange: e => setSlabRate(Number(e.target.value)) },
                    SLAB_RATES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)
                  )}
                </div>
              )}

              {/* Other income for surcharge */}
              <div>
                {label("Other Annual Income (₹) — optional, for surcharge")}
                {input({ type: "number", placeholder: "e.g. 1500000", value: otherIncome, onChange: e => setOtherIncome(e.target.value) })}
                <p className="text-[10px] text-muted mt-1">Used only to determine if surcharge applies (income &gt;₹50L). Leave blank to compute on capital gain only.</p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Results ── */}
          <div className="lg:col-span-3">
            {!result && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-card p-8 text-center text-muted">
                <TrendingUp size={40} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm">Fill in the details on the left to see your capital gains tax computation.</p>
              </div>
            )}

            {result && result.type === "loss" && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-blue-800 text-sm mb-1">Capital Loss</div>
                    <div className="text-blue-700 text-xs">
                      You have a capital loss of <strong>₹{fmtINR(Math.abs(result.capitalGain))}</strong>. This can be carried forward for 8 years to set off against future capital gains of the same type. Consult your CA for loss set-off planning.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result && result.type !== "loss" && (
              <div className="space-y-4">

                {/* Summary Card */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
                  <h2 className="font-bold text-dark text-base mb-4 pb-3 border-b border-gray-100">
                    Tax Computation — {result.type?.includes("equity") ? "Listed Equity / Equity MF" : result.type === "debt" ? "Debt MF / Bond" : "Property / Land"}</h2>

                  <div className="space-y-2 text-sm">
                    {/* Gain Type */}
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-muted">Gain Type</span>
                      <span className={`font-semibold px-2 py-0.5 rounded text-xs ${
                        result.type === "debt" ? "bg-amber-100 text-amber-800" :
                        result.isLTCG ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
                      }`}>
                        {result.type === "debt" ? "Slab Rate (No STCG/LTCG)" : result.isLTCG ? "LTCG" : "STCG"} · {result.section}
                      </span>
                    </div>

                    <div className="border-t border-gray-50 pt-2 mt-2 space-y-2">
                      {/* Cost */}
                      <div className="flex justify-between">
                        <span className="text-muted">
                          {result.indexedCost ? "Cost of Acquisition (original)" : "Cost of Acquisition"}
                        </span>
                        <span className="font-medium text-dark">₹{fmtINR(result.costOfAcquisition)}</span>
                      </div>

                      {/* Indexed cost */}
                      {result.indexedCost && (
                        <div className="flex justify-between">
                          <span className="text-muted">
                            Indexed Cost (CII {result.purchaseCII} → {result.saleCII}
                            {result.saleCIIEstimated ? "*" : ""})
                          </span>
                          <span className="font-medium text-dark">₹{fmtINR(result.indexedCost)}</span>
                        </div>
                      )}

                      {/* Net Sale Price */}
                      <div className="flex justify-between">
                        <span className="text-muted">Net Sale Price (after expenses)</span>
                        <span className="font-medium text-dark">₹{fmtINR(result.netSalePrice)}</span>
                      </div>

                      {/* Capital Gain */}
                      <div className="flex justify-between font-semibold border-t border-dashed border-gray-200 pt-2 mt-1">
                        <span className="text-dark">Capital Gain</span>
                        <span className="text-dark">₹{fmtINR(result.capitalGain)}</span>
                      </div>

                      {/* Exemption */}
                      {result.exemption > 0 && (
                        <div className="flex justify-between text-green-700">
                          <span>Less: Exemption (Sec 112A — ₹1,25,000)</span>
                          <span>- ₹{fmtINR(result.exemption)}</span>
                        </div>
                      )}

                      {/* Taxable gain */}
                      <div className="flex justify-between font-bold text-primary border-t border-gray-200 pt-2">
                        <span>Taxable Capital Gain</span>
                        <span>₹{fmtINR(result.taxableGain)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tax Breakdown */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
                  <h2 className="font-bold text-dark text-base mb-4 pb-3 border-b border-gray-100">Tax Breakup</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Tax @ {result.taxRate}% on ₹{fmtINR(result.taxableGain)}</span>
                      <span className="font-medium text-dark">₹{fmtINR(result.baseTax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">
                        Surcharge @ {result.surchargeRate.toFixed(0)}%
                        {result.type?.includes("equity") && result.surchargeRate > 0 ? " (capped at 15%)" : ""}
                        {result.surchargeRate === 0 ? " (N/A — total income ≤₹50L)" : ""}
                      </span>
                      <span className="font-medium text-dark">₹{fmtINR(result.surcharge)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Health & Education Cess @ 4%</span>
                      <span className="font-medium text-dark">₹{fmtINR(result.cess)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg text-primary border-t-2 border-primary/20 pt-3 mt-2">
                      <span>Total Tax Payable</span>
                      <span>₹{fmtINR(result.totalTax)}</span>
                    </div>
                    <div className="text-[10px] text-muted pt-1">
                      Effective rate: {result.taxableGain > 0 ? ((result.totalTax / result.capitalGain) * 100).toFixed(2) : "0.00"}% on capital gain
                    </div>
                  </div>
                </div>

                {/* Indexation comparison note */}
                {result.type === "ltcg-property-no-index" && isPropertyBeforeJul2024 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800">
                    <div className="font-semibold mb-1 flex items-center gap-1.5"><Info size={13} /> Indexation Option Available</div>
                    Since your property was purchased before 23 Jul 2024, you can also choose the <strong>20% with CII indexation</strong> option. Switch the toggle on the left to compare both and pick whichever gives lower tax.
                  </div>
                )}

                {/* CII estimated note */}
                {result.saleCIIEstimated && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                    <span className="font-semibold">* CII for FY {result.saleCIIFY}</span> is not yet officially notified. An estimated value of {result.saleCII} has been used. Recalculate once CBDT notifies the official figure.
                  </div>
                )}

                {/* Tax-loss harvesting recommendation */}
                {result.nearThreshold && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-green-800 text-sm mb-1">Tax-Loss Harvesting Opportunity</div>
                        <p className="text-green-700 text-xs leading-relaxed">
                          Your LTCG of ₹{fmtINR(result.capitalGain)} is near the ₹1,25,000 exemption threshold. Consider booking losses in other equity investments to bring net LTCG below ₹1.25L, potentially making the entire gain tax-free. Consult your CA before acting.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Debt MF note */}
                {result.type === "debt" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-amber-800 text-sm mb-1">Debt MF / Bond Taxation</div>
                        <p className="text-amber-700 text-xs leading-relaxed">
                          Debt mutual funds and bonds purchased on/after 1 April 2023 are fully taxed at your applicable income tax slab rate — no separate STCG/LTCG treatment applies. Debt MFs purchased <strong>before 1 Apr 2023</strong> retain grandfathered LTCG treatment. Please consult your CA for those.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <p className="text-[10px] text-muted text-center px-2">
                  Results are indicative under Income-tax Act, 2025 for FY 2026-27. Does not account for Section 54/54F/54EC exemptions on property reinvestment. Always consult a qualified tax professional for final computation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
