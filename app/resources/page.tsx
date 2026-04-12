import type { Metadata } from "next";
import Link from "next/link";
import { Clock, ArrowRight, BookOpen, Tag, Bell, Phone, Mail, MessageCircle, Calendar } from "lucide-react";
import ComplianceCalendar from "./ComplianceCalendar";

export const metadata: Metadata = {
  title: "Free Tax & Finance Guides",
  description:
    "Free expert guides on GST ITC eligibility, TDS Rate Chart FY 2026-27, Old vs New Tax Regime comparison, GSTR-9 filing, Forensic Accounting, and Advance Tax — by Associate Piyush, Pune.",
  keywords: [
    "GST ITC eligibility guide",
    "TDS rate chart 2026-27",
    "old vs new tax regime",
    "GSTR-9 filing guide",
    "forensic accounting guide",
    "advance tax calculation",
    "free tax guides india",
    "income tax resources",
  ],
  alternates: {
    canonical: "https://associatepiyush.in/resources",
  },
  openGraph: {
    title: "Free Tax & Finance Guides | Associate Piyush",
    description:
      "Expert tax guides: GST ITC, TDS, Old vs New Regime, GSTR-9, Forensic Accounting & more — free resources by Piyush Nimse.",
    url: "https://associatepiyush.in/resources",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Tax Resources - Associate Piyush" }],
  },
};

// ── Latest Tax Updates ───────────────────────────────────────────────────────
const TAX_TAG_COLORS: Record<string, string> = {
  "CBDT Notification": "bg-blue-100 text-blue-800",
  "Amendment": "bg-green-100 text-green-800",
  "Compliance Alert": "bg-red-100 text-red-700",
  "Due Date": "bg-purple-100 text-purple-800",
};

const taxUpdates = [
  {
    title: "Income-tax Rules, 2026 Notified",
    date: "20 March 2026",
    section: "Section 533, Income-tax Act, 2025",
    summary:
      "CBDT notified new Income-tax Rules, 2026 effective 1 April 2026. Rules reduced from 511 to 333, forms from 399 to 190. New Tax Year terminology replaces AY/FY.",
    tag: "CBDT Notification",
  },
  {
    title: "GAAR Framework Revised — Rule 128 Amended",
    date: "31 March 2026",
    section: "Sections 95–102, Income-tax Act, 2025",
    summary:
      "CBDT amended GAAR provisions with clearer guidance on Approving Panel process and documentation standards. Effective 1 April 2026.",
    tag: "Amendment",
  },
  {
    title: "Digital Asset Reporting Expanded (Retrospective from 1 Jan 2026)",
    date: "5 March 2026",
    section: "Section 285BA, Income-tax Act, 2025",
    summary:
      "Crypto and digital asset accounts now reportable under FATCA/CRS framework. All financial institutions must comply from 1 January 2026.",
    tag: "Compliance Alert",
  },
  {
    title: "ITR Filing Deadline Extended for Non-Audit Taxpayers",
    date: "Finance Act, 2026",
    section: "Section 139(1), Income-tax Act, 2025",
    summary:
      "Non-audit business/professional taxpayers now have until 31 August (earlier 31 July). Salaried taxpayers retain 31 July deadline.",
    tag: "Due Date",
  },
  {
    title: "Revised Return Window Extended to 12 Months",
    date: "Finance Act, 2026",
    section: "Section 139(5), Income-tax Act, 2025",
    summary:
      "Taxpayers can now file revised return up to 31 March (12 months). Filing after 9 months attracts fee of ₹1,000 or ₹5,000.",
    tag: "Amendment",
  },
];

