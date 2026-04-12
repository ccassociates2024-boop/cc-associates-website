import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personal Finance Dashboard — Free Indian CFO Tool | CC Associates",
  description:
    "Free personal finance dashboard for Indian taxpayers. Track income, expenses, investments, EMIs, tax liability (old vs new regime), financial goals, and net worth. 100% browser-based — no login, no data uploaded.",
  keywords: [
    "personal finance dashboard india",
    "free financial planning tool india",
    "income tax planner 2026-27",
    "investment tracker india",
    "EMI manager",
    "net worth tracker india",
    "80C deduction optimizer",
    "advance tax calculator",
    "financial health score",
  ],
  alternates: {
    canonical: "https://associate-piyush-bduu.vercel.app/tools/dashboard",
  },
  openGraph: {
    title: "Personal Finance Dashboard | CC Associates — Free, No Login",
    description:
      "Track income, expenses, investments, tax liability & goals. Built for Indian taxpayers. 100% browser-based.",
    url: "https://associate-piyush-bduu.vercel.app/tools/dashboard",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
