import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { buildKpHtml, type KpData } from "@/lib/pdf-template";
import { launchBrowser } from "@/lib/pdf-browser";

export const runtime = "nodejs";
export const maxDuration = 60;

type EntityRow = {
  code: string;
  name: string;
  full_name?: string | null;
  inn?: string | null;
  kpp?: string | null;
  ogrn?: string | null;
  requisites?: string | null;
  tax_mode: "usn" | "osn";
  vat_rate?: number | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const quoteId: string | undefined = body?.quoteId;
  if (!quoteId) {
    return NextResponse.json({ error: "quoteId required" }, { status: 400 });
  }

  let quote: Row | null | undefined;
  let items: Row[] | null | undefined;
  let entities: EntityRow[] | null | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let supabase: any = null;
  let userId = "local";

  if (isSupabaseConfigured) {
    supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;

    ({ data: quote } = await supabase.from("quotes").select("*").eq("id", quoteId).single());
    ({ data: items } = await supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", quoteId)
      .order("position"));
    ({ data: entities } = await supabase.from("entities").select("*"));
  } else {
    // Demo mode: data comes from the client (localStorage-backed store).
    quote = body?.quote;
    items = body?.items;
    entities = body?.entities;
  }

  if (!quote || !items || !entities) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  // Diagnostics for the "empty item name" bug — inspect the real row shape.
  console.log("PDF generate — items[0]:", JSON.stringify(items[0]));

  const entitiesMap: Record<string, EntityRow> = Object.fromEntries(
    entities.map((e) => [e.code, e]),
  );

  const variants = [
    { kind: "psk", entityCode: quote.entity_psk, priceField: "price_psk" },
    { kind: "alt1", entityCode: quote.entity_alt1, priceField: "price_alt1" },
    { kind: "alt2", entityCode: quote.entity_alt2, priceField: "price_alt2" },
  ] as const;

  const pdfBuffers: { kind: string; buffer: Buffer; filename: string }[] = [];
  const browser = await launchBrowser();

  // Части имени файла (общие для всех трёх вариантов).
  const cleanCustomer = (quote.customer ?? "Заказчик")
    .replace(/[^а-яёА-ЯЁa-zA-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 30);
  const kpNum = (quote.kp_no ?? "бн").replace(/[^а-яёА-ЯЁa-zA-Z0-9\-_]/g, "_");
  const entityShort: Record<string, string> = {
    ip: "ИП_Зиянгиров",
    tehnoprodukt: "Технопродукт",
    ata: "АТА",
  };

  try {
    for (const v of variants) {
      const entity = entitiesMap[v.entityCode];
      if (!entity) continue;

      const kpItems = items.map((i) => ({
        position: i.position,
        // quote_items stores the name in `name`; fall back to other likely keys
        // so a differently-shaped payload still renders a title.
        name: i.name ?? i.наименование ?? i.product_name ?? i.title ?? "",
        unit: i.unit ?? "шт",
        // Округляем до 2 знаков, чтобы копейки сходились без плавающей ошибки.
        qty: Math.round(Number(i.qty ?? 1) * 100) / 100,
        price: Math.round(Number(i[v.priceField] ?? 0) * 100) / 100,
      }));

      const kpData: KpData = {
        entityCode: entity.code as KpData["entityCode"],
        entityName: entity.name,
        entityFullName: entity.full_name ?? entity.name,
        entityInn: entity.inn ?? "",
        entityKpp: entity.kpp ?? "",
        entityOgrn: entity.ogrn ?? "",
        entityRequisites: entity.requisites ?? "",
        taxMode: entity.tax_mode,
        vatRate: entity.vat_rate ?? 0,
        customer: quote.customer ?? "",
        kpNo: `${quote.kp_no ?? quoteId.slice(0, 6)}-${v.kind.toUpperCase()}`,
        kpDate: quote.kp_date
          ? new Date(quote.kp_date).toLocaleDateString("ru-RU")
          : new Date().toLocaleDateString("ru-RU"),
        showLogo: !!quote.opt_logo,
        showStamp: !!(quote.opt_pechat || quote.opt_podpis),
        items: kpItems,
      };

      const html = buildKpHtml(entity.code, kpData);

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load" });
      const pdfBuf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0", bottom: "0", left: "0", right: "0" },
      });
      await page.close();

      const filename = `КП_${kpNum}_${cleanCustomer}_${
        entityShort[v.entityCode] ?? v.entityCode
      }.pdf`;
      pdfBuffers.push({ kind: v.kind, buffer: Buffer.from(pdfBuf), filename });

      // Persist to Storage — best-effort, never blocks PDF delivery.
      if (supabase) {
        try {
          const storagePath = `${userId}/${quoteId}/${filename}`;
          await supabase.storage
            .from("pdfs")
            .upload(storagePath, Buffer.from(pdfBuf), {
              contentType: "application/pdf",
              upsert: true,
            });
          await supabase.from("generated_pdfs").upsert(
            {
              quote_id: quoteId,
              kind: v.kind,
              entity_code: v.entityCode,
              storage_path: storagePath,
              generated_at: new Date().toISOString(),
            },
            { onConflict: "quote_id,kind" },
          );
        } catch (e) {
          console.warn("PDF storage upload failed (non-fatal):", e);
        }
      }
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "PDF generation failed" },
      { status: 500 },
    );
  } finally {
    await browser.close();
  }

  return NextResponse.json({
    pdfs: pdfBuffers.map((p) => ({
      kind: p.kind,
      filename: p.filename,
      data: p.buffer.toString("base64"),
    })),
  });
}
