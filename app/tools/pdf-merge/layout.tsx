import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF Merge Tool — Merge PDFs Free",
  description:
    "Free PDF Merge Tool — combine multiple PDF files into one instantly. Drag and drop, reorder pages, download merged PDF. 100% browser-based. No file uploaded to any server.",
  keywords: [
    "PDF merge online free",
    "combine PDF files",
    "merge PDF tool",
    "join PDF online",
    "PDF combiner free",
    "merge PDF browser",
  ],
  alternates: { canonical: "https://associatepiyush.in/tools/pdf-merge" },
  openGraph: {
    title: "Free PDF Merge Tool | Associate Piyush",
    description: "Merge multiple PDFs into one. Drag, drop, reorder, download. 100% private — no upload.",
    url: "https://associatepiyush.in/tools/pdf-merge",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
