import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, RefreshCw, Search, Calculator, ClipboardCheck,
  BarChart3, Briefcase, Shield, FileText,
} from "lucide-react";
import Team from "@/components/Team";
import Testimonials from "@/components/Testimonials";

export const metadata: Metadata = {
  title: {
    absolute: "CC Associates | Tax Advisory, GST, Audit & Litigation | Pune, India",
  },
  description:
    "CC Associates — 950+ income tax cases, GST compliance, TDS, statutory audit, litigation & business advisory in Pune. Piyush Nimse & CA Sourabh Chavan. Pan India.",
  keywords: [
    "CC Associates pune",
    "tax consultant pune",
    "CA Sourabh Chavan pune",
    "GST consultant pune",
    "income tax consultant pune",
    "statutory audit pune",
    "litigation support pune",
    "forensic accounting pune",
    "Piyush Nimse",
  ],
  alternates: { canonical: "https://associate-piyush-bduu.vercel.app" },
  openGraph: {
    title: "CC Associates | Tax Advisory, GST, Audit & Litigation | Pune",
    description:
      "950+ income tax cases. Expert GST, TDS, Audit & Litigation services. CA Sourabh Chavan & Piyush Nimse. Pune. Pan India.",
    url: "https://associate-piyush-bduu.vercel.app",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "CC Associates - Tax & Advisory Practice Pune" }],
  },
};

const services = [
  {
    icon: RefreshCw,
    title: "GST Reconciliation",
    desc: "Accurate GSTR-2A/2B matching, ITC eligibility analysis, and discrepancy resolution.",
    href: "/services#gst",
    price: "₹1,499 / month",
  },
  {
    icon: Search,
    title: "Forensic Accounting",
    desc: "Financial fraud detection, transaction trail analysis, and investigative accounting.",
    href: "/services#forensic",
    price: "On request",
  },
  {
    icon: Calculator,
    title: "Income Tax Advisory",
    desc: "ITR filing, tax planning, scrutiny handling, and regime optimisation.",
    href: "/services#income-tax",
    price: "₹2,000 onwards",
  },
  {
    icon: ClipboardCheck,
    title: "TDS Compliance",
    desc: "Deduction calculation, challan payment, return filing, and 26AS reconciliation.",
    href: "/services#tds",
    price: "₹1,999 / quarter",
  },
  {
    icon: BarChart3,
    title: "Audit & Assurance",
    desc: "Statutory and internal audits under the Companies Act 2013.",
    href: "/services#audit",
    price: "₹20,000 onwards",
  },
  {
    icon: Briefcase,
    title: "Business Advisory",
    desc: "Strategic advisory on business structuring, compliance, and growth planning.",
    href: "/services#business",
    price: "₹1,999 / hr",
  },
];

const stats = [
  { value: "950+", label: "Income Tax Cases" },
  { value: "28+", label: "Audit Clients" },
  { value: "150+", label: "GST Clients" },
  { value: "Since 2025", label: "In Practice" },
];

const trustBadges = [
  "950+ Tax cases",
  "28+ Audit clients",
  "150+ GST clients",
  "Confidential",
];

const WA_URL =
  "https://wa.me/917507354141?text=Hello%20CC%20Associates%2C%20I%20need%20tax%20and%20advisory%20consultation.";

