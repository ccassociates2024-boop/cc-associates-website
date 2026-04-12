import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Capital Gains Tax Calculator FY 2026-27",
  description:
    "Free Capital Gains Tax Calculator for FY 2026-27 — calculate STCG & LTCG tax on listed equity shares, equity mutual funds, debt mutual funds, and property/land under Income-tax Act 2025. Includes indexation, 87A rebate, surcharge & cess.",
  keywords: [
    "capital gains tax calculator india",
    "STCG LTCG calculator 2026-27",
    "equity capital gains tax",
    "property capital gains tax india",
    "section 111A 112A tax",
    "long term capital gains exemption",
    "indexation benefit property",
    "capital gains calculator FY 2026-27",
  ],
  alternates: { canonical: "https://associatepiyush.in/tools/capital-gains" },
  openGraph: {
    title: "Capital Gains Tax Calculator FY 2026-27 | Associate Piyush",
    description:
      "Calculate STCG & LTCG on equity, mutual funds & property. Indexation, exemptions, surcharge & cess — FY 2026-27.",
    url: "https://associatepiyush.in/tools/capital-gains",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
