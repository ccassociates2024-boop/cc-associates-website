import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertCircle, MessageCircle, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "GST Refund for Exporters: LUT vs IGST Method — Complete Guide",
  description:
    "Complete guide to GST refund for exporters and SEZ suppliers — Letter of Undertaking (LUT) vs IGST payment method, zero-rated supply rules, refund process under Rule 89/96A, and ITC refund calculation. By CC Associates.",
  keywords: [
    "GST refund exporters",
    "LUT GST exporters",
    "IGST refund exporters",
    "zero rated supply GST",
    "GST refund SEZ suppliers",
    "letter of undertaking GST",
    "export under LUT",
    "GST ITC refund exporters",
    "rule 89 GST refund",
  ],
  alternates: { canonical: "https://cc-associates-website.vercel.app/resources/gst-refund-exporters-lut-igst" },
  openGraph: {
    title: "GST Refund for Exporters: LUT vs IGST Method | CC Associates",
    description: "Export under LUT (no IGST) or with IGST payment? Which method gives better cash flow? Complete GST refund guide for Indian exporters and SEZ suppliers.",
    url: "https://cc-associates-website.vercel.app/resources/gst-refund-exporters-lut-igst",
  },
};

const WA = "https://wa.me/918421465966?text=Hello%2C%20I%20need%20help%20with%20GST%20refund%20for%20exports%20and%20LUT%20filing.";

