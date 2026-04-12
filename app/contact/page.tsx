import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact CC Associates for GST, Income Tax, TDS, Audit, Litigation & Forensic Accounting consultations. Call or WhatsApp: +91 75073 54141 (Piyush Nimse) | +91 84214 65966 (CA Sourabh Chavan). Pune — Pan India.",
  keywords: [
    "contact CC Associates pune",
    "Piyush Nimse contact",
    "CA Sourabh Chavan contact",
    "tax consultation pune",
    "GST consultant contact pune",
  ],
  alternates: { canonical: "https://associate-piyush-bduu.vercel.app/contact" },
  openGraph: {
    title: "Contact CC Associates | Tax & Advisory Pune",
    description:
      "WhatsApp or call +91 75073 54141. First consultation free. GST, Income Tax, TDS, Audit & Litigation — Pune & Pan India.",
    url: "https://associate-piyush-bduu.vercel.app/contact",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function ContactPage() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="py-14" style={{ background: "linear-gradient(135deg, #F5F3FF 0%, #EEEDFE 50%, #F5F3FF 100%)" }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <p className="text-purple-600 text-xs font-semibold uppercase tracking-widest mb-2">Get in Touch</p>
          <h1 className="text-4xl font-semibold tracking-tight text-[#26215C] mb-3">
            Contact CC Associates
          </h1>
          <div className="w-12 h-0.5 bg-gold-500 mb-4" />
          <p className="text-[#7F77DD] text-base max-w-xl leading-relaxed">
            Reach out via WhatsApp, call, or email. First consultation is free. We respond within 2 business days.
          </p>
        </div>
      </section>

      <ContactForm />
    </div>
  );
}
