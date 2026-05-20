import type { Metadata } from "next";
import { Shield } from "lucide-react";
import ToolsGrid from "./ToolsGrid";

export const metadata: Metadata = {
  title: "Free Tax & Finance Tools",
  description:
    "17 free professional-grade tax and finance tools for Indian businesses — GST Invoice Generator, TDS Calculator, ITR Estimator (FY 2026-27), GSTR-2A Reconciliation, Multi-Bank PDF to Excel & more. 100% browser-based, no data stored.",
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
    canonical: "https://cc-associates-website.vercel.app/tools",
  },
  openGraph: {
    title: "Free Tax & Finance Tools | CC Associates",
    description:
      "17 free browser-based tools: GST Invoice, TDS Calculator, ITR Estimator, PDF tools & more. No signup needed.",
    url: "https://cc-associates-website.vercel.app/tools",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Free Tax Tools - CC Associates" }],
  },
};

export default function ToolsPage() {
  return (
    <div className="pt-16">

      {/* Hero */}
      <section className="py-16 relative overflow-hidden"
               style={{ background: "linear-gradient(135deg, #03060F 0%, #080E1D 50%, #0C1527 100%)" }}>
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div style={{ position: "absolute", top: "20%",  left: "-5%",  width: "40vw", height: "40vw", maxWidth: 500, borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(83,74,183,0.18) 0%, transparent 70%)", filter: "blur(60px)" }} />
          <div style={{ position: "absolute", bottom: "5%", right: "-5%", width: "35vw", height: "35vw", maxWidth: 450, borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5"
                 style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.22)" }}>
              🛠 17 Professional Tools
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">
              Free Tax &amp; Finance Tools
            </h1>
            <p className="text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>
              Professional-grade tools built specifically for Indian tax compliance and finance workflows. Free forever.
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Banner */}
      <div style={{ background: "rgba(74,222,128,0.06)", borderBottom: "1px solid rgba(74,222,128,0.12)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center gap-2 text-sm font-medium" style={{ color: "#22C55E" }}>
            <Shield size={15} />
            <span>🔒 All tools run 100% in your browser. No data is sent to any server. Ever.</span>
          </div>
        </div>
      </div>

      {/* Tools Grid (client — has category filter) */}
      <section className="py-14" style={{ background: "var(--ap-bg)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ToolsGrid />
        </div>
      </section>

      {/* Bottom disclaimer */}
      <section className="py-10" style={{ background: "var(--ap-surface)" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs" style={{ color: "var(--ap-text-muted)" }}>
            <strong style={{ color: "var(--ap-text)" }}>Disclaimer:</strong> All tool results are indicative only. Always consult a qualified tax professional for final decisions. CC Associates is not liable for any decisions made based on tool outputs. © 2026 CC Associates, Pune.
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--ap-text-muted)" }}>
            Capital Gains tool does not account for Sec 54/54F/54EC reinvestment exemptions, STT paid grandfathering (pre-31 Jan 2018 equity), or partial sale scenarios. Updated for Income-tax Act, 2025.
          </p>
        </div>
      </section>

    </div>
  );
}
