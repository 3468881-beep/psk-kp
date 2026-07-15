import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createHash } from "crypto";

export const runtime = "nodejs";
// maxDuration не задаём: на Vercel Hobby повышенный лимит недоступен,
// укладываемся в дефолтный тайм-аут за счёт параллельного Firecrawl с таймаутами.

interface Source {
  site: string;
  url: string;
  price: number;
  title: string;
}

function statusFor(count: number): string {
  if (count === 0) return "no_data";
  return count >= 3 ? "ok" : "few_sources";
}

export async function POST(req: NextRequest) {
  const { itemName, force = false } = await req.json().catch(() => ({}));
  if (!itemName) {
    return NextResponse.json({ error: "itemName required" }, { status: 400 });
  }

  const nameHash = createHash("md5")
    .update(String(itemName).toLowerCase().trim())
    .digest("hex");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let supabase: any = null;
  if (isSupabaseConfigured) {
    supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Кэш (не старше 24 часов)
    if (!force) {
      const { data: cached } = await supabase
        .from("market_cache")
        .select("*")
        .eq("name_hash", nameHash)
        .gte("cached_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();
      if (cached) {
        return NextResponse.json({
          ...cached,
          status: statusFor(cached.source_count ?? 0),
          fromCache: true,
        });
      }
    }
  }

  const tavilyKey = process.env.TAVILY_API_KEY;
  console.log(
    "TAVILY_API_KEY present:",
    !!process.env.TAVILY_API_KEY,
    "length:",
    process.env.TAVILY_API_KEY?.length,
  );
  if (!tavilyKey) {
    return NextResponse.json({ error: "TAVILY_API_KEY not set" }, { status: 500 });
  }

  // Поиск через Tavily. Ключ передаём только в заголовке Authorization
  // (api_key в теле — устаревший способ и вызывает ошибку у новых ключей).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let searchResults: any[] = [];
  const tavilyRes = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tavilyKey}`,
    },
    body: JSON.stringify({
      query: `купить "${itemName}" цена рублей`,
      search_depth: "basic",
      max_results: 3,
      exclude_domains: ["avito.ru", "youla.ru"],
    }),
  });
  const tavilyText = await tavilyRes.text();
  console.log("Tavily response:", tavilyText.slice(0, 200));
  if (!tavilyRes.ok) {
    return NextResponse.json(
      { error: `Tavily error: ${tavilyRes.status} ${tavilyText.slice(0, 100)}` },
      { status: 500 },
    );
  }
  try {
    const tavilyData = JSON.parse(tavilyText);
    searchResults = tavilyData.results ?? [];
  } catch (e) {
    console.error("Tavily JSON parse error:", e);
    return NextResponse.json(
      { error: `Tavily returned non-JSON: ${tavilyText.slice(0, 100)}` },
      { status: 500 },
    );
  }

  // Парсинг цен через Firecrawl — максимум 2 страницы, параллельно,
  // с таймаутом 5 сек на каждый запрос и общим ограничением 20 сек.
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  let sources: Source[] = [];

  async function scrapeOne(result: {
    url: string;
    title?: string;
  }): Promise<Source | null> {
    if (!firecrawlKey) return null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${firecrawlKey}`,
        },
        body: JSON.stringify({
          url: result.url,
          formats: ["extract"],
          extract: {
            prompt:
              "Extract the product price in rubles. Return only a JSON object with fields: price (number, price in rubles without spaces), title (string, product name). If price not found return null.",
            schema: {
              type: "object",
              properties: {
                price: { type: "number" },
                title: { type: "string" },
              },
            },
          },
        }),
      });
      const fcData = await fcRes.json();
      const extracted = fcData.data?.extract;
      if (extracted?.price && extracted.price > 0) {
        return {
          site: new URL(result.url).hostname.replace("www.", ""),
          url: result.url,
          price: extracted.price,
          title: extracted.title ?? result.title ?? itemName,
        };
      }
      return null;
    } catch (e) {
      // таймаут (abort) или ошибка сети — пропускаем эту страницу
      console.error("Firecrawl error for", result.url, e);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  if (firecrawlKey) {
    const pages = searchResults.slice(0, 2);
    const scrapeAll = Promise.allSettled(pages.map(scrapeOne)).then((results) =>
      results
        .map((r) => (r.status === "fulfilled" ? r.value : null))
        .filter((s): s is Source => s !== null),
    );
    // Общий предохранитель: не ждём Firecrawl дольше 20 сек.
    const overallTimeout = new Promise<Source[]>((resolve) =>
      setTimeout(() => resolve([]), 20000),
    );
    sources = await Promise.race([scrapeAll, overallTimeout]);
  }

  // Fallback: цены из сниппетов Tavily
  if (sources.length === 0) {
    for (const result of searchResults) {
      const priceMatch = (result.content ?? "").match(
        /(\d[\d\s]{2,8})\s*(?:руб|₽|rub)/i,
      );
      if (priceMatch) {
        const price = parseInt(priceMatch[1].replace(/\s/g, ""), 10);
        if (price > 100 && price < 100_000_000) {
          sources.push({
            site: new URL(result.url).hostname.replace("www.", ""),
            url: result.url,
            price,
            title: result.title ?? itemName,
          });
        }
      }
    }
  }

  if (sources.length === 0) {
    return NextResponse.json({
      item_name: itemName,
      name_hash: nameHash,
      source_count: 0,
      status: "no_data",
      sources: [],
    });
  }

  const prices = sources.map((s) => s.price).filter((p) => p > 0);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  // Строка, сохраняемая в кэш (только колонки таблицы market_cache).
  const cacheRow = {
    item_name: itemName,
    name_hash: nameHash,
    min_price: Math.round(minPrice * 100) / 100,
    avg_price: Math.round(avgPrice * 100) / 100,
    max_price: Math.round(maxPrice * 100) / 100,
    source_count: sources.length,
    sources,
  };

  if (supabase) {
    await supabase
      .from("market_cache")
      .upsert({ ...cacheRow, cached_at: new Date().toISOString() }, {
        onConflict: "name_hash",
      });
  }

  return NextResponse.json({ ...cacheRow, status: statusFor(sources.length) });
}
