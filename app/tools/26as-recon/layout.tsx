import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "26AS Reconciliation Tool",
  description:
    "Free 26AS Reconciliation Tool — match Form 26AS TDS entries with your books of accounts. Identify unmatched TDS credits instantly. Upload and reconcile in seconds. No data stored.",
  keywords: [
    "26AS reconciliation tool",
    "Form 26AS TDS reconciliation",
    "26AS vs books reconciliation",
    "TDS credit reconciliation",
    "free 26AS checker",
    "26AS mismatch finder",
  ],
  alternates: { canonical: "https://associatepiyush.in/tools/26as-recon" },
  openGraph: {
    title: "Free 26AS Reconciliation Tool | Associate Piyush",
    description: "Match Form 26AS TDS with your books. Find mismatches instantly. No data stored.",
    url: "https://associatepiyush.in/tools/26as-recon",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
