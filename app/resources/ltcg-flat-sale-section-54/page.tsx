import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "LTCG on Flat Sale & Section 54 Exemption — Complete Guide",
  description:
    "Complete guide to Long Term Capital Gain tax on flat/house sale in India. CII indexation, 12.5% vs 20% rates, Section 54 exemption conditions, CGAS, and Section 54EC bonds — by CC Associates, Pune.",
  keywords: [
    "LTCG on flat sale",
    "long term capital gain property india",
    "section 54 exemption",
    "capital gains on house sale",
    "ltcg indexation",
    "capital gains account scheme",
    "section 54EC bonds",
    "property tax planning india",
  ],
  alternates: { canonical: "https://cc-associates-website.vercel.app/resources/ltcg-flat-sale-section-54" },
  openGraph: {
    title: "LTCG on Flat Sale & Section 54 — Complete Guide | CC Associates",
    description: "Tax on property sale in India: rates, indexation, Section 54 exemption, CGAS, and 54EC bonds explained in full.",
    url: "https://cc-associates-website.vercel.app/resources/ltcg-flat-sale-section-54",
  },
};

const WA = "https://wa.me/918421465966?text=Hello%2C%20I%20need%20help%20with%20LTCG%20on%20property%20sale%20and%20Section%2054%20exemption.";

