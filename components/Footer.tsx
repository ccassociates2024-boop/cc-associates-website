import Link from "next/link";
import { MapPin, Mail, Phone, Shield, ArrowRight } from "lucide-react";

const services = [
  { label: "GST Reconciliation",  href: "/services#gst" },
  { label: "Forensic Accounting", href: "/services#forensic" },
  { label: "Income Tax Advisory", href: "/services#income-tax" },
  { label: "TDS Compliance",      href: "/services#tds" },
  { label: "Audit & Assurance",   href: "/services#audit" },
  { label: "Business Advisory",   href: "/services#business" },
];

const quickLinks = [
  { label: "Services",   href: "/services" },
  { label: "Free Tools", href: "/tools" },
  { label: "Resources",  href: "/resources" },
  { label: "About",      href: "/about" },
  { label: "Contact",    href: "/contact" },
];

const tools = [
  { label: "GST Invoice Generator",   href: "/tools/gst-invoice" },
  { label: "TDS Calculator",          href: "/tools/tds-calculator" },
  { label: "Income Tax Estimator",    href: "/tools/itr-estimator" },
  { label: "Capital Gains Calc",      href: "/tools/capital-gains" },
  { label: "Notice Reply Gen",        href: "/tools/notice-reply" },
  { label: "Bank Statement → Excel",  href: "/tools/bank-statement" },
  { label: "Advance Tax Calc",        href: "/tools/advance-tax" },
  { label: "PDF Merge",               href: "/tools/pdf-merge" },
  { label: "PDF Arranger",            href: "/tools/pdf-arranger" },
];

export default function Footer() {
  return (
    <footer style={{ background: "#050A14", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                   style={{ background: "linear-gradient(135deg, #0A1628 0%, #1F3088 100%)", border: "1px solid rgba(201,168,76,0.3)" }}>
                <span className="text-white font-bold text-sm">CC</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-semibold text-sm text-white/90">CC</span>
                <span className="font-bold text-sm text-white/90 -mt-0.5">
                  Associates<span style={{ color: "#C9A84C" }}>.</span>
                </span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
              Expert Tax Advisory, GST Compliance, Audit & Litigation across India. Based in Pune. Since 2022.
            </p>
            <div className="flex flex-col gap-2.5 text-sm">
              {[
                { Icon: MapPin,  text: "Pune, Maharashtra, India",   href: undefined },
                { Icon: Phone,   text: "+91 84214 65966",            href: "tel:+918421465966" },
                { Icon: Mail,    text: "ccassociates2024@gmail.com", href: "mailto:ccassociates2024@gmail.com" },
              ].map(({ Icon, text, href }) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon size={13} style={{ color: "#C9A84C", flexShrink: 0 }} />
                  {href
                    ? <a href={href} className="transition-colors hover:text-white break-all" style={{ color: "rgba(255,255,255,0.45)" }}>{text}</a>
                    : <span style={{ color: "rgba(255,255,255,0.45)" }}>{text}</span>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-5 text-white/60">Services</h3>
            <ul className="space-y-2.5">
              {services.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="text-sm transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-5 text-white/60">Quick Links</h3>
            <ul className="space-y-2.5 mb-6">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools + CTA */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-5 text-white/60">Free Tools</h3>
            <ul className="space-y-2.5 mb-5">
              {tools.map((t) => (
                <li key={t.href}>
                  <Link href={t.href} className="text-sm transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {t.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/tools" className="inline-flex items-center gap-1 text-sm font-semibold transition-colors" style={{ color: "#C9A84C" }}>
                  View All 16 Free Tools <ArrowRight size={12} />
                </Link>
              </li>
            </ul>

            {/* Book CTA */}
            <Link href="/contact"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-gold"
              style={{ background: "#C9A84C", color: "#0A1628" }}>
              Book Consultation <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Privacy strip */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            <Shield size={11} style={{ color: "#4ADE80" }} />
            All tools run 100% in your browser. No data is sent to any server.
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            <p>© 2022–2026 CC Associates. All rights reserved. Pune, Maharashtra.</p>
            <p className="text-center md:text-right max-w-lg">
              <strong style={{ color: "rgba(255,255,255,0.45)" }}>Disclaimer:</strong> Information on this website is for general guidance only and does not constitute legal or financial advice. Always consult a qualified professional.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