// ── Articles ─────────────────────────────────────────────────────────────────
const articles = [
  {
    slug: "gst-itc-eligibility",
    title: "Complete Guide to GST ITC Eligibility under Section 16",
    category: "GST",
    readTime: "8 min read",
    date: "April 5, 2026",
    excerpt:
      "A comprehensive breakdown of Input Tax Credit eligibility conditions, blocked credits under Section 17(5), and the critical Rule 36(4) reconciliation requirement.",
  },
  {
    slug: "tds-rate-chart",
    title: "TDS Rate Chart FY 2025-26: Section-wise Reference",
    category: "TDS",
    readTime: "6 min read",
    date: "April 3, 2026",
    excerpt:
      "Complete TDS rate chart for FY 2025-26 covering all sections from 192 to 194N with threshold limits, applicable forms, and due date reminders.",
  },
  {
    slug: "old-vs-new-regime",
    title: "Old vs New Tax Regime: Which is Better for You?",
    category: "Income Tax",
    readTime: "7 min read",
    date: "April 1, 2026",
    excerpt:
      "A detailed analysis of old vs new tax regime for FY 2025-26 with break-even salary analysis, optimal deduction scenarios, and a decision framework.",
  },
  {
    slug: "gstr9-filing-guide",
    title: "GSTR-9 Annual Return: Step-by-Step Filing Guide",
    category: "GST",
    readTime: "10 min read",
    date: "March 28, 2026",
    excerpt:
      "Complete walkthrough of GSTR-9 annual return filing — what to check before filing, common mistakes, and how to handle FY 2024-25 reconciliation differences.",
  },
  {
    slug: "forensic-accounting-guide",
    title: "Forensic Accounting: How to Detect Financial Fraud",
    category: "Forensic",
    readTime: "9 min read",
    date: "March 25, 2026",
    excerpt:
      "A professional overview of forensic accounting methodology — fraud red flags, investigation techniques, and how financial forensics is used in Indian legal proceedings.",
  },
  {
    slug: "advance-tax-guide",
    title: "Advance Tax: Who Must Pay and How to Calculate",
    category: "Income Tax",
    readTime: "6 min read",
    date: "March 20, 2026",
    excerpt:
      "Complete guide to advance tax — who is liable, installment schedule, how to calculate each installment, and interest implications of non-payment under Section 234C.",
  },
];

const categoryColors: Record<string, string> = {
  GST: "bg-blue-100 text-blue-800",
  TDS: "bg-purple-100 text-purple-800",
  "Income Tax": "bg-green-100 text-green-800",
  Forensic: "bg-orange-100 text-orange-800",
};

const WA_URL =
  "https://wa.me/917507354141?text=Hello%2C%20I%20have%20a%20tax%20query";

