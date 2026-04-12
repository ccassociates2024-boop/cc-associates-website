"use client";

import { useState, useRef } from "react";
import {
  FileText, ArrowLeft, ArrowRight, Copy, Printer, CheckCircle,
  MessageCircle, AlertTriangle, ChevronDown, RotateCcw,
} from "lucide-react";
import Link from "next/link";

// ── Firm constants ───────────────────────────────────────────────────────────
const FIRM_NAME = "Associate Piyush";
const FIRM_ADDR = "Pune, Maharashtra";
const FIRM_PHONE = "+91 75073 54141";
const FIRM_EMAIL = "associate.piyush.nimse@gmail.com";
const WA_URL = "https://wa.me/917507354141?text=Hello%20Associate%20Piyush%2C%20I%20need%20help%20with%20an%20Income%20Tax%20notice.";

// ── Notice Types ─────────────────────────────────────────────────────────────
const NOTICE_TYPES = [
  {
    value: "143_1",
    label: "Section 143(1) — Intimation / Demand Notice",
    short: "Sec 143(1) Intimation",
    desc: "Issued after processing your ITR. May raise a demand or adjust your return.",
  },
  {
    value: "148A_b",
    label: "Section 148A(b) — Show Cause Notice for Reassessment",
    short: "Sec 148A(b) Show Cause",
    desc: "Before reopening a past assessment. You must explain why reassessment isn't warranted.",
  },
  {
    value: "139_9",
    label: "Section 139(9) — Defective Return Notice",
    short: "Sec 139(9) Defective Return",
    desc: "Your return has been marked defective. You must rectify within the specified time.",
  },
  {
    value: "245",
    label: "Section 245 — Adjustment of Refund Against Demand",
    short: "Sec 245 Refund Adjustment",
    desc: "Department intends to use your refund to settle an outstanding demand.",
  },
  {
    value: "156",
    label: "Section 156 — Notice of Demand",
    short: "Sec 156 Demand Notice",
    desc: "Formal demand for payment of tax, interest, or penalty.",
  },
  {
    value: "131",
    label: "Section 131 — Summons / Information Required",
    short: "Sec 131 Summons",
    desc: "Assessing Officer requires your attendance or specific documents/information.",
  },
];

const AY_OPTIONS = [
  "2026-27", "2025-26", "2024-25", "2023-24", "2022-23", "2021-22", "2020-21",
];

// ── Template Generator ───────────────────────────────────────────────────────
interface FormData {
  noticeType: string;
  assesseeName: string;
  pan: string;
  ay: string;
  noticeNo: string;
  noticeDate: string;
  aoName: string;
  ward: string;
  amount: string;
  issue: string;
  replyDate: string;
}

