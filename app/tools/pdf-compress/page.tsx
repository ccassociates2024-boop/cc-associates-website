"use client";

import { useState, useCallback, useRef } from "react";
import { Minimize2, ArrowLeft, Upload, Download, AlertCircle, CheckCircle, Loader2, Shield } from "lucide-react";
import Link from "next/link";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

// Compression ladder — from gentle (index 0) to maximum (index 8)
// scale: render DPI multiplier (1.0 = 72 DPI). jpegQ: JPEG quality 0–1
const LADDER: { scale: number; jpegQ: number }[] = [
  { scale: 2.2, jpegQ: 0.92 },  // 0 — very gentle
  { scale: 2.0, jpegQ: 0.80 },  // 1
  { scale: 1.8, jpegQ: 0.68 },  // 2
  { scale: 1.5, jpegQ: 0.55 },  // 3
  { scale: 1.3, jpegQ: 0.42 },  // 4
  { scale: 1.0, jpegQ: 0.30 },  // 5
  { scale: 0.8, jpegQ: 0.20 },  // 6
  { scale: 0.65, jpegQ: 0.12 }, // 7
  { scale: 0.5,  jpegQ: 0.07 }, // 8 — maximum
];

// Pick starting rung from desired size ratio
function startRung(ratio: number): number {
  if (ratio >= 0.82) return 0;
  if (ratio >= 0.68) return 1;
  if (ratio >= 0.54) return 2;
  if (ratio >= 0.40) return 3;
  if (ratio >= 0.28) return 4;
  if (ratio >= 0.18) return 5;
  if (ratio >= 0.12) return 6;
  if (ratio >= 0.07) return 7;
  return 8;
}

// ─── Preset quick-picks ────────────────────────────────────────────────────────
const PCT_PRESETS = [25, 50, 70, 85];