export default function HomePage() {
  return (
    <div className="pt-16">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="py-20"
        style={{ background: "linear-gradient(135deg, #F5F3FF 0%, #EEEDFE 50%, #F5F3FF 100%)" }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left column */}
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs text-purple-600
                               bg-purple-50 border border-purple-100 rounded-full px-3 py-1 mb-5">
                📍 Pune, Maharashtra — Pan India Services
              </span>

              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#26215C] mb-4 leading-tight">
                Precision in Every Number.<br />
                <span className="text-purple-600">Compliance</span> in Every Step.
              </h1>

              <div className="w-12 h-0.5 bg-gold-500 mb-5" />

              <p className="text-[#7F77DD] text-base leading-relaxed mb-1">
                Expert Tax Advisory · GST · TDS · Audit · Litigation · Business Advisory
              </p>
              <p className="text-sm text-[#7F77DD] mb-7">
                Serving clients across India. Response within 2 business days.
              </p>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-2 mb-8">
                {trustBadges.map((b) => (
                  <span
                    key={b}
                    className="bg-purple-50 text-purple-800 border border-purple-100
                               rounded-lg px-3 py-1 text-xs font-medium"
                  >
                    {b}
                  </span>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                <a
                  href={WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gold-500 text-white
                             hover:bg-gold-400 rounded-xl px-5 py-2.5 text-sm font-medium
                             transition-all duration-200 shadow-sm hover:shadow-gold"
                >
                  Book a Consultation <ArrowRight size={15} />
                </a>
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 bg-purple-50 text-purple-800
                             border border-purple-200 hover:bg-purple-100 rounded-xl px-5 py-2.5
                             text-sm font-medium transition-all duration-200"
                >
                  View Free Tools
                </Link>
              </div>
            </div>

            {/* Right column — Firm card */}
            <div className="flex justify-center lg:justify-end">
              <div className="bg-white rounded-2xl border border-purple-100 p-6 shadow-sm w-full max-w-xs">
                <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center mb-4">
                  <span className="text-2xl font-semibold text-white">CC</span>
                </div>
                <p className="text-xs text-purple-400 tracking-widest uppercase mb-1">
                  CC Associates
                </p>
                <p className="text-sm font-semibold text-[#26215C] mb-1">
                  Tax &amp; Advisory Practice
                </p>
                <p className="text-xs text-[#7F77DD] mb-4">
                  "Precision in Every Number. Compliance in Every Step."
                </p>
                <div className="space-y-2 text-xs text-[#7F77DD]">
                  <div>📍 Pune, Maharashtra</div>
                  <div>📞 +91 75073 54141</div>
                  <div>✉️ associate.piyush.nimse@gmail.com</div>
                </div>
                <div className="mt-4 pt-4 border-t border-purple-50 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-purple-400">Available for consultation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <section className="bg-purple-600 py-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-semibold text-white">{s.value}</div>
                <div className="text-purple-200 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-surface">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="mb-12">
            <p className="text-purple-600 text-xs font-semibold uppercase tracking-widest mb-2">
              Our Services
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#26215C]">
              Comprehensive Tax &amp; Advisory Services
            </h2>
            <div className="w-12 h-0.5 bg-gold-500 mt-3 mb-0" />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="bg-white rounded-2xl border border-purple-100 p-5 md:p-6
                           hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-100/60
                           hover:border-purple-200 transition-all duration-200 flex flex-col"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
                  <s.icon size={20} className="text-purple-600" />
                </div>
                <h3 className="text-base font-semibold text-[#26215C] mb-2">{s.title}</h3>
                <p className="text-sm text-[#7F77DD] leading-relaxed flex-1">{s.desc}</p>
                <p className="text-xs text-gold-500 font-medium mt-3">{s.price}</p>
                <div className="mt-4 flex items-center gap-1 text-purple-600 text-xs font-medium">
                  Learn more <ArrowRight size={12} />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 bg-purple-50 text-purple-800
                         border border-purple-200 hover:bg-purple-100 rounded-xl px-5 py-2.5
                         text-sm font-medium transition-all duration-200"
            >
              View All Services <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="mb-12">
            <p className="text-purple-600 text-xs font-semibold uppercase tracking-widest mb-2">
              Client Testimonials
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#26215C]">
              What Our Clients Say
            </h2>
            <div className="w-12 h-0.5 bg-gold-500 mt-3" />
          </div>
          <Testimonials />
        </div>
      </section>

      {/* ── Team ─────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-surface">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="mb-12">
            <p className="text-purple-600 text-xs font-semibold uppercase tracking-widest mb-2">
              Our Team
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#26215C]">
              Meet the Partners
            </h2>
            <div className="w-12 h-0.5 bg-gold-500 mt-3" />
          </div>
          <Team />
        </div>
      </section>

      {/* ── Free Tools ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-purple-600 text-xs font-semibold uppercase tracking-widest mb-2">
                Free Tools
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#26215C] mb-3">
                14 Professional Tax Tools — Free Forever
              </h2>
              <div className="w-12 h-0.5 bg-gold-500 mb-5" />
              <p className="text-[#7F77DD] text-sm leading-relaxed mb-6">
                GST Invoice Generator, ITR Estimator, Capital Gains Calculator, Notice Reply Generator, TDS Calculator, and 9 more — all 100% browser-based. No login. No data stored.
              </p>
              <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-xs text-purple-700 mb-6">
                <Shield size={14} className="text-purple-600 flex-shrink-0" />
                All tools run in your browser. No data is ever sent to any server.
              </div>
              <Link
                href="/tools"
                className="inline-flex items-center gap-2 bg-purple-600 text-white
                           hover:bg-purple-800 rounded-xl px-5 py-2.5 text-sm font-medium
                           transition-all duration-200 shadow-sm"
              >
                Explore All 14 Tools <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: FileText, label: "GST Invoice Generator" },
                { icon: Calculator, label: "ITR Tax Estimator" },
                { icon: BarChart3, label: "Capital Gains Calculator" },
                { icon: ClipboardCheck, label: "Notice Reply Generator" },
                { icon: RefreshCw, label: "GSTR-2A Reconciliation" },
                { icon: Search, label: "TDS Calculator" },
              ].map((t) => (
                <div
                  key={t.label}
                  className="bg-surface border border-purple-100 rounded-xl p-4 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <t.icon size={15} className="text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-[#26215C] leading-snug">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="py-16 bg-dark-navy">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <p className="text-gold-400 text-xs font-semibold uppercase tracking-widest mb-3">
            Free First Consultation
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
            Have a tax question? Let&apos;s talk.
          </h2>
          <p className="text-purple-200 text-sm mb-8 max-w-lg mx-auto leading-relaxed">
            Reach out via WhatsApp or call us. We respond within 2 business days. Confidential. Pan India service.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gold-500 text-white
                         hover:bg-gold-400 rounded-xl px-6 py-3 text-sm font-medium
                         transition-all duration-200 shadow-gold"
            >
              WhatsApp for Free Consultation
            </a>
            <a
              href="tel:+917507354141"
              className="inline-flex items-center gap-2 bg-purple-600 text-white
                         hover:bg-purple-800 rounded-xl px-6 py-3 text-sm font-medium
                         transition-all duration-200"
            >
              +91 75073 54141
            </a>
          </div>
          <p className="text-purple-400 text-xs mt-5">
            associate.piyush.nimse@gmail.com · Pune, Maharashtra · Since 2025
          </p>
        </div>
      </section>
    </div>
  );
}
