"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Clock, MessageCircle, ArrowRight, CheckCircle, Shield } from "lucide-react";

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
  "Statutory Audit",
  "Forensic Accounting",
  "Tax Notice Reply",
  "Business Advisory",
  "Litigation Support",
  "Capital Gains Tax",
  "Other",
];

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    service: "",
    message: "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text =
      `*Inquiry — CC Associates*\n\n` +
      `Hi CC Associates,\n\n` +
      `I'm *${form.name || "—"}* and I need assistance with *${form.service || "Tax Consultation"}*.\n\n` +
      `📱 My Phone: ${form.phone || "—"}\n` +
      (form.message ? `📝 Details: ${form.message}\n\n` : "\n") +
      `Please get back to me at your earliest convenience.\n\n` +
      `— via CCAssociates.in`;
    window.open(`${WA_BASE}?text=${encodeURIComponent(text)}`, "_blank");
  }

  const inputCls =
    "w-full border border-purple-200 rounded-xl px-3.5 py-2.5 text-sm text-[#26215C] " +
    "placeholder:text-purple-400 bg-white focus:outline-none focus:ring-2 " +
    "focus:ring-purple-400 focus:border-transparent transition-all duration-150";

  const lbl = (t: string, req?: boolean) => (
    <label className="block text-xs font-semibold text-[#26215C] mb-1.5 uppercase tracking-wide">
      {t}
      {req && <span className="text-purple-400 ml-1">*</span>}
    </label>
  );

  return (
    <section className="py-16 bg-surface">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-5 gap-10">

          {/* ── Left: Info Cards ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Call */}
            <a href={`tel:${PHONE_RAW}`}
               className="bg-white rounded-2xl border border-purple-100 p-5 flex items-center gap-3 hover:border-purple-200 hover:shadow-sm transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Phone size={18} className="text-purple-600" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-[#26215C] uppercase tracking-wide mb-0.5">Call Directly</div>
                <div className="text-sm font-semibold text-purple-600">{PHONE}</div>
                <div className="text-xs text-[#7F77DD]">Mon–Sat, 10 AM – 7 PM IST</div>
              </div>
            </a>

            {/* WhatsApp */}
            <a href={WA_QUICK} target="_blank" rel="noopener noreferrer"
               className="bg-[#25D366] rounded-2xl p-5 flex items-center gap-3 hover:bg-[#1ebe5d] transition-all duration-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle size={18} className="text-white" />
              </div>
              <div>
                <div className="text-[10px] font-semibold text-white/80 uppercase tracking-wide mb-0.5">WhatsApp</div>
                <div className="text-sm font-semibold text-white">Chat on WhatsApp</div>
                <div className="text-xs text-white/80">{PHONE}</div>
              </div>
            </a>

            {/* Email — gold bordered */}
            <div className="bg-white rounded-2xl border-2 border-gold-400 p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-400/10 flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-gold-500" />
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-[#26215C] uppercase tracking-wide mb-0.5">Email Us</div>
                  <a href={`mailto:${EMAIL}`} className="text-sm font-semibold text-gold-600 hover:underline block">{EMAIL}</a>
                  <div className="text-xs text-[#7F77DD] mt-0.5">Tax, Audit & Advisory queries</div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl border border-purple-100 p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-purple-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#26215C] uppercase tracking-wide mb-1">Location</div>
                  <div className="text-sm text-[#26215C]">Pune, Maharashtra</div>
                  <div className="text-xs text-[#7F77DD]">Pan India Services</div>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="bg-white rounded-2xl border border-purple-100 p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Clock size={16} className="text-purple-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#26215C] uppercase tracking-wide mb-1">Office Hours</div>
                  <div className="text-sm text-[#26215C]">Monday – Saturday: 10:00 AM – 7:00 PM</div>
                  <div className="text-xs text-[#7F77DD]">Sunday: By appointment only</div>
                </div>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-2">
              {["950+ cases handled", "Confidential", "2-day response", "Pan India"].map((b) => (
                <div key={b} className="flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
                  <CheckCircle size={12} className="text-purple-600 flex-shrink-0" />
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Smart WA Form ── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-purple-100 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#26215C]">Quick WhatsApp Inquiry</h2>
                  <p className="text-xs text-[#7F77DD]">Sends directly to CC Associates — responds within 2 hours</p>
                </div>
              </div>

              {/* Message Preview */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-xs text-green-900 font-mono leading-relaxed">
                <div className="text-[10px] text-green-600 font-semibold uppercase tracking-wide mb-1.5">Message Preview (example)</div>
                <div className="whitespace-pre-line">{`*Inquiry — CC Associates*\n\nHi CC Associates,\n\nI'm *Piyush Nimse* and I need assistance with *Income Tax Filing*.\n\n📱 My Phone: +91 98765 43210\n📝 Details: I need to file ITR for FY 2025-26.\n\n— via CCAssociates.in`}</div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    {lbl("Your Name", true)}
                    <input
                      type="text"
                      required
                      className={inputCls}
                      placeholder="e.g. Piyush Nimse"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                    />
                  </div>
                  <div>
                    {lbl("Phone / WhatsApp", true)}
                    <input
                      type="tel"
                      required
                      className={inputCls}
                      placeholder="+91 9XXXXXXXXX"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  {lbl("Service Required", true)}
                  <select
                    required
                    className={inputCls}
                    value={form.service}
                    onChange={(e) => set("service", e.target.value)}
                  >
                    <option value="">Select a service...</option>
                    {SERVICES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  {lbl("Additional Details")}
                  <textarea
                    rows={3}
                    className={inputCls + " resize-none"}
                    placeholder="Briefly describe your requirement (optional)..."
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white
                             hover:bg-[#1ebe5d] rounded-xl px-5 py-3.5 text-sm font-semibold
                             transition-all duration-200 shadow-sm"
                >
                  <MessageCircle size={16} />
                  Send to CC Associates via WhatsApp →
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-[#7F77DD]">
                  <Shield size={11} className="text-green-500" />
                  Confidential · No spam · Responds within 2 hours
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
