"use client";

import { useState } from "react";

interface Pdf {
  kind: string;
  filename: string;
  data: string; // base64
  label: string;
}

// Optional data the client sends so PDF generation works in demo mode
// (no server-side Supabase). Ignored when Supabase is configured.
export interface DemoPayload {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  quote: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: Record<string, any>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entities: Record<string, any>[];
}

const LABELS: Record<string, string> = {
  psk: "КП PSK (ИП Зиянгиров)",
  alt1: "Альтернатива 1 (Технопродукт)",
  alt2: "Альтернатива 2 (АТА)",
};

export function PdfModal({
  quoteId,
  demoPayload,
  onClose,
}: {
  quoteId: string;
  demoPayload?: DemoPayload;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [pdfs, setPdfs] = useState<Pdf[]>([]);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pdf/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, ...(demoPayload ?? {}) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ошибка генерации");
      setPdfs(
        json.pdfs.map((p: Pdf) => ({ ...p, label: LABELS[p.kind] ?? p.kind })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  }

  function downloadOne(pdf: Pdf) {
    const blob = new Blob(
      [Uint8Array.from(atob(pdf.data), (c) => c.charCodeAt(0))],
      { type: "application/pdf" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = pdf.filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function downloadAll() {
    const res = await fetch("/api/pdf/zip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdfs }),
    });
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "КП_3_варианта.zip";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6"
      onClick={onClose}
    >
      <div
        className="fadein w-[520px] max-w-[95vw] rounded-[14px] bg-white p-7 shadow-[0_24px_60px_rgba(0,0,0,.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[18px] font-bold">Сформировать 3 КП</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#EFE9DE] text-[16px] text-[#6F685D] hover:bg-[#E7DFD2]"
          >
            ✕
          </button>
        </div>

        {pdfs.length === 0 && !loading && (
          <div className="py-5 text-center">
            <p className="mb-5 leading-relaxed text-[#666]">
              Сформируем 3 коммерческих предложения от трёх юрлиц:
              <br />
              <b>ИП Зиянгиров</b>, <b>ООО Технопродукт</b> и <b>ООО АТА</b>
            </p>
            <button
              onClick={generate}
              className="rounded-[10px] bg-accent px-8 py-3 text-[15px] font-semibold text-white shadow-[0_4px_10px_rgba(42,111,219,.25)] transition-colors hover:bg-accent-dark"
            >
              Сформировать PDF
            </button>
          </div>
        )}

        {loading && (
          <div className="py-8 text-center">
            <div className="mb-3 text-[32px]">⏳</div>
            <p className="text-[#666]">Генерируем PDF… ~15–30 секунд</p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-[8px] bg-risk-bg px-3 py-3 text-[13px] text-risk">
            Ошибка: {error}
          </div>
        )}

        {pdfs.length > 0 && (
          <>
            <div className="mb-4 flex flex-col gap-2.5">
              {pdfs.map((pdf) => (
                <div
                  key={pdf.kind}
                  className="flex items-center justify-between rounded-[8px] border border-border bg-bg px-4 py-3"
                >
                  <div>
                    <div className="text-[14px] font-semibold">{pdf.label}</div>
                    <div className="mt-0.5 text-[11px] text-muted">{pdf.filename}</div>
                  </div>
                  <button
                    onClick={() => downloadOne(pdf)}
                    className="rounded-[6px] bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-dark"
                  >
                    ↓ PDF
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={downloadAll}
              className="w-full rounded-[8px] bg-ok py-3.5 text-[15px] font-bold text-white transition-colors hover:brightness-95"
            >
              ↓ Скачать все 3 одним ZIP
            </button>
          </>
        )}
      </div>
    </div>
  );
}
