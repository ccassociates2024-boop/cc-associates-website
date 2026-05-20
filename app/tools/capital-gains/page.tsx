"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp, ArrowLeft, AlertTriangle, Info, CheckCircle, AlertCircle,
  Plus, Trash2, Home, Building2, MapPin, Leaf,
} from "lucide-react";
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

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtINR(n: number) {
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}
function holdingMonths(from: string, to: string): number {
  if (!from || !to) return 0;
  const p = new Date(from), s = new Date(to);
  return (s.getFullYear() - p.getFullYear()) * 12 + (s.getMonth() - p.getMonth());
}
function dateToFY(d: string): string {
  if (!d) return "";
  const dt = new Date(d);
  const y = dt.getFullYear(), m = dt.getMonth() + 1;
  return m >= 4 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
}
function getSaleCII(saleDate: string): { fy: string; cii: number; estimated: boolean } {
  const fy = dateToFY(saleDate);
  return CII[fy] ? { fy, cii: CII[fy], estimated: false } : { fy, cii: 396, estimated: true };
}
function calcSurcharge(totalIncome: number, isEquity: boolean): number {
  if (totalIncome <= 5000000) return 0;
  let r = totalIncome <= 10000000 ? 0.10 : totalIncome <= 20000000 ? 0.15 : totalIncome <= 50000000 ? 0.25 : 0.37;
  if (isEquity && r > 0.15) r = 0.15;
  return r;
}

// ── Constants ────────────────────────────────────────────────────────────────
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

