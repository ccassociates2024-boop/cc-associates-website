"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, Plus, Trash2, Download, Upload,
  Target, AlertCircle, CheckCircle, Info, X, ChevronDown,
  Home, Car, GraduationCap, Briefcase, Shield, Wallet,
  PiggyBank, BarChart3, FileText, Settings, Users, Calendar,
  MessageCircle, ArrowRight, Edit2, Save, RefreshCw
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type IncomeEntry = {
  id: string; date: string; source: string; amount: number;
  description: string; taxCategory: string;
};
type ExpenseEntry = {
  id: string; date: string; category: string; amount: number;
  description: string; paymentMode: string; taxDeductible: boolean;
};
type Investment = {
  id: string; type: string; name: string; invested: number;
  currentValue: number; date: string; maturityDate: string; linkedGoal: string;
};
type Loan = {
  id: string; type: string; lender: string; principal: number;
  rate: number; tenure: number; startDate: string; emi: number;
};
type Goal = {
  id: string; name: string; target: number; targetDate: string;
  current: number; monthly: number; icon: string;
};
type Settings = {
  name: string; age: number; monthlyBudgets: Record<string, number>;
  bankBalance: number; propertyValue: number;
};
type AppData = {
  income: IncomeEntry[]; expenses: ExpenseEntry[];
  investments: Investment[]; loans: Loan[]; goals: Goal[];
  settings: Settings; netWorthHistory: { month: string; value: number }[];
};

// ── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "cc-associates-finance-v1";
const PURPLE = "#534AB7";
const GOLD = "#B8973A";
const COLORS = [PURPLE, GOLD, "#7F77DD", "#C9A84C", "#3C3489", "#E8A838", "#9C95E5", "#D4B56A"];

const EXPENSE_CATEGORIES = [
  "Housing", "Food & Dining", "Transport", "Utilities", "Healthcare",
  "Education", "Entertainment", "Clothing", "Insurance", "Tax Payments",
  "Investments", "Professional Fees", "Other"
];
const INCOME_SOURCES = ["Salary", "Freelance", "Rental", "Business", "Dividend", "Interest", "Other"];
const INVESTMENT_TYPES = ["Mutual Fund", "Stocks", "Fixed Deposit", "PPF", "NPS", "Gold", "Real Estate", "Other"];
const LOAN_TYPES = ["Home", "Car", "Personal", "Education", "Business", "Other"];
const GOAL_ICONS = ["🏠", "📚", "🏖️", "🚗", "🏦", "🆘", "✈️", "💍", "🎓", "🏥"];

const DEFAULT_DATA: AppData = {
  income: [], expenses: [], investments: [], loans: [], goals: [],
  settings: { name: "", age: 30, monthlyBudgets: {}, bankBalance: 0, propertyValue: 0 },
  netWorthHistory: [],
};

// ── Formatters ─────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (isNaN(n) || !isFinite(n)) return "₹0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(2)}L`;
  return `${sign}₹${abs.toLocaleString("en-IN")}`;
}
function fmtPct(n: number) { return `${isFinite(n) ? n.toFixed(1) : "0.0"}%`; }
function fmtDate(d: string) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function monthKey(d: string) { return d.slice(0, 7); }
function uid() { return Math.random().toString(36).slice(2, 10); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function monthLabel(iso: string) {
  const [y, m] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[+m - 1]} ${y}`;
}

// ── Tax calculations ───────────────────────────────────────────────────────

function calcTaxNew(income: number) {
  const std = 75000;
  const taxable = Math.max(0, income - std);
  if (taxable <= 1200000) { // 87A rebate applies up to 12L
    const tax = slabTaxNew(taxable);
    const rebate = taxable <= 1200000 ? Math.min(tax, 60000) : 0;
    const afterRebate = Math.max(0, tax - rebate);
    return { taxable, tax: afterRebate + afterRebate * 0.04, cess: afterRebate * 0.04, rebate, slabs: taxable };
  }
  const tax = slabTaxNew(taxable);
  const cess = tax * 0.04;
  return { taxable, tax: tax + cess, cess, rebate: 0, slabs: taxable };
}
function slabTaxNew(t: number) {
  let tax = 0;
  const slabs = [[0,400000,0],[400000,800000,0.05],[800000,1200000,0.10],
    [1200000,1600000,0.15],[1600000,2000000,0.20],[2000000,2400000,0.25],[2400000,Infinity,0.30]];
  for (const [lo, hi, rate] of slabs) {
    if (t > lo) tax += (Math.min(t, hi) - lo) * rate;
  }
  return tax;
}
function calcTaxOld(income: number, deductions: number) {
  const std = 50000;
  const taxable = Math.max(0, income - std - deductions);
  const tax = slabTaxOld(taxable);
  const rebate = taxable <= 500000 ? Math.min(tax, 12500) : 0;
  const afterRebate = Math.max(0, tax - rebate);
  const cess = afterRebate * 0.04;
  return { taxable, tax: afterRebate + cess, cess, rebate };
}
function slabTaxOld(t: number) {
  let tax = 0;
  if (t > 1000000) tax += (t - 1000000) * 0.30;
  if (t > 500000) tax += (Math.min(t, 1000000) - 500000) * 0.20;
  if (t > 250000) tax += (Math.min(t, 500000) - 250000) * 0.05;
  return tax;
}

// ── EMI helpers ────────────────────────────────────────────────────────────

function calcEMI(p: number, r: number, n: number) {
  if (r === 0) return p / n;
  const mr = r / 12 / 100;
  return (p * mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
}
function outstandingBalance(p: number, r: number, n: number, paid: number) {
  const mr = r / 12 / 100;
  if (mr === 0) return Math.max(0, p - (p / n) * paid);
  return p * Math.pow(1 + mr, paid) - calcEMI(p, r, n) * (Math.pow(1 + mr, paid) - 1) / mr;
}
function monthsPaid(startDate: string) {
  const start = new Date(startDate);
  const now = new Date();
  return Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth());
}

// ── Goal helpers ───────────────────────────────────────────────────────────

function monthsUntil(dateStr: string) {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.max(0, (target.getFullYear() - now.getFullYear()) * 12 + target.getMonth() - now.getMonth());
}
function requiredSIP(target: number, current: number, months: number, rate = 0.01) {
  if (months <= 0) return 0;
  const fv = target - current * Math.pow(1 + rate, months);
  if (fv <= 0) return 0;
  return fv * rate / (Math.pow(1 + rate, months) - 1);
}

// ── Small UI components ────────────────────────────────────────────────────

const DCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#1A1630] border border-purple-900/40 rounded-2xl p-5 ${className}`}>{children}</div>
);
const KPICard = ({ label, value, sub, trend, color = "text-white" }:
  { label: string; value: string; sub?: string; trend?: "up" | "down" | null; color?: string }) => (
  <DCard>
    <div className="text-purple-400 text-xs font-semibold uppercase tracking-widest mb-2">{label}</div>
    <div className={`text-2xl font-bold ${color} mb-1 leading-none`}>{value}</div>
    {sub && (
      <div className="flex items-center gap-1 text-xs text-purple-400 mt-1">
        {trend === "up" && <TrendingUp size={11} className="text-green-400" />}
        {trend === "down" && <TrendingDown size={11} className="text-amber-400" />}
        {sub}
      </div>
    )}
  </DCard>
);

