import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GSTR-2A Reconciliation Tool",
  description:
    "Free GSTR-2A Reconciliation Tool — match your purchase register with GSTR-2A data to identify ITC mismatches instantly. Upload Excel/CSV files. 100% browser-based, no data uploaded to server.",
  keywords: [
    "GSTR-2A reconciliation tool",
    "GSTR-2A mismatch finder",
    "ITC reconciliation online",
    "GST purchase reconciliation",
    "GSTR-2A vs purchase register",
    "free GST reconciliation tool",
  ],
  alternates: { canonical: "https://associatepiyush.in/tools/gstr2a-recon" },
  openGraph: {
    title: "Free GSTR-2A Reconciliation Tool | Associate Piyush",
    description: "Match your purchase register with GSTR-2A instantly. Find ITC mismatches. No data stored.",
    url: "https://associatepiyush.in/tools/gstr2a-recon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
