"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "./ui/Badge";
import { fmt, fmtPct, num } from "@/lib/formulas";
import { getQuoteWithItems } from "@/lib/store";
import type { Quote, QuoteItem } from "@/lib/types";

const th =
  "px-3 py-2 text-left text-[10px] font-semibold uppercase text-muted border-b border-[#F1ECE3]";
const td = "px-3 py-2 text-[12px] border-b border-[#F6F1E9]";

export function ArchiveCard({ quote }: { quote: Quote }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<QuoteItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && items === null && quote.id) {
      setLoading(true);
      try {
        const { items } = await getQuoteWithItems(quote.id);
        setItems(items);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div
      className={`overflow-hidden rounded-[12px] border bg-white ${
        open ? "border-[#C7DBF7] shadow-[0_2px_8px_rgba(42,111,219,.08)]" : "border-border"
      }`}
    >
      <div
        onClick={toggle}
        className={`flex cursor-pointer items-center justify-between px-4 py-3.5 ${
          open ? "border-b border-[#DCE8FB] bg-[#F4F8FE]" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`text-[14px] ${open ? "text-accent" : "text-[#A89F90]"}`}>
            {open ? "⌄" : "›"}
          </span>
          <div>
            <div className="flex items-center gap-2 text-[13.5px] font-bold">
              КП № {quote.kp_no || "—"} · {quote.customer || "без заказчика"}
              <StatusBadge status={quote.status} />
            </div>
            <div className="mt-px text-[11px] text-muted">
              {quote.kp_date} · средняя наценка {fmtPct(num(quote.avg_markup))}%
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="text-[10px] text-muted">Реальный закуп</div>
            <div className="num text-[13px] font-bold text-money">
              {fmt(num(quote.total_real))} ₽
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted">Σ КП PSK</div>
            <div className="num text-[13px] font-bold text-accent-dark">
              {fmt(num(quote.total_psk))} ₽
            </div>
          </div>
        </div>
      </div>

      {open && (
        <>
          {loading ? (
            <div className="px-4 py-6 text-center text-[12px] text-muted">Загрузка позиций…</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#FBFAF7]">
                  <th className={th}>№</th>
                  <th className={th}>Товар</th>
                  <th className={`${th} text-right`}>Кол</th>
                  <th className={th}>Ед.</th>
                  <th className={`${th} text-right`}>Закуп+дост</th>
                  <th className={`${th} text-right`}>Нац.</th>
                  <th className={`${th} text-right`}>Цена PSK</th>
                  <th className={`${th} text-right`}>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {(items ?? []).map((it, i) => (
                  <tr key={it.id ?? i}>
                    <td className={`${td} text-[#A89F90]`}>{it.position ?? i + 1}</td>
                    <td className={`${td} font-medium`}>{it.name || "—"}</td>
                    <td className={`${td} num text-right`}>{it.qty}</td>
                    <td className={td}>{it.unit}</td>
                    <td className={`${td} num text-right text-money`}>
                      {fmt(num(it.zakup) + num(it.dostavka))}
                    </td>
                    <td className={`${td} num text-right text-muted`}>{fmtPct(num(it.markup))}%</td>
                    <td className={`${td} num text-right font-semibold text-accent-dark`}>
                      {fmt(num(it.price_psk))}
                    </td>
                    <td className={`${td} num text-right font-semibold`}>
                      {fmt(num(it.summa))}
                    </td>
                  </tr>
                ))}
                {items && items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-4 text-center text-[12px] text-muted">
                      В расчёте нет позиций.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          <div className="flex gap-2 border-t border-[#F1ECE3] bg-[#FBFAF7] px-3.5 py-3">
            <button
              onClick={() => router.push(`/?load=${quote.id}`)}
              className="rounded-[8px] border border-[#DCE8FB] bg-white px-3 py-[7px] text-[11.5px] font-semibold text-accent transition-colors hover:bg-[#F4F8FE]"
            >
              Открыть в расчёте
            </button>
          </div>
        </>
      )}
    </div>
  );
}
