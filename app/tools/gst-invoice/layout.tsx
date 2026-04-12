import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GST Invoice Generator",
  description:
    "Free GST Invoice Generator — create professional GST-compliant tax invoices instantly. Add GSTIN, HSN/SAC codes, CGST/SGST/IGST. Download as PDF. 100% browser-based, no data stored.",
  keywords: [
    "GST invoice generator",
    "free GST invoice maker",
    "GST tax invoice online",
    "GSTIN invoice creator",
    "HSN code invoice",
    "CGST SGST invoice generator",
  ],
  alternates: { canonical: "https://associatepiyush.in/tools/gst-invoice" },
  openGraph: {
    title: "Free GST Invoice Generator | Associate Piyush",
    description: "Create GST-compliant invoices instantly — CGST, SGST, IGST. Download as PDF. No signup.",
    url: "https://associatepiyush.in/tools/gst-invoice",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
