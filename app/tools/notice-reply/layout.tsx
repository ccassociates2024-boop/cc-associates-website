import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Income Tax Notice Reply Generator — Free Draft in 60 Seconds",
  description:
    "Generate professional income tax notice reply drafts instantly — Section 143(1), 148A(b), 139(9), 245, 156, 131. Free, no login. Review with CC Associates CA, Pune: +91 84214 65966.",
  keywords: [
    "income tax notice reply draft",
    "section 143(1) notice reply",
    "section 148A reassessment reply",
    "section 139(9) defective return reply",
    "tax notice reply generator free",
    "income tax notice reply format india",
    "section 245 refund adjustment reply",
    "income tax demand notice reply",
  ],
  alternates: { canonical: "https://cc-associates-website.vercel.app/tools/notice-reply" },
  openGraph: {
    title: "Income Tax Notice Reply Generator | CC Associates",
    description:
      "Generate professional IT notice replies for Sec 143(1), 148A, 139(9), 245, 156, 131. Free draft in 60 seconds.",
    url: "https://cc-associates-website.vercel.app/tools/notice-reply",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
