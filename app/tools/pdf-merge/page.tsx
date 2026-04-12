"use client";

import { useState, useCallback, useRef } from "react";
import { Merge, ArrowLeft, Upload, Trash2, Download, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";

interface PDFFile {
  id: string;
  name: string;
  size: number;
  file: File;
}

export default function PDFMergePage() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [merging, setMerging] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    const pdfs: PDFFile[] = [];
    Array.from(newFiles).forEach(f => {
      if (f.type === "application/pdf" || f.name.endsWith(".pdf")) {
        pdfs.push({ id: crypto.randomUUID(), name: f.name, size: f.size, file: f });
      }
    });
    setFiles(prev => [...prev, ...pdfs]);
    setError("");
  }, []);

  const moveFile = (idx: number, dir: -1 | 1) => {
    const newFiles = [...files];
    const target = idx + dir;
    if (target < 0 || target >= newFiles.length) return;
    [newFiles[idx], newFiles[target]] = [newFiles[target], newFiles[idx]];
    setFiles(newFiles);
  };

  const removeFile = (id: string) => setFiles(files.filter(f => f.id !== id));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const mergePDFs = useCallback(async () => {
    if (files.length < 2) { setError("Please add at least 2 PDF files."); return; }
    setMerging(true);
    setError("");
    setProgress("Loading PDF library...");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        setProgress(`Processing file ${i + 1} of ${files.length}: ${files[i].name}`);
        const arrayBuffer = await files[i].file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(p => mergedPdf.addPage(p));
      }

      setProgress("Generating merged PDF...");
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged_document.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setProgress("Done! Download started.");
    } catch (e: any) {
      setError("Error merging PDFs: " + (e?.message || "Some PDFs may be encrypted."));
    } finally {
      setMerging(false);
    }
  }, [files]);

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted hover:text-dark mb-6">
          <ArrowLeft size={15} /> Back to Tools
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <Merge className="text-primary" size={22} /> PDF Merge
          </h1>
          <p className="text-muted text-sm mt-1">Combine multiple PDF files into one. Drag to reorder before merging.</p>
        </div>

        {/* Drop Zone */}
        <div
          className="bg-white rounded-card shadow-card border-2 border-dashed border-gray-200 p-8 mb-5 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf"
            className="hidden"
            onChange={e => addFiles(e.target.files)}
          />
          <Upload size={40} className="mx-auto text-muted mb-3" />
          <p className="text-dark font-medium mb-1">Drop PDF files here or click to browse</p>
          <p className="text-muted text-sm">Multiple files supported</p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="bg-white rounded-card shadow-card border border-gray-100 p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-dark text-sm">{files.length} file{files.length > 1 ? "s" : ""} — Total: {formatSize(files.reduce((s, f) => s + f.size, 0))}</h2>
              <button onClick={() => setFiles([])} className="text-xs text-red-500 hover:text-red-700">Remove All</button>
            </div>
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={f.id} className="flex items-center gap-3 p-3 bg-background rounded-lg border border-gray-100 group">
                  <GripVertical size={16} className="text-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-dark truncate">{f.name}</div>
                    <div className="text-xs text-muted">{formatSize(f.size)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveFile(i, -1)} disabled={i === 0} className="p-1 text-muted hover:text-dark disabled:opacity-30">
                      <ArrowUp size={14} />
                    </button>
                    <button onClick={() => moveFile(i, 1)} disabled={i === files.length - 1} className="p-1 text-muted hover:text-dark disabled:opacity-30">
                      <ArrowDown size={14} />
                    </button>
                    <button onClick={() => removeFile(f.id)} className="p-1 text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 mb-4">{error}</div>
        )}
        {progress && !error && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-primary mb-4">{progress}</div>
        )}

        <button
          onClick={mergePDFs}
          disabled={merging || files.length < 2}
          className="btn-primary gap-2 w-full justify-center py-3.5 disabled:opacity-50"
        >
          <Download size={18} />
          {merging ? "Merging..." : `Merge ${files.length} PDFs & Download`}
        </button>

        <p className="tool-disclaimer">
          Results are indicative only. Always consult a qualified tax professional for final decisions. Associate Piyush is not liable for any decisions made based on tool outputs. © 2026 Associate Piyush, Pune.
        </p>
      </div>
    </div>
  );
}
