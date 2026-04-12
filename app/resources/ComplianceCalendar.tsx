"use client";

import { useMemo } from "react";

interface DueItem {
  date: string; // "YYYY-MM-DD" for comparison
  dateLabel: string; // display
  description: string;
  category: string;
}

const APRIL_DUES: DueItem[] = [
  { date: "2026-04-07", dateLabel: "7 April", description: "TDS deposit for March (Government deductors)", category: "TDS" },
  { date: "2026-04-11", dateLabel: "11 April", description: "GSTR-1 for March (monthly filers)", category: "GST" },
  { date: "2026-04-13", dateLabel: "13 April", description: "GSTR-1 — QRMP quarterly filers (Jan–Mar)", category: "GST" },
  { date: "2026-04-20", dateLabel: "20 April", description: "GSTR-3B for March (monthly filers)", category: "GST" },
  { date: "2026-04-25", dateLabel: "25 April", description: "GST PMT-06 — QRMP monthly payment (March)", category: "GST" },
  { date: "2026-04-30", dateLabel: "30 April", description: "TDS deposit for March (Non-government deductors)", category: "TDS" },
  { date: "2026-04-30", dateLabel: "30 April", description: "TCS return for January–March quarter (Form 27EQ)", category: "TCS" },
];

const CAT_COLORS: Record<string, string> = {
  TDS: "bg-purple-100 text-purple-700",
  GST: "bg-blue-100 text-blue-700",
  TCS: "bg-orange-100 text-orange-700",
};

export default function ComplianceCalendar() {
  const today = useMemo(() => new Date(), []);

  const items = APRIL_DUES.map((item) => {
    const due = new Date(item.date);
    const isOverdue = due < today;
    const isToday = due.toDateString() === today.toDateString();
    return { ...item, isOverdue, isToday };
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-primary text-white">
            <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider w-28">Due Date</th>
            <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider">Compliance</th>
            <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider w-24">Type</th>
            <th className="text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider w-28">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {items.map((item, i) => (
            <tr
              key={i}
              className={`transition-colors ${
                item.isOverdue
                  ? "bg-amber-50 hover:bg-amber-100/60"
                  : item.isToday
                  ? "bg-green-50 hover:bg-green-100/60"
                  : "hover:bg-gray-50"
              }`}
            >
              <td className="px-5 py-3.5 font-semibold text-dark whitespace-nowrap">
                {item.dateLabel}
              </td>
              <td className="px-5 py-3.5 text-dark">{item.description}</td>
              <td className="px-5 py-3.5">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${CAT_COLORS[item.category]}`}>
                  {item.category}
                </span>
              </td>
              <td className="px-5 py-3.5 whitespace-nowrap">
                {item.isOverdue ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                    Overdue
                  </span>
                ) : item.isToday ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    Due Today
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                    Upcoming
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
