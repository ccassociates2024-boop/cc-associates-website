import type { Metadata } from "next";
import Link from "next/link";
import {
  MapPin, GraduationCap, Award, Code2, CheckCircle, ArrowRight,
  BookOpen, Shield, Phone, Mail, Users
} from "lucide-react";
import Team from "@/components/Team";

export const metadata: Metadata = {
  title: "About CC Associates",
  description:
    "Meet the team at CC Associates — Piyush Nimse (Tax & Finance) and CA Sourabh Chavan (Audit & Advisory). Expert tax consultants in Pune serving clients across India since 2025.",
  keywords: [
    "CC Associates team",
    "Piyush Nimse tax consultant pune",
    "CA Sourabh Chavan audit pune",
    "forensic accounting specialist pune",
    "GST expert pune",
    "income tax consultant pune",
    "about CC Associates",
  ],
  alternates: {
    canonical: "https://associate-piyush-bduu.vercel.app/about",
  },
  openGraph: {
    title: "About CC Associates | Tax & Advisory Firm Pune",
    description:
      "Piyush Nimse & CA Sourabh Chavan — CC Associates, Pune. GST, Income Tax, TDS, Forensic Accounting, Audit & Business Advisory. Pan India service since 2025.",
    url: "https://associate-piyush-bduu.vercel.app/about",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "CC Associates - Tax Consultants Pune" }],
  },
};

const piyushSpecializations = [
  "GST Compliance & Reconciliation (GSTR-1, 3B, 9, 9C)",
  "Forensic Accounting & Financial Fraud Detection",
  "Income Tax Advisory (ITR, Appeals, Scrutiny Handling)",
  "TDS Compliance (Sec 192–194N, Return Filing, 26AS Recon)",
  "Tax Regime Optimization (Old vs New Regime)",
  "Advance Tax & MAT Planning",
  "MSME Advisory & Virtual CFO Services",
  "Business Structuring & Cost Optimization",
];

const sourabhSpecializations = [
  "Statutory Audit under Companies Act 2013",
  "Tax Audit under Sec 44AB (Form 3CD/3CB)",
  "Internal Audit with Risk-Based Approach",
  "GST Audit and Annual Return (GSTR-9C)",
  "Stock Audit and Physical Verification",
  "Compliance Audit (FEMA, SEBI, RBI)",
  "Business Advisory & Financial Analysis",
  "Due Diligence for Mergers & Acquisitions",
];

const tools = [
  { cat: "Tax Software", items: ["Tally Prime", "TallyERP 9", "BUSY Accounting", "Zoho Books"] },
  { cat: "GST & Income Tax", items: ["GST Portal (GSTN)", "E-Invoice Portal", "IT Department Portal", "TRACES"] },
  { cat: "Office & Analytics", items: ["Microsoft Excel (Advanced)", "Power BI", "Google Sheets"] },
  { cat: "Development", items: ["JavaScript / TypeScript", "Next.js", "React", "Python"] },
];

const stats = [
  { label: "Tax Cases Handled", value: "950+" },
  { label: "Audit Clients", value: "28+" },
  { label: "GST Clients", value: "150+" },
  { label: "States Covered", value: "15+" },
  { label: "Free Tools Built", value: "14" },
  { label: "Active Since", value: "2025" },
];