const Input = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <label className="block">
    <span className="block text-xs text-purple-300 font-medium mb-1">{label}</span>
    <input {...props} className="w-full bg-[#0F0D1E] border border-purple-800/60 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 placeholder:text-purple-700" />
  </label>
);
const Select = ({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <label className="block">
    <span className="block text-xs text-purple-300 font-medium mb-1">{label}</span>
    <select {...props} className="w-full bg-[#0F0D1E] border border-purple-800/60 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500">{children}</select>
  </label>
);
const Btn = ({ children, onClick, variant = "primary", className = "", type = "button" }:
  { children: React.ReactNode; onClick?: () => void; variant?: "primary"|"gold"|"ghost"; className?: string; type?: "button"|"submit" }) => {
  const cls = variant === "primary" ? "bg-purple-600 hover:bg-purple-700 text-white"
    : variant === "gold" ? "bg-[#B8973A] hover:bg-[#C9A84C] text-white"
    : "border border-purple-700 text-purple-300 hover:bg-purple-900/40";
  return <button type={type} onClick={onClick} className={`${cls} rounded-xl px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${className}`}>{children}</button>;
};
const Badge = ({ children, color = "purple" }: { children: React.ReactNode; color?: string }) => {
  const cls = color === "green" ? "bg-green-900/30 text-green-400 border-green-800/40"
    : color === "amber" ? "bg-amber-900/30 text-amber-400 border-amber-800/40"
    : color === "red" ? "bg-red-900/30 text-red-400 border-red-800/40"
    : "bg-purple-900/30 text-purple-300 border-purple-800/40";
  return <span className={`${cls} border rounded-full px-2 py-0.5 text-[10px] font-semibold`}>{children}</span>;
};

// ── Custom tooltip for recharts ────────────────────────────────────────────

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1A1630] border border-purple-800/60 rounded-xl p-3 text-xs shadow-xl">
      {label && <div className="text-purple-400 mb-1 font-semibold">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color }} className="flex gap-2 items-center">
          <span>{p.name}:</span><span className="font-bold">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ── Progress bar ───────────────────────────────────────────────────────────

