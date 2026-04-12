import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF Compress Tool — Reduce PDF Size Free",
  description:
    "Free PDF Compressor — reduce PDF file size without losing quality. Perfect for compressing income tax documents, GST filings, and audit reports. 100% browser-based, no data uploaded.",
  keywords: [
    "PDF compress online free",
    "reduce PDF size",
    "compress PDF file",
    "PDF compressor free",
    "shrink PDF online",
    "PDF size reducer",
  ],
  alternates: { canonical: "https://associatepiyush.in/tools/pdf-compress" },
  openGraph: {
    title: "Free PDF Compressor | Associate Piyush",
    description: "Reduce PDF file size instantly. No quality loss. 100% private — files stay in your browser.",
    url: "https://associatepiyush.in/tools/pdf-compress",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
