"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, Download, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface LineItem {
  description: string;
  hsnSac: string;
  qty: string;
  rate: string;
  gstRate: string;
}

const defaultItem: LineItem = { description: "", hsnSac: "", qty: "1", rate: "", gstRate: "18" };

const GST_RATES = ["0", "0.1", "0.25", "1", "1.5", "3", "5", "7.5", "12", "18", "28"];

export default function GSTInvoicePage() {
  const [seller, setSeller] = useState({
    name: "", gstin: "", address: "", city: "", state: "", pin: "", email: "", phone: "",
  });
  const [buyer, setBuyer] = useState({
    name: "", gstin: "", address: "", city: "", state: "", pin: "",
  });
  const [invoice, setInvoice] = useState({
    number: "", date: new Date().toISOString().split("T")[0], poNumber: "",
    placeOfSupply: "", supplyType: "intra",
  });
  const [items, setItems] = useState<LineItem[]>([{ ...defaultItem }]);
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);

  const addItem = () => setItems([...items, { ...defaultItem }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof LineItem, value: string) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    setItems(updated);
  };

  const calcRow = (item: LineItem) => {
    const qty = parseFloat(item.qty) || 0;
    const rate = parseFloat(item.rate) || 0;
    const taxable = qty * rate;
    const gstPct = parseFloat(item.gstRate) || 0;
    const gstAmt = (taxable * gstPct) / 100;
    return { taxable, gstAmt, total: taxable + gstAmt };
  };

  const totals = items.reduce(
    (acc, item) => {
      const { taxable, gstAmt } = calcRow(item);
      return { taxable: acc.taxable + taxable, gst: acc.gst + gstAmt };
    },
    { taxable: 0, gst: 0 }
  );
  const grandTotal = totals.taxable + totals.gst;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const generatePDF = useCallback(async () => {
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      // Header
      doc.setFillColor(26, 58, 107);
      doc.rect(0, 0, 210, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("TAX INVOICE", 15, 16);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(seller.name || "Your Company Name", 15, 24);
      doc.setFontSize(8);
      doc.text(`GSTIN: ${seller.gstin || "—"}`, 15, 30);
      doc.text(`${seller.address || ""}, ${seller.city || ""} - ${seller.pin || ""}`, 15, 35);

      // Invoice details top right
      doc.setFontSize(9);
      doc.text(`Invoice No: ${invoice.number || "—"}`, 140, 15);
      doc.text(`Date: ${invoice.date}`, 140, 21);
      doc.text(`PO No: ${invoice.poNumber || "—"}`, 140, 27);

      // Sold To
      doc.setTextColor(26, 26, 46);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("BILLED TO:", 15, 52);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(buyer.name || "Buyer Name", 15, 58);
      doc.text(`GSTIN: ${buyer.gstin || "—"}`, 15, 63);
      doc.text(`${buyer.address || ""}`, 15, 68);
      doc.text(`${buyer.city || ""}, ${buyer.state || ""} - ${buyer.pin || ""}`, 15, 73);

      // Place of supply / Type
      doc.setFont("helvetica", "bold");
      doc.text("Place of Supply:", 120, 52);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.placeOfSupply || seller.state || "—", 120, 58);
      doc.text(`Supply Type: ${invoice.supplyType === "intra" ? "Intra-State" : "Inter-State"}`, 120, 64);

      // Line items
      const tableBody = items.map((item, i) => {
        const { taxable, gstAmt } = calcRow(item);
        const gstPct = parseFloat(item.gstRate) || 0;
        if (invoice.supplyType === "intra") {
          return [
            i + 1, item.description, item.hsnSac, item.qty,
            `₹${fmt(parseFloat(item.rate) || 0)}`,
            `₹${fmt(taxable)}`,
            `${gstPct / 2}%`, `₹${fmt(gstAmt / 2)}`,
            `${gstPct / 2}%`, `₹${fmt(gstAmt / 2)}`,
            `₹${fmt(taxable + gstAmt)}`,
          ];
        } else {
          return [
            i + 1, item.description, item.hsnSac, item.qty,
            `₹${fmt(parseFloat(item.rate) || 0)}`,
            `₹${fmt(taxable)}`,
            `${gstPct}%`, `₹${fmt(gstAmt)}`,
            `₹${fmt(taxable + gstAmt)}`,
          ];
        }
      });

      const intraHeaders = ["#", "Description", "HSN/SAC", "Qty", "Rate", "Taxable", "CGST%", "CGST", "SGST%", "SGST", "Total"];
      const interHeaders = ["#", "Description", "HSN/SAC", "Qty", "Rate", "Taxable", "IGST%", "IGST", "Total"];

      autoTable(doc, {
        startY: 82,
        head: [invoice.supplyType === "intra" ? intraHeaders : interHeaders],
        body: tableBody,
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [26, 58, 107], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [247, 249, 252] },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 8;

      // Totals
      doc.setFillColor(247, 249, 252);
      doc.rect(120, finalY, 75, 7, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Taxable Amount:", 122, finalY + 5);
      doc.text(`₹${fmt(totals.taxable)}`, 185, finalY + 5, { align: "right" });

      if (invoice.supplyType === "intra") {
        doc.rect(120, finalY + 7, 75, 7, "F");
        doc.text(`CGST:`, 122, finalY + 12);
        doc.text(`₹${fmt(totals.gst / 2)}`, 185, finalY + 12, { align: "right" });
        doc.rect(120, finalY + 14, 75, 7, "F");
        doc.text(`SGST:`, 122, finalY + 19);
        doc.text(`₹${fmt(totals.gst / 2)}`, 185, finalY + 19, { align: "right" });
      } else {
        doc.rect(120, finalY + 7, 75, 7, "F");
        doc.text(`IGST:`, 122, finalY + 12);
        doc.text(`₹${fmt(totals.gst)}`, 185, finalY + 12, { align: "right" });
      }

      const totalY = invoice.supplyType === "intra" ? finalY + 21 : finalY + 14;
      doc.setFillColor(26, 58, 107);
      doc.rect(120, totalY, 75, 9, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Grand Total:", 122, totalY + 6);
      doc.text(`₹${fmt(grandTotal)}`, 185, totalY + 6, { align: "right" });

      // Notes
      if (notes) {
        doc.setTextColor(26, 26, 46);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("Notes:", 15, totalY + 4);
        doc.setFont("helvetica", "normal");
        doc.text(notes, 15, totalY + 10);
      }

      // Footer
      const pageH = doc.internal.pageSize.height;
      doc.setFillColor(26, 58, 107);
      doc.rect(0, pageH - 14, 210, 14, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("This is a computer generated invoice. | Associate Piyush, Pune | contact@associatepiyush.in", 105, pageH - 6, { align: "center" });

      doc.save(`GST_Invoice_${invoice.number || "draft"}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Error generating PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [seller, buyer, invoice, items, notes, totals, grandTotal, fmt]);

  return (
    <div className="pt-16 min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-muted hover:text-dark mb-6">
          <ArrowLeft size={15} /> Back to Tools
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
              <FileText className="text-primary" size={22} /> GST Invoice Generator
            </h1>
            <p className="text-muted text-sm mt-1">Generate professional GST-compliant PDF invoices with auto tax calculations.</p>
          </div>
          <button
            onClick={generatePDF}
            disabled={generating}
            className="btn-primary gap-2 no-print"
          >
            <Download size={16} />
            {generating ? "Generating..." : "Download PDF"}
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-5 mb-5">
          {/* Seller */}
          <div className="bg-white rounded-card shadow-card border border-gray-100 p-5">
            <h2 className="font-semibold text-dark mb-4 text-sm uppercase tracking-wide border-b border-gray-100 pb-2">
              Seller Details (Your Business)
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { k: "name", label: "Business Name", full: true },
                { k: "gstin", label: "GSTIN", full: false },
                { k: "address", label: "Address", full: true },
                { k: "city", label: "City", full: false },
                { k: "state", label: "State", full: false },
                { k: "pin", label: "PIN Code", full: false },
                { k: "email", label: "Email", full: false },
                { k: "phone", label: "Phone", full: false },
              ].map(({ k, label, full }) => (
                <div key={k} className={full ? "col-span-2" : ""}>
                  <label className="label">{label}</label>
                  <input
                    type="text"
                    className="input-field"
                    value={(seller as any)[k]}
                    onChange={(e) => setSeller({ ...seller, [k]: e.target.value })}
                    placeholder={label}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Buyer + Invoice */}
          <div className="space-y-5">
            <div className="bg-white rounded-card shadow-card border border-gray-100 p-5">
              <h2 className="font-semibold text-dark mb-4 text-sm uppercase tracking-wide border-b border-gray-100 pb-2">
                Buyer Details
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { k: "name", label: "Buyer Name", full: true },
                  { k: "gstin", label: "GSTIN (if registered)" },
                  { k: "address", label: "Address", full: true },
                  { k: "city", label: "City" },
                  { k: "state", label: "State" },
                  { k: "pin", label: "PIN" },
                ].map(({ k, label, full }) => (
                  <div key={k} className={full ? "col-span-2" : ""}>
                    <label className="label">{label}</label>
                    <input
                      type="text"
                      className="input-field"
                      value={(buyer as any)[k]}
                      onChange={(e) => setBuyer({ ...buyer, [k]: e.target.value })}
                      placeholder={label}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-card shadow-card border border-gray-100 p-5">
              <h2 className="font-semibold text-dark mb-4 text-sm uppercase tracking-wide border-b border-gray-100 pb-2">
                Invoice Details
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Invoice Number</label>
                  <input type="text" className="input-field" value={invoice.number} onChange={e => setInvoice({ ...invoice, number: e.target.value })} placeholder="INV-001" />
                </div>
                <div>
                  <label className="label">Invoice Date</label>
                  <input type="date" className="input-field" value={invoice.date} onChange={e => setInvoice({ ...invoice, date: e.target.value })} />
                </div>
                <div>
                  <label className="label">PO Number</label>
                  <input type="text" className="input-field" value={invoice.poNumber} onChange={e => setInvoice({ ...invoice, poNumber: e.target.value })} placeholder="Optional" />
                </div>
                <div>
                  <label className="label">Place of Supply (State)</label>
                  <input type="text" className="input-field" value={invoice.placeOfSupply} onChange={e => setInvoice({ ...invoice, placeOfSupply: e.target.value })} placeholder="Maharashtra" />
                </div>
                <div className="col-span-2">
                  <label className="label">Supply Type</label>
                  <select className="input-field" value={invoice.supplyType} onChange={e => setInvoice({ ...invoice, supplyType: e.target.value })}>
                    <option value="intra">Intra-State (CGST + SGST)</option>
                    <option value="inter">Inter-State (IGST)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-card shadow-card border border-gray-100 p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-dark text-sm uppercase tracking-wide">Line Items</h2>
            <button onClick={addItem} className="btn-outline text-xs px-3 py-1.5 gap-1">
              <Plus size={13} /> Add Item
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted w-10">#</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted">Description</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted w-24">HSN/SAC</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted w-16">Qty</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted w-24">Rate (₹)</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted w-20">GST %</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-muted w-24">Taxable</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-muted w-24">GST Amt</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-muted w-24">Total</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const { taxable, gstAmt, total } = calcRow(item);
                  return (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 px-2 text-muted text-xs">{i + 1}</td>
                      <td className="py-1 px-2">
                        <input type="text" className="input-field text-xs py-1.5" value={item.description} onChange={e => updateItem(i, "description", e.target.value)} placeholder="Item description" />
                      </td>
                      <td className="py-1 px-2">
                        <input type="text" className="input-field text-xs py-1.5" value={item.hsnSac} onChange={e => updateItem(i, "hsnSac", e.target.value)} placeholder="998311" />
                      </td>
                      <td className="py-1 px-2">
                        <input type="number" className="input-field text-xs py-1.5" value={item.qty} onChange={e => updateItem(i, "qty", e.target.value)} min="0" />
                      </td>
                      <td className="py-1 px-2">
                        <input type="number" className="input-field text-xs py-1.5" value={item.rate} onChange={e => updateItem(i, "rate", e.target.value)} placeholder="0.00" min="0" />
                      </td>
                      <td className="py-1 px-2">
                        <select className="input-field text-xs py-1.5" value={item.gstRate} onChange={e => updateItem(i, "gstRate", e.target.value)}>
                          {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                        </select>
                      </td>
                      <td className="py-2 px-2 text-right text-xs font-medium">₹{fmt(taxable)}</td>
                      <td className="py-2 px-2 text-right text-xs text-muted">₹{fmt(gstAmt)}</td>
                      <td className="py-2 px-2 text-right text-xs font-semibold text-primary">₹{fmt(total)}</td>
                      <td className="py-2 px-2">
                        {items.length > 1 && (
                          <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="w-72 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted">
                <span>Taxable Amount</span>
                <span className="font-medium text-dark">₹{fmt(totals.taxable)}</span>
              </div>
              {invoice.supplyType === "intra" ? (
                <>
                  <div className="flex justify-between text-muted">
                    <span>CGST</span>
                    <span>₹{fmt(totals.gst / 2)}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>SGST</span>
                    <span>₹{fmt(totals.gst / 2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-muted">
                  <span>IGST</span>
                  <span>₹{fmt(totals.gst)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-dark border-t border-gray-200 pt-2 text-base">
                <span>Grand Total</span>
                <span className="text-primary">₹{fmt(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-card shadow-card border border-gray-100 p-5 mb-6">
          <label className="label">Notes / Terms (Optional)</label>
          <textarea className="input-field h-20 resize-none" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment due within 30 days. Late payment charges @18% p.a. NEFT details: ..." />
        </div>

        <button onClick={generatePDF} disabled={generating} className="btn-primary gap-2 w-full justify-center py-3.5">
          <Download size={18} />
          {generating ? "Generating PDF..." : "Download GST Invoice PDF"}
        </button>

        <p className="tool-disclaimer">
          Results are indicative only. Always consult a qualified tax professional for final decisions. Associate Piyush is not liable for any decisions made based on tool outputs. © 2026 Associate Piyush, Pune.
        </p>
      </div>
    </div>
  );
}