const ProgressBar = ({ value, max, color = PURPLE, label, sub }: { value: number; max: number; color?: string; label: string; sub?: string }) => {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-purple-300">{label}</span>
        <span className="text-white font-semibold">{fmtPct(pct)}{sub ? ` · ${sub}` : ""}</span>
      </div>
      <div className="h-2 bg-purple-900/40 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const [tab, setTab] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeForm, setWelcomeForm] = useState({ name: "", age: "30" });
  const fileRef = useRef<HTMLInputElement>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppData;
        setData({ ...DEFAULT_DATA, ...parsed, settings: { ...DEFAULT_DATA.settings, ...parsed.settings } });
      } else {
        setShowWelcome(true);
      }
    } catch { setShowWelcome(true); }
  }, []);

  // Save to localStorage
  const save = useCallback((d: AppData) => {
    setData(d);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  }, []);

  const upd = useCallback(<K extends keyof AppData>(key: K, val: AppData[K]) => {
    save({ ...data, [key]: val });
  }, [data, save]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "i" || e.key === "I") setTab(1);
      if (e.key === "e" || e.key === "E") setTab(2);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Welcome submit
  function submitWelcome() {
    if (!welcomeForm.name.trim()) return;
    const updated = { ...data, settings: { ...data.settings, name: welcomeForm.name.trim(), age: parseInt(welcomeForm.age) || 30 } };
    save(updated);
    setShowWelcome(false);
  }

  // Export JSON
  function exportJSON() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `cc-finance-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  }

  // Import JSON
  function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as AppData;
        save({ ...DEFAULT_DATA, ...parsed });
        alert("Data imported successfully!");
      } catch { alert("Invalid file. Please use a CC Associates backup JSON."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // ── Derived computations ─────────────────────────────────────────────────

  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  }).reverse();

  const last6Months = last12Months.slice(-6);

  const monthlyIncome = (m: string) => data.income.filter(e => monthKey(e.date) === m).reduce((s, e) => s + e.amount, 0);
  const monthlyExpense = (m: string) => data.expenses.filter(e => monthKey(e.date) === m).reduce((s, e) => s + e.amount, 0);

  const avgIncome = last12Months.reduce((s, m) => s + monthlyIncome(m), 0) / 12;
  const avgExpense = last12Months.reduce((s, m) => s + monthlyExpense(m), 0) / 12;
  const netSavings = avgIncome - avgExpense;
  const savingsRate = avgIncome > 0 ? (netSavings / avgIncome) * 100 : 0;

  const totalPortfolio = data.investments.reduce((s, i) => s + i.currentValue, 0);
  const totalInvested = data.investments.reduce((s, i) => s + i.invested, 0);
  const totalLiabilities = data.loans.reduce((l, loan) => {
    const paid = monthsPaid(loan.startDate);
    return l + Math.max(0, outstandingBalance(loan.principal, loan.rate, loan.tenure, paid));
  }, 0);
  const totalAssets = totalPortfolio + data.settings.bankBalance + data.settings.propertyValue;
  const netWorth = totalAssets - totalLiabilities;

  const totalEMI = data.loans.reduce((s, l) => s + (l.emi || calcEMI(l.principal, l.rate, l.tenure)), 0);
  const dtiRatio = avgIncome > 0 ? (totalEMI / avgIncome) * 100 : 0;

  const emergencyFundMonths = avgExpense > 0 ? data.settings.bankBalance / avgExpense : 0;

  // Health score
  const healthScores = {
    savings: Math.min(100, (savingsRate / 30) * 100),
    emergency: Math.min(100, (emergencyFundMonths / 6) * 100),
    debt: Math.max(0, 100 - dtiRatio * 2.5),
    investment: Math.min(100, avgIncome > 0 ? (totalPortfolio / (avgIncome * 12)) * 20 : 0),
    diversity: Math.min(100, new Set(data.income.map(i => i.source)).size * 25),
  };
  const overallScore = Math.round(Object.values(healthScores).reduce((a, b) => a + b, 0) / Object.values(healthScores).length);
  const grade = overallScore >= 80 ? "A" : overallScore >= 60 ? "B" : overallScore >= 40 ? "C" : "D";

  // Bar chart data
  const chartData = last6Months.map(m => ({
    month: monthLabel(m),
    Income: monthlyIncome(m),
    Expenses: monthlyExpense(m),
    Savings: Math.max(0, monthlyIncome(m) - monthlyExpense(m)),
  }));

  // ── TABS ─────────────────────────────────────────────────────────────────

  const TABS = ["Overview", "Income", "Expenses", "Investments", "Tax Planner", "EMI Manager", "Goals", "Reports"];

  return (
    <div className="pt-16 bg-[#0F0D1E] min-h-screen">
      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1A1630] border border-purple-800/60 rounded-2xl p-8 max-w-md w-full">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center mb-4">
              <span className="text-white font-bold text-lg">CC</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Welcome to Your Finance Dashboard</h2>
            <p className="text-purple-400 text-sm mb-6">Free, private, no login. All data stays in your browser.</p>
            <div className="space-y-4 mb-6">
              <Input label="Your Name" placeholder="e.g. Piyush Nimse" value={welcomeForm.name}
                onChange={e => setWelcomeForm(f => ({ ...f, name: e.target.value }))} />
              <Input label="Your Age" type="number" placeholder="30" value={welcomeForm.age}
                onChange={e => setWelcomeForm(f => ({ ...f, age: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/20 border border-green-800/30 rounded-xl p-3 mb-6">
              <Shield size={14} /> All data is stored only in your browser. CC Associates cannot see your financial data.
            </div>
            <Btn variant="primary" className="w-full justify-center" onClick={submitWelcome}>
              Get Started <ArrowRight size={14} />
            </Btn>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#1A1630] border-b border-purple-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-lg">
              {data.settings.name ? `${data.settings.name}'s` : "Personal"} Finance Dashboard
            </h1>
            <p className="text-purple-400 text-xs">CC Associates · 100% Private · Browser Only</p>
          </div>
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={exportJSON}><Download size={14} />Export</Btn>
            <Btn variant="ghost" onClick={() => fileRef.current?.click()}><Upload size={14} />Import</Btn>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={importJSON} />
            <Btn variant="gold" onClick={() => setTab(4)}>
              <BarChart3 size={14} />Tax Planner
            </Btn>
          </div>
        </div>
        {/* Tab bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-0 overflow-x-auto">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === i ? "border-purple-500 text-purple-300" : "border-transparent text-purple-600 hover:text-purple-400"
              }`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── TAB 0: OVERVIEW ──────────────────────────────────────────────── */}
        {tab === 0 && <OverviewTab data={data} save={save}
          avgIncome={avgIncome} avgExpense={avgExpense} netSavings={netSavings}
          savingsRate={savingsRate} netWorth={netWorth} totalPortfolio={totalPortfolio}
          totalAssets={totalAssets} totalLiabilities={totalLiabilities}
          emergencyFundMonths={emergencyFundMonths} chartData={chartData}
          healthScores={healthScores} overallScore={overallScore} grade={grade}
          dtiRatio={dtiRatio} last6Months={last6Months}
          monthlyIncome={monthlyIncome} monthlyExpense={monthlyExpense}
        />}

        {/* ── TAB 1: INCOME ────────────────────────────────────────────────── */}
        {tab === 1 && <IncomeTab data={data} upd={upd} />}

        {/* ── TAB 2: EXPENSES ──────────────────────────────────────────────── */}
        {tab === 2 && <ExpensesTab data={data} upd={upd} />}

        {/* ── TAB 3: INVESTMENTS ───────────────────────────────────────────── */}
        {tab === 3 && <InvestmentsTab data={data} upd={upd} goals={data.goals} />}

        {/* ── TAB 4: TAX PLANNER ───────────────────────────────────────────── */}
        {tab === 4 && <TaxTab data={data} upd={upd} avgIncome={avgIncome} />}

        {/* ── TAB 5: EMI MANAGER ───────────────────────────────────────────── */}
        {tab === 5 && <EMITab data={data} upd={upd} avgIncome={avgIncome} totalEMI={totalEMI} dtiRatio={dtiRatio} />}

        {/* ── TAB 6: GOALS ─────────────────────────────────────────────────── */}
        {tab === 6 && <GoalsTab data={data} upd={upd} />}

        {/* ── TAB 7: REPORTS ───────────────────────────────────────────────── */}
        {tab === 7 && <ReportsTab data={data} exportJSON={exportJSON} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// ── OVERVIEW ──────────────────────────────────────────────────────────────

function OverviewTab({ data, save, avgIncome, avgExpense, netSavings, savingsRate, netWorth,
  totalPortfolio, totalAssets, totalLiabilities, emergencyFundMonths, chartData,
  healthScores, overallScore, grade, dtiRatio, last6Months, monthlyIncome, monthlyExpense }:
  { data: AppData; save: (d: AppData) => void; avgIncome: number; avgExpense: number;
    netSavings: number; savingsRate: number; netWorth: number; totalPortfolio: number;
    totalAssets: number; totalLiabilities: number; emergencyFundMonths: number;
    chartData: any[]; healthScores: Record<string, number>; overallScore: number;
    grade: string; dtiRatio: number; last6Months: string[];
    monthlyIncome: (m: string) => number; monthlyExpense: (m: string) => number }) {

  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ ...data.settings });

  function saveSettings() {
    save({ ...data, settings: { ...data.settings, ...settingsForm } });
    setShowSettings(false);
  }

  const gradeColor = grade === "A" ? "text-green-400" : grade === "B" ? "text-purple-400" : grade === "C" ? "text-amber-400" : "text-red-400";

  return (
    <div className="space-y-6">
      {/* Settings button */}
      <div className="flex justify-between items-center">
        <h2 className="text-white font-bold text-lg">Financial Overview</h2>
        <Btn variant="ghost" onClick={() => setShowSettings(true)}><Settings size={14} />Settings</Btn>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <DCard>
          <h3 className="text-white font-semibold mb-4">Dashboard Settings</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Input label="Your Name" value={settingsForm.name} onChange={e => setSettingsForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Age" type="number" value={settingsForm.age} onChange={e => setSettingsForm(f => ({ ...f, age: +e.target.value }))} />
            <Input label="Bank Balance (₹)" type="number" value={settingsForm.bankBalance} onChange={e => setSettingsForm(f => ({ ...f, bankBalance: +e.target.value }))} />
            <Input label="Property Value (₹)" type="number" value={settingsForm.propertyValue} onChange={e => setSettingsForm(f => ({ ...f, propertyValue: +e.target.value }))} />
          </div>
          <Btn variant="primary" onClick={saveSettings}><Save size={14} />Save Settings</Btn>
        </DCard>
      )}

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Avg Monthly Income" value={fmt(avgIncome)} sub="Last 12 months" />
        <KPICard label="Avg Monthly Expenses" value={fmt(avgExpense)} sub="Last 12 months" />
        <KPICard label="Monthly Net Savings" value={fmt(netSavings)} color={netSavings >= 0 ? "text-purple-300" : "text-amber-400"} />
        <KPICard label="Net Worth" value={fmt(netWorth)} color={netWorth >= 0 ? "text-green-400" : "text-amber-400"} />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Savings Rate" value={fmtPct(savingsRate)} sub={savingsRate >= 20 ? "✓ Above 20% target" : "↑ Target: 20%"} color={savingsRate >= 20 ? "text-green-400" : "text-amber-400"} />
        <KPICard label="Total Portfolio" value={fmt(totalPortfolio)} sub="All investments" />
        <KPICard label="Total Assets" value={fmt(totalAssets)} sub="Investments + Bank + Property" />
        <KPICard label="Total Liabilities" value={fmt(totalLiabilities)} sub="Outstanding loan balances" color={totalLiabilities > 0 ? "text-amber-400" : "text-white"} />
      </div>

      {/* Alerts */}
      <DCard>
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><AlertCircle size={16} className="text-amber-400" /> Smart Alerts</h3>
        <div className="space-y-2">
          {emergencyFundMonths < 6 && (
            <div className="flex items-center gap-3 text-sm text-amber-300 bg-amber-900/20 border border-amber-800/30 rounded-xl p-3">
              <span className="text-base">🔴</span>
              <span>Emergency Fund: {emergencyFundMonths.toFixed(1)} months covered. Target: 6 months. Gap: {fmt(Math.max(0, avgExpense * 6 - data.settings.bankBalance))}</span>
            </div>
          )}
          {emergencyFundMonths >= 6 && (
            <div className="flex items-center gap-3 text-sm text-green-300 bg-green-900/20 border border-green-800/30 rounded-xl p-3">
              <span className="text-base">🟢</span>
              <span>Emergency Fund: {emergencyFundMonths.toFixed(1)} months covered. Excellent!</span>
            </div>
          )}
          <div className={`flex items-center gap-3 text-sm rounded-xl p-3 border ${savingsRate >= 20 ? "text-green-300 bg-green-900/20 border-green-800/30" : "text-amber-300 bg-amber-900/20 border-amber-800/30"}`}>
            <span className="text-base">{savingsRate >= 20 ? "🟢" : "🟡"}</span>
            <span>Savings Rate: {fmtPct(savingsRate)} — {savingsRate >= 20 ? "Above" : "Below"} 20% target</span>
          </div>
          {dtiRatio > 40 && (
            <div className="flex items-center gap-3 text-sm text-red-300 bg-red-900/20 border border-red-800/30 rounded-xl p-3">
              <span className="text-base">🔴</span>
              <span>Debt-to-Income ratio is {fmtPct(dtiRatio)} — above safe limit of 40%. Consider pre-paying loans.</span>
            </div>
          )}
          {data.income.length === 0 && (
            <div className="flex items-center gap-3 text-sm text-purple-300 bg-purple-900/20 border border-purple-800/30 rounded-xl p-3">
              <span className="text-base">🔵</span>
              <span>Add your income entries to unlock all insights. Press <kbd className="bg-purple-800 px-1.5 py-0.5 rounded text-xs">I</kbd> to go to Income tab.</span>
            </div>
          )}
        </div>
      </DCard>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        <DCard>
          <h3 className="text-white font-semibold mb-4">Income vs Expenses — Last 6 Months</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4}>
              <XAxis dataKey="month" tick={{ fill: "#7F77DD", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#7F77DD", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v).replace("₹","")} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="Income" fill={PURPLE} radius={[4,4,0,0]} />
              <Bar dataKey="Expenses" fill={GOLD} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div><div className="text-purple-400 text-xs">Avg In</div><div className="text-white text-sm font-bold">{fmt(avgIncome)}</div></div>
            <div><div className="text-amber-400 text-xs">Avg Out</div><div className="text-white text-sm font-bold">{fmt(avgExpense)}</div></div>
            <div><div className="text-green-400 text-xs">Net</div><div className="text-white text-sm font-bold">{fmt(netSavings)}</div></div>
          </div>
        </DCard>

        {/* Health Score */}
        <DCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Financial Health Score</h3>
            <div className="text-center">
              <div className={`text-5xl font-black ${gradeColor}`}>{grade}</div>
              <div className="text-purple-400 text-xs">{overallScore}/100</div>
            </div>
          </div>
          <ProgressBar value={healthScores.savings} max={100} label="Savings Rate" sub={fmtPct(savingsRate)} />
          <ProgressBar value={healthScores.emergency} max={100} label="Emergency Fund" sub={`${emergencyFundMonths.toFixed(1)} months`} color="#22c55e" />
          <ProgressBar value={healthScores.debt} max={100} label="Debt Safety" sub={`DTI ${fmtPct(dtiRatio)}`} color="#f59e0b" />
          <ProgressBar value={healthScores.investment} max={100} label="Investment Rate" color="#7F77DD" />
          <ProgressBar value={healthScores.diversity} max={100} label="Income Diversity" sub={`${new Set(data.income.map(i => i.source)).size} source(s)`} color={GOLD} />
        </DCard>
      </div>
    </div>
  );
}

