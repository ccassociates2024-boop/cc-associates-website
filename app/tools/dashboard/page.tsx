"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
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

const STORAGE_KEY    = "cc-associates-finance-v1"; // guest / legacy
const PROFILES_KEY   = "ap-finance-profiles";
const DATA_PREFIX    = "ap-finance-data-";
const PROFILE_COLORS = ["#534AB7","#B8973A","#22C55E","#EF4444","#3B82F6","#8B5CF6","#F59E0B","#06B6D4"];

interface Profile { id: string; name: string; pinHash: string; color: string; createdAt: string; }

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}
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
const Btn = ({ children, onClick, variant = "primary", className = "", type = "button", title }:
  { children: React.ReactNode; onClick?: () => void; variant?: "primary"|"gold"|"ghost"; className?: string; type?: "button"|"submit"; title?: string }) => {
  const cls = variant === "primary" ? "bg-purple-600 hover:bg-purple-700 text-white"
    : variant === "gold" ? "bg-[#B8973A] hover:bg-[#C9A84C] text-white"
    : "border border-purple-700 text-purple-300 hover:bg-purple-900/40";
  return <button type={type} onClick={onClick} title={title} className={`${cls} rounded-xl px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${className}`}>{children}</button>;
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
  const xlsxRef = useRef<HTMLInputElement>(null);

  // ── Profile state ──────────────────────────────────────────────────────────
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [showProfileScreen, setShowProfileScreen] = useState(true);
  const [profileAction, setProfileAction] = useState<"select" | "create">("select");
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfilePin, setNewProfilePin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pendingProfile, setPendingProfile] = useState<Profile | null>(null);
  const storageKeyRef = useRef<string>(STORAGE_KEY);

  // Keep storageKey in sync with active profile
  useEffect(() => {
    storageKeyRef.current = activeProfile ? DATA_PREFIX + activeProfile.id : STORAGE_KEY;
  }, [activeProfile]);

  // Load profiles + session on mount
  useEffect(() => {
    try {
      const rawProfiles = localStorage.getItem(PROFILES_KEY);
      const loaded: Profile[] = rawProfiles ? JSON.parse(rawProfiles) : [];
      setProfiles(loaded);

      const sessionId = sessionStorage.getItem("ap-active-profile");
      if (sessionId && loaded.length > 0) {
        const found = loaded.find(p => p.id === sessionId);
        if (found) {
          setActiveProfile(found);
          storageKeyRef.current = DATA_PREFIX + found.id;
          setShowProfileScreen(false);
          const raw = localStorage.getItem(DATA_PREFIX + found.id);
          if (raw) {
            const parsed = JSON.parse(raw) as AppData;
            setData({ ...DEFAULT_DATA, ...parsed, settings: { ...DEFAULT_DATA.settings, ...parsed.settings } });
          } else { setShowWelcome(true); }
          return;
        }
      }

      if (loaded.length === 0) setProfileAction("create");
    } catch { /* first visit */ }
  }, []);

  // Save to localStorage (profile-aware)
  const save = useCallback((d: AppData) => {
    setData(d);
    localStorage.setItem(storageKeyRef.current, JSON.stringify(d));
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

  // ── Profile actions ────────────────────────────────────────────────────────

  async function createProfile() {
    if (!newProfileName.trim()) return;
    if (newProfilePin.length !== 4) { setPinError("PIN must be 4 digits"); return; }
    if (newProfilePin !== confirmPin) { setPinError("PINs don't match"); return; }
    const hash = await sha256(newProfilePin);
    const profile: Profile = {
      id: uid(), name: newProfileName.trim(), pinHash: hash,
      color: PROFILE_COLORS[profiles.length % PROFILE_COLORS.length],
      createdAt: new Date().toISOString(),
    };
    const updated = [...profiles, profile];
    setProfiles(updated);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(updated));
    activateProfile(profile);
  }

  function activateProfile(profile: Profile) {
    setActiveProfile(profile);
    storageKeyRef.current = DATA_PREFIX + profile.id;
    sessionStorage.setItem("ap-active-profile", profile.id);
    const raw = localStorage.getItem(DATA_PREFIX + profile.id);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AppData;
        setData({ ...DEFAULT_DATA, ...parsed, settings: { ...DEFAULT_DATA.settings, ...parsed.settings } });
        setShowProfileScreen(false);
      } catch { setData(DEFAULT_DATA); setShowWelcome(true); setShowProfileScreen(false); }
    } else { setData(DEFAULT_DATA); setShowWelcome(true); setShowProfileScreen(false); }
  }

  async function verifyPin() {
    if (!pendingProfile) return;
    const hash = await sha256(pinInput);
    if (hash === pendingProfile.pinHash) {
      setPinError(""); setPinInput("");
      activateProfile(pendingProfile);
    } else {
      setPinError("Incorrect PIN. Please try again.");
      setPinInput("");
    }
  }

  function enterAsGuest() {
    storageKeyRef.current = STORAGE_KEY;
    sessionStorage.removeItem("ap-active-profile");
    setActiveProfile(null);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AppData;
        setData({ ...DEFAULT_DATA, ...parsed, settings: { ...DEFAULT_DATA.settings, ...parsed.settings } });
        setShowProfileScreen(false);
      } catch { setData(DEFAULT_DATA); setShowWelcome(true); setShowProfileScreen(false); }
    } else { setData(DEFAULT_DATA); setShowWelcome(true); setShowProfileScreen(false); }
  }

  function signOut() {
    sessionStorage.removeItem("ap-active-profile");
    setActiveProfile(null);
    setData(DEFAULT_DATA);
    setPendingProfile(null);
    setPinInput(""); setPinError("");
    setNewProfileName(""); setNewProfilePin(""); setConfirmPin("");
    setProfileAction(profiles.length > 0 ? "select" : "create");
    setShowProfileScreen(true);
  }

  // Welcome submit
  function submitWelcome() {
    if (!welcomeForm.name.trim()) return;
    const updated = { ...data, settings: { ...data.settings, name: welcomeForm.name.trim(), age: parseInt(welcomeForm.age) || 30 } };
    save(updated);
    setShowWelcome(false);
  }

  // ── Excel Export (Professional Styled + Dropdown Validation) ──────────────

  async function exportExcel(templateOnly: boolean) {
    // ExcelJS — handles colours, merged cells AND real data-validation dropdowns natively
    const EXM = await import("exceljs" as any) as any;
    const EX  = EXM.default ?? EXM;
    const wb  = new EX.Workbook();
    wb.creator  = "CC Associates";
    wb.created  = new Date();

    // ── Shared colour palette (ARGB: Alpha + RGB) ────────────────────────────
    const PH = "FF534AB7"; // Purple header
    const GH = "FFB8973A"; // Gold accent
    const NV = "FF1A1630"; // Dark navy (cover)
    const LP = "FFEDE9FF"; // Light purple alt row
    const WH = "FFFFFFFF"; // White
    const DK = "FF1E1B4B"; // Dark text
    const MT = "FF7A7AAA"; // Muted text
    const EG = "FFF9FAFB"; // Example row bg
    const EGT= "FF9CA3AF"; // Example row text

    const sf  = (argb: string) => ({ type: "pattern" as const, pattern: "solid" as const, fgColor: { argb } });
    const fnt = (argb: string, sz = 11, bold = false, italic = false) =>
      ({ name: "Calibri", size: sz, bold, italic, color: { argb } });
    const aln = (h: "left"|"center"|"right", v: "top"|"middle"|"bottom" = "middle", wrap = false) =>
      ({ horizontal: h, vertical: v, wrapText: wrap });

    // Apply style to a single ExcelJS cell
    const stc = (cell: any, fillA: string, fontA: string, h: "left"|"center"|"right",
                 bold = false, sz = 11, italic = false, numFmt?: string) => {
      cell.fill      = sf(fillA);
      cell.font      = fnt(fontA, sz, bold, italic);
      cell.alignment = aln(h);
      if (numFmt) cell.numFmt = numFmt;
    };

    // Style every cell in a row
    const str = (ws: any, rowNum: number, ncols: number,
                 fillA: string, fontA: string, h: "left"|"center"|"right",
                 bold = false, sz = 11, amtCols: number[] = []) => {
      const row = ws.getRow(rowNum);
      for (let c = 1; c <= ncols; c++) {
        const cell = row.getCell(c);
        stc(cell, fillA, fontA, amtCols.includes(c) ? "right" : h, bold, sz);
        if (amtCols.includes(c)) cell.numFmt = "#,##0.00";
      }
    };

    // Add a real dropdown validation to a range
    const dv = (ws: any, range: string, options: string[]) => {
      ws.dataValidations.add(range, {
        type: "list",
        allowBlank: true,
        formulae: [`"${options.join(",")}"`],
        showDropDown: false,
        showErrorMessage: true,
        errorStyle: "error",
        error: "Please choose from the dropdown list",
        errorTitle: "Invalid Entry",
      });
    };

    const today    = new Date().toISOString().slice(0, 10);
    const s        = templateOnly ? DEFAULT_DATA.settings : data.settings;
    const budgets  = s.monthlyBudgets || {};
    const income   = templateOnly ? [] : data.income;
    const expenses = templateOnly ? [] : data.expenses;
    const invests  = templateOnly ? [] : data.investments;
    const loans    = templateOnly ? [] : data.loans;
    const goals    = templateOnly ? [] : data.goals;
    const AMT      = "#,##0.00";

    // ════════════════════════════════════════════════════════════════════════
    // SHEET 1 — Instructions Cover
    // ════════════════════════════════════════════════════════════════════════
    {
      const ws = wb.addWorksheet("Instructions");
      ws.columns = [{ width: 5 }, { width: 58 }, { width: 46 }, { width: 10 }];

      const addRow = (vals: any[], fillA: string, fontA: string,
                      h: "left"|"center"|"right", bold = false, sz = 11) => {
        const row = ws.addRow(vals);
        row.height = 18;
        for (let c = 1; c <= 4; c++) stc(row.getCell(c), fillA, fontA, h, bold, sz);
        return row;
      };

      // Title row — merged, tall
      const r1 = ws.addRow(["PERSONAL FINANCE DASHBOARD"]);
      r1.height = 40;
      ws.mergeCells("A1:D1");
      stc(r1.getCell(1), NV, WH, "center", true, 18);

      // Subtitle
      const r2 = ws.addRow(["CC Associates  ·  100% Private  ·  No Server Upload"]);
      r2.height = 22;
      ws.mergeCells("A2:D2");
      stc(r2.getCell(1), NV, "FF8B83C8", "center", false, 10);

      ws.addRow([""]);

      const secRows = [
        ["📋  HOW TO USE THIS FILE"],
        ["1.", "Fill in each sheet tab with your actual financial data"],
        ["2.", "Do NOT rename column headers or the sheet names"],
        ["3.", "Dates must be in YYYY-MM-DD format   e.g.  2025-04-01"],
        ["4.", "Amounts are in Rupees (₹) — enter numbers only, no commas or ₹ symbol"],
        ["5.", "Cells with ▾ in the header have a dropdown — click cell then click arrow"],
        ["6.", "Save the file and click Import in the dashboard to load your data"],
        [""],
        ["📁  SHEETS IN THIS FILE"],
        ["Settings",    "→", "Name, age, bank balance, property value & monthly budgets"],
        ["Income",      "→", "Income entries with source & tax category dropdowns"],
        ["Expenses",    "→", "Expenses with category, payment mode & deductibility dropdowns"],
        ["Investments", "→", "Portfolio with investment type dropdown"],
        ["Loans_EMI",   "→", "Loan details for EMI and outstanding balance tracking"],
        ["Goals",       "→", "Financial goals with target amount and deadline"],
        [""],
        ["⚠️  NOTES"],
        ["", "Grey rows in template mode are examples — overwrite with your data"],
        ["", "Cells with dropdown ▾ show a list — click the cell then click the arrow"],
        ["", `Generated by: AssociatePiyush.in  ·  ${today}`],
      ];

      const secHeadRows = new Set([4, 12, 20]); // 1-indexed relative to sheet
      secRows.forEach((vals, i) => {
        const rowNum = i + 4; // rows 1-3 already added
        const row = ws.addRow(vals);
        row.height = 18;
        const isHead = secHeadRows.has(rowNum);
        for (let c = 1; c <= 4; c++)
          stc(row.getCell(c), isHead ? GH : (rowNum % 2 === 0 ? LP : WH),
              isHead ? WH : DK, "left", isHead, 10);
      });
    }

    // ════════════════════════════════════════════════════════════════════════
    // SHEET 2 — Settings
    // ════════════════════════════════════════════════════════════════════════
    {
      const ws = wb.addWorksheet("Settings");
      ws.columns = [{ width: 36 }, { width: 22 }, { width: 40 }];
      ws.views   = [{ state: "frozen", ySplit: 2 }];

      // Title
      const tr = ws.addRow(["PERSONAL SETTINGS & MONTHLY BUDGETS"]);
      tr.height = 32; ws.mergeCells("A1:C1");
      stc(tr.getCell(1), NV, WH, "center", true, 13);

      // Header
      const hr = ws.addRow(["Field", "Your Value", "Notes"]);
      hr.height = 22;
      [1,2,3].forEach(c => stc(hr.getCell(c), PH, WH, "center", true, 10));

      const dataRows: any[][] = [
        ["Full Name",          s.name || "",        "Your name"],
        ["Age",                s.age  || "",        "Current age in years"],
        ["Bank Balance (₹)",   s.bankBalance || 0,  "Total savings + current account"],
        ["Property Value (₹)", s.propertyValue || 0,"Market value of owned property"],
      ];
      dataRows.forEach((vals, i) => {
        const row = ws.addRow(vals);
        row.height = 18;
        const bg = i % 2 === 0 ? LP : WH;
        stc(row.getCell(1), bg, DK, "left",  true,  10);
        stc(row.getCell(2), bg, DK, (i >= 2 ? "right" : "left"), false, 10);
        if (i >= 2) row.getCell(2).numFmt = AMT;
        stc(row.getCell(3), WH, MT, "left",  false, 9, true);
      });

      // Section heading
      const sg = ws.addRow(["MONTHLY BUDGETS — enter your spending limit per category"]);
      sg.height = 20; ws.mergeCells(`A${sg.number}:C${sg.number}`);
      stc(sg.getCell(1), GH, WH, "left", true, 10);

      EXPENSE_CATEGORIES.forEach((cat, i) => {
        const row = ws.addRow([`Budget — ${cat} (₹)`, budgets[cat] || 0, `Monthly limit for ${cat.toLowerCase()}`]);
        row.height = 18;
        const bg = i % 2 === 0 ? LP : WH;
        stc(row.getCell(1), bg, DK, "left",  true,  10);
        stc(row.getCell(2), bg, DK, "right", false, 10);
        row.getCell(2).numFmt = AMT;
        stc(row.getCell(3), WH, MT, "left",  false, 9, true);
      });
    }

    // ════════════════════════════════════════════════════════════════════════
    // SHEET 3 — Income
    // ════════════════════════════════════════════════════════════════════════
    {
      const NC = 5;
      const ws = wb.addWorksheet("Income");
      ws.columns = [{ width: 18 }, { width: 16 }, { width: 16 }, { width: 38 }, { width: 16 }];
      ws.views   = [{ state: "frozen", ySplit: 2 }];
      ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: NC } };

      // Title
      const tr = ws.addRow(["INCOME TRACKER"]);
      tr.height = 32; ws.mergeCells(`A1:E1`);
      stc(tr.getCell(1), NV, WH, "center", true, 13);

      // Header
      const hr = ws.addRow(["Date (YYYY-MM-DD)", "Source ▾", "Amount (₹)", "Description", "Tax Category ▾"]);
      hr.height = 22;
      [1,2,3,4,5].forEach(c => stc(hr.getCell(c), PH, WH, "center", true, 10));

      const SRCS  = INCOME_SOURCES;
      const TAXCS = ["Taxable", "Exempt", "Capital Gain"];
      const samples = templateOnly ? [
        ["2025-04-01", "Salary",    85000, "April salary",        "Taxable"],
        ["2025-04-10", "Freelance", 15000, "Project payment",     "Taxable"],
        ["2025-05-01", "Salary",    85000, "May salary",          "Taxable"],
        ["2025-05-15", "Rental",    12000, "House rental income", "Taxable"],
      ] : income.map(e => [e.date, e.source, e.amount, e.description, e.taxCategory]);

      samples.forEach((vals, i) => {
        const row = ws.addRow(vals);
        row.height = 18;
        const bg = templateOnly ? EG : (i % 2 === 0 ? LP : WH);
        const fg = templateOnly ? EGT : DK;
        stc(row.getCell(1), bg, fg, "center", false, 10);
        stc(row.getCell(2), bg, fg, "left",   false, 10);
        stc(row.getCell(3), bg, fg, "right",  false, 10); row.getCell(3).numFmt = AMT;
        stc(row.getCell(4), bg, fg, "left",   false, 10);
        stc(row.getCell(5), bg, fg, "center", false, 10);
      });

      if (!templateOnly && income.length > 0) {
        const tot = income.reduce((s, e) => s + e.amount, 0);
        const row = ws.addRow(["TOTAL", "", tot, "", ""]);
        row.height = 20;
        [1,2,4,5].forEach(c => stc(row.getCell(c), GH, WH, "left", true, 10));
        stc(row.getCell(3), GH, WH, "right", true, 10); row.getCell(3).numFmt = AMT;
      }

      dv(ws, `B3:B1048576`, SRCS);
      dv(ws, `E3:E1048576`, TAXCS);
    }

    // ════════════════════════════════════════════════════════════════════════
    // SHEET 4 — Expenses
    // ════════════════════════════════════════════════════════════════════════
    {
      const NC = 6;
      const ws = wb.addWorksheet("Expenses");
      ws.columns = [{ width: 18 }, { width: 18 }, { width: 14 }, { width: 38 }, { width: 16 }, { width: 16 }];
      ws.views   = [{ state: "frozen", ySplit: 2 }];
      ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: NC } };

      const tr = ws.addRow(["EXPENSE TRACKER"]);
      tr.height = 32; ws.mergeCells("A1:F1");
      stc(tr.getCell(1), NV, WH, "center", true, 13);

      const hr = ws.addRow(["Date (YYYY-MM-DD)", "Category ▾", "Amount (₹)", "Description", "Payment Mode ▾", "Tax Deductible ▾"]);
      hr.height = 22;
      [1,2,3,4,5,6].forEach(c => stc(hr.getCell(c), PH, WH, "center", true, 10));

      const PMODES = ["UPI", "Cash", "Credit Card", "Debit Card", "Bank Transfer", "Cheque"];
      const samples = templateOnly ? [
        ["2025-04-02", "Food & Dining", 4500,  "Grocery shopping",  "UPI",           "No"],
        ["2025-04-05", "Housing",       15000, "Monthly rent",      "Bank Transfer", "No"],
        ["2025-04-10", "Transport",     2200,  "Petrol",            "UPI",           "No"],
        ["2025-04-15", "Healthcare",    800,   "Pharmacy",          "Cash",          "No"],
        ["2025-04-20", "Entertainment", 1200,  "OTT subscriptions", "Credit Card",   "No"],
      ] : expenses.map(e => [e.date, e.category, e.amount, e.description, e.paymentMode, e.taxDeductible ? "Yes" : "No"]);

      samples.forEach((vals, i) => {
        const row = ws.addRow(vals);
        row.height = 18;
        const bg = templateOnly ? EG : (i % 2 === 0 ? LP : WH);
        const fg = templateOnly ? EGT : DK;
        stc(row.getCell(1), bg, fg, "center", false, 10);
        stc(row.getCell(2), bg, fg, "left",   false, 10);
        stc(row.getCell(3), bg, fg, "right",  false, 10); row.getCell(3).numFmt = AMT;
        stc(row.getCell(4), bg, fg, "left",   false, 10);
        stc(row.getCell(5), bg, fg, "center", false, 10);
        stc(row.getCell(6), bg, fg, "center", false, 10);
      });

      if (!templateOnly && expenses.length > 0) {
        const tot = expenses.reduce((s, e) => s + e.amount, 0);
        const row = ws.addRow(["TOTAL", "", tot, "", "", ""]);
        row.height = 20;
        [1,2,4,5,6].forEach(c => stc(row.getCell(c), GH, WH, "left", true, 10));
        stc(row.getCell(3), GH, WH, "right", true, 10); row.getCell(3).numFmt = AMT;
      }

      dv(ws, "B3:B1048576", EXPENSE_CATEGORIES);
      dv(ws, "E3:E1048576", PMODES);
      dv(ws, "F3:F1048576", ["Yes", "No"]);
    }

    // ════════════════════════════════════════════════════════════════════════
    // SHEET 5 — Investments
    // ════════════════════════════════════════════════════════════════════════
    {
      const NC = 7;
      const ws = wb.addWorksheet("Investments");
      ws.columns = [{ width: 16 }, { width: 30 }, { width: 16 }, { width: 18 }, { width: 14 }, { width: 14 }, { width: 20 }];
      ws.views   = [{ state: "frozen", ySplit: 2 }];
      ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: NC } };

      const tr = ws.addRow(["INVESTMENT PORTFOLIO"]);
      tr.height = 32; ws.mergeCells("A1:G1");
      stc(tr.getCell(1), NV, WH, "center", true, 13);

      const hr = ws.addRow(["Type ▾", "Name / Fund Description", "Invested (₹)", "Current Value (₹)", "Start Date", "Maturity Date", "Linked Goal"]);
      hr.height = 22;
      [1,2,3,4,5,6,7].forEach(c => stc(hr.getCell(c), PH, WH, "center", true, 10));

      const samples = templateOnly ? [
        ["Mutual Fund",   "HDFC Top 100 Direct",  50000,  62000,  "2023-06-01", "",           "Retirement"],
        ["Fixed Deposit", "SBI FD 7.5% p.a.",    100000, 108000, "2024-01-01", "2026-01-01", ""],
        ["PPF",           "PPF Account",          150000, 168000, "2020-04-01", "2035-04-01", "Retirement"],
        ["Stocks",        "Infosys, TCS, HDFC",   80000,  96000,  "2022-01-01", "",           ""],
      ] : invests.map(iv => [iv.type, iv.name, iv.invested, iv.currentValue, iv.date, iv.maturityDate, iv.linkedGoal]);

      samples.forEach((vals, i) => {
        const row = ws.addRow(vals);
        row.height = 18;
        const bg = templateOnly ? EG : (i % 2 === 0 ? LP : WH);
        const fg = templateOnly ? EGT : DK;
        stc(row.getCell(1), bg, fg, "left",   false, 10);
        stc(row.getCell(2), bg, fg, "left",   false, 10);
        stc(row.getCell(3), bg, fg, "right",  false, 10); row.getCell(3).numFmt = AMT;
        stc(row.getCell(4), bg, fg, "right",  false, 10); row.getCell(4).numFmt = AMT;
        stc(row.getCell(5), bg, fg, "center", false, 10);
        stc(row.getCell(6), bg, fg, "center", false, 10);
        stc(row.getCell(7), bg, fg, "left",   false, 10);
      });

      if (!templateOnly && invests.length > 0) {
        const totI = invests.reduce((s, iv) => s + iv.invested, 0);
        const totC = invests.reduce((s, iv) => s + iv.currentValue, 0);
        const row  = ws.addRow(["TOTAL", "", totI, totC, "", "", ""]);
        row.height = 20;
        [1,2,5,6,7].forEach(c => stc(row.getCell(c), GH, WH, "left", true, 10));
        stc(row.getCell(3), GH, WH, "right", true, 10); row.getCell(3).numFmt = AMT;
        stc(row.getCell(4), GH, WH, "right", true, 10); row.getCell(4).numFmt = AMT;
      }

      dv(ws, "A3:A1048576", INVESTMENT_TYPES);
    }

    // ════════════════════════════════════════════════════════════════════════
    // SHEET 6 — Loans & EMI
    // ════════════════════════════════════════════════════════════════════════
    {
      const ws = wb.addWorksheet("Loans_EMI");
      ws.columns = [{ width: 14 }, { width: 22 }, { width: 16 }, { width: 14 }, { width: 18 }, { width: 14 }, { width: 26 }];
      ws.views   = [{ state: "frozen", ySplit: 2 }];

      const tr = ws.addRow(["LOANS & EMI TRACKER"]);
      tr.height = 32; ws.mergeCells("A1:G1");
      stc(tr.getCell(1), NV, WH, "center", true, 13);

      const hr = ws.addRow(["Type ▾", "Lender / Bank", "Principal (₹)", "Rate (% p.a.)", "Tenure (Months)", "Start Date", "EMI (₹ · 0=auto)"]);
      hr.height = 22;
      [1,2,3,4,5,6,7].forEach(c => stc(hr.getCell(c), PH, WH, "center", true, 10));

      const samples = templateOnly ? [
        ["Home",     "HDFC Bank",  3500000, 8.5, 240, "2022-04-01", 0],
        ["Car",      "Axis Bank",   600000, 9.5,  60, "2023-09-01", 0],
        ["Personal", "ICICI Bank",  200000,12.0,  36, "2024-06-01", 0],
      ] : loans.map(l => [l.type, l.lender, l.principal, l.rate, l.tenure, l.startDate, l.emi]);

      samples.forEach((vals, i) => {
        const row = ws.addRow(vals);
        row.height = 18;
        const bg = templateOnly ? EG : (i % 2 === 0 ? LP : WH);
        const fg = templateOnly ? EGT : DK;
        stc(row.getCell(1), bg, fg, "left",   false, 10);
        stc(row.getCell(2), bg, fg, "left",   false, 10);
        stc(row.getCell(3), bg, fg, "right",  false, 10); row.getCell(3).numFmt = AMT;
        stc(row.getCell(4), bg, fg, "right",  false, 10); row.getCell(4).numFmt = "0.00";
        stc(row.getCell(5), bg, fg, "center", false, 10);
        stc(row.getCell(6), bg, fg, "center", false, 10);
        stc(row.getCell(7), bg, fg, "right",  false, 10); row.getCell(7).numFmt = AMT;
      });

      dv(ws, "A3:A1048576", LOAN_TYPES);
    }

    // ════════════════════════════════════════════════════════════════════════
    // SHEET 7 — Goals
    // ════════════════════════════════════════════════════════════════════════
    {
      const NC = 6;
      const ws = wb.addWorksheet("Goals");
      ws.columns = [{ width: 28 }, { width: 18 }, { width: 20 }, { width: 14 }, { width: 18 }, { width: 8 }];
      ws.views   = [{ state: "frozen", ySplit: 2 }];

      const tr = ws.addRow(["FINANCIAL GOALS"]);
      tr.height = 32; ws.mergeCells("A1:F1");
      stc(tr.getCell(1), NV, WH, "center", true, 13);

      const hr = ws.addRow(["Goal Name", "Target Amount (₹)", "Current Savings (₹)", "Target Date", "Monthly SIP (₹)", "Icon"]);
      hr.height = 22;
      [1,2,3,4,5,6].forEach(c => stc(hr.getCell(c), PH, WH, "center", true, 10));

      const samples = templateOnly ? [
        ["Emergency Fund",    300000,  120000, "2025-12-31", 15000, "🆘"],
        ["Home Down Payment", 1500000, 350000, "2027-06-01", 25000, "🏠"],
        ["Child Education",   2000000,      0, "2035-04-01",  8000, "🎓"],
        ["Retirement Corpus", 5000000, 800000, "2045-04-01", 20000, "🏦"],
      ] : goals.map(g => [g.name, g.target, g.current, g.targetDate, g.monthly, g.icon]);

      samples.forEach((vals, i) => {
        const row = ws.addRow(vals);
        row.height = 18;
        const bg = templateOnly ? EG : (i % 2 === 0 ? LP : WH);
        const fg = templateOnly ? EGT : DK;
        stc(row.getCell(1), bg, fg, "left",   false, 10);
        stc(row.getCell(2), bg, fg, "right",  false, 10); row.getCell(2).numFmt = AMT;
        stc(row.getCell(3), bg, fg, "right",  false, 10); row.getCell(3).numFmt = AMT;
        stc(row.getCell(4), bg, fg, "center", false, 10);
        stc(row.getCell(5), bg, fg, "right",  false, 10); row.getCell(5).numFmt = AMT;
        stc(row.getCell(6), bg, fg, "center", false, 10);
      });

      if (!templateOnly && goals.length > 0) {
        const totT = goals.reduce((s, g) => s + g.target,  0);
        const totC = goals.reduce((s, g) => s + g.current, 0);
        const row  = ws.addRow(["TOTAL", totT, totC, "", "", ""]);
        row.height = 20;
        [1,4,5,6].forEach(c => stc(row.getCell(c), GH, WH, "left",  true, 10));
        stc(row.getCell(2), GH, WH, "right", true, 10); row.getCell(2).numFmt = AMT;
        stc(row.getCell(3), GH, WH, "right", true, 10); row.getCell(3).numFmt = AMT;
      }

      dv(ws, "F3:F1048576", GOAL_ICONS);
    }

    // ── Download ─────────────────────────────────────────────────────────────
    const buf  = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = templateOnly ? "AP-Finance-Template.xlsx" : `AP-Finance-Backup-${today}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Excel Import ───────────────────────────────────────────────────────────

  function importExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result as ArrayBuffer, { type: "array" });
        const newData: AppData = { ...DEFAULT_DATA, netWorthHistory: data.netWorthHistory };

        // Settings
        const sWs = wb.Sheets["Settings"];
        if (sWs) {
          const rows = XLSX.utils.sheet_to_json<any[]>(sWs, { header: 1 }) as any[][];
          const get = (label: string) => { const r = rows.find(row => String(row[0]).startsWith(label)); return r ? r[1] : undefined; };
          newData.settings = {
            name: String(get("Name") ?? ""),
            age: parseInt(String(get("Age") ?? "30")) || 30,
            bankBalance: parseFloat(String(get("Bank Balance") ?? "0")) || 0,
            propertyValue: parseFloat(String(get("Property Value") ?? "0")) || 0,
            monthlyBudgets: {
              "Housing": parseFloat(String(get("Budget — Housing") ?? "0")) || 0,
              "Food & Dining": parseFloat(String(get("Budget — Food") ?? "0")) || 0,
              "Transport": parseFloat(String(get("Budget — Transport") ?? "0")) || 0,
              "Utilities": parseFloat(String(get("Budget — Utilities") ?? "0")) || 0,
              "Healthcare": parseFloat(String(get("Budget — Healthcare") ?? "0")) || 0,
              "Education": parseFloat(String(get("Budget — Education") ?? "0")) || 0,
              "Entertainment": parseFloat(String(get("Budget — Entertainment") ?? "0")) || 0,
              "Clothing": parseFloat(String(get("Budget — Clothing") ?? "0")) || 0,
              "Insurance": parseFloat(String(get("Budget — Insurance") ?? "0")) || 0,
              "Tax Payments": parseFloat(String(get("Budget — Tax Payments") ?? "0")) || 0,
              "Professional Fees": parseFloat(String(get("Budget — Professional Fees") ?? "0")) || 0,
              "Other": parseFloat(String(get("Budget — Other") ?? "0")) || 0,
            },
          };
        }

        // Income
        const incWs = wb.Sheets["Income"];
        if (incWs) {
          const rows = (XLSX.utils.sheet_to_json<any[]>(incWs, { header: 1 }) as any[][]).slice(1);
          newData.income = rows.filter(r => r[0] && r[2]).map(r => ({
            id: uid(), date: String(r[0]), source: String(r[1] || "Other"),
            amount: parseFloat(String(r[2]).replace(/,/g, "")) || 0,
            description: String(r[3] || ""), taxCategory: String(r[4] || "Taxable"),
          }));
        }

        // Expenses
        const expWs = wb.Sheets["Expenses"];
        if (expWs) {
          const rows = (XLSX.utils.sheet_to_json<any[]>(expWs, { header: 1 }) as any[][]).slice(1);
          newData.expenses = rows.filter(r => r[0] && r[2]).map(r => ({
            id: uid(), date: String(r[0]), category: String(r[1] || "Other"),
            amount: parseFloat(String(r[2]).replace(/,/g, "")) || 0,
            description: String(r[3] || ""), paymentMode: String(r[4] || "UPI"),
            taxDeductible: String(r[5]).toLowerCase() === "yes",
          }));
        }

        // Investments
        const invWs = wb.Sheets["Investments"];
        if (invWs) {
          const rows = (XLSX.utils.sheet_to_json<any[]>(invWs, { header: 1 }) as any[][]).slice(1);
          newData.investments = rows.filter(r => r[0] && r[2]).map(r => ({
            id: uid(), type: String(r[0] || "Other"), name: String(r[1] || ""),
            invested: parseFloat(String(r[2]).replace(/,/g, "")) || 0,
            currentValue: parseFloat(String(r[3]).replace(/,/g, "")) || 0,
            date: String(r[4] || ""), maturityDate: String(r[5] || ""), linkedGoal: String(r[6] || ""),
          }));
        }

        // Loans
        const loanWs = wb.Sheets["Loans_EMI"];
        if (loanWs) {
          const rows = (XLSX.utils.sheet_to_json<any[]>(loanWs, { header: 1 }) as any[][]).slice(1);
          newData.loans = rows.filter(r => r[0] && r[2]).map(r => ({
            id: uid(), type: String(r[0] || "Personal"), lender: String(r[1] || ""),
            principal: parseFloat(String(r[2]).replace(/,/g, "")) || 0,
            rate: parseFloat(String(r[3])) || 0,
            tenure: parseInt(String(r[4])) || 12,
            startDate: String(r[5] || todayISO()),
            emi: parseFloat(String(r[6]).replace(/,/g, "")) || 0,
          }));
        }

        // Goals
        const goalWs = wb.Sheets["Goals"];
        if (goalWs) {
          const rows = (XLSX.utils.sheet_to_json<any[]>(goalWs, { header: 1 }) as any[][]).slice(1);
          newData.goals = rows.filter(r => r[0] && r[1]).map(r => ({
            id: uid(), name: String(r[0]),
            target: parseFloat(String(r[1]).replace(/,/g, "")) || 0,
            current: parseFloat(String(r[2]).replace(/,/g, "")) || 0,
            targetDate: String(r[3] || ""),
            monthly: parseFloat(String(r[4]).replace(/,/g, "")) || 0,
            icon: String(r[5] || "🏦"),
          }));
        }

        save(newData);
        alert("✅ Data imported successfully! Dashboard updated.");
      } catch (err) { alert("❌ Could not read file. Please use an CC Associates Excel template."); }
    };
    reader.readAsArrayBuffer(file);
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

      {/* ── Profile Screen ──────────────────────────────────────────────────── */}
      {showProfileScreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0818] p-4">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center mx-auto mb-3">
                <PiggyBank size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Finance Dashboard</h1>
              <p className="text-purple-400 text-sm mt-1">CC Associates · 100% Private · Browser Only</p>
            </div>

            {/* PIN entry overlay */}
            {pendingProfile && (
              <div className="bg-[#1A1630] border border-purple-800/60 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ background: pendingProfile.color }}>
                    {pendingProfile.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{pendingProfile.name}</div>
                    <div className="text-purple-400 text-xs">Enter your 4-digit PIN</div>
                  </div>
                </div>
                <div className="mb-4">
                  <input type="password" maxLength={4} placeholder="••••" value={pinInput}
                    onChange={e => { setPinInput(e.target.value.replace(/\D/g, "")); setPinError(""); }}
                    onKeyDown={e => e.key === "Enter" && verifyPin()}
                    className="w-full bg-[#0F0D1E] border border-purple-800/60 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-purple-500 placeholder:text-purple-800" />
                  {pinError && <div className="text-red-400 text-xs mt-2 text-center">{pinError}</div>}
                </div>
                <div className="flex gap-2">
                  <Btn variant="ghost" className="flex-1 justify-center" onClick={() => { setPendingProfile(null); setPinInput(""); setPinError(""); }}>Back</Btn>
                  <Btn variant="primary" className="flex-1 justify-center" onClick={verifyPin}>Unlock <ArrowRight size={14} /></Btn>
                </div>
              </div>
            )}

            {/* Profile selection */}
            {!pendingProfile && profileAction === "select" && (
              <div className="bg-[#1A1630] border border-purple-800/60 rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-4">Select Profile</h2>
                <div className="space-y-2 mb-4">
                  {profiles.map(p => (
                    <button key={p.id} onClick={() => { setPendingProfile(p); setPinInput(""); setPinError(""); }}
                      className="w-full flex items-center gap-3 bg-[#0F0D1E] border border-purple-900/40 hover:border-purple-600/60 rounded-xl px-4 py-3 transition-colors group">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{ background: p.color }}>
                        {p.name[0].toUpperCase()}
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-white font-medium">{p.name}</div>
                        <div className="text-purple-600 text-xs">Created {new Date(p.createdAt).toLocaleDateString("en-IN")}</div>
                      </div>
                      <ArrowRight size={14} className="text-purple-600 group-hover:text-purple-400" />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Btn variant="ghost" className="flex-1 justify-center" onClick={() => setProfileAction("create")}>
                    <Plus size={14} /> New Profile
                  </Btn>
                  <Btn variant="ghost" className="flex-1 justify-center" onClick={enterAsGuest}>
                    Continue as Guest
                  </Btn>
                </div>
              </div>
            )}

            {/* Create profile form */}
            {!pendingProfile && profileAction === "create" && (
              <div className="bg-[#1A1630] border border-purple-800/60 rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-1">Create Profile</h2>
                <p className="text-purple-400 text-xs mb-5">Your data stays in this browser. PIN is hashed locally.</p>
                <div className="space-y-4 mb-5">
                  <Input label="Profile Name" placeholder="e.g. Piyush, Family" value={newProfileName}
                    onChange={e => setNewProfileName(e.target.value)} />
                  <Input label="4-Digit PIN" type="password" maxLength={4} placeholder="Enter 4-digit PIN" value={newProfilePin}
                    onChange={e => { setNewProfilePin(e.target.value.replace(/\D/g, "")); setPinError(""); }} />
                  <Input label="Confirm PIN" type="password" maxLength={4} placeholder="Re-enter PIN" value={confirmPin}
                    onChange={e => { setConfirmPin(e.target.value.replace(/\D/g, "")); setPinError(""); }} />
                  {pinError && <div className="text-red-400 text-xs">{pinError}</div>}
                </div>
                <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/20 border border-green-800/30 rounded-xl p-3 mb-4">
                  <Shield size={13} /> PIN is hashed with SHA-256 and stored only in your browser.
                </div>
                <div className="flex gap-2">
                  {profiles.length > 0 && (
                    <Btn variant="ghost" className="flex-1 justify-center" onClick={() => setProfileAction("select")}>Back</Btn>
                  )}
                  <Btn variant="ghost" className={profiles.length > 0 ? "flex-1 justify-center" : "flex-1 justify-center"} onClick={enterAsGuest}>Guest Mode</Btn>
                  <Btn variant="primary" className="flex-1 justify-center" onClick={createProfile}>
                    Create <ArrowRight size={14} />
                  </Btn>
                </div>
              </div>
            )}

            <p className="text-center text-purple-700 text-xs mt-4">All financial data is stored locally in your browser. Never uploaded anywhere.</p>
          </div>
        </div>
      )}

      {/* Welcome Modal */}
      {!showProfileScreen && showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1A1630] border border-purple-800/60 rounded-2xl p-8 max-w-md w-full">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center mb-4">
              {activeProfile
                ? <span className="text-white font-bold text-lg">{activeProfile.name[0].toUpperCase()}</span>
                : <PiggyBank size={22} className="text-white" />}
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              {activeProfile ? `Welcome, ${activeProfile.name}!` : "Welcome to Finance Dashboard"}
            </h2>
            <p className="text-purple-400 text-sm mb-6">Let's set up your profile. You can change this later in Settings.</p>
            <div className="space-y-4 mb-6">
              <Input label="Your Name" placeholder="e.g. CC Associates" value={welcomeForm.name}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-white font-bold text-lg">
              {data.settings.name ? `${data.settings.name}'s` : "Personal"} Finance Dashboard
            </h1>
            <p className="text-purple-400 text-xs">
              CC Associates · 100% Private · Browser Only
              {activeProfile && <span className="ml-2 text-purple-500">· Profile: {activeProfile.name}</span>}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Btn variant="ghost" onClick={() => exportExcel(false)} title="Export all data to Excel"><Download size={14} />Export</Btn>
            <Btn variant="ghost" onClick={() => exportExcel(true)} title="Download blank Excel template"><FileText size={14} />Template</Btn>
            <Btn variant="ghost" onClick={() => xlsxRef.current?.click()} title="Import data from Excel"><Upload size={14} />Import</Btn>
            <input ref={xlsxRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={importExcel} />
            <Btn variant="ghost" onClick={signOut} title="Switch profile"><Users size={14} />Profile</Btn>
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
        {tab === 7 && <ReportsTab data={data} exportExcel={exportExcel} />}
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

      {/* CTA */}
      <div className="bg-[#1A1630] border border-purple-700/40 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <div className="text-white font-semibold">Need help optimizing your taxes?</div>
          <div className="text-purple-400 text-sm">Chat with CC Associates for personalized tax advice.</div>
        </div>
        <a href="https://wa.me/918421465966?text=Hello%20Piyush%2C%20I%20need%20tax%20advisory%20help."
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors">
          <MessageCircle size={16} />Chat on WhatsApp <ArrowRight size={14} />
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

function ReportsTab({ data, exportExcel }: { data: AppData; exportExcel: (templateOnly: boolean) => void | Promise<void> }) {
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
          <Btn variant="primary" onClick={() => exportExcel(false)}><Download size={14} />Export Full Backup (Excel)</Btn>
          <Btn variant="ghost" onClick={() => exportExcel(true)}><FileText size={14} />Download Blank Template</Btn>
          <Btn variant="gold" onClick={exportCSV}><Download size={14} />Monthly Report (CSV)</Btn>
          <Btn variant="ghost" onClick={() => window.print()}><FileText size={14} />Print Report</Btn>
        </div>
        <div className="mt-3 text-xs text-purple-500">Excel backup includes all income, expenses, investments, loans, and goals across 6 sheets. Use the template to import data from scratch.</div>
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
