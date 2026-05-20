"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText, Calculator, BarChart3, FileSpreadsheet, Clock, RefreshCw,
  TrendingUp, Merge, Minimize2, FileOutput, Database, Table, ArrowRight,
  Landmark, ScrollText, LayoutDashboard, LayoutGrid,
} from "lucide-react";

const tools = [
  {
    icon: LayoutDashboard,
    label: "Personal Finance Dashboard",
    desc: "Track income, expenses, investments, EMIs, tax & goals. Free personal CFO tool built for Indian taxpayers. No login, 100% private.",
    href: "/tools/dashboard",
    badge: "New",
    badgeColor: "bg-purple-100 text-purple-800",
    category: "Finance",
  },
  {
    icon: FileText,
    label: "GST Invoice Generator",
    desc: "Generate professional GST-compliant PDF invoices with CGST/SGST/IGST auto-calculation.",
    href: "/tools/gst-invoice",
    badge: "Popular",
    badgeColor: "bg-amber-100 text-amber-800",
    category: "GST",
  },
  {
    icon: Calculator,
    label: "TDS Calculator",
    desc: "Calculate TDS rates for Sec 192–194N payments. Get section, rate, amount, and due dates.",
    href: "/tools/tds-calculator",
    badge: "",
    badgeColor: "",
    category: "TDS",
  },
  {
    icon: BarChart3,
    label: "ITR Tax Estimator",
    desc: "Estimate income tax under Old vs New regime with full slab comparison for FY 2025-26.",
    href: "/tools/itr-estimator",
    badge: "New",
    badgeColor: "bg-green-100 text-green-800",
    category: "Income Tax",
  },
  {
    icon: FileSpreadsheet,
    label: "GSTR-2A Reconciliation",
    desc: "Upload Purchase Register + GSTR-2A/2B to find matched, unmatched, and missing invoices.",
    href: "/tools/gstr2a-recon",
    badge: "",
    badgeColor: "",
    category: "GST",
  },
  {
    icon: Clock,
    label: "GST Late Fee Calculator",
    desc: "Calculate GST late fee (₹50/day) and 18% interest for delayed GSTR filings.",
    href: "/tools/gst-late-fee",
    badge: "",
    badgeColor: "",
    category: "GST",
  },
  {
    icon: RefreshCw,
    label: "26AS TDS Reconciliation",
    desc: "Match Form 26AS TDS data against your books to identify mismatches and missing entries.",
    href: "/tools/26as-recon",
    badge: "",
    badgeColor: "",
    category: "TDS",
  },
  {
    icon: TrendingUp,
    label: "Advance Tax Calculator",
    desc: "Compute advance tax installments with Sec 234C interest for missed payment deadlines.",
    href: "/tools/advance-tax",
    badge: "",
    badgeColor: "",
    category: "Income Tax",
  },
  {
    icon: ScrollText,
    label: "Notice Reply Generator",
    desc: "Generate professional reply drafts for Sec 143(1), 148A, 139(9), 245, 156 & 131 notices in 60 seconds.",
    href: "/tools/notice-reply",
    badge: "New",
    badgeColor: "bg-green-100 text-green-800",
    category: "Income Tax",
  },
  {
    icon: Landmark,
    label: "Capital Gains Tax Calculator",
    desc: "Calculate STCG & LTCG on equity, mutual funds, and property with indexation for FY 2026-27.",
    href: "/tools/capital-gains",
    badge: "New",
    badgeColor: "bg-green-100 text-green-800",
    category: "Income Tax",
  },
  {
    icon: Merge,
    label: "PDF Merge",
    desc: "Drag, drop, reorder, and merge multiple PDF files into one. No size limit worries.",
    href: "/tools/pdf-merge",
    badge: "",
    badgeColor: "",
    category: "PDF",
  },
  {
    icon: LayoutGrid,
    label: "PDF Arranger",
    desc: "Upload a PDF and visually rearrange pages. Drag to reorder, rotate, delete pages, then download.",
    href: "/tools/pdf-arranger",
    badge: "New",
    badgeColor: "bg-green-100 text-green-800",
    category: "PDF",
  },
  {
    icon: Minimize2,
    label: "PDF Compress",
    desc: "Compress PDF file size with quality control slider. See before/after size comparison.",
    href: "/tools/pdf-compress",
    badge: "",
    badgeColor: "",
    category: "PDF",
  },
  {
    icon: FileOutput,
    label: "Word to PDF",
    desc: "Convert .docx files to PDF instantly in your browser. No upload to servers.",
    href: "/tools/word-to-pdf",
    badge: "",
    badgeColor: "",
    category: "PDF",
  },
  {
    icon: Database,
    label: "PDF Bank Statement to Excel",
    desc: "Auto-extract & classify transactions from any Indian bank PDF. Supports SBI, PNB, HDFC, ICICI, Axis, Kotak, Canara & more. Color-coded Excel with category breakdown.",
    href: "/tools/bank-statement",
    badge: "New",
    badgeColor: "bg-green-100 text-green-800",
    category: "Finance",
  },
  {
    icon: Table,
    label: "Tally Ledger to Excel",
    desc: "Convert Tally Prime ledger exports (.xlsx/.xml/.csv) to structured Excel with forensic flags.",
    href: "/tools/tally-ledger",
    badge: "Advanced",
    badgeColor: "bg-indigo-100 text-indigo-800",
    category: "Finance",
  },
];