export default function AboutPage() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="py-14" style={{ background: "linear-gradient(135deg, #F5F3FF 0%, #EEEDFE 50%, #F5F3FF 100%)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-purple-600 text-xs font-semibold uppercase tracking-widest mb-2">Our Story</p>
          <h1 className="text-4xl font-semibold tracking-tight text-[#26215C] mb-3">About CC Associates</h1>
          <div className="w-12 h-0.5 bg-gold-500 mb-4" />
          <p className="text-[#7F77DD] text-base max-w-2xl leading-relaxed">
            CC Associates is a Pune-based tax and advisory firm combining deep domain expertise in tax compliance with CA-led audit and assurance services. We serve businesses and individuals across India with precision, confidentiality, and proactive guidance.
          </p>
          <div className="flex flex-wrap gap-4 mt-6 text-sm text-[#7F77DD]">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-purple-600" />
              Pune, Maharashtra — Pan India
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={14} className="text-purple-600" />
              Two-Partner Firm
            </div>
            <div className="flex items-center gap-1.5">
              <Award size={14} className="text-purple-600" />
              Active Since 2025
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#26215C] py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6 text-center">
            {stats.map(({ label, value }) => (
              <div key={label}>
                <div className="text-2xl font-bold text-gold-400">{value}</div>
                <div className="text-purple-300 text-xs mt-1 leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Firm Overview */}
      <section className="bg-surface py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: About Text */}
            <div className="lg:col-span-2 space-y-6">

              {/* About the Firm */}
              <div className="bg-white rounded-2xl border border-purple-100 p-6">
                <h2 className="font-bold text-[#26215C] text-xl mb-4 flex items-center gap-2">
                  <BookOpen size={18} className="text-gold-500" /> About the Firm
                </h2>
                <div className="space-y-3 text-[#7F77DD] text-sm leading-relaxed">
                  <p>
                    CC Associates was founded on the belief that professional tax and audit services should be accessible, transparent, and genuinely useful — not just compliance boxes ticked on a form. We are a two-partner firm based in Pune, serving clients across India.
                  </p>
                  <p>
                    The firm combines the tax and forensic expertise of Piyush Nimse with the audit and advisory experience of CA Sourabh Chavan. This dual-specialization allows us to offer end-to-end financial services from GST reconciliation and ITR filing to statutory audits and business advisory under one roof.
                  </p>
                  <p>
                    We have handled 950+ tax cases, 28+ audit engagements, and 150+ GST clients across manufacturing, trading, services, real estate, and e-commerce sectors. Our clients range from individual proprietors to multi-crore private limited companies.
                  </p>
                  <p>
                    Beyond client work, we build free financial tools (this website!) to democratize access to professional-grade tax calculators and reconciliation tools for small businesses and professionals across India.
                  </p>
                </div>
              </div>

              {/* Professional Philosophy */}
              <div className="bg-white rounded-2xl border border-purple-100 p-6">
                <h2 className="font-bold text-[#26215C] text-xl mb-4 flex items-center gap-2">
                  <Shield size={18} className="text-gold-500" /> Our Philosophy
                </h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { title: "Precision First", desc: "Numbers don't lie when analyzed correctly. Every discrepancy has a cause — find it, fix it." },
                    { title: "Client Confidentiality", desc: "Financial matters are sensitive. Complete confidentiality is not optional — it's foundational." },
                    { title: "Proactive Compliance", desc: "The best tax problem is the one avoided. Plan ahead, stay compliant, minimize risk." },
                  ].map(({ title, desc }) => (
                    <div key={title} className="p-4 bg-surface rounded-xl border border-purple-100">
                      <div className="w-1 h-6 bg-gold-500 rounded-full mb-3" />
                      <div className="font-semibold text-[#26215C] text-sm mb-2">{title}</div>
                      <div className="text-[#7F77DD] text-xs leading-relaxed">{desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specializations — two columns for the two partners */}
              <div className="bg-white rounded-2xl border border-purple-100 p-6">
                <h2 className="font-bold text-[#26215C] text-xl mb-5 flex items-center gap-2">
                  <Award size={18} className="text-gold-500" /> Areas of Expertise
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-purple-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">PN</span>
                      </div>
                      <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Piyush Nimse — Tax & Finance</span>
                    </div>
                    <div className="space-y-1.5">
                      {piyushSpecializations.map(s => (
                        <div key={s} className="flex items-start gap-2 text-sm text-[#7F77DD]">
                          <CheckCircle size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-gold-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">SC</span>
                      </div>
                      <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">CA Sourabh Chavan — Audit</span>
                    </div>
                    <div className="space-y-1.5">
                      {sourabhSpecializations.map(s => (
                        <div key={s} className="flex items-start gap-2 text-sm text-[#7F77DD]">
                          <CheckCircle size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Tools, Contact, CTA */}
            <div className="space-y-5">
              {/* Quick Contact */}
              <div className="bg-white rounded-2xl border border-purple-100 p-5">
                <h3 className="font-bold text-[#26215C] mb-4 text-sm flex items-center gap-2">
                  <Phone size={14} className="text-purple-600" /> Contact the Team
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="font-semibold text-[#26215C] mb-0.5">Piyush Nimse</div>
                    <div className="text-[#7F77DD] mb-1">Tax & Finance</div>
                    <a href="tel:+917507354141" className="text-purple-600 hover:underline block">+91 75073 54141</a>
                    <a href="mailto:associate.piyush.nimse@gmail.com" className="text-purple-600 hover:underline block truncate">associate.piyush.nimse@gmail.com</a>
                  </div>
                  <div className="border-t border-purple-50 pt-3">
                    <div className="font-semibold text-[#26215C] mb-0.5">CA Sourabh Chavan</div>
                    <div className="text-[#7F77DD] mb-1">Audit & Advisory</div>
                    <a href="tel:+918421465966" className="text-purple-600 hover:underline block">+91 84214 65966</a>
                    <a href="mailto:ccassociates2024@gmail.com" className="text-purple-600 hover:underline block">ccassociates2024@gmail.com</a>
                  </div>
                </div>
              </div>

              {/* Tools & Platforms */}
              <div className="bg-white rounded-2xl border border-purple-100 p-5">
                <h3 className="font-bold text-[#26215C] mb-4 flex items-center gap-2 text-sm">
                  <Code2 size={16} className="text-gold-500" /> Tools & Platforms
                </h3>
                <div className="space-y-4">
                  {tools.map(({ cat, items }) => (
                    <div key={cat}>
                      <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1.5">{cat}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {items.map(item => (
                          <span key={item} className="px-2 py-1 bg-surface border border-purple-100 rounded-lg text-xs text-[#7F77DD]">{item}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="bg-[#26215C] rounded-2xl p-5 text-white">
                <h3 className="font-bold mb-2">Let&apos;s Work Together</h3>
                <p className="text-purple-300 text-sm leading-relaxed mb-4">
                  Have a tax matter, audit requirement, or forensic investigation? First consultation is free.
                </p>
                <Link href="/contact" className="flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-400 text-white rounded-xl px-5 py-3 text-sm font-medium transition-all duration-200 w-full">
                  Get in Touch <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full Team Section */}
      <section className="bg-white border-t border-purple-100 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-purple-600 text-xs font-semibold uppercase tracking-widest mb-2">The People</p>
            <h2 className="text-2xl font-semibold text-[#26215C] mb-3">Meet the Team</h2>
            <div className="w-12 h-0.5 bg-gold-500 mx-auto mb-4" />
            <p className="text-[#7F77DD] text-sm max-w-lg mx-auto">
              Every engagement is handled personally — no outsourcing, no juniors without direct supervision.
            </p>
          </div>
          <Team />
        </div>
      </section>
    </div>
  );
}
