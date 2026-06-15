import type { Metadata } from "next";
import Link from "next/link";
import {
  FileSpreadsheet, Search, Calculator, ClipboardCheck, BarChart3, Briefcase,
  ArrowRight, CheckCircle, Shield, MapPin, FileText, RefreshCw, Clock,
  TrendingUp, Merge, Home, Database, ChevronRight, Phone, Mail,
  Lightbulb,
} from "lucide-react";
import Team from "@/components/Team";

export const metadata: Metadata = {
  title: { absolute: "CC Associates | Tax Advisory, GST, Audit & Litigation | Pune, India" },
  description: "CC Associates — 3000+ income tax returns, GST compliance, TDS, statutory audit, litigation & business advisory in Pune. C.A. Sourabh Bhimrao Chavan & C.A. Shruti Sourabh Chavan. Pan India.",
  alternates: { canonical: "https://cc-associates-website.vercel.app" },
};

const services = [
  { icon: Calculator,      title: "Income Tax Advisory",    desc: "ITR filing, tax planning, regime optimisation, LTCG on property, scrutiny & notice handling for individuals and businesses.",   href: "/services#income-tax"             },
  { icon: RefreshCw,       title: "GST",                    desc: "End-to-end GST compliance (GSTR-1, 3B, 9), ITC claim management, and refund for SEZ suppliers & exporters.",                   href: "/services#gst"                    },
  { icon: ClipboardCheck,  title: "TDS Compliance",         desc: "Section 192–194T TDS computation, return filing, 26AS reconciliation, and default rectification.",                             href: "/services#tds"                    },
  { icon: BarChart3,       title: "Audit & Assurance",      desc: "CA-certified statutory, tax, and internal audits with actionable findings and management letter.",                              href: "/services#audit"                  },
  { icon: TrendingUp,      title: "Virtual CFO Service",    desc: "Senior financial leadership for your business — MIS, budgeting, cash flow, compliance calendar, and investor readiness.",      href: "/services#virtual-cfo"            },
  { icon: Briefcase,       title: "Business Advisory",      desc: "Business structuring, cost optimisation, financial planning, and growth strategy for SMEs and startups.",                       href: "/services#business"               },
  { icon: Lightbulb,       title: "Financial Consultation", desc: "Personalised financial guidance — tax-efficient planning, debt management, profitability analysis, and custom roadmaps.",       href: "/services#financial-consultation" },
  { icon: FileSpreadsheet, title: "Outsourced Accounting",  desc: "Full-cycle bookkeeping, bank reconciliation, GST-ready books, payroll, and monthly financial statements.",                     href: "/services#outsourced-accounting"  },
  { icon: Search,          title: "Forensic Accounting",    desc: "Financial fraud detection, transaction trail analysis, and investigative accounting for legal proceedings.",                    href: "/services#forensic"               },
];

const tools = [
  { icon: FileText,        label: "GST Invoice Generator",  href: "/tools/gst-invoice",   badge: "Popular" },
  { icon: Calculator,      label: "TDS Calculator",         href: "/tools/tds-calculator", badge: ""        },
  { icon: BarChart3,       label: "Income Tax Estimator",   href: "/tools/itr-estimator",  badge: "New"     },
  { icon: FileSpreadsheet, label: "GSTR-2A Reconciliation", href: "/tools/gstr2a-recon",   badge: ""        },
  { icon: Clock,           label: "GST Late Fee Calc",      href: "/tools/gst-late-fee",   badge: ""        },
  { icon: RefreshCw,       label: "26AS TDS Recon",         href: "/tools/26as-recon",     badge: ""        },
  { icon: TrendingUp,      label: "Advance Tax Calc",       href: "/tools/advance-tax",    badge: ""        },
  { icon: Database,        label: "Bank Statement → Excel", href: "/tools/bank-statement", badge: ""        },
  { icon: Merge,           label: "PDF Merge",              href: "/tools/pdf-merge",      badge: ""        },
  { icon: Home,            label: "LTCG Property Calc",     href: "/tools/ltcg-property",  badge: "New"     },
];

const stats = [
  { value: "3000", suffix: "+", label: "Income Tax Returns Filed" },
  { value: "250",  suffix: "+", label: "GST Clients Served"       },
  { value: "100",  suffix: "+", label: "Audit Clients"            },
];

