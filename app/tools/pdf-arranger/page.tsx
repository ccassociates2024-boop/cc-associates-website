"use client";

import { useState, useCallback, useRef } from "react";
import {
  LayoutGrid, ArrowLeft, Upload, Download, Trash2,
  RotateCcw, RotateCw, Loader2, Shield, CheckCircle, Plus,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PageItem {
  id: string;
  pdfIndex: number;   // which source PDF (index into pdfBuffers.current)
  pageIndex: number;  // 0-based page index within that PDF
  rotation: number;   // extra rotation to apply: 0 | 90 | 180 | 270
  thumbnail: string;  // data-URL JPEG thumbnail
  label: string;      // e.g. "Page 3" or "doc.pdf P3" for multi-file
  width: number;
  height: number;
}

type Step = "upload" | "arrange";

// ─── Component ────────────────────────────────────────────────────────────────
export default function PDFArrangerPage() {
  const [step, setStep]               = useState<Step>("upload");
  const [pages, setPages]             = useState<PageItem[]>([]);
  const [loadDone, setLoadDone]       = useState(0);
  const [loadTotal, setLoadTotal]     = useState(0);
  const [exporting, setExporting]     = useState(false);
  const [exportPct, setExportPct]     = useState(0);
  const [error, setError]             = useState("");
  const [dragIdx, setDragIdx]         = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Persisted across loads — raw PDF bytes keyed by index
  const pdfBuffers = useRef<ArrayBuffer[]>([]);
  const inputRef   = useRef<HTMLInputElement>(null);
  const addMoreRef = useRef<HTMLInputElement>(null);

  // ── Load PDFs → render thumbnails ─────────────────────────────────────────
  const loadFiles = useCallback(async (files: FileList | File[], append = false) => {
    const pdfFiles = Array.from(files).filter(
      f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (!pdfFiles.length) return;

    setError("");
    if (!append) {
      pdfBuffers.current = [];
      setPages([]);
    }
    setStep("arrange");

    // @ts-ignore
    const pdfjs = await import("pdfjs-dist/webpack.mjs");

    // Pre-load all docs to count total pages
    const pdfjsDocs: any[]       = [];
    const newBuffers: ArrayBuffer[] = [];
    let   total = 0;

    for (const file of pdfFiles) {
      const buf = await file.arrayBuffer();
      // Pass a *copy* to pdfjs — pdfjs transfers (detaches) the underlying
      // ArrayBuffer, which would make the original unusable for pdf-lib export.
      const doc = await pdfjs.getDocument({
        data: new Uint8Array(buf.slice(0)),
        isEvalSupported: false,
        useSystemFonts: true,
        disableRange: true,
        disableStream: true,
        disableAutoFetch: true,
      }).promise;
      pdfjsDocs.push(doc);
      newBuffers.push(buf); // original stays intact for pdf-lib
      total += doc.numPages;
    }

    const baseIdx = pdfBuffers.current.length;
    pdfBuffers.current.push(...newBuffers);

    setLoadTotal(t => t + total);
    let done = loadDone;

    const accumulated: PageItem[] = [];

    for (let fi = 0; fi < pdfFiles.length; fi++) {
      const doc  = pdfjsDocs[fi];
      const pIdx = baseIdx + fi;
      const multi = pdfFiles.length > 1 || append;

      for (let pg = 1; pg <= doc.numPages; pg++) {
        const page     = await doc.getPage(pg);
        const vp       = page.getViewport({ scale: 0.32 });
        const canvas   = document.createElement("canvas");
        canvas.width   = Math.round(vp.width);
        canvas.height  = Math.round(vp.height);
        const ctx      = canvas.getContext("2d")!;
        ctx.fillStyle  = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        const thumb = canvas.toDataURL("image/jpeg", 0.75);

        accumulated.push({
          id: crypto.randomUUID(),
          pdfIndex:  pIdx,
          pageIndex: pg - 1,
          rotation:  0,
          thumbnail: thumb,
          label: multi
            ? `${pdfFiles[fi].name.replace(/\.pdf$/i, "")} · P${pg}`
            : `Page ${pg}`,
          width:  Math.round(vp.width  / 0.32),
          height: Math.round(vp.height / 0.32),
        });

        done++;
        setLoadDone(done);
        // Update state progressively every page
        setPages(prev => append ? [...prev, ...accumulated.slice(-1)] : [...accumulated]);
      }
    }
  }, [loadDone]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    loadFiles(e.dataTransfer.files, false);
  }, [loadFiles]);

  const onAddMore = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) { loadFiles(e.target.files, true); e.target.value = ""; }
  };

  // ── Page operations ────────────────────────────────────────────────────────
  const rotate = (id: string, delta: 90 | -90) =>
    setPages(prev => prev.map(p =>
      p.id === id ? { ...p, rotation: ((p.rotation + delta + 360) % 360) as 0 | 90 | 180 | 270 } : p
    ));

  const deletePage = (id: string) =>
    setPages(prev => prev.filter(p => p.id !== id));

  const deleteAll = () => { setPages([]); pdfBuffers.current = []; setStep("upload"); setLoadDone(0); setLoadTotal(0); };

  // ── Drag & drop reorder ────────────────────────────────────────────────────
  const onDragStart = (i: number) => setDragIdx(i);

  const onDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    setDragOverIdx(i);
  };

  const onDropCard = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOverIdx(null); return; }
    setPages(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(dragIdx, 1);
      arr.splice(i, 0, moved);
      return arr;
    });
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const onDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  // Move by button (↑↓)
  const moveCard = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= pages.length) return;
    setPages(prev => {
      const arr = [...prev];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const exportPDF = useCallback(async () => {
    if (!pages.length) return;
    setExporting(true);
    setExportPct(5);
    setError("");
    try {
      const { PDFDocument, degrees } = await import("pdf-lib");

      // Load & cache each unique source PDF
      const cache = new Map<number, any>();
      for (const item of pages) {
        if (!cache.has(item.pdfIndex)) {
          const doc = await PDFDocument.load(pdfBuffers.current[item.pdfIndex], { ignoreEncryption: true });
          cache.set(item.pdfIndex, doc);
        }
      }

      setExportPct(25);
      const outDoc = await PDFDocument.create();

      for (let i = 0; i < pages.length; i++) {
        const item   = pages[i];
        const srcDoc = cache.get(item.pdfIndex)!;
        const [pg]   = await outDoc.copyPages(srcDoc, [item.pageIndex]);

        if (item.rotation !== 0) {
          const base = pg.getRotation().angle;
          pg.setRotation(degrees((base + item.rotation) % 360));
        }

        outDoc.addPage(pg);
        setExportPct(25 + Math.round((i + 1) / pages.length * 65));
      }

      setExportPct(92);
      const pdfBytes = await outDoc.save();
      const blob     = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement("a");
      a.href         = url;
      a.download     = "arranged_document.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setExportPct(100);
    } catch (e: any) {
      setError("Export failed: " + (e?.message || "File may be encrypted or corrupted."));
    } finally {
      setExporting(false);
    }
  }, [pages]);

  // ── Loading state ─────────────────────────────────────────────────────────
  const isLoading = loadDone < loadTotal && loadTotal > 0;

  // ─────────────────────────────────────────────────────────────────────────
  // UPLOAD SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "upload") return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted hover:text-dark mb-6 transition-colors">
          <ArrowLeft size={15} /> Back to Tools
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <LayoutGrid className="text-primary" size={22} /> PDF Arranger
          </h1>
          <p className="text-muted text-sm mt-1">
            Upload a PDF, then drag pages to reorder, rotate, or delete them. Download the rearranged PDF.
          </p>
        </div>

        {/* Drop zone */}
        <div
          className="bg-white rounded-card shadow-card border-2 border-dashed border-gray-200 hover:border-primary/50 transition-colors p-14 text-center cursor-pointer"
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept=".pdf" multiple className="hidden"
            onChange={e => { if (e.target.files) { loadFiles(e.target.files, false); e.target.value = ""; } }} />
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Upload size={28} className="text-primary" />
          </div>
          <p className="font-semibold text-dark text-lg mb-1">Drop PDF here or click to browse</p>
          <p className="text-muted text-sm">Single or multiple PDFs — all pages shown as thumbnails</p>
        </div>

        {/* Feature list */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: "🔀", label: "Drag & Drop", desc: "Reorder pages freely" },
            { icon: "🔄", label: "Rotate", desc: "Any page, any angle" },
            { icon: "🗑️", label: "Delete", desc: "Remove unwanted pages" },
          ].map(f => (
            <div key={f.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="text-sm font-semibold text-dark">{f.label}</div>
              <div className="text-xs text-muted mt-0.5">{f.desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted">
          <Shield size={11} className="text-green-500" />
          100% browser-based — your PDF never leaves your device
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // ARRANGE SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="pt-16 min-h-screen bg-background">
      {/* Hidden inputs */}
      <input ref={addMoreRef} type="file" accept=".pdf" multiple className="hidden" onChange={onAddMore} />

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <button onClick={deleteAll} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-dark transition-colors">
            <ArrowLeft size={15} /> New File
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-dark">
                {pages.length} page{pages.length !== 1 ? "s" : ""}
              </span>
              {isLoading && (
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <Loader2 size={11} className="animate-spin" />
                  Loading {loadDone}/{loadTotal} pages…
                </span>
              )}
              {!isLoading && loadTotal > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-green-600">
                  <CheckCircle size={11} /> All pages loaded
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => addMoreRef.current?.click()}
              className="flex items-center gap-1.5 text-sm font-medium text-primary border border-primary/30 hover:border-primary rounded-lg px-3 py-2 transition-colors"
            >
              <Plus size={14} /> Add More
            </button>
            <button
              onClick={exportPDF}
              disabled={exporting || !pages.length}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 shadow"
            >
              {exporting
                ? <><Loader2 size={14} className="animate-spin" /> Exporting {exportPct}%</>
                : <><Download size={14} /> Download PDF</>
              }
            </button>
          </div>
        </div>

        {/* Export progress */}
        {exporting && (
          <div className="h-1 bg-gray-100">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${exportPct}%` }} />
          </div>
        )}
      </div>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-6">

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Help tip */}
        <p className="text-xs text-muted mb-5 flex items-center gap-1.5">
          <span>💡</span>
          <span>Drag cards to reorder · Hover a card to rotate or delete · Changes only apply when you download</span>
        </p>

        {/* ── Page grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {pages.map((page, i) => {
            const isDragging   = dragIdx  === i;
            const isDragTarget = dragOverIdx === i && dragIdx !== null && dragIdx !== i;

            return (
              <div
                key={page.id}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={e => onDragOver(e, i)}
                onDrop={e => onDropCard(e, i)}
                onDragEnd={onDragEnd}
                className={`group relative bg-white rounded-xl border-2 shadow-sm transition-all duration-150 cursor-grab active:cursor-grabbing select-none overflow-hidden
                  ${isDragging   ? "opacity-30 scale-95 border-primary/30" : ""}
                  ${isDragTarget ? "border-primary shadow-lg shadow-primary/20 scale-[1.03]" : "border-gray-100 hover:border-primary/40 hover:shadow-md"}
                `}
              >
                {/* Drop indicator line */}
                {isDragTarget && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl z-10" />
                )}

                {/* Thumbnail */}
                <div className="relative overflow-hidden bg-gray-50 flex items-center justify-center"
                     style={{ aspectRatio: page.height > page.width ? "3/4" : "4/3" }}>
                  <img
                    src={page.thumbnail}
                    alt={page.label}
                    className="w-full h-full object-contain transition-transform duration-200"
                    style={{ transform: `rotate(${page.rotation}deg)` }}
                    draggable={false}
                  />

                  {/* Hover overlay: controls */}
                  <div className="absolute inset-0 bg-dark/0 group-hover:bg-dark/40 transition-all duration-200 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {/* Rotate row */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); rotate(page.id, -90); }}
                        title="Rotate 90° left"
                        className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow transition-all hover:scale-110"
                      >
                        <RotateCcw size={14} className="text-dark" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); rotate(page.id, 90); }}
                        title="Rotate 90° right"
                        className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow transition-all hover:scale-110"
                      >
                        <RotateCw size={14} className="text-dark" />
                      </button>
                    </div>
                    {/* Delete */}
                    <button
                      onClick={e => { e.stopPropagation(); deletePage(page.id); }}
                      title="Delete this page"
                      className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow transition-all hover:scale-110"
                    >
                      <Trash2 size={13} className="text-white" />
                    </button>
                  </div>

                  {/* Rotation badge */}
                  {page.rotation !== 0 && (
                    <div className="absolute top-1 right-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full z-10">
                      {page.rotation}°
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-2 py-1.5">
                  <p className="text-[10px] text-muted text-center truncate leading-tight" title={page.label}>
                    {page.label}
                  </p>
                  {/* Page number in arrangement */}
                  <p className="text-[10px] font-bold text-primary text-center">#{i + 1}</p>
                </div>
              </div>
            );
          })}

          {/* Loading skeleton cards */}
          {isLoading && Array.from({ length: Math.min(4, loadTotal - loadDone) }).map((_, i) => (
            <div key={`skel-${i}`} className="bg-white rounded-xl border-2 border-gray-100 shadow-sm overflow-hidden animate-pulse">
              <div className="bg-gray-100" style={{ aspectRatio: "3/4" }} />
              <div className="px-2 py-1.5 space-y-1">
                <div className="h-2 bg-gray-100 rounded mx-auto w-3/4" />
                <div className="h-2 bg-gray-100 rounded mx-auto w-1/2" />
              </div>
            </div>
          ))}
        </div>

        {/* Empty state (all deleted) */}
        {!isLoading && pages.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📄</div>
            <p className="text-dark font-semibold mb-1">All pages deleted</p>
            <p className="text-muted text-sm mb-4">Add pages back by clicking "Add More" above.</p>
            <button onClick={deleteAll} className="btn-primary px-5 py-2.5 text-sm">
              Start Over
            </button>
          </div>
        )}
      </div>

      {/* ── Bottom action bar ────────────────────────────────────────────── */}
      {pages.length > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-100 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
            <div className="text-sm text-muted">
              <span className="font-semibold text-dark">{pages.length} pages</span>
              {" "}ready to download
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportPDF}
                disabled={exporting || !pages.length}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 shadow-lg"
              >
                {exporting
                  ? <><Loader2 size={16} className="animate-spin" /> Exporting…</>
                  : <><Download size={16} /> Download Arranged PDF</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-center gap-2 text-xs text-muted">
        <Shield size={11} className="text-green-500" />
        100% browser-based — your PDF never leaves your device
      </div>
    </div>
  );
}