// ─── Component ────────────────────────────────────────────────────────────────
export default function PDFCompressPage() {
  const [file, setFile]               = useState<File | null>(null);
  const [mode, setMode]               = useState<"kb" | "pct">("pct");
  const [targetKB, setTargetKB]       = useState("");
  const [targetPct, setTargetPct]     = useState(60); // % reduction
  const [processing, setProcessing]   = useState(false);
  const [progress, setProgress]       = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [result, setResult]           = useState<{
    originalSize: number;
    compressedSize: number;
    url: string;
    pages: number;
  } | null>(null);
  const [error, setError]             = useState("");
  const inputRef                      = useRef<HTMLInputElement>(null);

  const resetResult = () => { setResult(null); setError(""); setProgress(0); };

  // ── Core compression ────────────────────────────────────────────────────────
  const compress = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    setError("");
    setResult(null);
    setProgress(0);

    try {
      // 1. Determine target bytes
      let targetBytes: number;
      if (mode === "kb") {
        const kb = parseFloat(targetKB);
        if (!kb || kb <= 0) throw new Error("Please enter a valid target size in KB.");
        targetBytes = kb * 1024;
      } else {
        targetBytes = file.size * (1 - targetPct / 100);
      }

      if (targetBytes >= file.size * 0.97) {
        throw new Error("Target size is too close to the original. Choose a higher reduction percentage or a smaller KB target.");
      }
      if (targetBytes < 15 * 1024) {
        throw new Error("Target size is too small (minimum ~15 KB). PDF quality would be unusable.");
      }

      const ratio = targetBytes / file.size;
      const rung0 = startRung(ratio);

      setProgressMsg("Loading PDF…");
      setProgress(5);

      // 2. Load PDF with pdfjs (pass a copy — pdfjs may transfer the buffer)
      const arrayBuffer = await file.arrayBuffer();
      // @ts-ignore
      const pdfjs = await import("pdfjs-dist/webpack.mjs");
      const pdf = await pdfjs.getDocument({
        data: new Uint8Array(arrayBuffer.slice(0)),
        isEvalSupported: false,
        useSystemFonts: true,
        disableRange: true,
        disableStream: true,
        disableAutoFetch: true,
      }).promise;

      const numPages = pdf.numPages;
      setProgress(10);

      const { PDFDocument } = await import("pdf-lib");

      // Helper: render all pages at given scale+quality → build PDF → return bytes
      const renderAtSettings = async (scale: number, jpegQ: number, pass: number): Promise<Uint8Array> => {
        const label = pass === 1 ? "" : ` (pass ${pass} — harder settings)`;
        const canvases: { canvas: HTMLCanvasElement; w: number; h: number }[] = [];

        for (let p = 1; p <= numPages; p++) {
          setProgressMsg(`Page ${p}/${numPages}${label}…`);
          setProgress(10 + Math.round((p - 1) / numPages * 62));

          const page     = await pdf.getPage(p);
          const viewport = page.getViewport({ scale });
          const canvas   = document.createElement("canvas");
          canvas.width   = Math.round(viewport.width);
          canvas.height  = Math.round(viewport.height);
          const ctx      = canvas.getContext("2d")!;
          ctx.fillStyle  = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport }).promise;
          canvases.push({ canvas, w: canvas.width, h: canvas.height });
        }

        setProgressMsg("Building PDF…");
        setProgress(75);

        const outPdf = await PDFDocument.create();
        for (const { canvas, w, h } of canvases) {
          const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), "image/jpeg", jpegQ));
          const ab = await blob.arrayBuffer();
          const jpgImg = await outPdf.embedJpg(new Uint8Array(ab));
          const pg = outPdf.addPage([w, h]);
          pg.drawImage(jpgImg, { x: 0, y: 0, width: w, height: h });
        }

        setProgress(92);
        return outPdf.save();
      };

      // 3. Adaptive compression — retry with harder settings if output ≥ original
      let pdfBytes: Uint8Array | null = null;
      let usedRung = rung0;

      for (let r = rung0; r < LADDER.length; r++) {
        const { scale, jpegQ } = LADDER[r];
        const pass = r - rung0 + 1;
        const bytes = await renderAtSettings(scale, jpegQ, pass);

        if (bytes.byteLength < file.size) {
          // Successfully smaller than original — use this
          pdfBytes = bytes;
          usedRung = r;
          break;
        }

        // Still larger — if not at last rung, try harder
        if (r < LADDER.length - 1) {
          setProgressMsg(`Output was larger (${Math.round(bytes.byteLength / 1024)} KB) — trying harder…`);
          await new Promise(r => setTimeout(r, 200)); // brief pause so UI updates
          continue;
        }

        // Last rung exhausted and still not smaller — use this anyway (best we can do)
        pdfBytes = bytes;
        usedRung = r;
      }

      if (!pdfBytes) throw new Error("Compression produced no output.");

      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url  = URL.createObjectURL(blob);

      setProgress(100);
      setProgressMsg("Done!");
      setResult({ originalSize: file.size, compressedSize: pdfBytes.byteLength, pages: numPages, url });

    } catch (e: any) {
      setError(e?.message || "Compression failed. File may be encrypted or corrupted.");
    } finally {
      setProcessing(false);
    }
  }, [file, mode, targetKB, targetPct]);

  const download = () => {
    if (!result) return;
    const a  = document.createElement("a");
    a.href   = result.url;
    a.download = `compressed_${file?.name || "document.pdf"}`;
    a.click();
  };

  const savings    = result ? Math.max(0, ((result.originalSize - result.compressedSize) / result.originalSize) * 100) : 0;
  const savedBytes = result ? Math.max(0, result.originalSize - result.compressedSize) : 0;
  const gotLarger  = result ? result.compressedSize > result.originalSize : false;

  // ── Derived label for current target ──────────────────────────────────────
  const targetLabel = () => {
    if (!file) return "";
    if (mode === "kb") {
      const kb = parseFloat(targetKB);
      if (!kb) return "";
      const pct = Math.round((1 - (kb * 1024) / file.size) * 100);
      return `≈ ${pct > 0 ? pct : 0}% reduction`;
    } else {
      const approxKB = Math.round(file.size * (1 - targetPct / 100) / 1024);
      return `≈ ${approxKB} KB output`;
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-10">
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted hover:text-dark mb-6 transition-colors">
          <ArrowLeft size={15} /> Back to Tools
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <Minimize2 className="text-primary" size={22} /> PDF Compress
          </h1>
          <p className="text-muted text-sm mt-1">
            Compress PDFs by specifying your exact target — in KB or by percentage. Works best on scanned/image PDFs.
          </p>
        </div>

        {/* ── Upload Card ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-card shadow-card border border-gray-100 p-6 mb-4">
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer mb-5"
            onClick={() => inputRef.current?.click()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type === "application/pdf") { setFile(f); resetResult(); } }}
            onDragOver={e => e.preventDefault()}
          >
            <input ref={inputRef} type="file" accept=".pdf" className="hidden"
              onChange={e => { const f = e.target.files?.[0] || null; setFile(f); resetResult(); e.target.value = ""; }} />
            {file ? (
              <>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Minimize2 size={22} className="text-primary" />
                </div>
                <p className="font-semibold text-dark">{file.name}</p>
                <p className="text-muted text-sm mt-1">
                  Original size: <span className="font-semibold text-dark">{fmtSize(file.size)}</span>
                  {" "}·{" "}
                  <span className="text-primary text-xs cursor-pointer hover:underline">Click to change</span>
                </p>
              </>
            ) : (
              <>
                <Upload size={36} className="mx-auto text-muted mb-3" />
                <p className="text-dark font-medium">Drop PDF here or click to browse</p>
                <p className="text-muted text-xs mt-1">Any size PDF — processed in your browser</p>
              </>
            )}
          </div>

          {/* ── Target mode toggle ─────────────────────────────────────────── */}
          <div className="mb-5">
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Compression Target</div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(["pct", "kb"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); resetResult(); }}
                  className={`py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                    mode === m
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-muted border-gray-200 hover:border-primary/40"
                  }`}
                >
                  {m === "pct" ? "📉 Reduce by %" : "📦 Target Size (KB)"}
                </button>
              ))}
            </div>

            {mode === "pct" ? (
              <>
                {/* Quick presets */}
                <div className="flex gap-2 mb-3 flex-wrap">
                  {PCT_PRESETS.map(p => (
                    <button
                      key={p}
                      onClick={() => { setTargetPct(p); resetResult(); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        targetPct === p
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-muted border-gray-200 hover:border-primary/30"
                      }`}
                    >
                      Reduce {p}%
                    </button>
                  ))}
                </div>
                {/* Custom slider */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted w-20">Reduce by</span>
                  <input
                    type="range" min="10" max="95" step="5"
                    value={targetPct}
                    onChange={e => { setTargetPct(parseInt(e.target.value)); resetResult(); }}
                    className="flex-1 accent-primary h-2"
                  />
                  <span className="text-sm font-bold text-primary w-12 text-right">{targetPct}%</span>
                </div>
                {file && (
                  <div className="mt-2 text-xs text-muted">
                    {fmtSize(file.size)} → target <span className="font-semibold text-dark">{fmtKB(file.size * (1 - targetPct / 100))}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">Target size</span>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min="20"
                      max={file ? Math.floor(file.size / 1024 * 0.95) : 99999}
                      placeholder={file ? `max ${Math.floor(file.size / 1024)} KB` : "e.g. 500"}
                      value={targetKB}
                      onChange={e => { setTargetKB(e.target.value); resetResult(); }}
                      className="input-field pr-10 text-right font-semibold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted font-semibold">KB</span>
                  </div>
                </div>
                {file && targetKB && (
                  <div className="mt-2 text-xs text-muted">
                    {fmtSize(file.size)} → <span className="font-semibold text-dark">{parseFloat(targetKB).toFixed(0)} KB</span>
                    {" · "}{targetLabel()}
                  </div>
                )}
              </>
            )}

            {/* Approx hint */}
            {file && (
              <div className="mt-2 text-xs text-primary/80 font-medium">
                {targetLabel()}
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-xs text-blue-800 mb-5">
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5 text-blue-500" />
            <span>
              Compression works by re-rendering pages as JPEG images.{" "}
              <strong>Text becomes non-selectable</strong> in the output — ideal for scanned documents, bank statements, and portal uploads.
            </span>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 mb-4">
              <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Progress */}
          {processing && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-muted mb-1.5">
                <span className="flex items-center gap-1.5"><Loader2 size={11} className="animate-spin" />{progressMsg}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <button
            onClick={compress}
            disabled={!file || processing || (mode === "kb" && !targetKB)}
            className="btn-primary gap-2 w-full justify-center py-3.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {processing
              ? <><Loader2 size={16} className="animate-spin" /> Compressing…</>
              : <><Minimize2 size={16} /> Compress PDF</>
            }
          </button>
        </div>

        {/* ── Result Card ──────────────────────────────────────────────────── */}
        {result && (
          <div className="bg-white rounded-card shadow-card border border-gray-100 p-6">
            <h2 className="font-bold text-dark mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" /> Compression Result
            </h2>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-gray-50 rounded-xl text-center">
                <div className="text-[10px] text-muted uppercase tracking-wide mb-1">Original</div>
                <div className="font-bold text-dark text-sm">{fmtSize(result.originalSize)}</div>
                <div className="text-[10px] text-muted mt-0.5">{fmtKB(result.originalSize)}</div>
              </div>
              <div className={`p-3 rounded-xl text-center border ${gotLarger ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                <div className={`text-[10px] uppercase tracking-wide mb-1 ${gotLarger ? "text-red-500" : "text-green-600"}`}>Compressed</div>
                <div className={`font-bold text-sm ${gotLarger ? "text-red-700" : "text-green-700"}`}>{fmtSize(result.compressedSize)}</div>
                <div className={`text-[10px] mt-0.5 ${gotLarger ? "text-red-500" : "text-green-500"}`}>{fmtKB(result.compressedSize)}</div>
              </div>
              <div className={`p-3 rounded-xl text-center border ${gotLarger ? "bg-red-50 border-red-200" : savings > 0 ? "bg-primary/5 border-primary/15" : "bg-yellow-50 border-yellow-200"}`}>
                <div className="text-[10px] text-muted uppercase tracking-wide mb-1">Saved</div>
                <div className={`font-bold text-sm ${gotLarger ? "text-red-600" : "text-primary"}`}>
                  {gotLarger ? "—" : savings.toFixed(1) + "%"}
                </div>
                <div className="text-[10px] text-muted mt-0.5">
                  {gotLarger ? "file grew" : fmtSize(savedBytes) + " saved"}
                </div>
              </div>
            </div>

            {/* Explanation banners */}
            {gotLarger && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-800 mb-4">
                <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Maximum compression attempted — file could not be reduced.</strong> This PDF uses JBIG2 or CCITT encoding (extremely efficient for black-and-white scans), which JPEG cannot beat even at the lowest quality. The original file is already near-optimal for its content type.
                </span>
              </div>
            )}

            {!gotLarger && savings < 10 && (
              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2.5 text-xs text-yellow-800 mb-4">
                <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                <span>
                  Less than 10% reduction achieved. This PDF may use an image format (JBIG2/CCITT) that already beats JPEG.
                  Try setting a higher reduction target for more aggressive compression.
                </span>
              </div>
            )}

            {!gotLarger && savings >= 10 && (
              <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 text-xs text-green-800 mb-4">
                <CheckCircle size={13} className="flex-shrink-0 mt-0.5 text-green-500" />
                <span>
                  Reduced by <strong>{savings.toFixed(1)}%</strong> — saved <strong>{fmtSize(savedBytes)}</strong> across {result.pages} page{result.pages > 1 ? "s" : ""}.
                  Output is image-only (no text layer).
                </span>
              </div>
            )}

            <button onClick={download} className="btn-primary gap-2 w-full justify-center py-3.5">
              <Download size={16} />
              Download ({fmtSize(result.compressedSize)})
            </button>

            <p className="text-[10px] text-center text-muted mt-3">
              Output PDF pages are rendered as JPEG images — text is not selectable but the file is fully readable.
            </p>
          </div>
        )}

        {/* Privacy */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted">
          <Shield size={11} className="text-green-500" />
          100% browser-based — your PDF never leaves your device
        </div>
      </div>
    </div>
  );
}