// ── INCOME ────────────────────────────────────────────────────────────────

function IncomeTab({ data, upd }: { data: AppData; upd: <K extends keyof AppData>(k: K, v: AppData[K]) => void }) {
  const [form, setForm] = useState({ date: todayISO(), source: "Salary", amount: "", description: "", taxCategory: "Taxable" });
  const [filter, setFilter] = useState("");

  function add() {
    if (!form.amount || +form.amount <= 0) return;
    upd("income", [...data.income, { ...form, amount: +form.amount, id: uid() }]);
    setForm(f => ({ ...f, amount: "", description: "" }));
  }
  function del(id: string) { upd("income", data.income.filter(e => e.id !== id)); }

  const filtered = data.income.filter(e =>
    (!filter || monthKey(e.date) === filter || e.source.toLowerCase().includes(filter.toLowerCase()))
  ).sort((a, b) => b.date.localeCompare(a.date));

  // Chart data by source
  const bySource: Record<string, number> = {};
  data.income.forEach(e => { bySource[e.source] = (bySource[e.source] || 0) + e.amount; });
  const pieData = Object.entries(bySource).map(([name, value]) => ({ name, value }));

  // Monthly trend
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - 5 + i);
    const m = d.toISOString().slice(0, 7);
    return { month: monthLabel(m), amount: data.income.filter(e => monthKey(e.date) === m).reduce((s, e) => s + e.amount, 0) };
  });

  const totalIncome = data.income.reduce((s, e) => s + e.amount, 0);
  const taxable = data.income.filter(e => e.taxCategory === "Taxable").reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-white font-bold text-lg">Income Tracker <span className="text-purple-400 text-sm font-normal ml-2">Press I to jump here</span></h2>

      {/* Quick Entry */}
      <DCard>
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Plus size={16} className="text-purple-400" />Add Income Entry</h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
          <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <Select label="Source" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
            {INCOME_SOURCES.map(s => <option key={s}>{s}</option>)}
          </Select>
          <Input label="Amount (₹)" type="number" placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          <Input label="Description" placeholder="e.g. July salary" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <Select label="Tax Category" value={form.taxCategory} onChange={e => setForm(f => ({ ...f, taxCategory: e.target.value }))}>
            <option>Taxable</option><option>Exempt</option><option>Capital Gain</option>
          </Select>
          <div className="flex items-end"><Btn variant="primary" onClick={add} className="w-full justify-center"><Plus size={14} />Add</Btn></div>
        </div>
      </DCard>

      {/* Stats + Charts */}
      <div className="grid md:grid-cols-3 gap-4">
        <KPICard label="Total Income" value={fmt(totalIncome)} />
        <KPICard label="Taxable" value={fmt(taxable)} sub={`${totalIncome > 0 ? fmtPct(taxable / totalIncome * 100) : "0%"} of total`} />
        <KPICard label="Exempt / Capital Gain" value={fmt(totalIncome - taxable)} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {pieData.length > 0 && (
          <DCard>
            <h3 className="text-white font-semibold mb-4">Income by Source</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#7F77DD" }} />
              </PieChart>
            </ResponsiveContainer>
          </DCard>
        )}
        <DCard>
          <h3 className="text-white font-semibold mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={last6}>
              <XAxis dataKey="month" tick={{ fill: "#7F77DD", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#7F77DD", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v).replace("₹","")} />
              <Tooltip content={<DarkTooltip />} />
              <Line type="monotone" dataKey="amount" stroke={PURPLE} strokeWidth={2} dot={{ fill: PURPLE, r: 4 }} name="Income" />
            </LineChart>
          </ResponsiveContainer>
        </DCard>
      </div>

      {/* Table */}
      <DCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">All Entries ({filtered.length})</h3>
          <input className="bg-[#0F0D1E] border border-purple-800/60 rounded-lg px-3 py-1.5 text-white text-xs w-48 focus:outline-none" placeholder="Filter by month or source..." value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-purple-400 text-xs border-b border-purple-900/40">
              <th className="text-left pb-2">Date</th><th className="text-left pb-2">Source</th>
              <th className="text-right pb-2">Amount</th><th className="text-left pb-2">Description</th>
              <th className="text-left pb-2">Tax</th><th className="pb-2"></th>
            </tr></thead>
            <tbody>
              {filtered.slice(0, 50).map(e => (
                <tr key={e.id} className="border-b border-purple-900/20 hover:bg-purple-900/10">
                  <td className="py-2 text-purple-300 text-xs">{fmtDate(e.date)}</td>
                  <td className="py-2"><Badge>{e.source}</Badge></td>
                  <td className="py-2 text-right font-bold text-green-400">{fmt(e.amount)}</td>
                  <td className="py-2 text-purple-400 text-xs">{e.description || "—"}</td>
                  <td className="py-2"><Badge color={e.taxCategory === "Exempt" ? "green" : e.taxCategory === "Capital Gain" ? "amber" : "purple"}>{e.taxCategory}</Badge></td>
                  <td className="py-2"><button onClick={() => del(e.id)} className="text-purple-700 hover:text-red-400 transition-colors"><Trash2 size={13} /></button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-purple-600">No entries yet. Add your first income above.</td></tr>}
            </tbody>
          </table>
        </div>
      </DCard>
    </div>
  );
}

// ── EXPENSES ───────────────────────────────────────────────────────────────

function ExpensesTab({ data, upd }: { data: AppData; upd: <K extends keyof AppData>(k: K, v: AppData[K]) => void }) {
  const [form, setForm] = useState({ date: todayISO(), category: "Food & Dining", amount: "", description: "", paymentMode: "UPI", taxDeductible: false });
  const [filter, setFilter] = useState("");

  function add() {
    if (!form.amount || +form.amount <= 0) return;
    upd("expenses", [...data.expenses, { ...form, amount: +form.amount, id: uid() }]);
    setForm(f => ({ ...f, amount: "", description: "" }));
  }
  function del(id: string) { upd("expenses", data.expenses.filter(e => e.id !== id)); }

  const filtered = data.expenses.filter(e =>
    !filter || e.category.toLowerCase().includes(filter.toLowerCase()) || monthKey(e.date).includes(filter)
  ).sort((a, b) => b.date.localeCompare(a.date));

  const byCategory: Record<string, number> = {};
  data.expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
  const pieData = Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).map(([name, value]) => ({ name, value }));

  const totalDeductible = data.expenses.filter(e => e.taxDeductible).reduce((s, e) => s + e.amount, 0);
  const total = data.expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-white font-bold text-lg">Expense Tracker <span className="text-purple-400 text-sm font-normal ml-2">Press E to jump here</span></h2>

      <DCard>
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Plus size={16} className="text-purple-400" />Add Expense</h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 mb-3">
          <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <Select label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </Select>
          <Input label="Amount (₹)" type="number" placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          <Input label="Description" placeholder="e.g. Grocery" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <Select label="Payment" value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))}>
            {["UPI","Card","Cash","Net Banking","Cheque"].map(p => <option key={p}>{p}</option>)}
          </Select>
          <Select label="Tax Deductible?" value={form.taxDeductible ? "Yes" : "No"} onChange={e => setForm(f => ({ ...f, taxDeductible: e.target.value === "Yes" }))}>
            <option>No</option><option>Yes</option>
          </Select>
          <div className="flex items-end"><Btn variant="primary" onClick={add} className="w-full justify-center"><Plus size={14} />Add</Btn></div>
        </div>
      </DCard>

      <div className="grid md:grid-cols-3 gap-4">
        <KPICard label="Total Expenses" value={fmt(total)} />
        <KPICard label="Tax Deductible" value={fmt(totalDeductible)} sub={`Est. saving: ${fmt(totalDeductible * 0.30)}`} color="text-green-400" />
        <KPICard label="Non-Deductible" value={fmt(total - totalDeductible)} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {pieData.length > 0 && (
          <DCard>
            <h3 className="text-white font-semibold mb-4">Expenses by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#7F77DD" }} />
              </PieChart>
            </ResponsiveContainer>
          </DCard>
        )}
        <DCard>
          <h3 className="text-white font-semibold mb-4">Top Categories</h3>
          <div className="space-y-2">
            {pieData.slice(0, 6).map(({ name, value }) => (
              <ProgressBar key={name} value={value} max={total} label={name} sub={fmt(value)} color={COLORS[pieData.findIndex(p => p.name === name) % COLORS.length]} />
            ))}
          </div>
        </DCard>
      </div>

      <DCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">All Entries ({filtered.length})</h3>
          <input className="bg-[#0F0D1E] border border-purple-800/60 rounded-lg px-3 py-1.5 text-white text-xs w-48 focus:outline-none" placeholder="Filter category or month..." value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-purple-400 text-xs border-b border-purple-900/40">
              <th className="text-left pb-2">Date</th><th className="text-left pb-2">Category</th>
              <th className="text-right pb-2">Amount</th><th className="text-left pb-2">Description</th>
              <th className="text-left pb-2">Mode</th><th className="text-left pb-2">Deductible</th><th className="pb-2"></th>
            </tr></thead>
            <tbody>
              {filtered.slice(0, 50).map(e => (
                <tr key={e.id} className="border-b border-purple-900/20 hover:bg-purple-900/10">
                  <td className="py-2 text-purple-300 text-xs">{fmtDate(e.date)}</td>
                  <td className="py-2"><Badge>{e.category}</Badge></td>
                  <td className="py-2 text-right font-bold text-amber-400">{fmt(e.amount)}</td>
                  <td className="py-2 text-purple-400 text-xs">{e.description || "—"}</td>
                  <td className="py-2 text-purple-400 text-xs">{e.paymentMode}</td>
                  <td className="py-2">{e.taxDeductible ? <Badge color="green">Yes</Badge> : <span className="text-purple-700 text-xs">No</span>}</td>
                  <td className="py-2"><button onClick={() => del(e.id)} className="text-purple-700 hover:text-red-400 transition-colors"><Trash2 size={13} /></button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-purple-600">No entries yet. Add your first expense above.</td></tr>}
            </tbody>
          </table>
        </div>
      </DCard>
    </div>
  );
}

// ── INVESTMENTS ────────────────────────────────────────────────────────────

function InvestmentsTab({ data, upd, goals }: { data: AppData; upd: <K extends keyof AppData>(k: K, v: AppData[K]) => void; goals: Goal[] }) {
  const [form, setForm] = useState({ type: "Mutual Fund", name: "", invested: "", currentValue: "", date: todayISO(), maturityDate: "", linkedGoal: "" });

  function add() {
    if (!form.name || !form.invested) return;
    upd("investments", [...data.investments, { ...form, invested: +form.invested, currentValue: +form.currentValue || +form.invested, id: uid() }]);
    setForm(f => ({ ...f, name: "", invested: "", currentValue: "", maturityDate: "", linkedGoal: "" }));
  }
  function del(id: string) { upd("investments", data.investments.filter(e => e.id !== id)); }

  const total = data.investments.reduce((s, i) => s + i.currentValue, 0);
  const totalInv = data.investments.reduce((s, i) => s + i.invested, 0);
  const gain = total - totalInv;
  const gainPct = totalInv > 0 ? (gain / totalInv) * 100 : 0;

  const byType: Record<string, number> = {};
  data.investments.forEach(i => { byType[i.type] = (byType[i.type] || 0) + i.currentValue; });
  const pieData = Object.entries(byType).map(([name, value]) => ({ name, value }));

  // LTCG/STCG estimate (simplified)
  const equityGain = data.investments.filter(i => ["Mutual Fund","Stocks"].includes(i.type)).reduce((s, i) => {
    const months = Math.round((new Date().getTime() - new Date(i.date).getTime()) / (1000 * 60 * 60 * 24 * 30));
    return s + (months >= 12 ? i.currentValue - i.invested : 0);
  }, 0);
  const ltcgTax = Math.max(0, equityGain - 125000) * 0.125;

  return (
    <div className="space-y-6">
      <h2 className="text-white font-bold text-lg">Investment Portfolio</h2>

      <DCard>
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Plus size={16} className="text-purple-400" />Add Investment</h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            {INVESTMENT_TYPES.map(t => <option key={t}>{t}</option>)}
          </Select>
          <Input label="Name / Description" placeholder="e.g. Axis Bluechip Fund" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Invested (₹)" type="number" placeholder="0" value={form.invested} onChange={e => setForm(f => ({ ...f, invested: e.target.value }))} />
          <Input label="Current Value (₹)" type="number" placeholder="0" value={form.currentValue} onChange={e => setForm(f => ({ ...f, currentValue: e.target.value }))} />
          <Input label="Investment Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <Input label="Maturity Date (optional)" type="date" value={form.maturityDate} onChange={e => setForm(f => ({ ...f, maturityDate: e.target.value }))} />
          <Select label="Linked Goal" value={form.linkedGoal} onChange={e => setForm(f => ({ ...f, linkedGoal: e.target.value }))}>
            <option value="">None</option>
            {goals.map(g => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
          </Select>
          <div className="flex items-end"><Btn variant="primary" onClick={add} className="w-full justify-center"><Plus size={14} />Add</Btn></div>
        </div>
      </DCard>

      <div className="grid md:grid-cols-4 gap-4">
        <KPICard label="Total Invested" value={fmt(totalInv)} />
        <KPICard label="Current Value" value={fmt(total)} />
        <KPICard label="Total Gain / Loss" value={fmt(gain)} color={gain >= 0 ? "text-green-400" : "text-amber-400"} />
        <KPICard label="Overall Return" value={fmtPct(gainPct)} color={gainPct >= 0 ? "text-green-400" : "text-amber-400"} sub={`Est. LTCG tax: ${fmt(ltcgTax)}`} />
      </div>

      {pieData.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <DCard>
            <h3 className="text-white font-semibold mb-4">Portfolio Allocation</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#7F77DD" }} />
              </PieChart>
            </ResponsiveContainer>
          </DCard>
          <DCard>
            <h3 className="text-white font-semibold mb-2">Tax Impact (FY 2026-27)</h3>
            <div className="text-purple-400 text-xs mb-4">Equity LTCG (held &gt;12 months): 12.5% above ₹1.25L exemption</div>
            <div className="space-y-3">
              {[["Equity LTCG Gain", fmt(equityGain)], ["Exemption", fmt(125000)], ["Taxable Gain", fmt(Math.max(0, equityGain - 125000))], ["Estimated Tax (12.5%)", fmt(ltcgTax)]].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm border-b border-purple-900/30 pb-2">
                  <span className="text-purple-400">{k}</span><span className="text-white font-semibold">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-purple-900/20 border border-purple-800/30 rounded-xl text-xs text-purple-300">
              💡 Consider booking losses before 31 March to offset gains (tax-loss harvesting).
            </div>
          </DCard>
        </div>
      )}

      <DCard>
        <h3 className="text-white font-semibold mb-4">Holdings ({data.investments.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-purple-400 text-xs border-b border-purple-900/40">
              <th className="text-left pb-2">Name</th><th className="text-left pb-2">Type</th>
              <th className="text-right pb-2">Invested</th><th className="text-right pb-2">Current</th>
              <th className="text-right pb-2">Gain</th><th className="text-right pb-2">Return</th>
              <th className="text-left pb-2">Since</th><th className="pb-2"></th>
            </tr></thead>
            <tbody>
              {data.investments.map(i => {
                const g = i.currentValue - i.invested;
                const pct = i.invested > 0 ? (g / i.invested) * 100 : 0;
                return (
                  <tr key={i.id} className="border-b border-purple-900/20 hover:bg-purple-900/10">
                    <td className="py-2 text-white text-xs font-medium">{i.name}</td>
                    <td className="py-2"><Badge>{i.type}</Badge></td>
                    <td className="py-2 text-right text-purple-300 text-xs">{fmt(i.invested)}</td>
                    <td className="py-2 text-right text-white font-semibold text-xs">{fmt(i.currentValue)}</td>
                    <td className={`py-2 text-right font-semibold text-xs ${g >= 0 ? "text-green-400" : "text-amber-400"}`}>{fmt(g)}</td>
                    <td className={`py-2 text-right text-xs ${pct >= 0 ? "text-green-400" : "text-amber-400"}`}>{fmtPct(pct)}</td>
                    <td className="py-2 text-purple-400 text-xs">{fmtDate(i.date)}</td>
                    <td className="py-2"><button onClick={() => del(i.id)} className="text-purple-700 hover:text-red-400"><Trash2 size={13} /></button></td>
                  </tr>
                );
              })}
              {data.investments.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-purple-600">No investments added yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </DCard>
    </div>
  );
}

// ── TAX PLANNER ────────────────────────────────────────────────────────────

function TaxTab({ data, upd, avgIncome }: { data: AppData; upd: <K extends keyof AppData>(k: K, v: AppData[K]) => void; avgIncome: number }) {
  const [salary, setSalary] = useState(Math.round(avgIncome * 12) || 0);
  const [otherIncome, setOtherIncome] = useState(0);
  const [regime, setRegime] = useState<"new" | "old">("new");
  const [d80C, setD80C] = useState(0);
  const [d80D, setD80D] = useState(0);
  const [d80E, setD80E] = useState(0);
  const [tdsDeducted, setTdsDeducted] = useState(0);

  const totalIncome = salary + otherIncome;
  const newCalc = calcTaxNew(totalIncome);
  const oldCalc = calcTaxOld(totalIncome, Math.min(150000, d80C) + Math.min(75000, d80D) + d80E);

  const saving = Math.abs(newCalc.tax - oldCalc.tax);
  const betterRegime = newCalc.tax <= oldCalc.tax ? "New" : "Old";

  const advanceTax = regime === "new" ? newCalc.tax : oldCalc.tax;
  const installments = [
    { date: "15 Jun 2026", pct: 15, amount: advanceTax * 0.15 },
    { date: "15 Sep 2026", pct: 45, amount: advanceTax * 0.30 },
    { date: "15 Dec 2026", pct: 75, amount: advanceTax * 0.30 },
    { date: "15 Mar 2027", pct: 100, amount: advanceTax * 0.25 },
  ];

  const curTax = regime === "new" ? newCalc : oldCalc;
  const netTax = Math.max(0, curTax.tax - tdsDeducted);
  const refund = Math.max(0, tdsDeducted - curTax.tax);

  return (
    <div className="space-y-6">
      <h2 className="text-white font-bold text-lg">Tax Planner ⭐ <span className="text-purple-400 text-sm font-normal ml-2">FY 2026-27 (AY 2027-28)</span></h2>

      {/* Inputs */}
      <DCard>
        <h3 className="text-white font-semibold mb-4">Income Details</h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Input label="Annual Salary / Business Income (₹)" type="number" value={salary || ""} onChange={e => setSalary(+e.target.value || 0)} placeholder="e.g. 1200000" />
          <Input label="Other Income (rental, FD, etc.) (₹)" type="number" value={otherIncome || ""} onChange={e => setOtherIncome(+e.target.value || 0)} placeholder="0" />
          <Input label="TDS Already Deducted (₹)" type="number" value={tdsDeducted || ""} onChange={e => setTdsDeducted(+e.target.value || 0)} placeholder="0" />
          <div className="flex flex-col gap-2">
            <span className="text-xs text-purple-300 font-medium">Select Regime</span>
            <div className="flex gap-2">
              {(["new","old"] as const).map(r => (
                <button key={r} onClick={() => setRegime(r)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors capitalize ${regime === r ? "bg-purple-600 border-purple-500 text-white" : "border-purple-800/60 text-purple-400 hover:bg-purple-900/30"}`}>{r}</button>
              ))}
            </div>
          </div>
        </div>
      </DCard>

      {/* Regime Comparison */}
      <div className="grid md:grid-cols-2 gap-4">
        {[
          { label: "New Regime", calc: newCalc, r: "new", std: 75000 },
          { label: "Old Regime", calc: oldCalc, r: "old", std: 50000, ded: Math.min(150000, d80C) + Math.min(75000, d80D) + d80E }
        ].map(({ label, calc, r, std, ded }) => (
          <DCard key={r} className={`relative ${regime === r ? "border-purple-500/60" : ""}`}>
            {regime === r && <div className="absolute top-3 right-3"><Badge color="purple">Selected</Badge></div>}
            {betterRegime.toLowerCase() === r && <div className="absolute top-3 left-3"><Badge color="green">Saves More</Badge></div>}
            <h3 className="text-white font-semibold mb-4 mt-4">{label}</h3>
            <div className="space-y-2 text-sm">
              {[
                ["Gross Total Income", fmt(totalIncome)],
                ["Standard Deduction", `−${fmt(std)}`],
                ...(r === "old" && ded ? [["Other Deductions", `−${fmt(ded)}`]] : []),
                ["Net Taxable Income", fmt(calc.taxable)],
                ["87A Rebate", calc.rebate > 0 ? `−${fmt(calc.rebate)}` : "N/A"],
                ["4% Health & Edu Cess", fmt(calc.cess)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-purple-900/30 pb-1">
                  <span className="text-purple-400">{k}</span><span className="text-white">{v}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2">
                <span className="text-white font-bold">Total Tax Payable</span>
                <span className="text-2xl font-black text-purple-300">{fmt(calc.tax)}</span>
              </div>
            </div>
          </DCard>
        ))}
      </div>

      {/* Recommendation */}
      <DCard>
        <div className="flex items-center gap-3">
          <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
          <div>
            <div className="text-white font-semibold">Recommended: <span className="text-green-400">{betterRegime} Regime</span></div>
            <div className="text-purple-400 text-sm">You save <span className="text-green-400 font-bold">{fmt(saving)}</span> by choosing the {betterRegime} Regime.</div>
          </div>
        </div>
      </DCard>

      {/* TDS Tracker */}
      <DCard>
        <h3 className="text-white font-semibold mb-3">TDS & Refund Summary</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div><div className="text-purple-400 text-xs mb-1">Tax Liability</div><div className="text-white font-bold text-xl">{fmt(curTax.tax)}</div></div>
          <div><div className="text-purple-400 text-xs mb-1">TDS Deducted</div><div className="text-white font-bold text-xl">{fmt(tdsDeducted)}</div></div>
          <div>
            <div className="text-purple-400 text-xs mb-1">{refund > 0 ? "Expected Refund" : "Additional Tax Due"}</div>
            <div className={`font-bold text-xl ${refund > 0 ? "text-green-400" : "text-amber-400"}`}>{fmt(refund > 0 ? refund : netTax)}</div>
          </div>
        </div>
      </DCard>

      {/* Old regime deductions */}
      {regime === "old" && (
        <DCard>
          <h3 className="text-white font-semibold mb-4">Deduction Optimizer (Old Regime)</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <Input label="80C (EPF/PPF/ELSS/LIC) (₹)" type="number" value={d80C || ""} onChange={e => setD80C(+e.target.value || 0)} placeholder="Max ₹1,50,000" />
              {d80C < 150000 && <div className="text-amber-400 text-xs mt-1">💡 ₹{(150000 - d80C).toLocaleString("en-IN")} unused — invest more to save {fmt((150000 - d80C) * 0.30)}</div>}
            </div>
            <Input label="80D Health Insurance (₹)" type="number" value={d80D || ""} onChange={e => setD80D(+e.target.value || 0)} placeholder="Self ₹25K + Parents ₹25K" />
            <Input label="80E Education Loan Interest (₹)" type="number" value={d80E || ""} onChange={e => setD80E(+e.target.value || 0)} placeholder="No limit" />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-purple-900/20 border border-purple-800/30 rounded-xl p-3 text-xs">
              <div className="text-purple-300 font-semibold mb-1">80C Used</div>
              <ProgressBar value={d80C} max={150000} label="" sub={`${fmt(d80C)} / ${fmt(150000)}`} />
            </div>
            <div className="bg-purple-900/20 border border-purple-800/30 rounded-xl p-3 text-xs">
              <div className="text-purple-300 font-semibold mb-1">80D Used</div>
              <ProgressBar value={d80D} max={75000} label="" sub={`${fmt(d80D)} / ${fmt(75000)}`} color={GOLD} />
            </div>
            <div className="bg-green-900/20 border border-green-800/30 rounded-xl p-3">
              <div className="text-green-400 text-xs font-semibold">Total Deductions</div>
              <div className="text-white font-bold text-xl mt-1">{fmt(Math.min(150000, d80C) + Math.min(75000, d80D) + d80E)}</div>
            </div>
          </div>
        </DCard>
      )}

      {/* Advance Tax */}
      <DCard>
        <h3 className="text-white font-semibold mb-4">Advance Tax Schedule (FY 2026-27)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-purple-400 text-xs border-b border-purple-900/40">
              <th className="text-left pb-2">Due Date</th><th className="text-left pb-2">Cumulative %</th><th className="text-right pb-2">Amount Due</th>
            </tr></thead>
            <tbody>
              {installments.map(({ date, pct, amount }) => {
                const isPast = new Date(date.split(" ").reverse().join("-")) < new Date();
                return (
                  <tr key={date} className="border-b border-purple-900/20">
                    <td className="py-2 text-white text-xs">{date}</td>
                    <td className="py-2"><Badge color={isPast ? "amber" : "green"}>{pct}%</Badge></td>
                    <td className="py-2 text-right font-bold text-purple-300">{fmt(amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DCard>

      {/* CA CTA */}
      <div className="bg-[#1A1630] border border-purple-700/40 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <div className="text-white font-semibold">Need help optimizing your taxes?</div>
          <div className="text-purple-400 text-sm">Chat with CA Sourabh Chavan for personalized advice.</div>
        </div>
        <a href="https://wa.me/918421465966?text=Hello%20CA%20Sourabh%2C%20I%20need%20tax%20advisory%20help."
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors">
          <MessageCircle size={16} />Chat with CA <ArrowRight size={14} />
        </a>
      </div>
    </div>
  );
}

// ── EMI MANAGER ────────────────────────────────────────────────────────────

function EMITab({ data, upd, avgIncome, totalEMI, dtiRatio }:
  { data: AppData; upd: <K extends keyof AppData>(k: K, v: AppData[K]) => void; avgIncome: number; totalEMI: number; dtiRatio: number }) {
  const [form, setForm] = useState({ type: "Home", lender: "", principal: "", rate: "", tenure: "", startDate: todayISO(), emi: "" });

  function add() {
    if (!form.lender || !form.principal) return;
    const emi = form.emi ? +form.emi : calcEMI(+form.principal, +form.rate, +form.tenure);
    upd("loans", [...data.loans, { ...form, principal: +form.principal, rate: +form.rate, tenure: +form.tenure, emi, id: uid() }]);
    setForm(f => ({ ...f, lender: "", principal: "", rate: "", tenure: "", emi: "" }));
  }
  function del(id: string) { upd("loans", data.loans.filter(l => l.id !== id)); }

  return (
    <div className="space-y-6">
      <h2 className="text-white font-bold text-lg">EMI Manager</h2>

      <DCard>
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Plus size={16} className="text-purple-400" />Add Loan</h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <Select label="Loan Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            {LOAN_TYPES.map(t => <option key={t}>{t}</option>)}
          </Select>
          <Input label="Lender Name" placeholder="e.g. SBI" value={form.lender} onChange={e => setForm(f => ({ ...f, lender: e.target.value }))} />
          <Input label="Principal (₹)" type="number" value={form.principal} onChange={e => setForm(f => ({ ...f, principal: e.target.value }))} />
          <Input label="Interest Rate (%)" type="number" placeholder="8.5" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} />
          <Input label="Tenure (months)" type="number" placeholder="240" value={form.tenure} onChange={e => setForm(f => ({ ...f, tenure: e.target.value }))} />
          <Input label="Start Date" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
          <Input label="EMI (optional — auto-calc)" type="number" value={form.emi} onChange={e => setForm(f => ({ ...f, emi: e.target.value }))} />
          <div className="flex items-end"><Btn variant="primary" onClick={add} className="w-full justify-center"><Plus size={14} />Add</Btn></div>
        </div>
      </DCard>

      <div className="grid md:grid-cols-3 gap-4">
        <KPICard label="Total Monthly EMI" value={fmt(totalEMI)} />
        <KPICard label="Debt-to-Income Ratio" value={fmtPct(dtiRatio)} color={dtiRatio > 40 ? "text-amber-400" : "text-green-400"} sub={dtiRatio > 40 ? "⚠ Above safe limit (40%)" : "✓ Within safe limit"} />
        <KPICard label="Active Loans" value={String(data.loans.length)} />
      </div>

      {data.loans.map(loan => {
        const paid = monthsPaid(loan.startDate);
        const outstanding = Math.max(0, outstandingBalance(loan.principal, loan.rate, loan.tenure, paid));
        const emi = loan.emi || calcEMI(loan.principal, loan.rate, loan.tenure);
        const remaining = Math.max(0, loan.tenure - paid);
        const paidPct = loan.tenure > 0 ? (paid / loan.tenure) * 100 : 0;
        const totalInterest = emi * loan.tenure - loan.principal;
        return (
          <DCard key={loan.id}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-white font-semibold">{loan.lender} — {loan.type} Loan</div>
                <div className="text-purple-400 text-xs">Started {fmtDate(loan.startDate)} · {loan.rate}% · {loan.tenure} months</div>
              </div>
              <button onClick={() => del(loan.id)} className="text-purple-700 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div><div className="text-purple-400 text-xs">Monthly EMI</div><div className="text-white font-bold">{fmt(emi)}</div></div>
              <div><div className="text-purple-400 text-xs">Outstanding</div><div className="text-amber-400 font-bold">{fmt(outstanding)}</div></div>
              <div><div className="text-purple-400 text-xs">Months Remaining</div><div className="text-white font-bold">{remaining}</div></div>
              <div><div className="text-purple-400 text-xs">Total Interest</div><div className="text-white font-bold">{fmt(totalInterest)}</div></div>
            </div>
            <ProgressBar value={paid} max={loan.tenure} label="Repaid" sub={`${paid} of ${loan.tenure} months`} />
            <div className="mt-3 p-3 bg-purple-900/20 border border-purple-800/30 rounded-xl text-xs text-purple-300">
              💡 Pre-paying <strong className="text-white">{fmt(outstanding * 0.1)}</strong> today saves approx <strong className="text-green-400">{fmt(totalInterest * 0.15)}</strong> in interest.
            </div>
          </DCard>
        );
      })}

      {data.loans.length === 0 && (
        <DCard><div className="text-center text-purple-600 py-8">No loans added yet. Add your first loan above.</div></DCard>
      )}
    </div>
  );
}

// ── GOALS ─────────────────────────────────────────────────────────────────

function GoalsTab({ data, upd }: { data: AppData; upd: <K extends keyof AppData>(k: K, v: AppData[K]) => void }) {
  const [form, setForm] = useState({ name: "", target: "", targetDate: "", current: "", monthly: "", icon: "🏠" });

  function add() {
    if (!form.name || !form.target) return;
    upd("goals", [...data.goals, { ...form, target: +form.target, current: +form.current || 0, monthly: +form.monthly || 0, id: uid() }]);
    setForm({ name: "", target: "", targetDate: "", current: "", monthly: "", icon: "🏠" });
  }
  function del(id: string) { upd("goals", data.goals.filter(g => g.id !== id)); }

  const EXAMPLE_GOALS = [
    { icon: "🏠", name: "Buy a Home" }, { icon: "📚", name: "Child's Education" },
    { icon: "🏖️", name: "Vacation Fund" }, { icon: "🚗", name: "Buy a Car" },
    { icon: "🏦", name: "Retirement Fund" }, { icon: "🆘", name: "Emergency Fund" }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-white font-bold text-lg">Financial Goals</h2>

      {data.goals.length === 0 && (
        <DCard>
          <h3 className="text-purple-400 font-semibold mb-3 text-sm">Quick Start — pick a common goal:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EXAMPLE_GOALS.map(g => (
              <button key={g.name} onClick={() => setForm(f => ({ ...f, name: g.name, icon: g.icon }))}
                className="flex items-center gap-2 text-sm text-purple-300 bg-purple-900/20 border border-purple-800/30 rounded-xl px-3 py-2 hover:bg-purple-800/30 transition-colors">
                <span>{g.icon}</span>{g.name}
              </button>
            ))}
          </div>
        </DCard>
      )}

      <DCard>
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Plus size={16} className="text-purple-400" />Add Goal</h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <Select label="Icon" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}>
            {GOAL_ICONS.map(i => <option key={i}>{i}</option>)}
          </Select>
          <Input label="Goal Name" placeholder="e.g. Buy a House" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Target Amount (₹)" type="number" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} />
          <Input label="Target Date" type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
          <Input label="Current Savings (₹)" type="number" value={form.current} onChange={e => setForm(f => ({ ...f, current: e.target.value }))} />
          <Input label="Monthly Contribution (₹)" type="number" value={form.monthly} onChange={e => setForm(f => ({ ...f, monthly: e.target.value }))} />
          <div className="md:col-span-2 flex items-end"><Btn variant="primary" onClick={add} className="justify-center px-8"><Plus size={14} />Add Goal</Btn></div>
        </div>
      </DCard>

      <div className="grid md:grid-cols-2 gap-4">
        {data.goals.map(goal => {
          const months = monthsUntil(goal.targetDate);
          const pct = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;
          const projected = goal.current + goal.monthly * months;
          const onTrack = projected >= goal.target;
          const needed = requiredSIP(goal.target, goal.current, months);
          const status = !goal.targetDate ? "No date set" : onTrack ? "On Track" : "Behind";
          return (
            <DCard key={goal.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{goal.icon}</span>
                  <div>
                    <div className="text-white font-semibold">{goal.name}</div>
                    <div className="text-purple-400 text-xs">{goal.targetDate ? `By ${fmtDate(goal.targetDate)}` : "No deadline"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={status === "On Track" ? "green" : status === "Behind" ? "amber" : "purple"}>{status}</Badge>
                  <button onClick={() => del(goal.id)} className="text-purple-700 hover:text-red-400"><Trash2 size={13} /></button>
                </div>
              </div>
              <ProgressBar value={goal.current} max={goal.target} label={`${fmt(goal.current)} of ${fmt(goal.target)}`} />
              <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                <div><span className="text-purple-400">Months left: </span><span className="text-white">{months}</span></div>
                <div><span className="text-purple-400">Need per month: </span><span className="text-white font-semibold">{fmt(needed)}</span></div>
                <div><span className="text-purple-400">Projected: </span><span className={onTrack ? "text-green-400" : "text-amber-400"}>{fmt(projected)}</span></div>
                <div><span className="text-purple-400">Gap: </span><span className={onTrack ? "text-green-400" : "text-amber-400"}>{fmt(Math.abs(goal.target - projected))}</span></div>
              </div>
            </DCard>
          );
        })}
      </div>
      {data.goals.length === 0 && <DCard><div className="text-center text-purple-600 py-6">No goals yet. Set your first financial goal above.</div></DCard>}
    </div>
  );
}

// ── REPORTS ───────────────────────────────────────────────────────────────

function ReportsTab({ data, exportJSON }: { data: AppData; exportJSON: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - 11 + i);
    return d.toISOString().slice(0, 7);
  });

  function exportCSV() {
    const rows = [["Month","Income","Expenses","Savings","Savings Rate %"]];
    months.forEach(m => {
      const inc = data.income.filter(e => monthKey(e.date) === m).reduce((s, e) => s + e.amount, 0);
      const exp = data.expenses.filter(e => monthKey(e.date) === m).reduce((s, e) => s + e.amount, 0);
      const sav = inc - exp;
      rows.push([monthLabel(m), inc.toString(), exp.toString(), sav.toString(), inc > 0 ? ((sav/inc)*100).toFixed(1) : "0"]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "cc-finance-report.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const annualIncome = data.income.reduce((s, e) => s + e.amount, 0);
  const annualExpense = data.expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-white font-bold text-lg">Reports & Export</h2>

      {/* Export buttons */}
      <DCard>
        <h3 className="text-white font-semibold mb-4">Export & Backup</h3>
        <div className="flex flex-wrap gap-3">
          <Btn variant="primary" onClick={exportJSON}><Download size={14} />Export Full Backup (JSON)</Btn>
          <Btn variant="gold" onClick={exportCSV}><Download size={14} />Export Monthly Report (CSV)</Btn>
          <Btn variant="ghost" onClick={() => window.print()}><FileText size={14} />Print Report</Btn>
        </div>
        <div className="mt-3 text-xs text-purple-500">JSON backup includes all income, expenses, investments, loans, and goals. Use it to restore data later.</div>
      </DCard>

      {/* Annual Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <KPICard label="Annual Income" value={fmt(annualIncome)} />
        <KPICard label="Annual Expenses" value={fmt(annualExpense)} />
        <KPICard label="Annual Savings" value={fmt(annualIncome - annualExpense)} color={annualIncome >= annualExpense ? "text-green-400" : "text-amber-400"} />
        <KPICard label="Savings Rate" value={fmtPct(annualIncome > 0 ? ((annualIncome - annualExpense) / annualIncome) * 100 : 0)} />
      </div>

      {/* Month table */}
      <DCard>
        <h3 className="text-white font-semibold mb-4">12-Month Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-purple-400 text-xs border-b border-purple-900/40">
              <th className="text-left pb-2">Month</th>
              <th className="text-right pb-2">Income</th>
              <th className="text-right pb-2">Expenses</th>
              <th className="text-right pb-2">Savings</th>
              <th className="text-right pb-2">Rate</th>
              <th className="text-left pb-2">Status</th>
            </tr></thead>
            <tbody>
              {months.map(m => {
                const inc = data.income.filter(e => monthKey(e.date) === m).reduce((s, e) => s + e.amount, 0);
                const exp = data.expenses.filter(e => monthKey(e.date) === m).reduce((s, e) => s + e.amount, 0);
                const sav = inc - exp;
                const rate = inc > 0 ? (sav / inc) * 100 : 0;
                return (
                  <tr key={m} className="border-b border-purple-900/20 hover:bg-purple-900/10">
                    <td className="py-2 text-white text-xs">{monthLabel(m)}</td>
                    <td className="py-2 text-right text-purple-300 text-xs">{inc > 0 ? fmt(inc) : "—"}</td>
                    <td className="py-2 text-right text-amber-400 text-xs">{exp > 0 ? fmt(exp) : "—"}</td>
                    <td className={`py-2 text-right text-xs font-semibold ${sav >= 0 ? "text-green-400" : "text-amber-400"}`}>{inc > 0 || exp > 0 ? fmt(sav) : "—"}</td>
                    <td className="py-2 text-right text-xs text-purple-300">{inc > 0 ? fmtPct(rate) : "—"}</td>
                    <td className="py-2 text-xs">
                      {inc > 0 && <Badge color={rate >= 20 ? "green" : rate >= 10 ? "amber" : "red"}>{rate >= 20 ? "✓ Good" : rate >= 0 ? "Low" : "Deficit"}</Badge>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DCard>

      {/* Data info */}
      <DCard>
        <h3 className="text-white font-semibold mb-3">Data Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          {[
            { label: "Income Entries", value: data.income.length },
            { label: "Expense Entries", value: data.expenses.length },
            { label: "Investments", value: data.investments.length },
            { label: "Active Loans", value: data.loans.length },
            { label: "Goals", value: data.goals.length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-purple-900/20 border border-purple-800/30 rounded-xl p-3">
              <div className="text-2xl font-black text-purple-300">{value}</div>
              <div className="text-purple-500 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-green-400 bg-green-900/20 border border-green-800/30 rounded-xl p-3">
          <Shield size={14} /> All data stored locally in your browser. Never sent to any server.
        </div>
      </DCard>
    </div>
  );
}
