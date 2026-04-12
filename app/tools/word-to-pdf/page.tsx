"use client";

import { useState, useCallback, useRef } from "react";
import { FileOutput, ArrowLeft, Upload, Download, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function WordToPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  const convert = useCallback(async () => {
    if (!file) return;
    setConverting(true);
    setError("");
    setDone(false);
    try {
      const mammoth = await import("mammoth");
      const { jsPDF } = await import("jspdf");

      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });

      // Parse HTML content to extract text with basic formatting
      const parser = new DOMParser();
      const doc = parser.parseFromString(result.value, "text/html");

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = 210;
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = 25;

      const addText = (text: string, fontSize: number, bold: boolean) => {
        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", bold ? "bold" : "normal");
        const lines = pdf.splitTextToSize(text, contentWidth);
        for (const line of lines) {
          if (y > 275) {
            pdf.addPage();
            y = 20;
          }
          pdf.text(line, margin, y);
          y += fontSize * 0.45;
        }
        y += 2;
      };

      // Walk through body elements
      const body = doc.body;
      const processNode = (node: Element) => {
        const tag = node.tagName?.toLowerCase();
        const text = node.textContent?.trim() || "";
        if (!text) return;

        if (tag === "h1") addText(text, 18, true);
        else if (tag === "h2") addText(text, 15, true);
        else if (tag === "h3") addText(text, 13, true);
        else if (tag === "p") addText(text, 11, false);
        else if (tag === "li") addText(`• ${text}`, 11, false);
        else if (tag === "table") {
          // Basic table support
          const rows = node.querySelectorAll("tr");
          rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll("td, th")).map(c => c.textContent?.trim() || "");
            addText(cells.join(" | "), 9, row.querySelectorAll("th").length > 0);
          });
        } else {
          // For divs, spans, etc., process children
          Array.from(node.children).forEach(child => processNode(child as Element));
        }
      };

      // If body has no block elements, use full text
      const hasBlocks = body.querySelector("p, h1, h2, h3, li, table");
      if (hasBlocks) {
        Array.from(body.children).forEach(child => processNode(child as Element));
      } else {
        addText(body.textContent || "", 11, false);
      }

      // Footer
      const pagesCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pagesCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Converted by Associate Piyush Tools — ${file.name}`, margin, 290);
        pdf.text(`Page ${i} of ${pagesCount}`, pageWidth - margin, 290, { align: "right" });
        pdf.setTextColor(0, 0, 0);
      }

      pdf.save(`${file.name.replace(/\.(docx?|doc)$/i, "")}.pdf`);
      setDone(true);
    } catch (e: any) {
      setError("Error converting: " + (e?.message || "Please ensure the file is a valid .docx format."));
    } finally {
      setConverting(false);
    }
  }, [file]);

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted hover:text-dark mb-6">
          <ArrowLeft size={15} /> Back to Tools
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            <FileOutput className="text-primary" size={22} /> Word to PDF Converter
          </h1>
          <p className="text-muted text-sm mt-1">Convert .docx files to PDF instantly. No upload, no server — 100% in your browser.</p>
        </div>

        <div className="bg-white rounded-card shadow-card border border-gray-100 p-6">
          {/* Upload */}
          <div
            className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer mb-5"
            onClick={() => inputRef.current?.click()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setFile(f); setDone(false); } }}
            onDragOver={e => e.preventDefault()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".doc,.docx"
              className="hidden"
              onChange={e => { setFile(e.target.files?.[0] || null); setDone(false); }}
            />
            {file ? (
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileOutput size={22} className="text-primary" />
                </div>
                <p className="font-medium text-dark">{file.name}</p>
                <p className="text-muted text-sm mt-1">{formatSize(file.size)}</p>
                <p className="text-xs text-primary mt-2">Click to change file</p>
              </div>
            ) : (
              <div>
                <Upload size={40} className="mx-auto text-muted mb-3" />
                <p className="text-dark font-medium mb-1">Drop .docx file here or click to browse</p>
                <p className="text-muted text-sm">.doc and .docx supported</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { title: "Preserves Text", desc: "All paragraphs and headings retained" },
              { title: "Preserves Lists", desc: "Bullet and numbered lists" },
              { title: "No Upload", desc: "Conversion happens in browser" },
            ].map(({ title, desc }) => (
              <div key={title} className="p-3 bg-background rounded-lg text-center text-xs">
                <div className="font-semibold text-dark mb-1">{title}</div>
                <div className="text-muted">{desc}</div>
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 mb-4">{error}</div>
          )}

          {done && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-4">
              <CheckCircle size={16} />
              <span>Conversion successful! PDF downloaded.</span>
            </div>
          )}

          <button
            onClick={convert}
            disabled={!file || converting}
            className="btn-primary gap-2 w-full justify-center py-3.5 disabled:opacity-50"
          >
            <Download size={18} />
            {converting ? "Converting..." : "Convert & Download PDF"}
          </button>

          <p className="text-xs text-muted mt-4 text-center">
            Note: Complex formatting (columns, custom fonts, shapes) may not be preserved perfectly. For best results, use simple Word documents.
          </p>
        </div>

        <p className="tool-disclaimer">
          Results are indicative only. Always consult a qualified tax professional for final decisions. Associate Piyush is not liable for any decisions made based on tool outputs. © 2026 Associate Piyush, Pune.
        </p>
      </div>
    </div>
  );
}
