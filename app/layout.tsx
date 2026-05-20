import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingContact from "@/components/FloatingContact";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CC Associates | Tax Advisory, GST, Audit & Litigation | Pune, India",
    template: "%s | CC Associates",
  },
  description:
    "Professional tax and advisory by CC Associates — 950+ income tax cases, GST compliance, TDS, statutory audit, litigation & business advisory. C.A. Sourabh Bhimrao Chavan & C.A. Shruti Sourabh Chavan. Pune. Pan India.",
  keywords: [
    "CC Associates pune",
    "tax consultant pune",
    "GST reconciliation pune",
    "forensic accounting india",
    "income tax advisory pune",
    "TDS compliance",
    "statutory audit pune",
    "CA Sourabh Chavan",
    "C.A. Sourabh Bhimrao Chavan",
    "litigation support pune",
    "business advisory pune",
    "tax notice reply pune",
  ],
  authors: [{ name: "CC Associates" }],
  creator: "CC Associates",
  publisher: "CC Associates",
  metadataBase: new URL("https://associate-piyush-bduu.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://associate-piyush-bduu.vercel.app",
    siteName: "CC Associates",
    title: "CC Associates — Tax & Advisory Practice | Pune",
    description:
      "950+ income tax cases. GST, TDS, Audit, Litigation. C.A. Sourabh Bhimrao Chavan & C.A. Shruti Sourabh Chavan. Since 2025. ccassociates2024@gmail.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CC Associates - Tax & Advisory Practice, Pune",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CC Associates | Tax Advisory, GST, Audit | Pune",
    description:
      "950+ income tax cases. GST, TDS, Audit & Litigation by CC Associates — Pune. Pan India service.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AccountingService",
  name: "CC Associates",
  alternateName: "CC Associates",
  description:
    "Professional tax and advisory practice — 950+ income tax cases, GST compliance, TDS, statutory audit, litigation & business advisory. Based in Pune, India.",
  url: "https://associate-piyush-bduu.vercel.app",
  telephone: "+918421465966",
  email: "ccassociates2024@gmail.com",
  foundingDate: "2025",
  areaServed: "India",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Pune",
    addressRegion: "Maharashtra",
    postalCode: "411001",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "18.5204",
    longitude: "73.8567",
  },
  openingHours: "Mo-Sa 10:00-19:00",
  priceRange: "$$",
  currenciesAccepted: "INR",
  paymentAccepted: "Bank Transfer, UPI",
  employee: [
    {
      "@type": "Person",
      name: "C.A. Sourabh Bhimrao Chavan",
      jobTitle: "Founding Partner — Audit & Advisory",
      telephone: "+918421465966",
      email: "ccassociates2024@gmail.com",
    },
    {
      "@type": "Person",
      name: "C.A. Shruti Sourabh Chavan",
      jobTitle: "Partner — Tax & Compliance",
      telephone: "+918421465966",
      email: "ccassociates2024@gmail.com",
    },
  ],
  serviceType: [
    "Income Tax Advisory",
    "GST Compliance",
    "TDS Compliance",
    "Statutory Audit",
    "Litigation Support",
    "Business Advisory",
    "Forensic Accounting",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased bg-surface">
        <Navbar />
        <main>{children}</main>
        <Footer />
        <FloatingContact />
      </body>
    </html>
  );
}