interface Improvement {
  id: number;
  description: string;
  fy: string;
  amount: string;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function CapitalGainsPage() {

  // ── Core state (equity/debt — unchanged) ─────────────────────────────────
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

  // ── Property state ────────────────────────────────────────────────────────
  const [propSubType, setPropSubType] = useState("residential");
  const [isUrbanAgri, setIsUrbanAgri] = useState(false);
  const [acqType, setAcqType] = useState("purchase");
  const [prevOwnerDate, setPrevOwnerDate] = useState("");
  const [prevOwnerFY, setPrevOwnerFY] = useState("2001-02");
  const [prevOwnerCost, setPrevOwnerCost] = useState("");
  const [fmv2001Val, setFmv2001Val] = useState("");
  const [purchaseExpenses, setPurchaseExpenses] = useState("");
  const [saleExpenses, setSaleExpenses] = useState("");
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [nextImpId, setNextImpId] = useState(1);
  const [exemptionType, setExemptionType] = useState("none");
  const [sec54Reinvestment, setSec54Reinvestment] = useState("");
  const [sec54ECAmount, setSec54ECAmount] = useState("");

  // ── Derived values ────────────────────────────────────────────────────────
  // Effective purchase date for property (considers acqType)
  const effectivePurchaseDate = useMemo(() => {
    if (assetType !== "property") return purchaseDate;
    if (acqType === "inherited" || acqType === "gift") return prevOwnerDate;
    if (acqType === "fmv2001") return "2001-04-01";
    return purchaseDate;
  }, [assetType, acqType, purchaseDate, prevOwnerDate]);

  const isPropertyBeforeJul2024 = useMemo(() => {
    if (assetType !== "property" || !effectivePurchaseDate) return false;
    return new Date(effectivePurchaseDate) < new Date("2024-07-23");
  }, [assetType, effectivePurchaseDate]);

  // Display holding months
  const displayMonths = useMemo(() => {
    const pd = assetType === "property" ? effectivePurchaseDate : purchaseDate;
    if (!pd || !saleDate) return null;
    const m = holdingMonths(pd, saleDate);
    return m > 0 ? m : null;
  }, [assetType, purchaseDate, effectivePurchaseDate, saleDate]);

  // Improvement helpers
  const addImprovement = () => {
    setImprovements(p => [...p, { id: nextImpId, description: "", fy: "2015-16", amount: "" }]);
    setNextImpId(n => n + 1);
  };
  const removeImprovement = (id: number) => setImprovements(p => p.filter(i => i.id !== id));
  const updateImprovement = (id: number, field: keyof Improvement, value: string) =>
    setImprovements(p => p.map(i => i.id === id ? { ...i, [field]: value } : i));

  // Shorthand flags for rendering
  const isProp = assetType === "property";
  const isRuralAgri = isProp && propSubType === "agricultural" && !isUrbanAgri;
  const showPropFields = isProp && !isRuralAgri;
  const isLTCGProp = showPropFields && (displayMonths ?? 0) >= 24;

  // ── Main computation ──────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = useMemo((): any => {
    const pp = parseFloat(purchasePrice) || 0;
    const sp = parseFloat(salePrice) || 0;
    const exp = parseFloat(brokerage) || 0;
    const otherInc = parseFloat(otherIncome) || 0;
    if (!sp || !saleDate) return null;

    // ── EQUITY ──────────────────────────────────────────────────────────────
    if (assetType === "equity") {
      if (!pp || !purchaseDate) return null;
      if (new Date(saleDate) <= new Date(purchaseDate)) return null;
      const m = holdingMonths(purchaseDate, saleDate);
      const netSP = sp - exp;
      const cg = netSP - pp;
      if (cg <= 0) return { type: "loss", months: m, costOfAcquisition: pp, capitalGain: cg, netSalePrice: netSP };
      if (m < 12) {
        const bt = cg * 0.20, sr = calcSurcharge(otherInc + cg, true);
        const sc = bt * sr, cs = (bt + sc) * 0.04;
        return {
          type: "stcg-equity", months: m, isLTCG: false, section: "Section 111A",
          costOfAcquisition: pp, netSalePrice: netSP, capitalGain: cg, exemption: 0,
          taxableGain: cg, taxRate: 20, baseTax: bt, surchargeRate: sr * 100,
          surcharge: sc, cess: cs, totalTax: bt + sc + cs,
        };
      } else {
        const ex = 125000, tg = Math.max(0, cg - ex), bt = tg * 0.125;
        const sr = calcSurcharge(otherInc + tg, true), sc = bt * sr, cs = (bt + sc) * 0.04;
        return {
          type: "ltcg-equity", months: m, isLTCG: true, section: "Section 112A",
          costOfAcquisition: pp, netSalePrice: netSP, capitalGain: cg, exemption: ex,
          taxableGain: tg, taxRate: 12.5, baseTax: bt, surchargeRate: sr * 100,
          surcharge: sc, cess: cs, totalTax: bt + sc + cs,
          nearThreshold: cg > 100000 && cg < 150000,
        };
      }
    }

    // ── DEBT MF ──────────────────────────────────────────────────────────────
    if (assetType === "debt") {
      if (!pp || !purchaseDate) return null;
      const m = holdingMonths(purchaseDate, saleDate);
      const netSP = sp - exp, cg = netSP - pp;
      if (cg <= 0) return { type: "loss", months: m, costOfAcquisition: pp, capitalGain: cg, netSalePrice: netSP };
      const bt = cg * (slabRate / 100), sr = calcSurcharge(otherInc + cg, false);
      const sc = bt * sr, cs = (bt + sc) * 0.04;
      return {
        type: "debt", months: m, costOfAcquisition: pp, netSalePrice: netSP, capitalGain: cg,
        exemption: 0, taxableGain: cg, taxRate: slabRate, baseTax: bt,
        surchargeRate: sr * 100, surcharge: sc, cess: cs, totalTax: bt + sc + cs,
      };
    }

    // ── PROPERTY ─────────────────────────────────────────────────────────────
    if (assetType === "property") {
      if (propSubType === "agricultural" && !isUrbanAgri) return { type: "agri-exempt" };

      const effDate =
        acqType === "inherited" || acqType === "gift" ? prevOwnerDate :
        acqType === "fmv2001" ? "2001-04-01" : purchaseDate;
      if (!effDate || !saleDate) return null;
      if (new Date(saleDate) <= new Date(effDate)) return null;

      const m = holdingMonths(effDate, saleDate);
      const isLTCG = m >= 24;

      const acqCIIFY =
        acqType === "inherited" || acqType === "gift" ? prevOwnerFY :
        acqType === "fmv2001" ? "2001-02" : purchaseFY;
      const acquisitionCII = CII[acqCIIFY] || 100;

      const purchExpAmt = parseFloat(purchaseExpenses) || 0;
      const saleExpAmt = parseFloat(saleExpenses) || 0;

      let baseAcqCost: number;
      if (acqType === "fmv2001") {
        baseAcqCost = parseFloat(fmv2001Val) || 0;
      } else if (acqType === "inherited" || acqType === "gift") {
        baseAcqCost = parseFloat(prevOwnerCost) || 0;
      } else {
        baseAcqCost = pp + purchExpAmt;
      }
      if (!baseAcqCost || !sp) return null;

      const netSP = sp - saleExpAmt;
      const saleInfo = getSaleCII(saleDate);
      const saleCIIVal = saleInfo.cii;

      // Improvements — each indexed independently
      const validImps = improvements.filter(i => parseFloat(i.amount) > 0);
      const impDetails = validImps.map(i => {
        const impCII = CII[i.fy] || 100;
        const amt = parseFloat(i.amount) || 0;
        return { id: i.id, description: i.description || "Improvement", fy: i.fy, amountNum: amt, impCII, indexed: amt * (saleCIIVal / impCII) };
      });
      const totalIdxImps = impDetails.reduce((s, i) => s + i.indexed, 0);
      const totalRawImps = impDetails.reduce((s, i) => s + i.amountNum, 0);

      // STCG — slab rate, no exemptions
      if (!isLTCG) {
        const costBasis = baseAcqCost + totalRawImps;
        const cg = netSP - costBasis;
        if (cg <= 0) return { type: "loss", months: m, costOfAcquisition: costBasis, capitalGain: cg, netSalePrice: netSP };
        const bt = cg * (slabRate / 100), sr = calcSurcharge(otherInc + cg, false);
        const sc = bt * sr, cs = (bt + sc) * 0.04;
        return {
          type: "stcg-property", months: m, isLTCG: false, propSubType,
          section: "Short Term — Slab Rate (Sec 112)",
          baseAcqCost, purchExpAmt, impDetails, totalRawImps, costBasis,
          saleExpAmt, netSalePrice: netSP, capitalGain: cg, taxableGain: cg,
          taxRate: slabRate, baseTax: bt, surchargeRate: sr * 100, surcharge: sc, cess: cs,
          totalTax: bt + sc + cs,
        };
      }

      // LTCG
      const idxAcqCost = baseAcqCost * (saleCIIVal / acquisitionCII);
      const totalIdxCost = idxAcqCost + totalIdxImps;
      const totalRawCost = baseAcqCost + totalRawImps;
      const isBeforeJul2024 = new Date(effDate) < new Date("2024-07-23");
      const cgIdx = netSP - totalIdxCost;
      const cgRaw = netSP - totalRawCost;
      const useIdx = isBeforeJul2024 && useIndexation;
      const rawGain = useIdx ? cgIdx : cgRaw;

      if (rawGain <= 0 && cgRaw <= 0 && cgIdx <= 0) {
        return { type: "loss", months: m, costOfAcquisition: totalRawCost, capitalGain: rawGain, netSalePrice: netSP };
      }

      const capitalGain = Math.max(0, rawGain);
      const taxRateUsed = useIdx ? 20 : 12.5;

      // Exemptions
      let exemption = 0;
      let exemptionBreakdown: any = null;
      const s54Rein = parseFloat(sec54Reinvestment) || 0;
      const s54EC = Math.min(parseFloat(sec54ECAmount) || 0, 5000000);

      if (exemptionType === "sec54" && propSubType === "residential") {
        exemption = Math.min(capitalGain, s54Rein);
        exemptionBreakdown = { type: "sec54", reinvestment: s54Rein, exempt: exemption };
      } else if (exemptionType === "sec54f" && propSubType !== "residential") {
        exemption = s54Rein >= netSP ? capitalGain : capitalGain * (s54Rein / netSP);
        exemptionBreakdown = { type: "sec54f", reinvestment: s54Rein, netSalePrice: netSP, exempt: exemption };
      } else if (exemptionType === "sec54ec") {
        exemption = Math.min(capitalGain, s54EC);
        exemptionBreakdown = { type: "sec54ec", bondAmount: s54EC, exempt: exemption };
      }

      const taxableGain = Math.max(0, capitalGain - exemption);
      const bt = taxableGain * (taxRateUsed / 100);
      const sr = calcSurcharge(otherInc + taxableGain, false);
      const sc = bt * sr, cs = (bt + sc) * 0.04;

      // Comparison (approx, ignores surcharge for simplicity)
      const taxIdxComp = Math.max(0, cgIdx - Math.min(exemption, Math.max(0, cgIdx))) * 0.20 * 1.04;
      const taxRawComp = Math.max(0, cgRaw - Math.min(exemption, Math.max(0, cgRaw))) * 0.125 * 1.04;

      return {
        type: useIdx ? "ltcg-property-indexed" : "ltcg-property-no-index",
        months: m, isLTCG: true, propSubType, acqType,
        section: useIdx ? "Section 112 — 20% with CII Indexation" : "Section 112 — 12.5% without Indexation",
        baseAcqCost, purchExpAmt, acqCIIFY, acquisitionCII, idxAcqCost,
        impDetails, totalIdxImps, totalRawImps, totalIdxCost, totalRawCost,
        saleCIIVal, saleCIIFY: saleInfo.fy, saleCIIEstimated: saleInfo.estimated,
        saleExpAmt, netSalePrice: netSP, capitalGain, cgIdx, cgRaw, isBeforeJul2024,
        taxRateUsed, exemption, exemptionBreakdown, taxableGain, taxRate: taxRateUsed,
        baseTax: bt, surchargeRate: sr * 100, surcharge: sc, cess: cs, totalTax: bt + sc + cs,
        taxIdxComp, taxRawComp,
      };
    }

    return null;
  }, [
    assetType, purchaseDate, saleDate, purchasePrice, salePrice, brokerage,
    purchaseFY, useIndexation, slabRate, otherIncome,
    propSubType, isUrbanAgri, acqType, prevOwnerDate, prevOwnerFY, prevOwnerCost,
    fmv2001Val, purchaseExpenses, saleExpenses, improvements,
    exemptionType, sec54Reinvestment, sec54ECAmount,
  ]);

  // ── Render helpers ────────────────────────────────────────────────────────
  const lbl = (text: string, hint?: string) => (
    <label className="block text-xs font-semibold text-dark mb-1.5 uppercase tracking-wide">
      {text}{hint && <span className="ml-1 text-muted normal-case font-normal">({hint})</span>}
    </label>
  );
  const inp = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
  );
  const sel = (props: React.SelectHTMLAttributes<HTMLSelectElement>, children: React.ReactNode) => (
    <select {...props} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white">{children}</select>
  );
  const propIcon = (v: string) => {
    if (v === "residential") return <Home size={14} />;
    if (v === "commercial") return <Building2 size={14} />;
    if (v === "land") return <MapPin size={14} />;
    return <Leaf size={14} />;
  };

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

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
                STCG &amp; LTCG on equity, mutual funds &amp; property — with indexed cost of improvement, inherited/gift property &amp; Sec 54 / 54F / 54EC exemptions.
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 bg-gold/20 border border-gold/30 rounded-lg px-4 py-2.5 text-gold text-xs font-medium">
            <Info size={14} className="flex-shrink-0 mt-0.5" />
            Updated for Income-tax Act, 2025 (effective 1 April 2026) — STCG equity 20%, LTCG 12.5%, ₹1.25L exemption; Property LTCG 12.5% or 20% with CII (pre-23 Jul 2024 option).
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 items-start">

          {/* ── LEFT: Inputs ───────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5 space-y-4">

              {/* Asset Type */}
              <div>
                {lbl("Asset Type")}
                {sel(
                  { value: assetType, onChange: e => { setAssetType(e.target.value); setExemptionType("none"); } },
                  ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)
                )}
              </div>

              {/* Debt note */}
              {assetType === "debt" && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                  <AlertTriangle size={13} className="flex-shrink-0 mt-0.5 text-amber-600" />
                  <span>Debt MFs purchased <strong>before 1 Apr 2023</strong> have grandfathered LTCG treatment — <strong>consult your CA</strong>. This tool covers purchases on/after 1 Apr 2023.</span>
                </div>
              )}

              {/* ─── PROPERTY SUB-TYPE ─────────────────────────────────── */}
              {isProp && (
                <div>
                  {lbl("Property Type")}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "residential", label: "Residential House" },
                      { value: "commercial", label: "Commercial Property" },
                      { value: "land", label: "Land / Plot (Non-Agri)" },
                      { value: "agricultural", label: "Agricultural Land" },
                    ].map(t => (
                      <button key={t.value} onClick={() => { setPropSubType(t.value); setExemptionType("none"); }}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition ${propSubType === t.value ? "border-primary bg-primary text-white" : "border-gray-200 text-dark hover:border-primary/40"}`}>
                        {propIcon(t.value)} {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Agricultural location */}
              {isProp && propSubType === "agricultural" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                  {lbl("Location of Agricultural Land")}
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input type="radio" name="agriloc" checked={!isUrbanAgri} onChange={() => setIsUrbanAgri(false)} className="accent-primary" />
                      Rural (outside 8 km from municipality / cantonment)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input type="radio" name="agriloc" checked={isUrbanAgri} onChange={() => setIsUrbanAgri(true)} className="accent-primary" />
                      Urban (within 8 km)
                    </label>
                  </div>
                  {!isUrbanAgri && (
                    <p className="text-xs text-green-800 font-medium">✓ Rural agricultural land is NOT a capital asset [Sec 2(14)(iii)] — sale is fully exempt.</p>
                  )}
                </div>
              )}

              {/* ─── ACQUISITION TYPE ──────────────────────────────────── */}
              {showPropFields && (
                <div>
                  {lbl("How was property acquired?")}
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { value: "purchase", label: "Purchased" },
                      { value: "inherited", label: "Inherited" },
                      { value: "gift", label: "Gift / Will" },
                      { value: "fmv2001", label: "Pre-2001 (FMV)" },
                    ].map(t => (
                      <button key={t.value} onClick={() => setAcqType(t.value)}
                        className={`px-2 py-2 rounded-lg border text-xs font-semibold transition ${acqType === t.value ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-dark hover:border-primary/40"}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                  {(acqType === "inherited" || acqType === "gift") && (
                    <p className="text-[10px] text-muted mt-1.5">Holding period &amp; indexed cost are computed from the <strong>previous owner&apos;s acquisition date</strong> — Sec 49(1) / Sec 55(2).</p>
                  )}
                  {acqType === "fmv2001" && (
                    <p className="text-[10px] text-muted mt-1.5">Property acquired before 1 Apr 2001 — FMV on 1 Apr 2001 is used as cost of acquisition (Sec 55(2)(b)). CII base year: 2001-02 (100).</p>
                  )}
                </div>
              )}

              {/* Previous owner details */}
              {showPropFields && (acqType === "inherited" || acqType === "gift") && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
                  <div className="text-xs font-bold text-blue-800">Previous Owner Details</div>
                  <div>
                    {lbl("Previous Owner's Acquisition Date")}
                    {inp({ type: "date", value: prevOwnerDate, onChange: e => setPrevOwnerDate(e.target.value) })}
                  </div>
                  <div>
                    {lbl("Previous Owner's Acquisition FY", "for CII")}
                    {sel({ value: prevOwnerFY, onChange: e => setPrevOwnerFY(e.target.value) },
                      CII_FYS.map(fy => <option key={fy} value={fy}>FY {fy} (CII: {CII[fy]})</option>)
                    )}
                  </div>
                  <div>
                    {lbl("Previous Owner's Cost of Acquisition (₹)")}
                    {inp({ type: "number", placeholder: "e.g. 800000", value: prevOwnerCost, onChange: e => setPrevOwnerCost(e.target.value) })}
                  </div>
                </div>
              )}

              {/* FMV 2001 */}
              {showPropFields && acqType === "fmv2001" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                  <div className="text-xs font-bold text-amber-800">Fair Market Value as on 1 April 2001</div>
                  {inp({ type: "number", placeholder: "FMV in ₹ (from registered valuer)", value: fmv2001Val, onChange: e => setFmv2001Val(e.target.value) })}
                  <p className="text-[10px] text-amber-700">Obtain from a CBDT registered valuer. Used as cost of acquisition — indexed from CII 2001-02 (100).</p>
                </div>
              )}

              {/* ─── DATES ─────────────────────────────────────────────── */}
              {/* Purchase date — equity, debt, and property-purchase only */}
              {(!isProp || acqType === "purchase") && (
                <div>
                  {lbl("Date of Purchase")}
                  {inp({ type: "date", value: purchaseDate, onChange: e => setPurchaseDate(e.target.value) })}
                </div>
              )}
              {/* Info for inherited/gift/fmv2001 */}
              {showPropFields && (acqType === "inherited" || acqType === "gift") && (
                <div className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
                  📅 Acquisition date = previous owner&apos;s date entered above.
                </div>
              )}
              {showPropFields && acqType === "fmv2001" && (
                <div className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                  📅 Acquisition date = 1 April 2001 (FMV base year).
                </div>
              )}
              <div>
                {lbl("Date of Sale")}
                {inp({ type: "date", value: saleDate, onChange: e => setSaleDate(e.target.value) })}
              </div>

              {/* Holding period badge */}
              {displayMonths !== null && displayMonths > 0 && (
                <div className={`text-xs font-semibold px-3 py-2 rounded-lg ${
                  assetType === "equity"
                    ? displayMonths >= 12 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    : isProp
                    ? displayMonths >= 24 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    : "bg-gray-50 text-gray-600"
                }`}>
                  Holding: {Math.floor(displayMonths / 12) > 0 ? `${Math.floor(displayMonths / 12)}y ` : ""}{displayMonths % 12}m &nbsp;·&nbsp;
                  {assetType === "equity"
                    ? displayMonths >= 12 ? "LTCG (≥12 months)" : "STCG (<12 months)"
                    : isProp
                    ? displayMonths >= 24 ? "LTCG (≥24 months)" : "STCG (<24 months)"
                    : "Slab rate (no STCG/LTCG)"}
                </div>
              )}

              {/* ─── PRICES ────────────────────────────────────────────── */}
              {/* Purchase price — equity/debt or property-purchase */}
              {(!isProp || acqType === "purchase") && (
                <div>
                  {lbl("Purchase Price (₹)", isProp ? "excluding stamp duty" : undefined)}
                  {inp({ type: "number", placeholder: "e.g. 500000", value: purchasePrice, onChange: e => setPurchasePrice(e.target.value) })}
                </div>
              )}

              {/* Purchase expenses — property purchase only */}
              {showPropFields && acqType === "purchase" && (
                <div>
                  {lbl("Purchase Expenses (₹)", "stamp duty + registration")}
                  {inp({ type: "number", placeholder: "e.g. 350000", value: purchaseExpenses, onChange: e => setPurchaseExpenses(e.target.value) })}
                  <p className="text-[10px] text-muted mt-1">Added to cost of acquisition — CII-indexed for LTCG.</p>
                </div>
              )}

              {/* Sale price — always */}
              <div>
                {lbl("Sale Price (₹)")}
                {inp({ type: "number", placeholder: "e.g. 800000", value: salePrice, onChange: e => setSalePrice(e.target.value) })}
              </div>

              {/* Transfer expenses — equity/debt */}
              {!isProp && (
                <div>
                  {lbl("Brokerage / Transfer Expenses (₹)")}
                  {inp({ type: "number", placeholder: "e.g. 2000", value: brokerage, onChange: e => setBrokerage(e.target.value) })}
                </div>
              )}

              {/* Sale expenses — property */}
              {showPropFields && (
                <div>
                  {lbl("Sale Expenses (₹)", "brokerage + agent commission")}
                  {inp({ type: "number", placeholder: "e.g. 100000", value: saleExpenses, onChange: e => setSaleExpenses(e.target.value) })}
                  <p className="text-[10px] text-muted mt-1">Deducted from sale price to arrive at net sale consideration.</p>
                </div>
              )}

              {/* ─── COST OF IMPROVEMENT ───────────────────────────────── */}
              {showPropFields && (
                <div className="border border-dashed border-gray-300 rounded-xl p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-dark uppercase tracking-wide">Cost of Improvement</div>
                      <div className="text-[10px] text-muted mt-0.5">Each entry indexed separately by CII of that FY</div>
                    </div>
                    <button onClick={addImprovement}
                      className="flex items-center gap-1 text-xs text-primary font-semibold hover:bg-primary/10 px-2 py-1.5 rounded-lg transition">
                      <Plus size={13} /> Add
                    </button>
                  </div>

                  {improvements.length === 0 && (
                    <p className="text-[11px] text-muted text-center py-1">No improvements. Click &quot;Add&quot; for renovation, additional construction, etc.</p>
                  )}

                  {improvements.map(imp => (
                    <div key={imp.id} className="bg-gray-50 rounded-lg p-2.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-dark uppercase">Entry #{imp.id}</span>
                        <button onClick={() => removeImprovement(imp.id)} className="text-red-400 hover:text-red-600 transition">
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <input type="text" placeholder="Description (e.g. Kitchen renovation)" value={imp.description}
                        onChange={e => updateImprovement(imp.id, "description", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[10px] text-muted mb-1">Financial Year</div>
                          <select value={imp.fy} onChange={e => updateImprovement(imp.id, "fy", e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white">
                            {CII_FYS.map(fy => <option key={fy} value={fy}>FY {fy} (CII {CII[fy]})</option>)}
                          </select>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted mb-1">Amount (₹)</div>
                          <input type="number" placeholder="e.g. 500000" value={imp.amount}
                            onChange={e => updateImprovement(imp.id, "amount", e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ─── CII / INDEXATION ──────────────────────────────────── */}
              {showPropFields && isLTCGProp && acqType === "purchase" && (
                <div>
                  {lbl("Purchase Financial Year", "for CII")}
                  {sel({ value: purchaseFY, onChange: e => setPurchaseFY(e.target.value) },
                    CII_FYS.map(fy => <option key={fy} value={fy}>FY {fy} (CII: {CII[fy]})</option>)
                  )}
                </div>
              )}
              {showPropFields && isLTCGProp && isPropertyBeforeJul2024 && (
                <div className="border border-primary/20 rounded-lg p-3 bg-primary/5">
                  <div className="text-xs font-semibold text-dark mb-2">Indexation Option <span className="text-primary font-bold">(pre-23 Jul 2024)</span></div>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="idx" checked={!useIndexation} onChange={() => setUseIndexation(false)} className="accent-primary" />
                      <span className="text-xs">12.5% <span className="text-muted">(no indexation)</span></span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="idx" checked={useIndexation} onChange={() => setUseIndexation(true)} className="accent-primary" />
                      <span className="text-xs">20% <span className="text-muted">(with CII indexation)</span></span>
                    </label>
                  </div>
                  <p className="text-[10px] text-muted mt-2">Results panel shows a comparison — pick the option with lower tax.</p>
                </div>
              )}

              {/* ─── SECTION 54 / 54F / 54EC ───────────────────────────── */}
              {showPropFields && isLTCGProp && (
                <div className="border border-green-200 bg-green-50/40 rounded-xl p-3 space-y-3">
                  <div className="text-xs font-bold text-dark uppercase tracking-wide">Reinvestment Exemption</div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="exem" checked={exemptionType === "none"} onChange={() => setExemptionType("none")} className="accent-primary" />
                    <span className="text-xs font-medium text-dark">No exemption claimed</span>
                  </label>

                  {propSubType === "residential" && (
                    <>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="radio" name="exem" checked={exemptionType === "sec54"} onChange={() => setExemptionType("sec54")} className="accent-primary mt-0.5" />
                        <div>
                          <div className="text-xs font-semibold text-dark">Section 54 <span className="text-green-700">(Residential → New Residential)</span></div>
                          <div className="text-[10px] text-muted">Exempt = min(LTCG, reinvestment)</div>
                        </div>
                      </label>
                      {exemptionType === "sec54" && (
                        <div className="ml-5 space-y-1.5">
                          {lbl("Amount Reinvested in New House (₹)")}
                          {inp({ type: "number", placeholder: "e.g. 5000000", value: sec54Reinvestment, onChange: e => setSec54Reinvestment(e.target.value) })}
                        </div>
                      )}
                    </>
                  )}

                  {propSubType !== "residential" && (
                    <>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="radio" name="exem" checked={exemptionType === "sec54f"} onChange={() => setExemptionType("sec54f")} className="accent-primary mt-0.5" />
                        <div>
                          <div className="text-xs font-semibold text-dark">Section 54F <span className="text-green-700">(Non-Residential → New Residential)</span></div>
                          <div className="text-[10px] text-muted">Exempt = LTCG × (Reinvestment ÷ Net Sale Consideration)</div>
                        </div>
                      </label>
                      {exemptionType === "sec54f" && (
                        <div className="ml-5 space-y-1.5">
                          {lbl("Amount Reinvested in New House (₹)")}
                          {inp({ type: "number", placeholder: "e.g. 5000000", value: sec54Reinvestment, onChange: e => setSec54Reinvestment(e.target.value) })}
                        </div>
                      )}
                    </>
                  )}

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="radio" name="exem" checked={exemptionType === "sec54ec"} onChange={() => setExemptionType("sec54ec")} className="accent-primary mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-dark">Section 54EC <span className="text-green-700">(NHAI / REC Bonds)</span></div>
                      <div className="text-[10px] text-muted">Within 6 months of sale — max ₹50 lakh</div>
                    </div>
                  </label>
                  {exemptionType === "sec54ec" && (
                    <div className="ml-5 space-y-1.5">
                      {lbl("Bond Investment Amount (₹)", "max ₹50L")}
                      {inp({ type: "number", placeholder: "e.g. 5000000", value: sec54ECAmount, onChange: e => setSec54ECAmount(e.target.value) })}
                    </div>
                  )}
                </div>
              )}

              {/* Slab rate */}
              {(assetType === "debt" || (showPropFields && (displayMonths ?? 0) < 24 && (displayMonths ?? 0) > 0)) && (
                <div>
                  {lbl("Your Income Tax Slab Rate")}
                  {sel({ value: slabRate, onChange: e => setSlabRate(Number(e.target.value)) },
                    SLAB_RATES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)
                  )}
                </div>
              )}

              {/* Other income */}
              <div>
                {lbl("Other Annual Income (₹)", "optional, for surcharge")}
                {inp({ type: "number", placeholder: "e.g. 1500000", value: otherIncome, onChange: e => setOtherIncome(e.target.value) })}
                <p className="text-[10px] text-muted mt-1">Surcharge applies only if total income &gt;₹50L. Leave blank to compute on capital gain alone.</p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Results ─────────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">

            {!result && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-card p-8 text-center text-muted">
                <TrendingUp size={40} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm">Fill in the details on the left to see your capital gains tax computation.</p>
              </div>
            )}

            {/* Rural agri exempt card */}
            {result?.type === "agri-exempt" && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
                <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                  <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-green-800 text-sm mb-1">Fully Exempt — Rural Agricultural Land</div>
                    <p className="text-green-700 text-xs leading-relaxed">
                      Rural agricultural land situated beyond 8 km from a municipality or cantonment is <strong>not a capital asset</strong> under Section 2(14)(iii) of the Income-tax Act, 2025. Any gain is <strong>completely exempt</strong> from capital gains tax — no reporting required under the capital gains schedule. Confirm rural classification through local revenue records.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Capital loss */}
            {result?.type === "loss" && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-blue-800 text-sm mb-1">Capital Loss</div>
                    <p className="text-blue-700 text-xs leading-relaxed">
                      You have a capital loss of <strong>₹{fmtINR(Math.abs(result.capitalGain))}</strong>. This can be carried forward for 8 assessment years to set off against future capital gains of the same type. File your ITR before the due date to preserve this carry-forward. Consult your CA for loss set-off planning.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Main results */}
            {result && result.type !== "loss" && result.type !== "agri-exempt" && (
              <>

                {/* Computation card */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
                  <h2 className="font-bold text-dark text-base mb-4 pb-3 border-b border-gray-100">
                    Tax Computation —&nbsp;
                    {result.type?.includes("equity") ? "Listed Equity / Equity MF"
                      : result.type === "debt" ? "Debt MF / Bond"
                      : "Property / Land"}
                  </h2>
                  <div className="space-y-2 text-sm">

                    {/* Type badge */}
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-muted">Gain Type</span>
                      <span className={`font-semibold px-2 py-0.5 rounded text-xs ${
                        result.type === "debt" ? "bg-amber-100 text-amber-800"
                          : result.isLTCG ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {result.type === "debt" ? "Slab Rate" : result.isLTCG ? "LTCG" : "STCG"} · {result.section}
                      </span>
                    </div>

                    <div className="border-t border-gray-50 pt-2 space-y-2">

                      {/* Property cost breakdown */}
                      {result.type?.includes("property") && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted">
                              {result.acqType === "fmv2001" ? "FMV as on 1 April 2001"
                                : result.acqType === "inherited" || result.acqType === "gift" ? "Previous Owner's Cost of Acquisition"
                                : "Purchase Price + Purchase Expenses"}
                            </span>
                            <span className="font-medium text-dark">₹{fmtINR(result.baseAcqCost)}</span>
                          </div>
                          {result.acqType === "purchase" && result.purchExpAmt > 0 && (
                            <div className="flex justify-between text-xs text-muted ml-3">
                              <span>↳ incl. Stamp Duty / Registration: ₹{fmtINR(result.purchExpAmt)}</span>
                            </div>
                          )}
                          {result.isLTCG && (
                            <div className="flex justify-between">
                              <span className="text-muted">Indexed Cost of Acquisition (CII {result.acquisitionCII} → {result.saleCIIVal}{result.saleCIIEstimated ? "*" : ""})</span>
                              <span className="font-medium text-dark">₹{fmtINR(result.idxAcqCost)}</span>
                            </div>
                          )}
                          {result.impDetails && result.impDetails.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-2.5 space-y-1.5 mt-1">
                              <div className="text-[10px] font-bold text-dark uppercase tracking-wide">Cost of Improvements</div>
                              {result.impDetails.map((imp: any) => (
                                <div key={imp.id} className="flex justify-between text-xs">
                                  <span className="text-muted truncate pr-2">{imp.description} <span className="text-[10px]">(FY {imp.fy}, CII {imp.impCII})</span></span>
                                  <div className="text-right flex-shrink-0">
                                    <div className="font-medium text-dark">₹{fmtINR(result.isLTCG ? imp.indexed : imp.amountNum)}</div>
                                    {result.isLTCG && <div className="text-[10px] text-muted">orig. ₹{fmtINR(imp.amountNum)}</div>}
                                  </div>
                                </div>
                              ))}
                              <div className="flex justify-between text-xs font-semibold border-t border-gray-200 pt-1">
                                <span>Total Improvements</span>
                                <span>₹{fmtINR(result.isLTCG ? result.totalIdxImps : result.totalRawImps)}</span>
                              </div>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold">
                            <span className="text-dark">Total Cost Basis {result.isLTCG ? "(Indexed)" : ""}</span>
                            <span className="text-dark">₹{fmtINR(result.isLTCG ? result.totalIdxCost : result.costBasis)}</span>
                          </div>
                          {result.saleExpAmt > 0 && (
                            <div className="flex justify-between text-muted">
                              <span>Less: Sale Expenses</span>
                              <span>– ₹{fmtINR(result.saleExpAmt)}</span>
                            </div>
                          )}
                        </>
                      )}

                      {/* Equity / Debt cost */}
                      {!result.type?.includes("property") && (
                        <div className="flex justify-between">
                          <span className="text-muted">Cost of Acquisition</span>
                          <span className="font-medium text-dark">₹{fmtINR(result.costOfAcquisition)}</span>
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

                      {/* Equity exemption */}
                      {(result.type === "ltcg-equity") && result.exemption > 0 && (
                        <div className="flex justify-between text-green-700">
                          <span>Less: Exemption (Sec 112A — ₹1,25,000)</span>
                          <span>– ₹{fmtINR(result.exemption)}</span>
                        </div>
                      )}

                      {/* Property exemption */}
                      {result.type?.includes("property") && result.exemption > 0 && (
                        <>
                          <div className="flex justify-between text-green-700 font-medium">
                            <span>Less: Exemption ({
                              result.exemptionBreakdown?.type === "sec54" ? "Section 54"
                                : result.exemptionBreakdown?.type === "sec54f" ? "Section 54F"
                                : "Section 54EC"
                            })</span>
                            <span>– ₹{fmtINR(result.exemption)}</span>
                          </div>
                          {result.exemptionBreakdown?.type === "sec54f" && (
                            <div className="text-[10px] text-muted ml-3">
                              = ₹{fmtINR(result.capitalGain)} × (₹{fmtINR(result.exemptionBreakdown.reinvestment)} ÷ ₹{fmtINR(result.exemptionBreakdown.netSalePrice)})
                              = {result.exemptionBreakdown.netSalePrice > 0 ? ((result.exemptionBreakdown.reinvestment / result.exemptionBreakdown.netSalePrice) * 100).toFixed(1) : "0.0"}% proportionate
                            </div>
                          )}
                        </>
                      )}

                      {/* Taxable Gain */}
                      <div className="flex justify-between font-bold text-primary border-t border-gray-200 pt-2">
                        <span>Taxable Capital Gain</span>
                        <span>₹{fmtINR(result.taxableGain)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Both-options comparison (pre-Jul 2024 LTCG property) */}
                {result.isBeforeJul2024 && result.isLTCG && result.type?.includes("property") && (
                  <div className="bg-white rounded-xl border border-primary/20 shadow-card p-6">
                    <h2 className="font-bold text-dark text-base mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
                      <Info size={16} className="text-primary" /> Both Options — pre-23 Jul 2024
                    </h2>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className={`rounded-lg border p-3 ${!useIndexation ? "border-primary bg-primary/5" : "border-gray-200"}`}>
                        <div className="text-[10px] font-bold uppercase text-muted mb-2">Option A · 12.5% (No Indexation)</div>
                        <div className="font-medium text-dark">Capital Gain: ₹{fmtINR(Math.max(0, result.cgRaw))}</div>
                        <div className="text-xs text-muted mt-1">Approx. Tax: ₹{fmtINR(result.taxRawComp)}</div>
                        {result.taxRawComp <= result.taxIdxComp && (
                          <div className="mt-2 text-[10px] font-bold text-green-700 flex items-center gap-1"><CheckCircle size={11} /> Lower Tax</div>
                        )}
                      </div>
                      <div className={`rounded-lg border p-3 ${useIndexation ? "border-primary bg-primary/5" : "border-gray-200"}`}>
                        <div className="text-[10px] font-bold uppercase text-muted mb-2">Option B · 20% (CII Indexation)</div>
                        <div className="font-medium text-dark">Capital Gain: ₹{fmtINR(Math.max(0, result.cgIdx))}</div>
                        <div className="text-xs text-muted mt-1">Approx. Tax: ₹{fmtINR(result.taxIdxComp)}</div>
                        {result.taxIdxComp < result.taxRawComp && (
                          <div className="mt-2 text-[10px] font-bold text-green-700 flex items-center gap-1"><CheckCircle size={11} /> Lower Tax</div>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted mt-3">Switch the indexation toggle on the left to use your preferred option. Comparison is approximate (excludes surcharge).</p>
                  </div>
                )}

                {/* Tax Breakup */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
                  <h2 className="font-bold text-dark text-base mb-4 pb-3 border-b border-gray-100">Tax Breakup</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Tax @ {result.taxRate}% on ₹{fmtINR(result.taxableGain)}</span>
                      <span className="font-medium text-dark">₹{fmtINR(result.baseTax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">
                        Surcharge @ {result.surchargeRate?.toFixed(0)}%
                        {result.type?.includes("equity") && result.surchargeRate > 0 ? " (capped at 15%)" : ""}
                        {result.surchargeRate === 0 ? " (N/A — income ≤₹50L)" : ""}
                      </span>
                      <span className="font-medium text-dark">₹{fmtINR(result.surcharge)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Health &amp; Education Cess @ 4%</span>
                      <span className="font-medium text-dark">₹{fmtINR(result.cess)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg text-primary border-t-2 border-primary/20 pt-3 mt-2">
                      <span>Total Tax Payable</span>
                      <span>₹{fmtINR(result.totalTax)}</span>
                    </div>
                    <div className="text-[10px] text-muted pt-1">
                      Effective rate: {result.capitalGain > 0 ? ((result.totalTax / result.capitalGain) * 100).toFixed(2) : "0.00"}% on capital gain
                    </div>
                  </div>
                </div>

                {/* Exemption compliance checklist */}
                {result.exemptionBreakdown && (
                  <div className="bg-white rounded-xl border border-green-200 shadow-card p-6">
                    <h2 className="font-bold text-dark text-base mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600" />
                      {result.exemptionBreakdown.type === "sec54" && "Section 54 — Compliance Checklist"}
                      {result.exemptionBreakdown.type === "sec54f" && "Section 54F — Compliance Checklist"}
                      {result.exemptionBreakdown.type === "sec54ec" && "Section 54EC — Compliance Checklist"}
                    </h2>

                    {result.exemptionBreakdown.type === "sec54" && (
                      <ul className="space-y-2">
                        {[
                          "Asset sold: Residential house property — long-term (held >24 months)",
                          "Reinvest LTCG in ONE new residential house property",
                          "Purchase window: 1 year BEFORE or 2 years AFTER date of sale",
                          "Construction window: Within 3 years of date of sale",
                          "New house must NOT be sold within 3 years of purchase/completion",
                          "LTCG ≤₹2 crore: exemption may be claimed for 2 houses (once in lifetime)",
                          "New residential house must be situated in India",
                          "Unutilised amount: Deposit in Capital Gains Account Scheme (CGAS) before ITR filing due date",
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <CheckCircle size={12} className="text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-dark">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {result.exemptionBreakdown.type === "sec54f" && (
                      <ul className="space-y-2">
                        {[
                          "Asset sold: Any LTCG asset OTHER than residential house property",
                          "Reinvest NET SALE CONSIDERATION (not just capital gain) in new residential house",
                          "Full reinvestment → full exemption; partial → proportionate exemption",
                          "Formula: Exempt = LTCG × (Reinvestment ÷ Net Sale Consideration)",
                          "Purchase window: 1 year BEFORE or 2 years AFTER date of sale",
                          "Construction window: Within 3 years from date of sale",
                          "On the date of sale, assessee must NOT own more than 1 residential house",
                          "New house must NOT be sold within 3 years of purchase/completion",
                          "New house must be situated in India",
                          "Unutilised amount: Deposit in CGAS before ITR filing due date",
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <CheckCircle size={12} className="text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-dark">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {result.exemptionBreakdown.type === "sec54ec" && (
                      <ul className="space-y-2">
                        {[
                          "Asset sold: Land or building (residential or commercial) — long-term",
                          "Invest in: NHAI bonds or REC bonds (specified bonds u/s 54EC)",
                          "Investment window: Within 6 months from date of transfer/sale",
                          "Maximum investment: ₹50 lakh in a financial year",
                          "Bonds are lock-in for 5 years — cannot be redeemed, pledged, or transferred",
                          "Early redemption / conversion voids the exemption — gain becomes taxable",
                          "Exempt amount = min(Capital Gain, Bond Amount, ₹50 lakh)",
                          "Can be combined with Section 54 or 54F on the same transaction",
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <CheckCircle size={12} className="text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-dark">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* CII estimated */}
                {result.saleCIIEstimated && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                    <span className="font-semibold">* CII for FY {result.saleCIIFY}</span> is not yet officially notified by CBDT. An estimated value of {result.saleCIIVal} has been used. Recalculate once the official CII is published.
                  </div>
                )}

                {/* No-index option available note */}
                {result.type === "ltcg-property-no-index" && result.isBeforeJul2024 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800">
                    <div className="font-semibold mb-1 flex items-center gap-1.5"><Info size={13} /> Indexation option available</div>
                    Property acquired before 23 Jul 2024 — you may also use the <strong>20% with CII indexation</strong> route. Switch the toggle on the left and compare both via the comparison card.
                  </div>
                )}

                {/* Tax-loss harvesting */}
                {result.nearThreshold && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-green-800 text-sm mb-1">Tax-Loss Harvesting Opportunity</div>
                        <p className="text-green-700 text-xs leading-relaxed">
                          Your LTCG of ₹{fmtINR(result.capitalGain)} is near the ₹1,25,000 exemption limit. Booking losses in other equity holdings to bring net LTCG below ₹1.25L could make the entire gain tax-free. Consult your CA before acting.
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
                          Debt mutual funds and bonds purchased on/after 1 April 2023 are fully taxed at your income tax slab rate — no separate STCG/LTCG treatment. Debt MFs bought <strong>before 1 Apr 2023</strong> retain grandfathered LTCG treatment. Consult your CA for those.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <p className="text-[10px] text-muted text-center px-2 leading-relaxed">
                  Results are indicative under Income-tax Act, 2025 for FY 2026-27. Section 54/54F/54EC eligibility depends on facts and circumstances — verify all conditions before filing. Always consult a qualified Chartered Accountant for final computation and ITR filing.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
