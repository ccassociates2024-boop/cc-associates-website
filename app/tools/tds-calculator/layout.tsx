import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TDS Calculator FY 2026-27",
  description:
    "Free TDS Calculator for FY 2026-27 — calculate Tax Deducted at Source for salary, contractor payments, rent, professional fees under all sections (192, 194C, 194I, 194J). Instant results.",
  keywords: [
    "TDS calculator 2026-27",
    "TDS rate calculator india",
    "section 192 TDS",
    "section 194C TDS",
    "TDS on salary calculator",
    "TDS on rent calculator",
    "TDS calculator free",
  ],
  alternates: { canonical: "https://associatepiyush.in/tools/tds-calculator" },
  openGraph: {
    title: "Free TDS Calculator FY 2026-27 | Associate Piyush",
    description: "Calculate TDS under all sections instantly — salary, contractor, rent, professional fees. FY 2026-27.",
    url: "https://associatepiyush.in/tools/tds-calculator",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