export default function ResourcesPage() {
  return (
    <div className="pt-16">
      {/* ── Hero ── */}
      <section className="bg-primary py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-gold text-sm font-semibold uppercase tracking-wider mb-3">
              Updated for Income-tax Act, 2025
            </p>
            <h1 className="text-4xl font-bold text-white mb-4">Tax Resources &amp; Updates</h1>
            <p className="text-blue-200 text-lg leading-relaxed">
              Latest tax notifications, compliance calendar, and expert guides on GST, Income Tax, and TDS — all in one place.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 1: Latest Tax Updates ── */}
      <section className="bg-background py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <Bell size={18} className="text-gold" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-dark">Latest Tax Updates</h2>
              <p className="text-muted text-sm mt-0.5">Key changes under Income-tax Act, 2025 & Finance Act, 2026</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {taxUpdates.map((update, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-100 shadow-card p-5 flex flex-col gap-3 hover:shadow-card-hover transition-shadow"
              >
                {/* Tag + Date row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      TAX_TAG_COLORS[update.tag] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {update.tag}
                  </span>
                  <span className="text-xs text-muted">{update.date}</span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-dark text-base leading-snug">{update.title}</h3>

                {/* Section ref */}
                <div className="text-[11px] font-semibold text-primary/80 uppercase tracking-wide">
                  {update.section}
                </div>

                {/* Summary */}
                <p className="text-muted text-sm leading-relaxed">{update.summary}</p>
              </div>
            ))}

            {/* "More updates" placeholder card */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 flex flex-col items-start justify-center gap-2">
              <div className="text-xs font-semibold text-primary uppercase tracking-wide">Stay Updated</div>
              <p className="text-dark text-sm font-medium leading-snug">
                Get the latest tax updates and compliance reminders directly on WhatsApp.
              </p>
              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-gold text-xs font-bold px-4 py-2 rounded-full mt-1 hover:bg-primary/90 transition-colors"
              >
                <MessageCircle size={13} /> Follow on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Compliance Calendar ── */}
      <section className="bg-white py-14 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <Calendar size={18} className="text-gold" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-dark">Compliance Calendar — April 2026</h2>
              <p className="text-muted text-sm mt-0.5">
                <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Amber = Overdue
                </span>
                &nbsp;&nbsp;
                <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Green = Upcoming
                </span>
              </p>
            </div>
          </div>

          <ComplianceCalendar />

          <p className="text-[11px] text-muted mt-3">
            * Due dates are as per Income-tax Act, 2025 and GST Act. Confirm with your CA for your specific category. Dates falling on public holidays may shift.
          </p>
        </div>
      </section>

      {/* ── In-Depth Guides ── */}
      <section className="bg-background py-14 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <BookOpen size={18} className="text-gold" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-dark">In-Depth Guides</h2>
              <p className="text-muted text-sm mt-0.5">Detailed articles on GST, Income Tax, TDS, and Forensic Accounting</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <article
                key={article.slug}
                className="bg-white rounded-card shadow-card border border-gray-100 flex flex-col group hover:shadow-card-hover transition-shadow duration-200"
              >
                <div className="p-6 flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        categoryColors[article.category] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <Tag size={9} />
                      {article.category}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted">
                      <Clock size={11} />
                      {article.readTime}
                    </div>
                  </div>
                  <h3 className="font-bold text-dark text-base leading-tight mb-3 group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed mb-4">{article.excerpt}</p>
                  <div className="text-xs text-muted">{article.date}</div>
                </div>
                <div className="px-6 pb-5 border-t border-gray-50 pt-4">
                  <Link
                    href={`/resources/${article.slug}`}
                    className="text-primary text-sm font-medium hover:text-primary/80 flex items-center gap-1 group/link"
                  >
                    Read Full Article{" "}
                    <ArrowRight size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Book a Free Consultation CTA ── */}
      <section className="bg-primary py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-gold text-sm font-bold uppercase tracking-wider mb-3">Free Consultation</p>
            <h2 className="text-3xl font-bold text-white mb-4">
              Have a tax question? Get expert guidance from Associate Piyush.
            </h2>
            <p className="text-blue-200 text-base max-w-xl mx-auto">
              First consultation is free. We respond within 2 hours on business days. Serving clients across India from Pune.
            </p>
          </div>

          {/* Contact options */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {/* WhatsApp */}
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-5 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <MessageCircle size={20} className="text-white" />
              </div>
              <div className="text-center">
                <div className="text-white font-semibold text-sm">WhatsApp</div>
                <div className="text-blue-200 text-xs mt-0.5">Chat instantly</div>
              </div>
            </a>

            {/* Phone */}
            <a
              href="tel:+917507354141"
              className="flex flex-col items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-5 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center">
                <Phone size={20} className="text-dark" />
              </div>
              <div className="text-center">
                <div className="text-white font-semibold text-sm">+91 75073 54141</div>
                <div className="text-blue-200 text-xs mt-0.5">Mon–Sat, 10 AM–7 PM</div>
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:associate.piyush.nimse@gmail.com"
              className="flex flex-col items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-5 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Mail size={20} className="text-white" />
              </div>
              <div className="text-center">
                <div className="text-white font-semibold text-sm">Email Us</div>
                <div className="text-blue-200 text-xs mt-0.5">Reply within 24 hours</div>
              </div>
            </a>
          </div>

          {/* Primary CTA button */}
          <div className="text-center">
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-gold hover:bg-gold/90 text-dark font-bold px-8 py-4 rounded-full text-base transition-colors shadow-lg"
            >
              <MessageCircle size={20} />
              WhatsApp for Free Consultation
              <ArrowRight size={18} />
            </a>
            <p className="text-blue-300 text-xs mt-3">
              associate.piyush.nimse@gmail.com · Pune, Maharashtra · Pan India Service
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
