import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bank Statement Analyser",
  description:
    "Free Bank Statement Analyser — upload your bank statement (CSV/Excel) and get instant category-wise expense summary, income vs expense breakdown, and transaction insights. No data stored.",
  keywords: [
    "bank statement analyser",
    "bank statement analyser online",
    "expense categorisation tool",
    "bank CSV analyser",
    "transaction summary tool",
    "free bank statement tool india",
  ],
  alternates: { canonical: "https://associatepiyush.in/tools/bank-statement" },
  openGraph: {
    title: "Free Bank Statement Analyser | Associate Piyush",
    description: "Upload bank statement CSV and get instant expense summary & insights. 100% private.",
    url: "https://associatepiyush.in/tools/bank-statement",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
