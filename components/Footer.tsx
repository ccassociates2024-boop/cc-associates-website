import Link from "next/link";
import { MapPin, Mail, Phone, Shield } from "lucide-react";

const services = [
  { label: "GST Reconciliation", href: "/services#gst" },
  { label: "Forensic Accounting", href: "/services#forensic" },
  { label: "Income Tax Advisory", href: "/services#income-tax" },
  { label: "TDS Compliance", href: "/services#tds" },
  { label: "Audit & Assurance", href: "/services#audit" },
  { label: "Business Advisory", href: "/services#business" },
];

const quickLinks = [
  { label: "Services", href: "/services" },
  { label: "Free Tools", href: "/tools" },
  { label: "Resources", href: "/resources" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const tools = [
  { label: "Personal Finance Dashboard", href: "/tools/dashboard" },
  { label: "GST Invoice Generator", href: "/tools/gst-invoice" },
  { label: "TDS Calculator", href: "/tools/tds-calculator" },
  { label: "ITR Tax Estimator", href: "/tools/itr-estimator" },
  { label: "Capital Gains Calculator", href: "/tools/capital-gains" },
  { label: "Notice Reply Generator", href: "/tools/notice-reply" },
  { label: "Advance Tax Calculator", href: "/tools/advance-tax" },
  { label: "PDF Merge", href: "/tools/pdf-merge" },
];

const WA_URL =
  "https://wa.me/917507354141?text=Hello%20CC%20Associates%2C%20I%20need%20tax%20and%20advisory%20consultation.";

export default function Footer() {
  return (
    <footer className="bg-dark-navy text-white">
      {/* Main Footer */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">CC</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-white text-sm">CC Associates</span>
                <span className="text-[10px] text-purple-400 -mt-0.5">Tax &amp; Advisory</span>
              </div>
            </Link>
            <p className="text-purple-300 text-xs leading-relaxed mb-1 italic">
              "Precision in Every Number. Compliance in Every Step."
            </p>
            <p className="text-purple-400 text-xs leading-relaxed mb-5">
              Expert tax advisory and CA services for businesses across India. Since 2025.
            </p>
            <div className="flex flex-col gap-2 text-xs text-purple-400">
              <div className="flex items-center gap-2">
                <MapPin size={12} className="text-gold-400 flex-shrink-0" />
                <span>Pune, Maharashtra, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={12} className="text-gold-400 flex-shrink-0" />
                <a href="tel:+917507354141" className="hover:text-white transition-colors">
                  +91 75073 54141 (Piyush Nimse)
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={12} className="text-gold-400 flex-shrink-0" />
                <a href="tel:+918421465966" className="hover:text-white transition-colors">
                  +91 84214 65966 (CA Sourabh Chavan)
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={12} className="text-gold-400 flex-shrink-0" />
                <a href="mailto:associate.piyush.nimse@gmail.com" className="hover:text-white transition-colors">
                  associate.piyush.nimse@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={12} className="text-gold-400 flex-shrink-0" />
                <a href="mailto:ccassociates2024@gmail.com" className="hover:text-white transition-colors">
                  ccassociates2024@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-xs uppercase tracking-widest">Services</h3>
            <ul className="space-y-2.5">
              {services.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="text-purple-400 hover:text-white text-xs transition-colors">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-xs uppercase tracking-widest">Quick Links</h3>
            <ul className="space-y-2.5 mb-6">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-purple-400 hover:text-white text-xs transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white
                         text-xs font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.561 4.14 1.535 5.875L.057 23.985l6.293-1.648A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.877 9.877 0 01-5.031-1.376l-.361-.214-3.735.979 1-3.639-.235-.374A9.872 9.872 0 012.106 12C2.106 6.53 6.53 2.106 12 2.106c5.471 0 9.894 4.424 9.894 9.894 0 5.471-4.423 9.894-9.894 9.894z" />
              </svg>
              WhatsApp Us
            </a>
          </div>

          {/* Free Tools */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-xs uppercase tracking-widest">Free Tools</h3>
            <ul className="space-y-2.5">
              {tools.map((t) => (
                <li key={t.href}>
                  <Link href={t.href} className="text-purple-400 hover:text-white text-xs transition-colors">
                    {t.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/tools" className="text-gold-400 hover:text-gold-500 text-xs font-medium transition-colors">
                  View All 15 Tools →
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Privacy badge */}
      <div className="border-t border-purple-900/60">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-center gap-2 text-xs text-purple-500">
            <Shield size={12} className="text-green-400" />
            <span>All tools run 100% in your browser. No data is sent to any server.</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-purple-900/60">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-purple-500">
            <p>© 2025 CC Associates. All rights reserved. Pune, Maharashtra. Since 2025.</p>
            <p className="text-center md:text-right max-w-lg">
              <strong className="text-purple-400">Disclaimer:</strong> Information on this website is for general guidance only and does not constitute legal or financial advice. Results from tools are indicative. Always consult a qualified professional.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
