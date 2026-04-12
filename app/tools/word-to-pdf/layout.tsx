import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Word to PDF Converter — Free Online",
  description:
    "Free Word to PDF Converter — convert .docx files to PDF instantly in your browser. Perfect for converting tax reports, audit documents, and business letters. No file uploaded to server.",
  keywords: [
    "word to PDF converter free",
    "docx to PDF online",
    "convert Word to PDF",
    "DOCX to PDF converter",
    "free word to PDF",
    "word document to PDF browser",
  ],
  alternates: { canonical: "https://associatepiyush.in/tools/word-to-pdf" },
  openGraph: {
    title: "Free Word to PDF Converter | Associate Piyush",
    description: "Convert .docx to PDF instantly in your browser. 100% private — no file upload.",
    url: "https://associatepiyush.in/tools/word-to-pdf",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
