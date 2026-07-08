"use client";

import { useEffect, useState } from "react";
import { ArchiveCard } from "@/components/ArchiveCard";
import { useToast } from "@/components/ui/Toast";
import { listQuotes } from "@/lib/store";
import type { Quote } from "@/lib/types";

export default function ArchivePage() {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[] | null>(null);

  useEffect(() => {
    listQuotes()
      .then(setQuotes)
      .catch((e) => {
        setQuotes([]);
        toast(e instanceof Error ? e.message : "Ошибка загрузки архива", "error");
      });
  }, [toast]);

  return (
    <div className="flex-1 overflow-auto bg-bg px-[22px] py-4">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-1 text-[15px] font-bold">Архив КП</div>
        <div className="mb-4 text-[11.5px] text-muted">
          Все расчёты команды. Раскройте карточку, чтобы увидеть состав позиций, наценку и
          поставщиков. «Открыть в расчёте» — вернуть расчёт в таблицу.
        </div>

        {quotes === null ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[64px] animate-pulse rounded-[12px] border border-border bg-white"
              />
            ))}
          </div>
        ) : quotes.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[#DDD4C5] bg-white px-6 py-14 text-center">
            <div className="text-[14px] font-semibold text-ink">Архив пуст</div>
            <div className="mt-1 text-[12.5px] text-muted">
              Сохраните расчёт на вкладке «Расчёт КП» — он появится здесь.
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {quotes.map((q) => (
              <ArchiveCard key={q.id} quote={q} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