const CATEGORIES = ["All", "GST", "TDS", "Income Tax", "PDF", "Finance"];

/* Category → subtle accent color */
const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  GST:          { bg: "rgba(201,168,76,0.12)",  text: "#C9A84C" },
  TDS:          { bg: "rgba(83,74,183,0.12)",   text: "#7B74E0" },
  "Income Tax": { bg: "rgba(74,222,128,0.10)",  text: "#22C55E" },
  PDF:          { bg: "rgba(239,68,68,0.10)",   text: "#F87171" },
  Finance:      { bg: "rgba(59,130,246,0.10)",  text: "#60A5FA" },
};

export default function ToolsGrid() {
  const [active, setActive] = useState("All");

  const visible = active === "All" ? tools : tools.filter((t) => t.category === active);
  const catColor = CAT_COLORS[active] ?? { bg: "rgba(201,168,76,0.12)", text: "#C9A84C" };

  return (
    <>
      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`cat-tab${active === cat ? " active" : ""}`}
          >
            {cat}
            {cat !== "All" && (
              <span className="ml-1.5 text-[10px] opacity-70">
                ({tools.filter((t) => t.category === cat).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Count line */}
      <p className="text-center text-sm mb-8" style={{ color: "var(--ap-text-muted)" }}>
        Showing <strong style={{ color: "var(--ap-text)" }}>{visible.length}</strong> tool{visible.length !== 1 ? "s" : ""}
        {active !== "All" && <span> in <span style={{ color: catColor.text }}>{active}</span></span>}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {visible.map((tool) => {
          const cc = CAT_COLORS[tool.category] ?? catColor;
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className="bg-white border border-gray-100 rounded-[18px] shadow-[0_2px_12px_rgba(10,22,64,0.06)] hover:shadow-[0_8px_32px_rgba(10,22,64,0.12)] hover:border-[rgba(201,168,76,0.3)] hover:-translate-y-1 transition-all duration-250 p-5 flex flex-col group relative"
              style={{ background: "var(--ap-surface)", borderColor: "var(--ap-border)" }}
            >
              {tool.badge && (
                <span className={`absolute -top-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${tool.badgeColor}`}>
                  {tool.badge}
                </span>
              )}

              {/* Icon */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors duration-200"
                   style={{ background: cc.bg }}>
                <tool.icon size={20} style={{ color: cc.text }} />
              </div>

              {/* Category pill */}
              <div className="cat-pill mb-1"
                   style={{ background: cc.bg, color: cc.text }}>
                {tool.category}
              </div>

              <h3 className="font-semibold text-sm leading-tight mb-2" style={{ color: "var(--ap-text)" }}>
                {tool.label}
              </h3>
              <p className="text-xs leading-relaxed flex-1" style={{ color: "var(--ap-text-muted)" }}>
                {tool.desc}
              </p>

              <div className="mt-3 text-xs font-semibold flex items-center gap-1 transition-all duration-200 group-hover:gap-1.5"
                   style={{ color: cc.text }}>
                Open Tool <ArrowRight size={11} />
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
