import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ITR Tax Estimator FY 2026-27",
  description:
    "Free Income Tax Estimator for FY 2026-27 — compare Old vs New Tax Regime using Income-tax Act 2025 slabs. Zero tax up to ₹12L in new regime (87A rebate). Includes surcharge & cess.",
  keywords: [
    "ITR estimator 2026-27",
    "income tax calculator 2026-27",
    "old vs new tax regime calculator",
    "income tax slab 2026",
    "87A rebate calculator",
    "new tax regime slab",
    "income tax estimator india",
  ],
  alternates: { canonical: "https://associatepiyush.in/tools/itr-estimator" },
  openGraph: {
    title: "Free ITR Tax Estimator FY 2026-27 | Associate Piyush",
    description: "Compare Old vs New Tax Regime. New regime: zero tax up to ₹12L. Updated for Income-tax Act 2025.",
    url: "https://associatepiyush.in/tools/itr-estimator",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
