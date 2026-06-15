"use client";
import { MessageCircle, Phone, Mail, CheckCircle } from "lucide-react";

const combinedExpertise = [
  "Income Tax", "GST Compliance", "ITC Claims", "TDS",
  "Statutory Audit", "Tax Audit", "Financial Litigation",
  "Virtual CFO", "Forensic Accounting", "Financial Consultation",
  "Outsourced Accounting", "Business Advisory",
];

const partners = [
  {
    initials: "SC",
    name: "C.A. Sourabh Bhimrao Chavan",
    role: "Audit, Advisory & Litigation",
    qualification: "Chartered Accountant (ACA)",
    description:
      "7+ years in CA firm practice — Income Tax, GST, statutory & internal audits, financial consultation, and financial litigation for businesses and individuals.",
    phone: "+91 84214 65966",
    phoneRaw: "918421465966",
    email: "ccassociates2024@gmail.com",
    expertise: ["CA Firm", "Audit", "Income Tax", "GST", "Financial Litigation", "Financial Consultant"],
    accentBg: "#D97706",
    highlight: "7+ Years CA Practice · 100+ Audit Clients",
  },
  {
    initials: "SS",
    name: "C.A. Shruti Sourabh Chavan",
    role: "Tax & Compliance",
    qualification: "Chartered Accountant (ACA)",
    description:
      "Specialises in Income Tax advisory, GST compliance, TDS management, business advisory, and handling tax notices & assessments for businesses and individuals.",
    phone: "+91 84214 65966",
    phoneRaw: "918421465966",
    email: "ccassociates2024@gmail.com",
    expertise: ["Income Tax", "GST", "TDS", "Statutory Audit", "Tax Compliance", "Business Advisory"],
    accentBg: "#1F3088",
    highlight: "3000+ Income Tax Returns · 250+ GST Clients",
  },
];

export default function Team() {
  return (
    <div className="w-full max-w-3xl">

      {/* Partnership banner */}
      <div
        className="rounded-2xl px-5 py-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3"
        style={{ background: "linear-gradient(135deg, #F5F3FF 0%, #EEF2FF 100%)", border: "1px solid #DDD6FE" }}
      >
        <CheckCircle size={16} className="text-purple-600 flex-shrink-0 hidden sm:block" />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-purple-600 mb-0.5">
            A Complete Tax + CA Partnership
          </p>
          <p className="text-xs text-purple-700 leading-relaxed">
            C.A. Sourabh &amp; C.A. Shruti cover the full spectrum — from day-to-day tax filing and GST
            compliance to CA-certified audits, financial litigation, and strategic advisory.
            One firm. Complete coverage.
          </p>
        </div>
      </div>

      {/* Partner cards */}
      <div className="grid sm:grid-cols-2 gap-5 mb-6">
        {partners.map((p) => (
          <div
            key={p.initials}
            className="bg-white rounded-2xl border border-purple-100 p-6 flex flex-col
                       hover:shadow-lg hover:shadow-purple-100/60 hover:-translate-y-1
                       transition-all duration-200"
          >
            {/* Avatar + name */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: p.accentBg }}
              >
                <span className="text-xs font-bold text-white tracking-tight">{p.initials}</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#26215C] leading-tight">{p.name}</h3>
                <p className="text-xs font-semibold text-purple-600">{p.role}</p>
              </div>
            </div>

            {/* Qualification badge */}
            <span className="inline-block self-start text-xs bg-purple-50 text-purple-800
                             border border-purple-100 rounded-lg px-2 py-0.5 mb-3">
              {p.qualification}
            </span>

            {/* Highlight stat */}
            <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-2">
              {p.highlight}
            </p>

            {/* Description */}
            <p className="text-xs text-[#7F77DD] leading-relaxed mb-4 flex-1">{p.description}</p>

            {/* Expertise tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {p.expertise.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] font-bold uppercase tracking-wide
                             bg-purple-50 text-purple-700 border border-purple-100
                             rounded-md px-1.5 py-0.5"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Contact */}
            <div className="mt-auto space-y-1.5 text-xs text-[#7F77DD]">
              <a href={`tel:${p.phoneRaw}`}
                 className="flex items-center gap-1.5 hover:text-purple-600 transition-colors">
                <Phone size={11} /> {p.phone}
              </a>
              <a href={`mailto:${p.email}`}
                 className="flex items-center gap-1.5 hover:text-purple-600 transition-colors">
                <Mail size={11} /> {p.email}
              </a>
              <a href={`https://wa.me/${p.phoneRaw}?text=Hello%20CC%20Associates%2C%20I%20need%20consultation.`}
                 target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-1.5 bg-green-50 text-green-700
                            border border-green-200 rounded-lg px-3 py-1.5 font-semibold
                            hover:bg-green-100 transition-colors mt-2">
                <MessageCircle size={11} /> WhatsApp
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Combined expertise strip */}
      <div
        className="rounded-xl px-5 py-4"
        style={{ background: "var(--ap-surface-2, #F8F9FB)", border: "1px solid #E5E7EB" }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#7F77DD] mb-3">
          What We Cover Together
        </p>
        <div className="flex flex-wrap gap-2">
          {combinedExpertise.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{ background: "#F5F3FF", color: "#5B21B6", border: "1px solid #DDD6FE" }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
