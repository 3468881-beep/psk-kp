"use client";

import { useState } from "react";
import { fmt } from "@/lib/formulas";

interface MarketSource {
  site: string;
  url: string;
  price: number;
  title: string;
}
interface MarketResult {
  item_name: string;
  min_price?: number;
  avg_price?: number;
  max_price?: number;
  source_count: number;
  sources: MarketSource[];
  status: string;
  fromCache?: boolean;
}

export default function MarketPage() {
  const [itemName, setItemName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MarketResult | null>(null);
  const [error, setError] = useState("");

  async function check() {
    if (!itemName.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/market/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName: itemName.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ошибка проверки");
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка проверки");
    } finally {
      setLoading(false);
    }
  }

  const statusTone =
    result?.status === "ok"
      ? "bg-ok-bg text-ok"
      : result?.status === "few_sources"
        ? "bg-warn-bg text-warn"
        : "bg-risk-bg text-risk";
  const statusLabel =
    result?.status === "ok"
      ? "Достаточно данных"
      : result?.status === "few_sources"
        ? "Мало источников"
        : "Нет данных";

  return (
    <div className="flex-1 overflow-auto bg-bg px-[22px] py-6">
      <div className="mx-auto max-w-[720px]">
        <h1 className="mb-1 text-[20px] font-bold">Проверка рынка</h1>
        <p className="mb-5 text-[12.5px] text-muted">
          Web-поиск цен по наименованию (Tavily) и извлечение цен со страниц (Firecrawl).
          Сравнение с ценой PSK делаете на экране расчёта.
        </p>

        <div className="mb-6 flex gap-2">
          <input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="Введите наименование товара…"
            className="flex-1 rounded-[8px] border border-border bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-accent focus:shadow-[0_0_0_2px_rgba(42,111,219,.12)]"
          />
          <button
            onClick={check}
            disabled={loading || !itemName.trim()}
            className="rounded-[8px] bg-accent px-6 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Ищу…" : "Проверить"}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-[8px] bg-risk-bg px-3 py-3 text-[13px] text-risk">
            Ошибка: {error}
          </div>
        )}

        {result && (
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-[16px] font-semibold">{result.item_name}</h2>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold ${statusTone}`}
              >
                {statusLabel}
                {result.fromCache ? " (кэш)" : ""}
              </span>
            </div>

            {result.source_count > 0 && (
              <div className="mb-5 grid grid-cols-3 gap-3">
                {[
                  { label: "Минимум", value: fmt(result.min_price ?? 0), color: "text-ok" },
                  { label: "Среднее", value: fmt(result.avg_price ?? 0), color: "text-accent" },
                  { label: "Максимум", value: fmt(result.max_price ?? 0), color: "text-risk" },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-[10px] bg-white border border-border px-4 py-3.5 text-center"
                  >
                    <div className="mb-1 text-[11px] text-muted">{card.label}</div>
                    <div className={`num text-[18px] font-bold ${card.color}`}>
                      {card.value} ₽
                    </div>
                  </div>
                ))}
              </div>
            )}

            {result.source_count === 0 && (
              <p className="py-6 text-center text-[13px] text-muted">
                Цены по данной позиции не найдены. Попробуйте уточнить название.
              </p>
            )}

            {result.sources.length > 0 && (
              <div>
                <div className="mb-2 text-[12px] text-muted">
                  Источники ({result.sources.length})
                </div>
                {result.sources.map((s, i) => (
                  <div
                    key={i}
                    className="mb-1.5 flex items-center justify-between rounded-[8px] border border-border bg-white px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] text-accent hover:underline"
                      >
                        {s.site}
                      </a>
                      <div className="mt-0.5 truncate text-[11px] text-muted">
                        {s.title.slice(0, 80)}
                      </div>
                    </div>
                    <div className="num ml-3 whitespace-nowrap text-[15px] font-bold">
                      {fmt(s.price)} ₽
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