export default function GSTRefundExportersPage() {
  return (
    <div className="pt-16 min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-primary py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/resources" className="inline-flex items-center gap-2 text-blue-300 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={14} /> Back to Resources
          </Link>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">GST</span>
            <span className="text-blue-300 text-xs">June 2026 · 12 min read</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
            GST Refund for Exporters: LUT vs IGST Method — Which is Better?
          </h1>
          <p className="text-blue-200 text-base leading-relaxed">
            If you export goods or services from India, you are entitled to zero-rated supply treatment under GST —
            meaning your exports carry no GST burden. But you need to either file a Letter of Undertaking (LUT)
            or pay IGST and claim it back. Here is a complete breakdown of both methods.
          </p>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* What is zero-rated */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-dark mb-3">1. What is Zero-Rated Supply Under GST?</h2>
          <p className="text-muted leading-relaxed mb-4">
            Under Section 16 of the IGST Act, 2017, a &quot;zero-rated supply&quot; is a supply on which no GST is
            charged but the supplier is still eligible to claim the full Input Tax Credit (ITC) on inputs used
            for making that supply. This makes it different from exempted supply, where ITC cannot be claimed.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm mb-4">
            <div className="font-semibold text-blue-900 mb-2">Zero-Rated Supply includes:</div>
            <div className="space-y-1.5">
              {[
                "Export of goods outside India",
                "Export of services (payment in foreign exchange)",
                "Supply of goods to a Special Economic Zone (SEZ) unit or developer",
                "Supply of services to an SEZ unit or developer",
              ].map(item => (
                <div key={item} className="flex items-start gap-2 text-blue-800">
                  <CheckCircle size={13} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-muted leading-relaxed">
            The GST law gives exporters and SEZ suppliers two options: either export under a Letter of Undertaking
            (LUT) without paying IGST and claim ITC refund, or pay IGST on export and claim refund of the IGST paid.
          </p>
        </section>

        {/* Two methods */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-dark mb-3">2. The Two Methods — LUT vs IGST Payment</h2>

          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            {/* LUT method */}
            <div className="bg-white border-2 border-primary/20 rounded-xl p-5">
              <div className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Method A — Export Under LUT</div>
              <div className="text-sm font-bold text-dark mb-3">Export Without IGST + Claim ITC Refund</div>
              <div className="space-y-2 text-sm text-muted">
                <div className="flex items-start gap-2"><CheckCircle size={13} className="text-green-500 mt-0.5 flex-shrink-0" /><span>No IGST charged on export invoices</span></div>
                <div className="flex items-start gap-2"><CheckCircle size={13} className="text-green-500 mt-0.5 flex-shrink-0" /><span>Claim refund of accumulated ITC on inputs</span></div>
                <div className="flex items-start gap-2"><CheckCircle size={13} className="text-green-500 mt-0.5 flex-shrink-0" /><span>Better for working capital (no IGST outflow)</span></div>
                <div className="flex items-start gap-2"><CheckCircle size={13} className="text-green-500 mt-0.5 flex-shrink-0" /><span>Best for regular exporters with high input costs</span></div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-muted">
                Refund basis: ITC accumulated on inputs used for zero-rated supply
              </div>
            </div>

            {/* IGST method */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
              <div className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Method B — Export With IGST</div>
              <div className="text-sm font-bold text-dark mb-3">Pay IGST on Export + Claim Refund of IGST Paid</div>
              <div className="space-y-2 text-sm text-muted">
                <div className="flex items-start gap-2"><CheckCircle size={13} className="text-green-500 mt-0.5 flex-shrink-0" /><span>Pay IGST on export invoice (set-off from ITC first)</span></div>
                <div className="flex items-start gap-2"><CheckCircle size={13} className="text-green-500 mt-0.5 flex-shrink-0" /><span>Refund auto-processed via shipping bill + GSTR-1</span></div>
                <div className="flex items-start gap-2"><AlertCircle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" /><span>Blocks working capital (IGST paid upfront, refund awaited)</span></div>
                <div className="flex items-start gap-2"><CheckCircle size={13} className="text-green-500 mt-0.5 flex-shrink-0" /><span>Simpler for one-time or occasional exporters</span></div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-muted">
                Refund basis: Actual IGST paid on exported goods/services
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm">
            <div className="font-semibold text-green-900 mb-1">💡 Which method should you choose?</div>
            <p className="text-green-800">
              <strong>LUT (Method A) is almost always better for regular exporters</strong> — it avoids upfront
              IGST cash outflow and gives faster ITC refunds. Method B is practical only if your input ITC is
              minimal (you mostly provide services with low input costs) or if you are a one-time exporter.
            </p>
          </div>
        </section>

        {/* LUT in detail */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-dark mb-3">3. LUT (Letter of Undertaking) — How to File</h2>
          <p className="text-muted leading-relaxed mb-4">
            A Letter of Undertaking is a declaration submitted on the GST portal (Form GST RFD-11) by the exporter,
            undertaking that they will comply with all GST export conditions and pay any IGST if obligations are not met.
          </p>

          <div className="space-y-3 mb-5">
            {[
              {
                step: "01",
                title: "Eligibility",
                detail: "Any registered GST taxpayer who exports goods or services (including SEZ supplies) is eligible. Exception: taxpayers who have been prosecuted for tax evasion > ₹2.5 crore must pay IGST first."
              },
              {
                step: "02",
                title: "Annual Filing",
                detail: "LUT must be filed once every financial year — before the first export in that FY. It is valid for the entire FY. File fresh LUT at the start of each new FY."
              },
              {
                step: "03",
                title: "How to file",
                detail: "Login to GST Portal → Services → User Services → Furnish Letter of Undertaking (GST RFD-11). Self-declaration, no physical submission. Usually approved instantly."
              },
              {
                step: "04",
                title: "Export invoices",
                detail: "Once LUT is approved, raise export invoices with the note: 'Supply meant for Export under LUT without payment of IGST.' Mention the LUT number and date on invoices."
              },
            ].map(({ step, title, detail }) => (
              <div key={step} className="flex items-start gap-4 bg-white border border-gray-100 rounded-xl p-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">{step}</span>
                </div>
                <div>
                  <div className="font-semibold text-dark text-sm">{title}</div>
                  <div className="text-muted text-sm mt-0.5">{detail}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ITC Refund */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-dark mb-3">4. ITC Refund for LUT Exporters — Rule 89 Calculation</h2>
          <p className="text-muted leading-relaxed mb-4">
            When you export under LUT, you accumulate ITC on your input materials and services but cannot set it
            off since you have no output tax liability. You can claim this accumulated ITC as a cash refund
            from the GST department under Rule 89(4) of CGST Rules.
          </p>

          <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 mb-4">
            <div className="font-semibold text-primary text-xs uppercase tracking-widest mb-3">Refund Formula (Rule 89(4))</div>
            <div className="font-mono text-sm text-dark bg-white rounded-lg p-3 border border-gray-100">
              Refund Amount = (Turnover of zero-rated supply / Adjusted total turnover) × Net ITC
            </div>
            <div className="mt-3 text-xs text-muted space-y-1">
              <div>• <strong>Net ITC</strong> = Total eligible ITC availed in the period (CGST + SGST + IGST)</div>
              <div>• <strong>Adjusted total turnover</strong> = All taxable supplies including zero-rated, minus exempt supply, minus supplies taxable at NIL rate</div>
              <div>• Refund claim period: Minimum 1 month, maximum 2 years from relevant date</div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
            <div className="flex items-start gap-2 text-amber-800">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0 text-amber-600" />
              <div>
                <strong>Common mistake:</strong> Many exporters don&apos;t claim refund for months because they think the department will process it automatically. GST ITC refund must be applied for proactively via <strong>Form GST RFD-01</strong> on the GST portal.
              </div>
            </div>
          </div>
        </section>

        {/* SEZ Suppliers */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-dark mb-3">5. GST Refund for SEZ Suppliers</h2>
          <p className="text-muted leading-relaxed mb-3">
            Supply of goods or services to an SEZ unit or SEZ developer is treated as zero-rated supply. The same
            two methods (LUT or IGST payment) apply. Key difference: you need an endorsement on the invoice from
            the authorised officer of the SEZ.
          </p>
          <div className="space-y-2">
            {[
              "Supply to SEZ must be for authorised operations (as per SEZ approval letter)",
              "SEZ unit provides a letter/certificate confirming the supply is for authorised operations",
              "Both goods and services supplies to SEZ qualify for zero-rating",
              "LUT covers both export and SEZ supply — one LUT per FY is sufficient",
              "Refund calculation is the same as for regular exporters (Rule 89(4))",
            ].map(item => (
              <div key={item} className="flex items-start gap-2 text-sm text-muted">
                <CheckCircle size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* IGST method detail */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-dark mb-3">6. IGST Method — Auto-Refund via Shipping Bill</h2>
          <p className="text-muted leading-relaxed mb-4">
            If you export with IGST payment, the refund is largely automated through the integration between GSTN
            and ICEGATE (Indian Customs). The shipping bill filed at customs effectively acts as a refund application.
          </p>
          <div className="space-y-3">
            {[
              { step: "01", title: "File GSTR-1", detail: "Report export invoices in Table 6A of GSTR-1. Mention shipping bill number and date." },
              { step: "02", title: "Shipping Bill at Customs", detail: "File shipping bill at customs portal (ICEGATE). Ensure EGM (Export General Manifest) is filed by the shipping line." },
              { step: "03", title: "Auto-matching", detail: "GSTN and ICEGATE systems match the invoice details from GSTR-1 with the shipping bill data." },
              { step: "04", title: "Refund to bank", detail: "Once matched, IGST refund is automatically credited to your bank account registered on the GST portal. Usually within 2–3 weeks of EGM filing." },
            ].map(({ step, title, detail }) => (
              <div key={step} className="flex items-start gap-4 bg-white border border-gray-100 rounded-xl p-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">{step}</span>
                </div>
                <div>
                  <div className="font-semibold text-dark text-sm">{title}</div>
                  <div className="text-muted text-sm mt-0.5">{detail}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick comparison */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-dark mb-3">7. Quick Comparison — LUT vs IGST</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">Factor</th>
                  <th className="text-center py-3 px-4 font-medium">LUT (Recommended)</th>
                  <th className="text-center py-3 px-4 font-medium">IGST Payment</th>
                </tr>
              </thead>
              <tbody className="text-muted">
                {[
                  ["Cash Flow", "✅ Better — no IGST outflow", "⚠️ IGST outflow until refund"],
                  ["Refund Type", "ITC accumulated on inputs", "IGST actually paid on export"],
                  ["Refund Speed", "15–60 days (application-based)", "2–4 weeks (auto-processing)"],
                  ["Compliance", "Annual LUT + RFD-01 each period", "No LUT; linked to shipping bill"],
                  ["Best for", "Regular exporters with high inputs", "Occasional/service exporters"],
                  ["Refund Amount", "Proportional ITC on export portion", "100% of IGST paid on exports"],
                ].map(([factor, lut, igst]) => (
                  <tr key={factor} className="border-b border-gray-100 even:bg-background">
                    <td className="py-3 px-4 font-medium text-dark">{factor}</td>
                    <td className="py-3 px-4 text-center">{lut}</td>
                    <td className="py-3 px-4 text-center">{igst}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-primary rounded-xl p-6 text-white mt-8">
          <h3 className="text-lg font-bold mb-2">Need help with GST refund for exports or SEZ supply?</h3>
          <p className="text-blue-200 text-sm mb-5">
            We handle end-to-end GST refund applications for exporters and SEZ suppliers — LUT filing, ITC
            reconciliation, RFD-01 application, and follow-up with the GST department. First consultation is free.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href={WA} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors">
              <MessageCircle size={15} /> WhatsApp Us Now
            </a>
            <Link href="/services#gst"
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors">
              View GST Services <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <p className="text-xs text-muted mt-6 leading-relaxed">
          <strong>Disclaimer:</strong> GST rules and procedures are updated regularly. This guide reflects
          CGST/IGST Act provisions and CBDT/GSTN notifications as of June 2026. Always verify current rules
          and consult a GST practitioner for your specific situation.
          © 2026 CC Associates, Pune.
        </p>
      </article>
    </div>
  );
}
