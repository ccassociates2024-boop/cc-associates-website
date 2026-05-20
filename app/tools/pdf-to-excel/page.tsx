"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import Link from "next/link";
import {
  Table, ArrowLeft, Upload, Download, Shield, AlertCircle,
  CheckCircle, Loader2, RefreshCw, FileSpreadsheet, Eye, EyeOff,
  Cloud, Lock, Zap, Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TextItem { str: string; x: number; y: number; pageY: number; width: number; }

interface ExtractionResult {
  rawTable:   string[][];
  stdHeaders: string[];
  stdRows:    string[][];
  pages:      number;
  rows:       number;
  cols:       number;
  fileName:   string;
  isOCR:      boolean;
  isServer:   boolean;
  serverBlob?: Blob;   // original Excel bytes from server (used for download)
}

type Mode = "server" | "browser";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DATE_RE  = /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b|\b\d{2}\s+\w{3}\s+\d{4}\b|\b\d{8}\b/;
const NUM_RE   = /^[\d,]+\.?\d{0,2}$|^-$|^Dr\.?$|^Cr\.?$/i;
const CHEQ_RE  = /^\d{5,9}$/;
const GARBAGE_RE = /^[|[\]{}<>\\\/\-_=+~*^]+$|^\s*$/;

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1048576).toFixed(2)} MB`;
}

// ─── Browser-mode: canvas grid-line detection ─────────────────────────────────
function detectEraseLines(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number): number[] {
  const img  = ctx.getImageData(0, 0, w, h);
  const data = img.data;
  const lum  = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++)
    lum[i] = Math.round(0.299 * data[i*4] + 0.587 * data[i*4+1] + 0.114 * data[i*4+2]);

  const DARK = 190;
  const xS = Math.floor(w * 0.03), xE = Math.floor(w * 0.97);
  const yS = Math.floor(h * 0.03), yE = Math.floor(h * 0.97);

  // Erase horizontal lines
  for (let y = 0; y < h; y++) {
    let dark = 0;
    for (let x = xS; x < xE; x++) if (lum[y*w+x] < DARK) dark++;
    if (dark / (xE - xS) > 0.55) {
      for (let x = 0; x < w; x++) {
        lum[y*w+x] = 255;
        const i = (y*w+x)*4; data[i] = data[i+1] = data[i+2] = 255;
      }
    }
  }

  // Detect + erase vertical lines
  const vPixels: number[] = [];
  for (let x = 0; x < w; x++) {
    let dark = 0;
    for (let y = yS; y < yE; y++) if (lum[y*w+x] < DARK) dark++;
    if (dark / (yE - yS) > 0.28) {
      vPixels.push(x);
      for (let y = 0; y < h; y++) {
        lum[y*w+x] = 255;
        const i = (y*w+x)*4; data[i] = data[i+1] = data[i+2] = 255;
      }
    }
  }

  // Binarize
  for (let i = 0; i < w*h; i++) {
    const v = lum[i] < 140 ? 0 : 255;
    data[i*4] = data[i*4+1] = data[i*4+2] = v; data[i*4+3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  if (!vPixels.length) return [];
  const colPDF: number[] = [];
  let runStart = vPixels[0], last = vPixels[0];
  for (let i = 1; i < vPixels.length; i++) {
    if (vPixels[i] - last > 4) {
      colPDF.push(Math.round((runStart + last) / 2 / scale));
      runStart = vPixels[i];
    }
    last = vPixels[i];
  }
  colPDF.push(Math.round((runStart + last) / 2 / scale));
  return colPDF;
}

function assignToColumns(words: TextItem[], sepX: number[]): string[][] {
  if (sepX.length < 2) return [];
  const nCols = sepX.length - 1;
  const byY   = new Map<number, TextItem[]>();
  for (const w of words) {
    const ry = Math.round(w.pageY / 8) * 8;
    if (!byY.has(ry)) byY.set(ry, []);
    byY.get(ry)!.push(w);
  }
  const rows: string[][] = [];
  for (const ry of Array.from(byY.keys()).sort((a,b) => a-b)) {
    const cells = new Array<string>(nCols).fill("");
    for (const item of byY.get(ry)!) {
      let col = 0;
      for (let i = 0; i < sepX.length-1; i++) if (item.x >= sepX[i]) col = i;
      col = Math.min(col, nCols-1);
      cells[col] = cells[col] ? cells[col] + " " + item.str.trim() : item.str.trim();
    }
    if (cells.some(c => c.trim())) rows.push(cells);
  }
  return rows;
}

async function extractFromTextPDF(pdf: any): Promise<{ items: TextItem[]; pages: number }> {
  const allItems: TextItem[] = [];
  const pages = pdf.numPages;
  let yOffset = 0;
  for (let p = 1; p <= pages; p++) {
    const page    = await pdf.getPage(p);
    const vp      = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const pageH   = vp.height;
    for (const item of content.items as any[]) {
      if (!item.str?.trim()) continue;
      const [,,,,tx,ty] = item.transform as number[];
      allItems.push({ str: item.str, x: tx, y: ty, pageY: yOffset + (pageH - ty), width: item.width || 0 });
    }
    yOffset += pageH + 10;
  }
  return { items: allItems, pages };
}

async function extractFromOCR(
  pdf: any,
  onProgress: (msg: string, pct: number) => void
): Promise<{ items: TextItem[]; pages: number; colSeps: number[] }> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  await worker.setParameters({ preserve_interword_spaces: "1" } as any);

  const allItems: TextItem[] = [];
  const pages = pdf.numPages;
  let yOffset = 0;
  const allColSeps: number[][] = [];
  const SCALE = 2.5;

  for (let p = 1; p <= pages; p++) {
    onProgress(`OCR page ${p} of ${pages}…`, 12 + Math.round((p-1) / pages * 60));
    const page   = await pdf.getPage(p);
    const vp     = page.getViewport({ scale: SCALE });
    const canvas = document.createElement("canvas");
    canvas.width  = Math.round(vp.width);
    canvas.height = Math.round(vp.height);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;

    const colSeps = detectEraseLines(ctx, canvas.width, canvas.height, SCALE);
    if (colSeps.length >= 2) allColSeps.push(colSeps);

    const result = await worker.recognize(canvas);
    const pageH  = canvas.height / SCALE;
    for (const line of (result.data as any).lines ?? []) {
      if ((line.confidence ?? 0) < 25) continue;
      for (const word of (line.words ?? []) as any[]) {
        const raw = (word.text ?? "").trim();
        if (!raw || (word.confidence ?? 0) < 38 || GARBAGE_RE.test(raw)) continue;
        const x = word.bbox.x0 / SCALE, y = word.bbox.y0 / SCALE;
        allItems.push({ str: raw, x, y: pageH - y, pageY: yOffset + y, width: (word.bbox.x1 - word.bbox.x0) / SCALE });
      }
    }
    yOffset += pageH + 10;
  }
  await worker.terminate();

  const bestSeps = allColSeps.sort(
    (a, b) =>
      allColSeps.filter(s => JSON.stringify(s) === JSON.stringify(b)).length -
      allColSeps.filter(s => JSON.stringify(s) === JSON.stringify(a)).length
  )[0] ?? [];

  return { items: allItems, pages, colSeps: bestSeps };
}

function clusterRows(items: TextItem[], yTol: number): TextItem[][] {
  if (!items.length) return [];
  const sorted = [...items].sort((a,b) => b.pageY - a.pageY || a.x - b.x);
  const rows: TextItem[][] = [];
  let cur: TextItem[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (Math.abs(sorted[i].pageY - cur[0].pageY) <= yTol) cur.push(sorted[i]);
    else { rows.push([...cur].sort((a,b) => a.x - b.x)); cur = [sorted[i]]; }
  }
  rows.push([...cur].sort((a,b) => a.x - b.x));
  return rows.filter(r => r.some(t => t.str.trim()));
}

function detectColumns(rows: TextItem[][], colMerge: number, minFreq: number): number[] {
  const freq = new Map<number, number>();
  for (const row of rows) for (const item of row) {
    const rx = Math.round(item.x / 8) * 8;
    freq.set(rx, (freq.get(rx) || 0) + 1);
  }
  const minCnt    = Math.max(2, rows.length * minFreq);
  const qualified = Array.from(freq.entries()).filter(([,c]) => c >= minCnt).map(([x]) => x).sort((a,b) => a-b);
  if (!qualified.length) return [];
  const cols: number[] = [qualified[0]];
  for (let i = 1; i < qualified.length; i++)
    if (qualified[i] - cols[cols.length-1] > colMerge) cols.push(qualified[i]);
  return cols;
}

function assignCells(row: TextItem[], cols: number[]): string[] {
  const cells = new Array<string>(cols.length).fill("");
  for (const item of row) {
    const s = item.str.trim(); if (!s) continue;
    let best = 0, bd = Math.abs(item.x - cols[0]);
    for (let i = 1; i < cols.length; i++) { const d = Math.abs(item.x - cols[i]); if (d < bd) { bd = d; best = i; } }
    cells[best] = cells[best] ? cells[best] + " " + s : s;
  }
  return cells;
}

function buildTableText(rows: TextItem[][], cols: number[]): string[][] {
  return rows.map(r => assignCells(r, cols));
}

function deduplicateHeaders(table: string[][]): string[][] {
  if (!table.length) return [];
  const key = table[0].map(c => c.toLowerCase().trim()).join("|");
  return table.filter((row, i) => i === 0 || row.map(c => c.toLowerCase().trim()).join("|") !== key);
}

function standardizeTable(raw: string[][]): { headers: string[]; rows: string[][] } | null {
  if (raw.length < 2) return null;
  const header = raw[0];
  const data   = raw.slice(1).filter(r => r.some(c => c.trim()));
  if (!data.length) return null;
  const N = header.length;

  const dateScore = new Array(N).fill(0);
  const numScore  = new Array(N).fill(0);
  const textLen   = new Array(N).fill(0);
  const cheqScore = new Array(N).fill(0);
  const sample    = data.slice(0, Math.min(30, data.length));

  for (const row of sample) {
    for (let i = 0; i < N; i++) {
      const v = (row[i] || "").trim(); if (!v) continue;
      if (DATE_RE.test(v))                        dateScore[i]++;
      if (NUM_RE.test(v))                         numScore[i]++;
      textLen[i] += v.length;
      if (CHEQ_RE.test(v.replace(/\s/g, "")))     cheqScore[i]++;
    }
  }

  const dateCol = dateScore.indexOf(Math.max(...dateScore));
  const narCol  = textLen.indexOf(Math.max(...textLen));
  const cheqCol = cheqScore.indexOf(Math.max(...cheqScore));
  const threshold = sample.length * 0.20;
  const amtCols   = numScore.map((s, i) => ({ s, i }))
    .filter(({ s, i }) => s >= threshold && i !== dateCol && i !== narCol)
    .sort((a,b) => a.i - b.i).map(({ i }) => i);

  let balCol = -1, crCol = -1, drCol = -1;
  for (let i = 0; i < N; i++) {
    const h = (header[i] || "").toLowerCase();
    if (/bal/.test(h))                    balCol = i;
    if (/cred|dep(osit)?|\bcr\b/.test(h)) crCol  = i;
    if (/deb|with|\bdr\b/.test(h))        drCol  = i;
  }
  if (amtCols.length >= 1 && balCol < 0) balCol = amtCols[amtCols.length-1];
  if (amtCols.length >= 2 && crCol  < 0) crCol  = amtCols[amtCols.length-2];
  if (amtCols.length >= 3 && drCol  < 0) drCol  = amtCols[amtCols.length-3];

  const stdHeaders = ["Date", "Particulars / Narration", "Cheque No.", "Debit / Withdrawal (₹)", "Credit / Deposit (₹)", "Balance (₹)"];
  const stdRows = data.map(row => [
    dateCol >= 0 ? (row[dateCol] || "") : "",
    narCol  >= 0 ? (row[narCol]  || "") : "",
    cheqCol >= 0 && cheqCol !== narCol ? (row[cheqCol] || "") : "",
    drCol   >= 0 ? (row[drCol]   || "") : "",
    crCol   >= 0 ? (row[crCol]   || "") : "",
    balCol  >= 0 ? (row[balCol]  || "") : "",
  ]);
  return { headers: stdHeaders, rows: stdRows };
}

// ─── Browser-mode main processor ──────────────────────────────────────────────
async function processBrowser(
  file: File,
  onProgress: (msg: string, pct: number) => void
): Promise<ExtractionResult> {
  onProgress("Loading PDF…", 5);
  // @ts-ignore
  const pdfjs = await import("pdfjs-dist/webpack.mjs");
  const buf   = await file.arrayBuffer();
  const pdf   = await pdfjs.getDocument({
    data: new Uint8Array(buf.slice(0)),
    isEvalSupported: false, useSystemFonts: true,
    disableRange: true, disableStream: true, disableAutoFetch: true,
  }).promise;

  onProgress("Checking PDF type…", 8);
  const textResult = await extractFromTextPDF(pdf);
  const textChars  = textResult.items.reduce((s, t) => s + t.str.trim().length, 0);
  const isOCR      = textChars < 80;

  let rawTable: string[][];
  let pages: number;
  let detectedCols: number;

  if (!isOCR) {
    pages = textResult.pages;
    const clustered  = clusterRows(textResult.items, 4);
    const meaningful = clustered.filter(r => r.filter(t => t.str.trim().length > 1).length >= 2);
    const cols = detectColumns(meaningful, 18, 0.07);
    if (cols.length < 2) throw new Error(`Column detection failed (found ${cols.length}). PDF may not contain a table.`);
    rawTable     = buildTableText(meaningful, cols);
    detectedCols = cols.length;
  } else {
    onProgress("Scanned PDF — detecting grid lines + OCR…", 10);
    const ocrResult = await extractFromOCR(pdf, onProgress);
    pages = ocrResult.pages;
    onProgress("Building table from grid…", 75);

    if (ocrResult.colSeps.length >= 3) {
      const rows   = assignToColumns(ocrResult.items, ocrResult.colSeps);
      rawTable     = rows.filter(r => r.some(c => c.trim()));
      detectedCols = ocrResult.colSeps.length - 1;
    } else {
      const clustered  = clusterRows(ocrResult.items, 10);
      const meaningful = clustered.filter(r => r.filter(t => t.str.trim().length > 1).length >= 2);
      const cols = detectColumns(meaningful, 45, 0.04);
      if (cols.length < 2) throw new Error(`Column detection failed (found ${cols.length}). Try a higher-quality scan.`);
      rawTable     = buildTableText(meaningful, cols);
      detectedCols = cols.length;
    }
  }

  onProgress("Removing repeated headers…", 88);
  const deduped = deduplicateHeaders(rawTable).filter(r => r.some(c => c.trim()));
  onProgress("Standardising columns…", 93);
  const std = standardizeTable(deduped);

  return {
    rawTable: deduped,
    stdHeaders: std?.headers ?? [],
    stdRows:    std?.rows    ?? [],
    pages, rows: Math.max(0, deduped.length - 1),
    cols: detectedCols,
    fileName: file.name,
    isOCR, isServer: false,
  };
}

// ─── Server-mode processor (calls our API route → ilovepdf) ──────────────────
async function processServer(
  file: File,
  onProgress: (msg: string, pct: number) => void
): Promise<ExtractionResult> {
  onProgress("Uploading to conversion server…", 15);
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch("/api/pdf-to-excel", { method: "POST", body: fd });

  if (res.status === 503) throw new Error("__NO_KEY__");   // signal: fall back to browser
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `Server error ${res.status}` }));
    throw new Error(err.error ?? `Server error ${res.status}`);
  }

  onProgress("Processing & converting…", 60);
  const blob = await res.blob();

  onProgress("Parsing result…", 85);
  const ab = await blob.arrayBuffer();
  const wb = XLSX.read(ab, { type: "array" });

  // Read first sheet as raw table
  const ws  = wb.Sheets[wb.SheetNames[0]];
  const raw = (XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][])
    .map(row => row.map(c => String(c ?? "")));
  const filtered = raw.filter(r => r.some(c => c.trim()));

  // Try standardisation on top of what ilovepdf returned
  const std = standardizeTable(filtered);

  return {
    rawTable:   filtered,
    stdHeaders: std?.headers ?? [],
    stdRows:    std?.rows    ?? [],
    pages:      wb.SheetNames.length,
    rows:       Math.max(0, filtered.length - 1),
    cols:       filtered[0]?.length ?? 0,
    fileName:   file.name,
    isOCR:      false,
    isServer:   true,
    serverBlob: blob,
  };
}

// ─── Excel export ─────────────────────────────────────────────────────────────
function exportToExcel(result: ExtractionResult) {
  if (result.serverBlob) {
    // Return the original ilovepdf Excel (best quality, preserves formatting)
    const url = URL.createObjectURL(result.serverBlob);
    const a   = document.createElement("a");
    a.href     = url;
    a.download = result.fileName.replace(/\.pdf$/i, "") + "_converted.xlsx";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }
  // Browser mode — regenerate from parsed data
  const wb = XLSX.utils.book_new();
  const rawWs = XLSX.utils.aoa_to_sheet(result.rawTable);
  if (result.rawTable[0]) rawWs["!cols"] = result.rawTable[0].map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, rawWs, "Raw Extraction");
  if (result.stdHeaders.length) {
    const stdWs = XLSX.utils.aoa_to_sheet([result.stdHeaders, ...result.stdRows]);
    stdWs["!cols"] = result.stdHeaders.map(() => ({ wch: 24 }));
    XLSX.utils.book_append_sheet(wb, stdWs, "Bank Statement");
  }
  XLSX.writeFile(wb, `${result.fileName.replace(/\.pdf$/i, "")}_extracted.xlsx`);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PDFToExcelPage() {
  const [files, setFiles]               = useState<File[]>([]);
  const [mode, setMode]                 = useState<Mode>("server");
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null); // null = checking
  const [processing, setProcessing]     = useState(false);
  const [progress, setProgress]         = useState(0);
  const [progressMsg, setProgressMsg]   = useState("");
  const [results, setResults]           = useState<ExtractionResult[]>([]);
  const [activeResult, setActiveResult] = useState(0);
  const [showRaw, setShowRaw]           = useState(false);
  const [error, setError]               = useState("");
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if server API key is configured
  useEffect(() => {
    fetch("/api/pdf-to-excel")
      .then(r => r.json())
      .then(({ available }) => {
        setServerAvailable(available);
        if (!available) setMode("browser");
      })
      .catch(() => { setServerAvailable(false); setMode("browser"); });
  }, []);

  const onProg = (msg: string, pct: number) => { setProgressMsg(msg); setProgress(pct); };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(
      f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (dropped.length) { setFiles(dropped); setResults([]); setError(""); setFallbackUsed(false); }
  }, []);

  const run = async () => {
    if (!files.length) return;
    setProcessing(true); setError(""); setResults([]); setProgress(0); setFallbackUsed(false);
    try {
      const all: ExtractionResult[] = [];
      for (let i = 0; i < files.length; i++) {
        onProg(`File ${i+1}/${files.length}: Starting…`, 0);
        let result: ExtractionResult;
        if (mode === "server") {
          try {
            result = await processServer(files[i], onProg);
          } catch (e: any) {
            if (e?.message === "__NO_KEY__") {
              // No API key configured — silently fall back to browser
              setFallbackUsed(true);
              result = await processBrowser(files[i], onProg);
            } else {
              throw e;
            }
          }
        } else {
          result = await processBrowser(files[i], onProg);
        }
        all.push(result);
      }
      setResults(all); setActiveResult(0); setProgress(100); setProgressMsg("Done!");
    } catch (e: any) {
      setError(e?.message || "Extraction failed. The file may be encrypted or not contain a table.");
    } finally { setProcessing(false); }
  };

  const active      = results[activeResult];
  const previewData = showRaw
    ? (active?.rawTable ?? [])
    : (active ? [active.stdHeaders, ...active.stdRows] : []);
  const previewRows = previewData.slice(0, 13);

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted hover:text-dark mb-6 transition-colors">
          <ArrowLeft size={15} /> Back to Tools
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <FileSpreadsheet className="text-primary" size={22} /> Smart PDF → Excel
          </h1>
          <p className="text-muted text-sm mt-1">
            Upload any bank statement or tabular PDF — digital or scanned.
            <strong className="text-dark"> Server mode</strong> uses ilovepdf's professional OCR engine for near-perfect results.
            <strong className="text-dark"> Browser mode</strong> runs 100% on your device for privacy.
          </p>
        </div>

        {/* ── Mode Selector ── */}
        <div className="bg-white rounded-card shadow-card border border-gray-100 p-4 mb-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Conversion Mode</p>
          <div className="grid grid-cols-2 gap-3">
            {/* Server mode */}
            <button
              onClick={() => { if (serverAvailable) setMode("server"); }}
              disabled={!serverAvailable || serverAvailable === null}
              className={`relative flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 transition-all text-left ${
                mode === "server" && serverAvailable
                  ? "border-primary bg-primary/5"
                  : "border-gray-100 bg-gray-50 hover:border-gray-200"
              } ${!serverAvailable ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {/* Best quality badge */}
              {serverAvailable && (
                <span className="absolute -top-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  Best Quality
                </span>
              )}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  mode === "server" && serverAvailable ? "bg-primary" : "bg-gray-200"
                }`}>
                  <Cloud size={15} className={mode === "server" && serverAvailable ? "text-white" : "text-gray-500"} />
                </div>
                <div>
                  <div className="font-semibold text-sm text-dark">Server Mode</div>
                  <div className="text-[10px] text-muted">Powered by ilovepdf</div>
                </div>
              </div>
              <div className="text-xs text-muted leading-relaxed">
                Professional OCR engine (Solid Documents). Handles scanned PDFs perfectly.
              </div>
              {serverAvailable === null && (
                <div className="flex items-center gap-1 text-[10px] text-muted">
                  <Loader2 size={10} className="animate-spin" /> Checking availability…
                </div>
              )}
              {serverAvailable === false && (
                <div className="flex items-center gap-1 text-[10px] text-amber-600">
                  <Info size={10} /> API key not configured — see setup below
                </div>
              )}
              {serverAvailable === true && (
                <div className="flex items-center gap-1 text-[10px] text-green-600">
                  <CheckCircle size={10} /> Ready
                </div>
              )}
            </button>

            {/* Browser mode */}
            <button
              onClick={() => setMode("browser")}
              className={`relative flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${
                mode === "browser"
                  ? "border-primary bg-primary/5"
                  : "border-gray-100 bg-gray-50 hover:border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  mode === "browser" ? "bg-primary" : "bg-gray-200"
                }`}>
                  <Lock size={15} className={mode === "browser" ? "text-white" : "text-gray-500"} />
                </div>
                <div>
                  <div className="font-semibold text-sm text-dark">Browser Mode</div>
                  <div className="text-[10px] text-muted">100% private, offline</div>
                </div>
              </div>
              <div className="text-xs text-muted leading-relaxed">
                Tesseract.js OCR runs in your browser. No data leaves your device. Slower for scanned PDFs.
              </div>
              <div className="flex items-center gap-1 text-[10px] text-green-600">
                <Shield size={10} /> No data sent anywhere
              </div>
            </button>
          </div>

          {/* Server mode notice */}
          {mode === "server" && serverAvailable && (
            <div className="mt-3 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-[11px] text-blue-700">
              <Info size={11} className="flex-shrink-0 mt-0.5" />
              Your PDF will be sent to <strong>ilovepdf.com</strong> for processing (automatically deleted after 2 hours).
              Switch to Browser mode if you need full privacy.
            </div>
          )}

          {/* API key setup instructions */}
          {serverAvailable === false && (
            <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800">
              <p className="font-semibold mb-1.5 flex items-center gap-1.5">
                <Zap size={12} /> Enable Server Mode (free setup, 5 minutes)
              </p>
              <ol className="list-decimal list-inside space-y-1 text-amber-700">
                <li>Sign up free at <strong>developer.ilovepdf.com</strong> → get your <code className="bg-amber-100 px-1 rounded">Public Key</code></li>
                <li>Add to Vercel: Settings → Environment Variables → <code className="bg-amber-100 px-1 rounded">ILOVEPDF_PUBLIC_KEY = your_key</code></li>
                <li>Redeploy — Server Mode will activate automatically</li>
              </ol>
              <p className="mt-1.5 text-amber-600">Free tier: 250 conversions/month. No credit card required.</p>
            </div>
          )}
        </div>

        {/* ── Upload ── */}
        <div className="bg-white rounded-card shadow-card border border-gray-100 p-6 mb-4">
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center hover:border-primary/50 transition-colors cursor-pointer mb-5"
            onDrop={onDrop} onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept=".pdf" multiple className="hidden"
              onChange={e => {
                const f = Array.from(e.target.files || []);
                if (f.length) { setFiles(f); setResults([]); setError(""); setFallbackUsed(false); }
                e.target.value = "";
              }} />
            {files.length ? (
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileSpreadsheet size={22} className="text-primary" />
                </div>
                {files.map((f, i) => (
                  <div key={i} className="text-sm font-medium text-dark">
                    {f.name} <span className="text-muted font-normal">({fmtSize(f.size)})</span>
                  </div>
                ))}
                <p className="text-xs text-primary mt-2 cursor-pointer hover:underline">Click to change</p>
              </div>
            ) : (
              <>
                <Upload size={36} className="mx-auto text-muted mb-3" />
                <p className="text-dark font-medium">Drop PDF(s) here or click to browse</p>
                <p className="text-muted text-xs mt-1">Bank statements · Ledgers · Any tabular PDF · Text-based or scanned</p>
              </>
            )}
          </div>

          {fallbackUsed && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700 mb-4">
              <Info size={12} className="flex-shrink-0 mt-0.5" />
              Server API key not configured — used browser OCR instead. Set up the API key for better quality.
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 mb-4">
              <AlertCircle size={13} className="flex-shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {processing && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-muted mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Loader2 size={11} className="animate-spin" />{progressMsg}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <button
            onClick={run}
            disabled={!files.length || processing}
            className="btn-primary gap-2 w-full justify-center py-3.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {processing
              ? <><Loader2 size={16} className="animate-spin" /> {mode === "server" ? "Converting on server…" : "Extracting in browser…"}</>
              : <><Table size={16} /> Extract Table → Excel {mode === "server" ? "(Server)" : "(Browser)"}</>
            }
          </button>
        </div>

        {/* ── Results ── */}
        {results.length > 0 && active && (
          <div className="bg-white rounded-card shadow-card border border-gray-100 p-6">
            {results.length > 1 && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {results.map((r, i) => (
                  <button key={i} onClick={() => setActiveResult(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-all ${
                      activeResult === i ? "bg-primary text-white border-primary" : "bg-white text-muted border-gray-200 hover:border-primary/30"
                    }`}>
                    {r.fileName.replace(/\.pdf$/i, "")}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <CheckCircle size={16} className="text-green-500" />
              <h2 className="font-bold text-dark">Extraction Complete</h2>
              {active.isServer ? (
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Cloud size={9} /> Server · ilovepdf Engine
                </span>
              ) : active.isOCR ? (
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Browser OCR
                </span>
              ) : (
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Browser · Text PDF
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Pages",   value: active.isServer ? "—" : active.pages },
                { label: "Rows",    value: active.rows },
                { label: "Columns", value: active.cols },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-dark">{value}</div>
                  <div className="text-[10px] text-muted uppercase tracking-wide mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-dark text-sm">Preview (first 13 rows)</h3>
              {!active.isServer && (
                <button onClick={() => setShowRaw(v => !v)}
                  className="flex items-center gap-1.5 text-xs text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors">
                  {showRaw ? <><EyeOff size={11} /> Standardised</> : <><Eye size={11} /> Raw view</>}
                </button>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100 mb-5">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-primary text-white">
                    {previewRows[0]?.map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h || `Col ${i+1}`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.slice(1).map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-1.5 text-dark border-b border-gray-100 max-w-[200px] truncate" title={cell}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {active.rows > 12 && (
              <p className="text-xs text-muted text-center mb-4">
                Showing 13 of {active.rows + 1} rows — all rows included in Excel download.
              </p>
            )}

            <div className="flex gap-3 flex-wrap">
              <button onClick={() => exportToExcel(active)} className="btn-primary gap-2 flex-1 justify-center py-3">
                <Download size={15} /> Download Excel
                {active.isServer ? " (ilovepdf Output)" : " (2 sheets)"}
              </button>
              <button
                onClick={() => { setFiles([]); setResults([]); setError(""); setProgress(0); setFallbackUsed(false); }}
                className="btn-secondary gap-2 px-5 py-3"
              >
                <RefreshCw size={14} /> Reset
              </button>
            </div>

            {active.isServer ? (
              <p className="text-[10px] text-center text-muted mt-3">
                Direct output from ilovepdf's Solid Documents engine — all sheets preserved as-is.
              </p>
            ) : (
              <p className="text-[10px] text-center text-muted mt-3">
                Sheet 1: Raw Extraction · Sheet 2: Bank Statement (Date / Particulars / Cheque / Debit / Credit / Balance)
              </p>
            )}
          </div>
        )}

        {/* ── Privacy note ── */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted">
          {mode === "browser" ? (
            <><Shield size={11} className="text-green-500" /> Browser mode — your PDF never leaves your device.</>
          ) : (
            <><Cloud size={11} className="text-blue-400" /> Server mode — PDF processed by ilovepdf.com and auto-deleted after 2 hours.</>
          )}
        </div>
      </div>
    </div>
  );
}
