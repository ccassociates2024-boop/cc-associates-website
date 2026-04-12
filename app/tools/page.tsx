import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText, Calculator, BarChart3, FileSpreadsheet, Clock, RefreshCw,
  TrendingUp, Merge, Minimize2, FileOutput, Database, Table, Shield, ArrowRight, Landmark, ScrollText, LayoutDashboard
} from "lucide-react";

export const metadata: Metadata = {
  title: "Free Tax & Finance Tools",
  description:
    "12 free professional-grade tax and finance tools for Indian businesses — GST Invoice Generator, TDS Calculator, ITR Estimator (FY 2026-27), GSTR-2A Reconciliation, PDF Merge & more. 100% browser-based, no data stored.",
  keywords: [
    "free GST invoice generator",
    "TDS calculator india",
    "ITR estimator 2026-27",
    "GSTR-2A reconciliation tool",
    "advance tax calculator",
    "GST late fee calculator",
    "26AS reconciliation",
    "free tax tools india",
    "PDF merge online",
    "word to pdf converter",
  ],
  alternates: {
    canonical: "https://associatepiyush.in/tools",
  },
  openGraph: {
    title: "Free Tax & Finance Tools | Associate Piyush",
    description:
      "12 free browser-based tools: GST Invoice, TDS Calculator, ITR Estimator, PDF tools & more. No signup needed.",
    url: "https://associatepiyush.in/tools",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Free Tax Tools - Associate Piyush" }],
  },
};

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
    badgeColor: "bg-gold text-dark",
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
    label: "Bank Statement to Excel",
    desc: "Extract transactions from PDF bank statements to structured Excel with debit/credit columns.",
    href: "/tools/bank-statement",
    badge: "Advanced",
    badgeColor: "bg-primary/10 text-primary",
    category: "Finance",
  },
  {
    icon: Table,
    label: "Tally Ledger to Excel",
    desc: "Convert Tally Prime ledger exports (.xlsx/.xml/.csv) to structured Excel with forensic flags.",
    href: "/tools/tally-ledger",
    badge: "Advanced",
    badgeColor: "bg-primary/10 text-primary",
    category: "Finance",
  },
];

const categories = ["All", "GST", "TDS", "Income Tax", "PDF", "Finance"];

export default function ToolsPage() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="bg-primary py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold text-white mb-4">Free Tax & Finance Tools</h1>
            <p className="text-blue-200 text-lg leading-relaxed">
              15 professional-grade tools built specifically for Indian tax compliance and finance workflows. Free forever.
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Banner */}
      <div className="bg-green-50 border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center gap-2 text-green-800 text-sm font-medium">
            <Shield size={16} className="text-green-600" />
            <span>🔒 All tools run 100% in your browser. No data is sent to any server. Ever.</span>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <section className="bg-background py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="bg-white border border-gray-100 rounded-card shadow-card hover:shadow-card-hover hover:border-primary/30 transition-all duration-200 p-5 flex flex-col group relative"
              >
                {tool.badge && (
                  <span className={`absolute -top-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${tool.badgeColor}`}>
                    {tool.badge}
                  </span>
                )}
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <tool.icon size={20} className="text-primary" />
                </div>
                <div className="text-[10px] font-semibold text-gold uppercase tracking-wide mb-1">{tool.category}</div>
                <h3 className="font-semibold text-dark text-sm leading-tight mb-2">{tool.label}</h3>
                <p className="text-muted text-xs leading-relaxed flex-1">{tool.desc}</p>
                <div className="mt-3 text-primary text-xs font-medium flex items-center gap-1 group-hover:gap-1.5 transition-all">
                  Open Tool <ArrowRight size={12} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom note */}
      <section className="bg-white py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-muted">
            <strong className="text-dark">Disclaimer:</strong> All tool results are indicative only. Always consult a qualified tax professional for final decisions. Associate Piyush is not liable for any decisions made based on tool outputs. © 2026 Associate Piyush, Pune.
          </p>
          <p className="text-xs text-muted mt-2">
            Capital Gains tool does not account for Sec 54/54F/54EC reinvestment exemptions, STT paid grandfathering (pre-31 Jan 2018 equity), or partial sale scenarios. Updated for Income-tax Act, 2025.
          </p>
        </div>
      </section>
    </div>
  );
}
