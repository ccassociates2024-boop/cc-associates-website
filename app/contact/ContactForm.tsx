"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Clock, MessageCircle, ArrowRight, CheckCircle } from "lucide-react";

const WA_NUM = "917507354141";
const SERVICES = [
  "Income Tax Filing",
  "GST Compliance",
  "TDS Compliance",
  "Statutory Audit",
  "Litigation Support",
  "Business Advisory",
  "Tax Notice Reply",
  "Forensic Accounting",
  "Other",
];

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = encodeURIComponent(
      `*New Inquiry — CC Associates*\n\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nService: ${form.service}\n\nMessage: ${form.message}`
    );
    window.open(`https://wa.me/${WA_NUM}?text=${text}`, "_blank");
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

            {/* Phone */}
            <div className="bg-white rounded-2xl border border-purple-100 p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Phone size={16} className="text-purple-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#26215C] uppercase tracking-wide mb-1">Primary Contact</div>
                  <a href="tel:+917507354141" className="text-sm font-semibold text-purple-600 hover:underline block">
                    +91 75073 54141
                  </a>
                  <div className="text-xs text-[#7F77DD]">Piyush Nimse — Tax & Finance</div>
                  <a href="tel:+918421465966" className="text-sm font-semibold text-purple-600 hover:underline block mt-1">
                    +91 84214 65966
                  </a>
                  <div className="text-xs text-[#7F77DD]">CA Sourabh Chavan — Audit & Advisory</div>
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/${WA_NUM}?text=Hello%20CC%20Associates%2C%20I%20need%20tax%20and%20advisory%20consultation.`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl border border-purple-100 p-5 flex items-start gap-3 hover:border-green-200 hover:bg-green-50 transition-all duration-200"
            >
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <MessageCircle size={16} className="text-green-600" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#26215C] uppercase tracking-wide mb-1">WhatsApp</div>
                <div className="text-sm font-semibold text-green-600">Chat instantly on WhatsApp</div>
                <div className="text-xs text-[#7F77DD]">Fastest response — usually within hours</div>
              </div>
            </a>

            {/* Email */}
            <div className="bg-white rounded-2xl border border-purple-100 p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Mail size={16} className="text-purple-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#26215C] uppercase tracking-wide mb-1">Email</div>
                  <a href="mailto:associate.piyush.nimse@gmail.com" className="text-xs text-purple-600 hover:underline block">
                    associate.piyush.nimse@gmail.com
                  </a>
                  <div className="text-xs text-[#7F77DD]">Tax, GST, TDS, ITR queries</div>
                  <a href="mailto:ccassociates2024@gmail.com" className="text-xs text-purple-600 hover:underline block mt-1">
                    ccassociates2024@gmail.com
                  </a>
                  <div className="text-xs text-[#7F77DD]">Audit queries — CA Sourabh Chavan</div>
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
              <h2 className="text-lg font-semibold text-[#26215C] mb-1">Send an Inquiry</h2>
              <p className="text-xs text-[#7F77DD] mb-6">
                Fill in the form — we&apos;ll open WhatsApp with your details pre-filled for instant delivery.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    {lbl("Full Name", true)}
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
                    {lbl("Email Address", true)}
                    <input
                      type="email"
                      required
                      className={inputCls}
                      placeholder="e.g. you@example.com"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    {lbl("Phone / WhatsApp")}
                    <input
                      type="tel"
                      className={inputCls}
                      placeholder="+91 XXXXX XXXXX"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                    />
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
                </div>

                <div>
                  {lbl("Message", true)}
                  <textarea
                    required
                    rows={4}
                    className={inputCls + " resize-none"}
                    placeholder="Briefly describe your requirement..."
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-gold-500 text-white
                             hover:bg-gold-400 rounded-xl px-5 py-3.5 text-sm font-medium
                             transition-all duration-200 shadow-sm"
                >
                  <MessageCircle size={16} />
                  Send via WhatsApp
                  <ArrowRight size={15} />
                </button>

                <p className="text-center text-xs text-[#7F77DD]">
                  Confidential. No spam. We respond within 2 business days.
                </p>
              </form>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
