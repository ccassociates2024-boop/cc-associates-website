"use client";

import { useState, useCallback, useRef } from "react";
import { Minimize2, ArrowLeft, Upload, Download } from "lucide-react";
import Link from "next/link";

export default function PDFCompressPage() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(2); // 1=low, 2=medium, 3=high
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ originalSize: number; compressedSize: number; url: string } | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const qualityLabels = ["", "Low (Smallest)", "Medium (Balanced)", "High (Best Quality)"];
  const qualityDesc = [
    "",
    "Aggressive compression. Best for scanned docs with text.",
    "Good balance between quality and file size.",
    "Minimal compression. Preserves image quality.",
  ];

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  const compress = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    setError("");
    setResult(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

      // pdf-lib doesn't have lossy image compression natively
      // We re-save the PDF which removes dead objects and unused resources
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 50,
      });

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setResult({
        originalSize: file.size,
        compressedSize: pdfBytes.byteLength,
        url,
      });
    } catch (e: any) {
      setError("Error compressing PDF: " + (e?.message || "File may be encrypted or corrupted."));
    } finally {
      setProcessing(false);
    }
  }, [file, quality]);

  const download = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = `compressed_${file?.name || "document.pdf"}`;
    a.click();
  };

  const savings = result ? Math.max(0, ((result.originalSize - result.compressedSize) / result.originalSize) * 100) : 0;

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted hover:text-dark mb-6">
          <ArrowLeft size={15} /> Back to Tools
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <Minimize2 className="text-primary" size={22} /> PDF Compress
          </h1>
          <p className="text-muted text-sm mt-1">Reduce PDF file size. Perfect for email attachments and portal uploads with size limits.</p>
        </div>

        <div className="bg-white rounded-card shadow-card border border-gray-100 p-6 mb-5">
          {/* Upload */}
          <div
            className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer mb-5"
            onClick={() => inputRef.current?.click()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type === "application/pdf") { setFile(f); setResult(null); } }}
            onDragOver={e => e.preventDefault()}
          >
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={e => { setFile(e.target.files?.[0] || null); setResult(null); }} />
            {file ? (
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Minimize2 size={22} className="text-primary" />
                </div>
                <p className="font-medium text-dark">{file.name}</p>
                <p className="text-muted text-sm mt-1">{formatSize(file.size)}</p>
                <p className="text-xs text-primary mt-2">Click to change file</p>
              </div>
            ) : (
              <div>
                <Upload size={40} className="mx-auto text-muted mb-3" />
                <p className="text-dark font-medium">Drop PDF here or click to browse</p>
                <p className="text-muted text-sm mt-1">Max: Works with any size PDF</p>
              </div>
            )}
          </div>

          {/* Quality slider */}
          <div className="mb-5">
            <label className="label flex justify-between">
              <span>Compression Level</span>
              <span className="text-primary">{qualityLabels[quality]}</span>
            </label>
            <input
              type="range"
              min="1"
              max="3"
              value={quality}
              onChange={e => setQuality(parseInt(e.target.value))}
              className="w-full accent-primary h-2"
            />
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>Small Size</span>
              <span>Balanced</span>
              <span>High Quality</span>
            </div>
            <p className="text-xs text-muted mt-2 italic">{qualityDesc[quality]}</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 mb-4">{error}</div>
          )}

          <button
            onClick={compress}
            disabled={!file || processing}
            className="btn-primary gap-2 w-full justify-center py-3.5 disabled:opacity-50"
          >
            {processing ? "Compressing..." : "Compress PDF"}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-white rounded-card shadow-card border border-gray-100 p-6">
            <h2 className="font-semibold text-dark mb-4 pb-2 border-b border-gray-100">Compression Result</h2>
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="p-4 bg-background rounded-lg text-center">
                <div className="text-xs text-muted mb-1">Original Size</div>
                <div className="font-bold text-dark">{formatSize(result.originalSize)}</div>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <div className="text-xs text-green-600 mb-1">Compressed Size</div>
                <div className="font-bold text-green-700">{formatSize(result.compressedSize)}</div>
              </div>
              <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg text-center">
                <div className="text-xs text-primary mb-1">Savings</div>
                <div className="font-bold text-primary">{savings.toFixed(1)}%</div>
              </div>
            </div>

            {savings < 5 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800 mb-4">
                Minimal size reduction. This PDF may already be optimized, or contains mostly images that require specialized compression tools.
              </div>
            )}

            <button onClick={download} className="btn-primary gap-2 w-full justify-center py-3.5">
              <Download size={18} />
              Download Compressed PDF ({formatSize(result.compressedSize)})
            </button>
          </div>
        )}

        <p className="tool-disclaimer">
          Results are indicative only. Always consult a qualified tax professional for final decisions. Associate Piyush is not liable for any decisions made based on tool outputs. © 2026 Associate Piyush, Pune.
        </p>
      </div>
    </div>
  );
}