export default function HomePage() {
  return (
    <div className="pt-[60px]">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ background: "var(--ap-surface)" }}
               className="border-b ap-divider py-14 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Location pill */}
          <div data-reveal
               className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full mb-8"
               style={{ background: "var(--ap-gold-bg)", color: "var(--ap-gold)", border: "1px solid rgba(184,150,12,0.2)" }}>
            <MapPin size={11} />
            Pune, Maharashtra — Pan India Services
          </div>

          {/* Headline */}
          <h1 data-reveal data-delay="100"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-5 text-balance"
              style={{ color: "var(--ap-text)" }}>
            Tax &amp; Finance Advisory<br />
            for <span className="text-gold-gradient">Individuals, SMEs &amp; Startups</span>
          </h1>

          <p data-reveal data-delay="200"
             className="text-base sm:text-lg leading-relaxed mb-10 max-w-2xl"
             style={{ color: "var(--ap-text-muted)" }}>
            C.A. Sourabh Chavan &amp; C.A. Shruti Chavan — your complete tax and finance team. GST compliance, income tax returns, audits, TDS, Virtual CFO, and financial advisory. Serving clients across India from Pune. Since 2022.
          </p>

          {/* CTAs */}
          <div data-reveal data-delay="300" className="flex flex-wrap gap-3 mb-12">
            <Link href="/contact" className="btn-gold gap-2 px-6 py-3 text-sm">
              Book a Free Consultation <ArrowRight size={15} />
            </Link>
            <Link href="/tools" className="btn-outline gap-2 px-6 py-3 text-sm">
              <Shield size={14} /> Explore Free Tools
            </Link>
          </div>

          {/* Trust row */}
          <div data-reveal data-delay="400"
               className="flex flex-wrap gap-6 pt-8"
               style={{ borderTop: "1px solid var(--ap-border)" }}>
            {[
              { icon: CheckCircle, text: "100% Confidential" },
              { icon: CheckCircle, text: "First Consultation Free" },
              { icon: CheckCircle, text: "Response within 2–3 Working Days" },
              { icon: CheckCircle, text: "CA-Certified Practice" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-sm" style={{ color: "var(--ap-text-muted)" }}>
                <Icon size={14} style={{ color: "var(--ap-green)" }} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section style={{ background: "var(--ap-surface-2)" }} className="ap-divider border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-3">
            {stats.map((s, i) => (
              <div key={s.label} data-reveal data-delay={String(i * 100)}
                   className="text-center py-2"
                   style={i > 0 ? { borderLeft: "1px solid var(--ap-border)", paddingLeft: "2rem" } : { paddingRight: "2rem" }}>
                <div className="text-3xl sm:text-4xl font-bold mb-1"
                     style={{ color: "var(--ap-text)" }}>
                  <span data-counter={s.value} data-counter-suffix={s.suffix}>
                    {s.value}{s.suffix}
                  </span>
                </div>
                <div className="text-sm" style={{ color: "var(--ap-text-muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────────────────── */}
      <section style={{ background: "var(--ap-surface)" }} className="py-20 border-b ap-divider">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          <div data-reveal className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2"
               style={{ color: "var(--ap-gold)" }}>Services</p>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--ap-text)" }}>
              Our Services
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s, i) => (
              <Link key={s.title} href={s.href}
                    data-reveal data-delay={String((i % 3) * 100)}
                    className="ap-card p-6 group block">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                     style={{ background: "var(--ap-gold-bg)" }}>
                  <s.icon size={18} style={{ color: "var(--ap-gold)" }} />
                </div>
                <h3 className="font-semibold text-sm mb-2" style={{ color: "var(--ap-text)" }}>
                  {s.title}
                </h3>
                <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--ap-text-muted)" }}>
                  {s.desc}
                </p>
                <div className="inline-flex items-center gap-1 text-xs font-semibold transition-all group-hover:gap-1.5"
                     style={{ color: "var(--ap-gold)" }}>
                  Learn more <ChevronRight size={12} />
                </div>
              </Link>
            ))}
          </div>

          <div data-reveal className="mt-10">
            <Link href="/services" className="btn-outline gap-1.5 text-sm">
              All Services <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FREE TOOLS ───────────────────────────────────────────────────── */}
      <section style={{ background: "var(--ap-surface-2)" }} className="py-20 border-b ap-divider">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          <div data-reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                 style={{ color: "var(--ap-gold)" }}>Free Tools</p>
              <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--ap-text)" }}>
                15+ Tools, No Login Required
              </h2>
              <p className="text-sm mt-2" style={{ color: "var(--ap-text-muted)" }}>
                Runs entirely in your browser. Your data never leaves your device.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0"
                 style={{ background: "rgba(22,163,74,0.08)", color: "#16A34A", border: "1px solid rgba(22,163,74,0.15)" }}>
              <Shield size={11} /> 100% Private
            </div>
          </div>

          {/* Tool list */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
            {tools.map((t) => (
              <Link key={t.href} href={t.href}
                    className="dock-item ap-card p-4 flex flex-col items-start gap-2.5 group relative">
                {t.badge && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: "var(--ap-gold-bg)", color: "var(--ap-gold)" }}>
                    {t.badge}
                  </span>
                )}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: "var(--ap-surface-2)" }}>
                  <t.icon size={16} style={{ color: "var(--ap-gold)" }} />
                </div>
                <span className="text-[11px] font-medium leading-tight" style={{ color: "var(--ap-text-2)" }}>
                  {t.label}
                </span>
              </Link>
            ))}
          </div>

          <div data-reveal>
            <Link href="/tools" className="btn-outline gap-1.5 text-sm">
              View All 15+ Tools <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TAX REGIME PROMO STRIP ────────────────────────────────────────── */}
      <section className="py-5 border-b ap-divider" style={{ background: "var(--ap-gold-bg)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm font-medium text-center sm:text-left" style={{ color: "var(--ap-text)" }}>
            🧮 <strong>Not sure which tax regime saves you more?</strong> — Old Regime with 80C/HRA vs New Regime zero-tax up to ₹12L.
          </p>
          <Link href="/tools/itr-estimator"
                className="btn-gold shrink-0 gap-1.5 text-sm whitespace-nowrap">
            Free ITR Estimator <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── HOW WE WORK ──────────────────────────────────────────────────── */}
      <section style={{ background: "var(--ap-surface)" }} className="py-20 border-b ap-divider">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          <div data-reveal className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2"
               style={{ color: "var(--ap-gold)" }}>How We Work</p>
            <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--ap-text)" }}>
              Simple Steps. Expert Results.
            </h2>
            <p className="text-sm mt-2 max-w-lg" style={{ color: "var(--ap-text-muted)" }}>
              From your first message to final filing — a clear, confidential process every time.
            </p>
          </div>

          {/* 4-step process */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
            {[
              { step: "01", title: "Reach Out",       body: "WhatsApp, email, or the contact form — whichever is easiest. We reply within 2–3 working days." },
              { step: "02", title: "Share Your Case", body: "Send your documents or describe your situation. Everything is handled with complete confidentiality." },
              { step: "03", title: "Expert Review",   body: "CA-reviewed analysis specific to your numbers — tax-saving options, risks, and the best path forward." },
              { step: "04", title: "Execute & File",  body: "Accurate, on-time filing. We keep you in the loop at every step until the job is fully done." },
            ].map(({ step, title, body }) => (
              <div key={step} data-reveal className="ap-card p-6 relative overflow-hidden">
                <span className="absolute top-3 right-4 text-4xl font-black select-none"
                      style={{ color: "var(--ap-gold-bg)", lineHeight: 1 }}>
                  {step}
                </span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-4 text-sm font-bold"
                     style={{ background: "var(--ap-gold-bg)", color: "var(--ap-gold)" }}>
                  {step}
                </div>
                <h3 className="font-semibold text-sm mb-2" style={{ color: "var(--ap-text)" }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--ap-text-muted)" }}>{body}</p>
              </div>
            ))}
          </div>

          {/* Team divider */}
          <div data-reveal className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2"
               style={{ color: "var(--ap-gold)" }}>Meet the Experts</p>
            <h3 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--ap-text)" }}>
              Handled by Qualified Professionals
            </h3>
            <p className="text-sm mt-2 max-w-lg" style={{ color: "var(--ap-text-muted)" }}>
              Every case is personally reviewed and managed — not outsourced, not automated.
            </p>
          </div>
          <Team />

        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section style={{ background: "#0A1628", color: "#FFFFFF" }} className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div data-reveal>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4"
               style={{ color: "rgba(255,255,255,0.45)" }}>
              First Consultation Free
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Stop overpaying taxes.<br className="hidden sm:block" /> Let&apos;s fix that.
            </h2>
            <p className="text-base mb-10" style={{ color: "rgba(255,255,255,0.55)" }}>
              Whether it&apos;s a notice, GST refund, LTCG on property, or just filing your ITR — we respond within 2–3 working days and your first consultation is free.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              <Link href="/contact" className="btn-gold gap-2 px-7 py-3 text-sm">
                Get in Touch <ArrowRight size={15} />
              </Link>
              <a href="https://wa.me/918421465966?text=Hello%20CC%20Associates%2C%20I%20need%20tax%20and%20advisory%20consultation."
                 target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold rounded-lg transition-all"
                 style={{ background: "rgba(255,255,255,0.10)", color: "white", border: "1.5px solid rgba(255,255,255,0.20)" }}>
                💬 WhatsApp
              </a>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm"
                 style={{ color: "rgba(255,255,255,0.40)" }}>
              <a href="tel:+918421465966" className="flex items-center gap-1.5 hover:text-white transition-colors">
                <Phone size={13} /> +91 84214 65966
              </a>
              <span className="hidden sm:inline">·</span>
              <a href="mailto:ccassociates2024@gmail.com"
                 className="flex items-center gap-1.5 hover:text-white transition-colors">
                <Mail size={13} /> ccassociates2024@gmail.com
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
