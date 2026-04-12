import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tally Ledger Reconciliation Tool",
  description:
    "Free Tally Ledger Reconciliation Tool — upload Tally ledger exports and bank statements to automatically match entries and find unreconciled transactions. Browser-based, no data stored.",
  keywords: [
    "Tally ledger reconciliation",
    "Tally bank reconciliation tool",
    "Tally ledger matcher",
    "Tally vs bank statement",
    "free Tally reconciliation",
    "ledger reconciliation online india",
  ],
  alternates: { canonical: "https://associatepiyush.in/tools/tally-ledger" },
  openGraph: {
    title: "Free Tally Ledger Reconciliation Tool | Associate Piyush",
    description: "Match Tally ledger with bank statement instantly. Find unreconciled entries. No data stored.",
    url: "https://associatepiyush.in/tools/tally-ledger",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