export default function LTCGFlatSalePage() {
  return (
    <div className="pt-16 min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-primary py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/resources" className="inline-flex items-center gap-2 text-blue-300 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={14} /> Back to Resources
          </Link>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-800">Income Tax</span>
            <span className="text-blue-300 text-xs">June 2026 · 10 min read</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
            LTCG on Flat Sale: Tax Rates, Indexation & Section 54 Exemption
          </h1>
          <p className="text-blue-200 text-base leading-relaxed">
            Selling a flat, house, or plot? Here is everything you need to know about Long Term Capital Gain tax —
            the new 12.5% vs 20% choice, CII indexation, and how to legally reduce or eliminate your tax liability
            using Section 54 and 54EC.
          </p>
        </div>
      </section>

      {/* Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 prose prose-sm prose-slate max-w-none">

        {/* Holding Period */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-dark mb-3">1. What Qualifies as Long Term Capital Gain on Property?</h2>
          <p className="text-muted leading-relaxed mb-3">
            For immovable property (house, flat, plot, commercial property), the holding period for LTCG treatment
            was reduced from 36 months to <strong>24 months</strong> by Finance Act 2024, effective from
            23 July 2024. If you held the property for 24 months or more before selling, the gain is treated as LTCG.
            If held for less than 24 months, it is STCG — taxed at your normal slab rate.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
            <div className="font-semibold text-blue-900 mb-2">Quick Check: Is Your Gain LTCG?</div>
            <div className="space-y-1 text-blue-800">
              <div className="flex items-start gap-2"><CheckCircle size={14} className="text-blue-600 mt-0.5 flex-shrink-0" /><span>Held property for 24+ months → <strong>LTCG</strong> (taxed at lower, flat rate)</span></div>
              <div className="flex items-start gap-2"><AlertCircle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" /><span>Held for less than 24 months → STCG (added to total income, taxed at slab rate)</span></div>
            </div>
          </div>
        </section>

        {/* Tax Rates */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-dark mb-3">2. LTCG Tax Rates on Property — Post Finance Act 2024</h2>
          <p className="text-muted leading-relaxed mb-4">
            The Finance Act 2024 (Budget July 23, 2024) introduced a major change. The tax rate on LTCG from
            immovable property changed from 20% (with indexation) to 12.5% (without indexation). However,
            a grandfathering provision was added for properties acquired before July 23, 2024.
          </p>

          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">Acquisition Date</th>
                  <th className="text-left py-3 px-4 font-medium">Option Available</th>
                  <th className="text-right py-3 px-4 font-medium">Tax Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 bg-background">
                  <td className="py-3 px-4 text-muted" rowSpan={2}>Before July 23, 2024</td>
                  <td className="py-3 px-4">Option A: Without Indexation</td>
                  <td className="py-3 px-4 text-right font-semibold text-dark">12.5%</td>
                </tr>
                <tr className="border-b border-gray-100 bg-white">
                  <td className="py-3 px-4">Option B: With CII Indexation</td>
                  <td className="py-3 px-4 text-right font-semibold text-dark">20%</td>
                </tr>
                <tr className="bg-background">
                  <td className="py-3 px-4 text-muted">On or After July 23, 2024</td>
                  <td className="py-3 px-4">Without Indexation only</td>
                  <td className="py-3 px-4 text-right font-semibold text-dark">12.5%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
            <div className="font-semibold text-amber-900 mb-1">💡 Which option should you choose (pre-July 23, 2024 property)?</div>
            <p className="text-amber-800">
              Compare both: compute LTCG with indexation (taxed @20%) and without indexation (taxed @12.5%).
              Choose whichever gives a <strong>lower final tax amount</strong>. For properties purchased long ago
              (e.g., before 2010), indexation typically reduces the gain significantly and the 20% option often
              wins. For recently acquired properties (e.g., post-2018), 12.5% without indexation may be better.
              Use our free <Link href="/tools/ltcg-property" className="text-primary font-semibold underline">LTCG Property Calculator</Link> to compare both options instantly.
            </p>
          </div>
        </section>

        {/* CII Indexation */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-dark mb-3">3. How CII Indexation Works</h2>
          <p className="text-muted leading-relaxed mb-3">
            Cost Inflation Index (CII) is a number published by CBDT each year (base year 2001-02 = 100).
            Indexation adjusts your purchase cost upward for inflation, reducing the taxable LTCG.
          </p>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4 font-mono text-sm text-dark">
            <div className="mb-2 font-semibold text-primary font-sans text-xs uppercase tracking-widest">Indexed Cost Formula</div>
            Indexed Cost = Purchase Price × (CII of Sale Year / CII of Purchase Year)
            <br /><br />
            <span className="text-muted font-sans text-xs">Example: Flat bought in FY 2010-11 for ₹30L. Sold in FY 2025-26.</span>
            <br />
            <span className="text-muted font-sans text-xs">Indexed Cost = ₹30L × (380 / 167) = <strong>₹68.26L</strong></span>
            <br />
            <span className="text-muted font-sans text-xs">LTCG (if sold at ₹1 Cr) = ₹1 Cr − ₹68.26L = <strong>₹31.74L</strong></span>
            <br />
            <span className="text-muted font-sans text-xs">Tax @20% = <strong>₹6.35L</strong> (compare with 12.5% on ₹70L without indexation = <strong>₹8.75L</strong>)</span>
          </div>
          <p className="text-muted text-sm">The CII table from 2001-02 to 2025-26 is available in our <Link href="/tools/ltcg-property" className="text-primary font-semibold">LTCG Calculator</Link>.</p>
        </section>

        {/* Section 54 */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-dark mb-3">4. Section 54 Exemption — Reinvest in New Residential Property</h2>
          <p className="text-muted leading-relaxed mb-4">
            Section 54 is the most widely used LTCG exemption. If you sell a residential property and reinvest
            the LTCG amount in a new residential property in India, the reinvested amount is exempt from tax.
          </p>

          <div className="space-y-3 mb-4">
            {[
              { title: "Who can claim?", detail: "Individual and HUF taxpayers (not companies or firms)" },
              { title: "What asset must be sold?", detail: "A residential house property (building, flat, or land appurtenant to a building)" },
              { title: "Time to buy new house", detail: "Purchase: 1 year before sale or 2 years after sale date. Construction: within 3 years after sale date." },
              { title: "How much is exempt?", detail: "The lower of: (a) LTCG amount or (b) cost of new house. If LTCG = ₹50L and new house costs ₹40L → only ₹40L is exempt." },
              { title: "LTCG ≤ ₹2 Crore?", detail: "If LTCG is ₹2 crore or less, you can invest in TWO residential houses — but only ONCE in a lifetime." },
              { title: "Lock-in period?", detail: "New house must not be transferred within 3 years of purchase/construction. If sold earlier, the exemption is withdrawn." },
            ].map(({ title, detail }) => (
              <div key={title} className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-xl">
                <CheckCircle size={15} className="text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-dark text-sm">{title}</div>
                  <div className="text-muted text-sm mt-0.5">{detail}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CGAS */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-dark mb-3">5. Capital Gains Account Scheme (CGAS) — Don&apos;t Lose Your Exemption</h2>
          <p className="text-muted leading-relaxed mb-3">
            If the sale happens before your ITR due date (31 July for non-audit, 31 Oct for audit cases) but
            you have not yet purchased or constructed the new property, you must deposit the unutilised LTCG
            amount in a <strong>Capital Gains Account Scheme (CGAS)</strong> at an authorised bank before the
            ITR filing deadline.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-red-800">
                <strong>Important:</strong> If you do not deposit in CGAS before the ITR due date AND have not
                invested in a new property, the LTCG becomes fully taxable in that year.
                The CGAS deposit preserves the exemption while you finalise the new property purchase.
              </div>
            </div>
          </div>
        </section>

        {/* Section 54EC */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-dark mb-3">6. Section 54EC — Invest in NHAI / REC Bonds</h2>
          <p className="text-muted leading-relaxed mb-3">
            If you don&apos;t want to buy another property, Section 54EC allows you to invest LTCG in specified
            bonds (NHAI — National Highways Authority of India, and REC — Rural Electrification Corporation)
            to claim exemption.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: "Maximum investment", value: "₹50 lakh per Financial Year" },
              { label: "Time to invest", value: "Within 6 months from date of sale" },
              { label: "Lock-in period", value: "5 years (redemption before = exemption withdrawn)" },
              { label: "Tax on interest earned", value: "Taxable as per slab rate (not capital gains)" },
              { label: "Can claim with Sec 54?", value: "Yes — both Sec 54 and 54EC can be claimed together" },
              { label: "Available for", value: "Individuals, HUFs, Companies, Firms, LLPs" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="text-xs text-muted mb-1">{label}</div>
                <div className="font-semibold text-dark text-sm">{value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Practical Example */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-dark mb-3">7. Practical Example — Flat Sold for ₹1.2 Crore</h2>
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 text-sm">
            <div className="font-semibold text-primary mb-3 text-xs uppercase tracking-widest">Scenario</div>
            <div className="space-y-1 text-muted mb-4">
              <div>Flat purchased in FY 2012-13 for ₹35 lakh (CII: 200). Sold in FY 2025-26 for ₹1.2 crore (CII: 380, est.).</div>
              <div>New flat purchased for ₹55 lakh within 2 years. ₹10 lakh invested in 54EC bonds.</div>
            </div>
            <div className="space-y-2">
              {[
                ["Without indexation (12.5%)", "LTCG = ₹1.2Cr − ₹35L = ₹85L. Less: Sec 54 (₹55L) + 54EC (₹10L) = ₹65L. Taxable = ₹20L. Tax = ₹2.5L + cess"],
                ["With indexation (20%)", "Indexed cost = ₹35L × (380/200) = ₹66.5L. LTCG = ₹1.2Cr − ₹66.5L = ₹53.5L. Less: Sec 54 (₹53.5L). Taxable = ₹0. Tax = ₹0"],
                ["Better option", "20% with indexation — ZERO tax after Section 54 exemption"],
              ].map(([label, detail]) => (
                <div key={label} className="bg-white rounded-lg p-3 border border-gray-100">
                  <div className="font-semibold text-dark text-xs mb-1">{label}</div>
                  <div className="text-muted text-xs">{detail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-primary rounded-xl p-6 text-white mt-8">
          <h3 className="text-lg font-bold mb-2">Selling a property? Let us handle your LTCG computation.</h3>
          <p className="text-blue-200 text-sm mb-5">
            We specialise in LTCG on property sale — including CII indexation, Sec 54/54EC tax planning,
            CGAS deposits, and accurate ITR filing for capital gains. First consultation is free.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href={WA} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors">
              <MessageCircle size={15} /> WhatsApp Us Now
            </a>
            <Link href="/tools/ltcg-property"
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors">
              Use LTCG Calculator <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <p className="text-xs text-muted mt-6 leading-relaxed">
          <strong>Disclaimer:</strong> This guide is for general informational purposes only. Tax laws are subject to change.
          Always consult a qualified Chartered Accountant for your specific situation before making tax decisions.
          © 2026 CC Associates, Pune.
        </p>
      </article>
    </div>
  );
}
