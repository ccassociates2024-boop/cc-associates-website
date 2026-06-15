import type { Metadata } from "next";
import ContactSection from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact CC Associates for GST, Income Tax, TDS, Audit & Litigation consultations. Call or WhatsApp: +91 84214 65966. Email: ccassociates2024@gmail.com. Pune, Maharashtra — Pan India. First consultation free.",
  keywords: [
    "contact CC Associates pune",
    "CA Sourabh Chavan contact",
    "CC Associates WhatsApp",
    "tax consultation pune",
    "GST consultant contact pune",
    "audit firm contact pune",
    "tax advisor phone pune",
  ],
  alternates: {
    canonical: "https://cc-associates-website.vercel.app/contact",
  },
  openGraph: {
    title: "Contact CC Associates | Tax & Advisory Firm Pune",
    description:
      "WhatsApp or call +91 84214 65966. First consultation free. GST, Income Tax, TDS, Audit & Litigation — Pune & Pan India.",
    url: "https://cc-associates-website.vercel.app/contact",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Contact CC Associates" }],
  },
};

export default function ContactPage() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="bg-primary py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-gold text-sm font-semibold uppercase tracking-wider mb-3">
              Get in Touch
            </p>
            <h1 className="text-4xl font-bold text-white mb-4">
              Let&apos;s Resolve Your Tax Matter
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed">
              Reach out via WhatsApp, call, or email. First consultation is free.
              Response within 2–3 working days.
            </p>
          </div>
        </div>
      </section>

      <ContactSection />
    </div>
  );
}
