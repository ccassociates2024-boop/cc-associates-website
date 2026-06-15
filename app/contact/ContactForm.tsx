"use client";

import { useState } from "react";
import {
  Phone,
  Mail,
  Clock,
  MapPin,
  MessageCircle,
  Shield,
  CheckCircle,
  ArrowRight,
  Send,
} from "lucide-react";

const PHONE = "+91 84214 65966";
const PHONE_RAW = "918421465966";
const EMAIL = "ccassociates2024@gmail.com";
const WA_BASE = `https://wa.me/${PHONE_RAW}`;
const WA_QUICK = `${WA_BASE}?text=${encodeURIComponent(
  "Hello CC Associates, I need tax and advisory consultation. Please get back to me."
)}`;

const SERVICES = [
  "GST Reconciliation",
  "Income Tax Filing (ITR)",
  "TDS Compliance",
  "Forensic Accounting",
  "Tax Notice Reply",
  "Audit & Assurance",
  "Business Advisory",
  "Capital Gains Tax",
  "Other",
];

const INFO_CARDS = [
  {
    icon: Phone,
    label: "Call Directly",
    value: PHONE,
    sub: "Mon–Sat, 10 AM – 7 PM IST",
    href: "tel:+918421465966",
    accent: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "Chat Instantly",
    sub: PHONE,
    href: WA_QUICK,
    accent: "bg-green-50",
    iconColor: "text-green-600",
    external: true,
  },
  {
    icon: Mail,
    label: "Email",
    value: EMAIL,
    sub: "Response within 24 hours",
    href: `mailto:${EMAIL}`,
    accent: "bg-gold/10",
    iconColor: "text-gold",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "Pune, Maharashtra",
    sub: "Pan India Services",
    accent: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: Clock,
    label: "Working Hours",
    value: "Mon–Sat: 10 AM – 7 PM",
    sub: "Indian Standard Time",
    accent: "bg-primary/10",
    iconColor: "text-primary",
  },
];

const TRUST = [
  "Response within 2–3 working days",
  "Confidential consultation",
  "Pan India service",
  "Est. 2022",
];

export default function ContactSection() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    const text =
      `*New Inquiry — CC Associates*\n\n` +
      `Name: ${form.name || "—"}\n` +
      `Email: ${form.email || "—"}\n` +
      `Phone: ${form.phone || "—"}\n` +
      `Service: ${form.service || "Tax Consultation"}\n\n` +
      (form.message ? `Message: ${form.message}` : "");
    const url = `${WA_BASE}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="bg-background py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-8 items-start">

          {/* ── LEFT: Contact Info Cards ── */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-lg font-bold text-dark mb-4">Contact Information</h2>

            {INFO_CARDS.map(({ icon: Icon, label, value, sub, href, accent, iconColor, external }) => {
              const inner = (
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${accent} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} className={iconColor} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-0.5">
                      {label}
                    </div>
                    <div className="text-sm font-semibold text-dark truncate">{value}</div>
                    <div className="text-xs text-muted mt-0.5">{sub}</div>
                  </div>
                </div>
              );

              return href ? (
                <a
                  key={label}
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className="block bg-white rounded-card shadow-card border border-gray-100 p-4 hover:border-primary/30 hover:shadow-card-hover transition-all duration-200"
                >
                  {inner}
                </a>
              ) : (
                <div
                  key={label}
                  className="bg-white rounded-card shadow-card border border-gray-100 p-4"
                >
                  {inner}
                </div>
              );
            })}

            {/* WhatsApp quick CTA */}
            <a
              href={WA_QUICK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg px-5 py-4 transition-colors w-full mt-2"
            >
              <div className="flex items-center gap-3">
                <MessageCircle size={22} />
                <div className="text-left">
                  <div className="text-sm font-bold">Chat on WhatsApp</div>
                  <div className="text-green-100 text-xs">{PHONE}</div>
                </div>
              </div>
              <ArrowRight size={18} />
            </a>

            {/* Email CTA */}
            <a
              href={`mailto:${EMAIL}`}
              className="flex items-center gap-3 bg-white border border-gold/40 hover:border-gold rounded-lg px-5 py-4 transition-colors w-full"
            >
              <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-gold" />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-0.5">Email Us</div>
                <div className="text-sm font-semibold text-dark break-all">{EMAIL}</div>
              </div>
            </a>

            {/* Confidentiality note */}
            <div className="bg-white border border-gray-100 rounded-card p-4 text-xs text-muted shadow-card">
              <div className="flex items-center gap-2 mb-1.5">
                <Shield size={13} className="text-primary flex-shrink-0" />
                <span className="font-semibold text-dark">Confidentiality Notice</span>
              </div>
              All client information is handled with strict confidentiality and is never
              shared with any third party. Consultation details are protected under
              professional ethics.
            </div>
          </div>

          {/* ── RIGHT: WhatsApp Inquiry Form ── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-card shadow-card border border-gray-100 p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-dark text-lg leading-tight">
                    Quick WhatsApp Inquiry
                  </h2>
                  <p className="text-muted text-xs mt-0.5">
                    Sends directly to CC Associates — responds within 2–3 working days
                  </p>
                </div>
              </div>

              {/* Preview message example */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-xs text-green-900 font-mono leading-relaxed">
                <div className="text-[10px] text-green-600 font-semibold uppercase tracking-wide mb-1.5">Message Preview (example)</div>
                <div className="whitespace-pre-line">{
                  `*New Inquiry — CC Associates*\n\nName: Sunil Yadav\nEmail: sunil@example.com\nPhone: +91 98765 43210\nService: Income Tax Filing\n\nMessage: I need to file ITR for FY 2026-27.`
                }</div>
              </div>

              <form onSubmit={handleWhatsApp} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="label">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Rahul Sharma"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="label">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="e.g. you@example.com"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="label">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="+91 XXXXX XXXXX"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </div>

                {/* Service */}
                <div>
                  <label className="label">Service Needed</label>
                  <select
                    className="input-field"
                    value={form.service}
                    onChange={(e) => set("service", e.target.value)}
                  >
                    <option value="">Select a service...</option>
                    {SERVICES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="label">Brief Message</label>
                  <textarea
                    className="input-field h-28 resize-none"
                    placeholder="e.g. I need help with GST reconciliation for FY 2024-25. We have ITC mismatch issues."
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg py-4 text-sm transition-colors"
                >
                  <Send size={16} />
                  Send via WhatsApp →
                </button>
                <p className="text-xs text-muted text-center">Confidential. No spam. We respond within 2–3 working days.</p>
              </form>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-2 mt-6 pt-6 border-t border-gray-100">
                {TRUST.map((t) => (
                  <div key={t} className="flex items-center gap-2 text-xs text-muted">
                    <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>

              {/* Also reachable via */}
              <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
                <div className="text-xs text-muted font-semibold uppercase tracking-wide mb-2">Or reach us directly</div>
                <a
                  href={`tel:+${PHONE_RAW}`}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <Phone size={14} /> {PHONE}
                </a>
                <a
                  href={`mailto:${EMAIL}`}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:underline break-all"
                >
                  <Mail size={14} /> {EMAIL}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
