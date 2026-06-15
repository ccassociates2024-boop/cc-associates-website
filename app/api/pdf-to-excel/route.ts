import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // seconds — large PDFs need time

const BASE = "https://api.ilovepdf.com/v1";

// ── GET: tell the client whether the API key is configured ──────────────────
export async function GET() {
  return NextResponse.json({
    available: !!process.env.ILOVEPDF_PUBLIC_KEY,
  });
}

// ── POST: proxy a PDF → Excel conversion through ilovepdf ──────────────────
export async function POST(req: NextRequest) {
  const publicKey = process.env.ILOVEPDF_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json(
      { error: "API key not configured on this server." },
      { status: 503 }
    );
  }

  try {
    // 1 ── Parse incoming form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 50 MB)." }, { status: 413 });
    }

    // 2 ── Authenticate
    const authRes = await fetch(`${BASE}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_key: publicKey }),
    });
    if (!authRes.ok) {
      const body = await authRes.text();
      throw new Error(`ilovepdf auth failed (${authRes.status}): ${body.slice(0, 200)}`);
    }
    const { token } = (await authRes.json()) as { token: string };

    // 3 ── Start a pdftoxls task → get task ID + processing server
    const startRes = await fetch(`${BASE}/start/pdftoxls`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!startRes.ok) throw new Error(`Start task failed: ${startRes.status}`);
    const { task, server } = (await startRes.json()) as { task: string; server: string };

    // 4 ── Upload the PDF
    const uploadForm = new FormData();
    uploadForm.append("task", task);
    uploadForm.append("file", file, file.name);
    const uploadRes = await fetch(`https://${server}/v1/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: uploadForm,
    });
    if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
    const { server_filename } = (await uploadRes.json()) as { server_filename: string };

    // 5 ── Process (convert PDF → Excel, with OCR for scanned pages)
    const processRes = await fetch(`https://${server}/v1/process`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        task,
        tool: "pdftoxls",
        files: [{ server_filename, filename: file.name }],
        pdftoxls_mode: "spreadsheet",   // structured table output
        ocr_languages: ["eng"],          // enable OCR for scanned PDFs
      }),
    });
    if (!processRes.ok) {
      const body = await processRes.text();
      throw new Error(`Processing failed (${processRes.status}): ${body.slice(0, 300)}`);
    }

    // 6 ── Download result
    const dlRes = await fetch(`https://${server}/v1/download/${task}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!dlRes.ok) throw new Error(`Download failed: ${dlRes.status}`);

    const xlsxBuffer = await dlRes.arrayBuffer();
    const outName = file.name.replace(/\.pdf$/i, ".xlsx");

    return new NextResponse(xlsxBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${outName}"`,
        "X-Output-Filename": outName,
      },
    });
  } catch (err: any) {
    console.error("[pdf-to-excel API]", err);
    return NextResponse.json(
      { error: err?.message ?? "Conversion failed. Please try again." },
      { status: 500 }
    );
  }
}
