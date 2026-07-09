import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

export const runtime = "nodejs";

interface PdfEntry {
  filename: string;
  data: string; // base64
}

export async function POST(req: NextRequest) {
  const { pdfs } = (await req.json()) as { pdfs: PdfEntry[] };
  if (!pdfs || !pdfs.length) {
    return NextResponse.json({ error: "pdfs required" }, { status: 400 });
  }

  const zip = new JSZip();
  for (const pdf of pdfs) {
    zip.file(pdf.filename, pdf.data, { base64: true });
  }
  const buf = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="KP_3_variants.zip"',
    },
  });
}
