import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GST Late Fee Calculator",
  description:
    "Free GST Late Fee Calculator — calculate late fees for GSTR-1, GSTR-3B, GSTR-9, GSTR-9C. Includes CGST & SGST breakup. Daily late fee as per GST Act.",
  keywords: [
    "GST late fee calculator",
    "GSTR-3B late fee",
    "GSTR-1 late fee calculator",
    "GSTR-9 late fee",
    "GST penalty calculator",
    "GST delay penalty india",
  ],
  alternates: { canonical: "https://associatepiyush.in/tools/gst-late-fee" },
  openGraph: {
    title: "Free GST Late Fee Calculator | Associate Piyush",
    description: "Calculate GSTR-1, GSTR-3B, GSTR-9 late fees instantly. CGST + SGST breakup included.",
    url: "https://associatepiyush.in/tools/gst-late-fee",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
