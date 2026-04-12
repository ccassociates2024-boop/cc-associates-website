import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advance Tax Calculator FY 2026-27",
  description:
    "Free Advance Tax Calculator for FY 2026-27 — calculate quarterly advance tax instalments due on 15 June, 15 September, 15 December, 15 March. Avoid interest under Section 234B & 234C.",
  keywords: [
    "advance tax calculator 2026-27",
    "advance tax due dates",
    "section 234B 234C interest",
    "quarterly advance tax india",
    "advance tax payment schedule",
    "advance tax calculator india",
  ],
  alternates: { canonical: "https://associatepiyush.in/tools/advance-tax" },
  openGraph: {
    title: "Free Advance Tax Calculator FY 2026-27 | Associate Piyush",
    description: "Calculate advance tax instalments and due dates. Avoid Sec 234B/234C interest.",
    url: "https://associatepiyush.in/tools/advance-tax",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