function fmt(d: string) {
  if (!d) return "___________";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function fmtAmt(a: string) {
  if (!a) return "";
  const n = parseFloat(a);
  if (isNaN(n)) return a;
  return "₹" + new Intl.NumberFormat("en-IN").format(n);
}

function generateLetter(f: FormData): string {
  const name = f.assesseeName || "[Assessee Name]";
  const pan = f.pan || "[PAN]";
  const ay = f.ay || "[AY]";
  const noticeNo = f.noticeNo || "[Notice No.]";
  const noticeDate = fmt(f.noticeDate);
  const replyDate = fmt(f.replyDate);
  const ao = f.aoName || "The Assessing Officer";
  const ward = f.ward || "[Ward / Circle]";
  const amount = fmtAmt(f.amount);
  const issue = f.issue || "[Brief description of the issue as stated in the notice]";

  const header = `${name}
${FIRM_ADDR}
PAN: ${pan}

Date: ${replyDate}

To,
${ao}
Income Tax Department,
${ward}`;

  const enclosures = `Enclosures:
1. Copy of the Notice dated ${noticeDate}
2. Copy of Income Tax Return Acknowledgement for AY ${ay}
3. Form 26AS / AIS (relevant portion)
4. Any other supporting documents as applicable`;

  const signOff = `Thanking you,

Yours faithfully,

${name}
PAN: ${pan}
Date: ${replyDate}

Represented by:
${FIRM_NAME}
Tax & Finance Consultants, Pune
Phone: ${FIRM_PHONE}
Email: ${FIRM_EMAIL}

${enclosures}`;

  // ── 143(1) ────────────────────────────────────────────────────────────────
  if (f.noticeType === "143_1") {
    return `${header}

Sub: Reply to Intimation under Section 143(1) of the Income-tax Act, 2025
Ref: Notice No. ${noticeNo} dated ${noticeDate}
     PAN: ${pan} | Assessment Year: ${ay}

Respected Sir / Madam,

With reference to the above-mentioned Intimation under Section 143(1) of the Income-tax Act, 2025 dated ${noticeDate}, we respectfully submit our reply as follows:

1. ACKNOWLEDGEMENT OF NOTICE
   We are in receipt of the above Intimation wherein${amount ? ` a demand of ${amount} has been raised` : " certain adjustments have been made"} in relation to: ${issue}.

2. GROUNDS OF REPLY
   a. The Income Tax Return for the Assessment Year ${ay} was filed correctly and in good faith, disclosing all income, deductions, and tax credits in accordance with the provisions of the Income-tax Act, 2025.

   b. The adjustment/demand raised in the Intimation appears to be erroneous and is not in conformity with the provisions of Section 143(1)(a) of the Act. The adjustments permissible under Section 143(1) are limited to arithmetical errors, incorrect claims apparent from the return, and disallowance of certain specific claims — none of which appear applicable in the present case.

   c. All TDS deducted, advance tax paid, and self-assessment tax paid are duly reflected in Form 26AS / Annual Information Statement (AIS) and have been correctly claimed in the return of income.

3. REQUEST FOR RECTIFICATION
   In view of the above, we respectfully pray that your good office may kindly:
   a. Review the Intimation in light of the submissions made herein;
   b. Pass a rectification order under Section 154 of the Income-tax Act, 2025 withdrawing/reducing the demand raised; and
   c. Grant the correct refund due, if applicable.

We are ready to provide any further information, documents, or clarifications as may be required and assure your office of our full cooperation at all times.

${signOff}`;
  }

  // ── 148A(b) ───────────────────────────────────────────────────────────────
  if (f.noticeType === "148A_b") {
    return `${header}

Sub: Reply to Show Cause Notice under Section 148A(b) of the Income-tax Act, 2025
Ref: Notice No. ${noticeNo} dated ${noticeDate}
     PAN: ${pan} | Assessment Year: ${ay}

Respected Sir / Madam,

With reference to the above-mentioned Show Cause Notice under Section 148A(b) of the Income-tax Act, 2025 dated ${noticeDate}, calling upon us to show cause why an order for conducting reassessment under Section 148 should not be passed, we respectfully submit our reply as follows:

1. FACTS OF THE CASE
   The assessee, ${name} (PAN: ${pan}), duly filed the Return of Income for Assessment Year ${ay} within the prescribed time under Section 139 of the Income-tax Act, 2025, disclosing all income, assets, and transactions in a true and fair manner.

2. GROUNDS AGAINST REASSESSMENT
   a. The alleged information suggesting income escaping assessment in relation to ${issue} is factually incorrect and/or already fully disclosed in the original return of income.

   b. The proceedings under Section 148A are subject to the condition that there exists credible, specific, and tangible information indicating escapement of income. No such credible information has been brought on record in the present notice.

   c. The requirement of "reason to believe" as contemplated under the Income-tax Act has not been fulfilled. Mere information from databases or third parties, without independent application of mind, does not constitute sufficient ground for reopening.

   d. ${amount ? `The alleged escapement of ${amount} is denied. ` : ""}All financial transactions undertaken by the assessee are duly reflected in the books of account and supporting documents are available.

3. PRAYER
   In view of the above submissions, we respectfully pray that:
   a. The Show Cause Notice under Section 148A(b) be considered in light of the submissions made herein;
   b. No order under Section 148A(d) directing reassessment be passed; and
   c. The proceedings be dropped, as the income in question has been duly disclosed and there is no escapement of income.

We stand ready to appear before your office on the scheduled date and produce any documents or evidence as required.

${signOff}`;
  }

  // ── 139(9) ────────────────────────────────────────────────────────────────
  if (f.noticeType === "139_9") {
    return `${header}

Sub: Reply to Notice under Section 139(9) — Rectification of Defective Return
Ref: Notice No. ${noticeNo} dated ${noticeDate}
     PAN: ${pan} | Assessment Year: ${ay}

Respected Sir / Madam,

With reference to the above-mentioned Notice under Section 139(9) of the Income-tax Act, 2025 dated ${noticeDate}, declaring the Return of Income for Assessment Year ${ay} as defective on account of ${issue}, we respectfully submit as follows:

1. ACKNOWLEDGEMENT
   We acknowledge receipt of the Notice under Section 139(9) and have carefully examined the defect(s) pointed out therein.

2. RECTIFICATION / CLARIFICATION
   a. We accept that the return as filed contained an inadvertent omission / error as highlighted in the notice.

   b. We are hereby furnishing the corrected information / required details to cure the said defect:
      — The defect pertains to: ${issue}
      — Corrected details are enclosed with this reply along with supporting documentary evidence.

   c. Kindly note that the defect was purely due to an oversight and there was no intention to suppress any income or misrepresent any fact. The assessee has always been compliant and has filed returns regularly.

3. REQUEST
   In view of the above, we respectfully request that:
   a. The defect pointed out in the notice be treated as cured upon receipt of this reply;
   b. The Return of Income for AY ${ay} be treated as valid from the original date of filing; and
   c. No adverse action be taken against the assessee.

We enclose the required documents for your reference and record.

${signOff}`;
  }

  // ── 245 ───────────────────────────────────────────────────────────────────
  if (f.noticeType === "245") {
    return `${header}

Sub: Objection to Proposed Adjustment of Refund under Section 245 of the Income-tax Act, 2025
Ref: Notice No. ${noticeNo} dated ${noticeDate}
     PAN: ${pan} | Assessment Year: ${ay}

Respected Sir / Madam,

With reference to the above-mentioned Notice under Section 245 of the Income-tax Act, 2025 dated ${noticeDate} proposing to adjust the refund due for Assessment Year ${ay} against the alleged outstanding demand${amount ? ` of ${amount}` : ""}, we respectfully object to the said adjustment on the following grounds:

1. STATEMENT OF FACTS
   The assessee, ${name} (PAN: ${pan}), is entitled to a refund for Assessment Year ${ay} as per the filed return of income / assessment order. The department proposes to adjust this refund against a demand${amount ? ` of ${amount}` : ""} relating to ${issue}.

2. GROUNDS OF OBJECTION
   a. The demand proposed to be adjusted is disputed and is currently subject to appeal / rectification proceedings before the competent authority. A demand that is sub-judice or has been stayed should not be adjusted against a refund.

   b. The outstanding demand referred to in the notice is incorrect and has arisen on account of a processing error / erroneous assessment, as detailed in our earlier rectification application / appeal (copy enclosed).

   c. Adjustment of a refund against a disputed demand would cause irreparable hardship and financial loss to the assessee.

   d. In terms of the CBDT Circular and settled judicial precedent, adjustment should not be made where the demand is disputed and stay has been applied for / granted.

3. PRAYER
   We humbly pray that:
   a. The proposed adjustment under Section 245 be dropped;
   b. The refund due for AY ${ay} be released forthwith; and
   c. The disputed demand be resolved through proper proceedings.

We are prepared to furnish any further information as may be required.

${signOff}`;
  }

  // ── 156 ───────────────────────────────────────────────────────────────────
  if (f.noticeType === "156") {
    return `${header}

Sub: Reply to Notice of Demand under Section 156 of the Income-tax Act, 2025
Ref: Notice No. ${noticeNo} dated ${noticeDate}
     PAN: ${pan} | Assessment Year: ${ay}

Respected Sir / Madam,

With reference to the above-mentioned Notice of Demand under Section 156 of the Income-tax Act, 2025 dated ${noticeDate}${amount ? `, raising a demand of ${amount}` : ""} for Assessment Year ${ay} on account of ${issue}, we respectfully submit as follows:

1. ACKNOWLEDGEMENT OF DEMAND
   We are in receipt of the Notice of Demand and have duly noted the demand${amount ? ` of ${amount}` : ""} raised therein.

2. GROUNDS OF REPLY / DISPUTE
   a. The demand raised under the assessment/order giving rise to this notice is disputed on the following grounds: ${issue}.

   b. The assessment order / intimation giving rise to this demand contains factual and legal errors which have not been appreciated correctly. The said demand is, therefore, not sustainable under law.

   c. We have already filed / intend to file an Appeal / Rectification Application before the competent authority against the order giving rise to this demand. In view of the same, we request that the demand be kept in abeyance pending disposal of the appeal / rectification.

3. APPLICATION FOR STAY
   Without prejudice to our right to contest the demand in full, we request your good office to grant a stay on recovery of the demand during the pendency of the appeal / rectification proceedings, as per the CBDT's Stay Policy and in consonance with the principles of natural justice.

4. PRAYER
   We respectfully pray that:
   a. The demand under reference be kept in abeyance pending the outcome of the appeal / rectification;
   b. No coercive recovery action be initiated during this period; and
   c. A reasonable opportunity of being heard be granted before any adverse action is taken.

${signOff}`;
  }

  // ── 131 ───────────────────────────────────────────────────────────────────
  if (f.noticeType === "131") {
    return `${header}

Sub: Reply to Summons / Notice for Information under Section 131 of the Income-tax Act, 2025
Ref: Notice No. ${noticeNo} dated ${noticeDate}
     PAN: ${pan} | Assessment Year: ${ay}

Respected Sir / Madam,

With reference to the above-mentioned Summons / Notice under Section 131 of the Income-tax Act, 2025 dated ${noticeDate} calling upon the assessee, ${name} (PAN: ${pan}), to furnish information / attend your office in connection with: ${issue}, we respectfully submit as follows:

1. ACKNOWLEDGEMENT AND COMPLIANCE
   We acknowledge receipt of the Summons / Notice and express our willingness to fully cooperate with the Income Tax Department. We are committed to providing all information and documents as required under law.

2. INFORMATION / DOCUMENTS FURNISHED
   In compliance with the above notice, we are enclosing the following documents / information herewith:
   a. Copies of relevant financial statements / bank statements for AY ${ay};
   b. Copies of relevant transaction documents / agreements as applicable;
   c. Copy of Income Tax Return with computation for AY ${ay};
   d. Any other documents specifically requested in the notice.

3. CLARIFICATION ON THE MATTER
   With respect to the specific query regarding ${issue}, we submit:
   All transactions undertaken by the assessee are genuine commercial transactions, duly recorded in the books of account, supported by primary documents, and fully disclosed in the relevant return(s) of income. There is no element of tax evasion or concealment.

4. REQUEST
   We respectfully request that:
   a. The information and documents furnished herewith be accepted as complete compliance with the notice;
   b. If any further information or personal appearance is required, adequate prior notice be provided; and
   c. The matter be closed at the earliest upon satisfaction of the department.

${signOff}`;
  }

  return "";
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function NoticeReplyPage() {
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const letterRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormData>({
    noticeType: "",
    assesseeName: "",
    pan: "",
    ay: "2026-27",
    noticeNo: "",
    noticeDate: "",
    aoName: "",
    ward: "",
    amount: "",
    issue: "",
    replyDate: new Date().toISOString().split("T")[0],
  });

  const set = (k: keyof FormData, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const selectedNotice = NOTICE_TYPES.find(n => n.value === form.noticeType);
  const letter = step === 3 ? generateLetter(form) : "";

  const canProceedStep1 = !!form.noticeType;
  const canProceedStep2 = form.assesseeName && form.pan && form.noticeNo && form.noticeDate && form.replyDate;

  async function copyLetter() {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function printLetter() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Notice Reply — ${selectedNotice?.short}</title>
    <style>
      body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.7; margin: 0; padding: 40px 60px; color: #111; }
      pre { font-family: 'Times New Roman', serif; font-size: 13pt; white-space: pre-wrap; word-wrap: break-word; }
      @media print { body { padding: 20px 40px; } }
    </style></head>
    <body><pre>${letter.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition";
  const selectCls = inputCls + " bg-white";
  const lbl = (t: string, opt?: boolean) => (
    <label className="block text-xs font-semibold text-dark mb-1.5 uppercase tracking-wide">
      {t}{opt && <span className="text-gray-400 normal-case font-normal ml-1">(optional)</span>}
    </label>
  );

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Back */}
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Tools
        </Link>

        {/* Header */}
        <div className="bg-primary rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <FileText size={24} className="text-gold" />
            </div>
            <div>
              <div className="text-gold text-xs font-bold uppercase tracking-wider mb-1">Income Tax · Free Tool</div>
              <h1 className="text-2xl font-bold text-white mb-1">Income Tax Notice Reply Generator</h1>
              <p className="text-blue-200 text-sm">
                Generate a professional, legally-worded reply draft for common Income Tax notices in 60 seconds. No login required.
              </p>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { n: 1, label: "Notice Type" },
            { n: 2, label: "Your Details" },
            { n: 3, label: "Review Draft" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <button
                onClick={() => { if (s.n < step || (s.n === 2 && canProceedStep1) || (s.n === 3 && canProceedStep2 && canProceedStep1)) setStep(s.n); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  step === s.n
                    ? "bg-primary text-white"
                    : step > s.n
                    ? "bg-green-100 text-green-700 cursor-pointer hover:bg-green-200"
                    : "bg-gray-100 text-gray-400 cursor-default"
                }`}
              >
                {step > s.n ? <CheckCircle size={12} /> : <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[10px]">{s.n}</span>}
                {s.label}
              </button>
              {i < 2 && <div className={`h-px w-6 ${step > s.n ? "bg-green-300" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Notice Type ── */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
            <h2 className="font-bold text-dark text-base mb-1">Step 1 — Select Notice Type</h2>
            <p className="text-muted text-sm mb-5">Choose the section under which you received the notice.</p>
            <div className="space-y-3">
              {NOTICE_TYPES.map(n => (
                <button
                  key={n.value}
                  onClick={() => set("noticeType", n.value)}
                  className={`w-full text-left border rounded-xl p-4 transition-all ${
                    form.noticeType === n.value
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-gray-200 hover:border-primary/40 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-dark text-sm">{n.label}</div>
                      <div className="text-muted text-xs mt-0.5">{n.desc}</div>
                    </div>
                    {form.noticeType === n.value && <CheckCircle size={18} className="text-primary flex-shrink-0 mt-0.5" />}
                  </div>
                </button>
              ))}
            </div>
            <button
              disabled={!canProceedStep1}
              onClick={() => setStep(2)}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-primary disabled:bg-gray-200 disabled:text-gray-400 text-gold font-bold rounded-lg py-3.5 text-sm transition-colors hover:bg-primary/90"
            >
              Next: Enter Details <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ── STEP 2: Form Inputs ── */}
        {step === 2 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {selectedNotice?.short}
              </div>
              <button onClick={() => setStep(1)} className="text-xs text-muted hover:text-primary flex items-center gap-1"><RotateCcw size={12} /> Change</button>
            </div>
            <h2 className="font-bold text-dark text-base mb-1">Step 2 — Enter Details</h2>
            <p className="text-muted text-sm mb-5">These details will be auto-filled into the reply letter.</p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                {lbl("Assessee Name")}
                <input type="text" className={inputCls} placeholder="e.g. Rahul Sharma" value={form.assesseeName} onChange={e => set("assesseeName", e.target.value)} />
              </div>
              <div>
                {lbl("PAN Number")}
                <input type="text" className={inputCls} placeholder="ABCDE1234F" maxLength={10} value={form.pan} onChange={e => set("pan", e.target.value.toUpperCase())} />
              </div>
              <div>
                {lbl("Assessment Year")}
                <select className={selectCls} value={form.ay} onChange={e => set("ay", e.target.value)}>
                  {AY_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                {lbl("Notice Number")}
                <input type="text" className={inputCls} placeholder="e.g. ITO/143(1)/2024-25/001" value={form.noticeNo} onChange={e => set("noticeNo", e.target.value)} />
              </div>
              <div>
                {lbl("Date of Notice")}
                <input type="date" className={inputCls} value={form.noticeDate} onChange={e => set("noticeDate", e.target.value)} />
              </div>
              <div>
                {lbl("Assessing Officer Name", true)}
                <input type="text" className={inputCls} placeholder="e.g. ITO Ward 1(2)" value={form.aoName} onChange={e => set("aoName", e.target.value)} />
              </div>
              <div>
                {lbl("Ward / Circle", true)}
                <input type="text" className={inputCls} placeholder="e.g. Ward 5(3)(2), Pune" value={form.ward} onChange={e => set("ward", e.target.value)} />
              </div>
              <div>
                {lbl("Amount in Dispute (₹)", true)}
                <input type="number" className={inputCls} placeholder="e.g. 45000" value={form.amount} onChange={e => set("amount", e.target.value)} />
              </div>
              <div>
                {lbl("Date of Reply")}
                <input type="date" className={inputCls} value={form.replyDate} onChange={e => set("replyDate", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                {lbl("Brief Description of Issue")}
                <textarea
                  className={inputCls + " h-24 resize-none"}
                  placeholder="e.g. Mismatch in TDS credit claimed vs Form 26AS; additional income of ₹45,000 added on account of interest income not declared..."
                  maxLength={200}
                  value={form.issue}
                  onChange={e => set("issue", e.target.value)}
                />
                <div className="text-right text-[10px] text-muted mt-0.5">{form.issue.length}/200</div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="flex items-center gap-2 border border-gray-200 text-dark rounded-lg px-5 py-3 text-sm font-medium hover:bg-gray-50 transition-colors">
                <ArrowLeft size={15} /> Back
              </button>
              <button
                disabled={!canProceedStep2}
                onClick={() => setStep(3)}
                className="flex-1 flex items-center justify-center gap-2 bg-primary disabled:bg-gray-200 disabled:text-gray-400 text-gold font-bold rounded-lg py-3 text-sm transition-colors hover:bg-primary/90"
              >
                Generate Reply Draft <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Output ── */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Actions bar */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  {selectedNotice?.short}
                </div>
                <span className="text-sm font-semibold text-dark">{form.assesseeName} · PAN: {form.pan} · AY {form.ay}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="flex items-center gap-2 border border-gray-200 text-dark rounded-lg px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors">
                  <RotateCcw size={13} /> Edit
                </button>
                <button
                  onClick={copyLetter}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
                    copied ? "bg-green-500 text-white" : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {copied ? <><CheckCircle size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                </button>
                <button
                  onClick={printLetter}
                  className="flex items-center gap-2 bg-primary text-gold rounded-lg px-4 py-2 text-xs font-bold hover:bg-primary/90 transition-colors"
                >
                  <Printer size={13} /> Print / PDF
                </button>
              </div>
            </div>

            {/* Letter preview */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-300" />
                <div className="w-3 h-3 rounded-full bg-yellow-300" />
                <div className="w-3 h-3 rounded-full bg-green-300" />
                <span className="ml-3 text-xs text-muted font-medium">Reply Letter Preview</span>
              </div>
              <div ref={letterRef} className="p-6 sm:p-8">
                <pre className="font-serif text-sm text-dark leading-relaxed whitespace-pre-wrap break-words">
                  {letter}
                </pre>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                <span className="font-semibold">Disclaimer:</span> This is a computer-generated draft for reference only. Please review the content carefully with your CA before submission. For personalised guidance, contact{" "}
                <span className="font-semibold">{FIRM_NAME}: {FIRM_PHONE}</span>.
              </p>
            </div>

            {/* WhatsApp CTA */}
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-4 bg-primary rounded-xl px-5 py-4 hover:bg-primary/90 transition-colors"
            >
              <div>
                <div className="text-gold text-xs font-bold uppercase tracking-wide mb-0.5">Need Expert Help?</div>
                <div className="text-white font-semibold text-sm">Let us review & submit this reply on your behalf</div>
                <div className="text-blue-200 text-xs mt-0.5">WhatsApp: {FIRM_PHONE} · Response within 2 hours</div>
              </div>
              <div className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold px-4 py-2.5 rounded-full whitespace-nowrap flex-shrink-0 transition-colors">
                <MessageCircle size={16} />
                WhatsApp Us
              </div>
            </a>
          </div>
        )}

        {/* Info note at bottom */}
        <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-card p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText size={16} className="text-primary" />
            </div>
            <div className="text-xs text-muted leading-relaxed">
              <span className="font-semibold text-dark block mb-1">How this tool works</span>
              This tool generates standard reply drafts based on established legal templates for common Income Tax notices. Templates are updated for the Income-tax Act, 2025. Each draft is automatically filled with your specific details. Always consult a qualified CA before submitting any reply to the Income Tax Department.
              <br /><br />
              <span className="font-semibold text-dark">Supported notices:</span> Sec 143(1) Intimation, Sec 148A(b) Show Cause, Sec 139(9) Defective Return, Sec 245 Refund Adjustment, Sec 156 Demand Notice, Sec 131 Summons.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
