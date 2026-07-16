"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { fmt } from "@/lib/formulas";
import {
  deleteProduct,
  incrementProductUse,
  listProducts,
  saveProducts,
} from "@/lib/store";
import type { Product } from "@/lib/types";

export default function ProductsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[] | null>(null);
  const [query, setQuery] = useState("");
  const [savingFromCalc, setSavingFromCalc] = useState(false);

  const load = useCallback(() => {
    listProducts()
      .then(setProducts)
      .catch((e) => {
        setProducts([]);
        toast(e instanceof Error ? e.message : "Ошибка загрузки базы", "error");
      });
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = (products ?? []).filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase().trim()),
  );

  async function addToCalc(product: Product) {
    try {
      if (product.id) await incrementProductUse(product.id, product.uses_count);
    } catch {
      /* счётчик не критичен */
    }
    const pending = JSON.parse(localStorage.getItem("pendingProduct") || "[]");
    pending.push({
      name: product.name,
      unit: product.unit,
      zakup: product.default_zakup,
      supplier_name: product.supplier_name,
      supplier_inn: product.supplier_inn,
    });
    localStorage.setItem("pendingProduct", JSON.stringify(pending));
    router.push("/");
  }

  async function remove(product: Product) {
    if (!product.id) return;
    if (!window.confirm(`Удалить «${product.name}» из базы?`)) return;
    try {
      await deleteProduct(product.id);
      setProducts((prev) => (prev ?? []).filter((p) => p.id !== product.id));
      toast("Позиция удалена");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка удаления", "error");
    }
  }

  async function saveFromCalc() {
    setSavingFromCalc(true);
    try {
      const raw = localStorage.getItem("currentCalcItems");
      const items = raw ? JSON.parse(raw) : [];
      if (!items.length) {
        toast("В текущем расчёте нет позиций с наименованием", "error");
        return;
      }
      const { saved } = await saveProducts(items);
      toast(saved > 0 ? `Сохранено ${saved} позиций` : "Все позиции уже в базе");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка сохранения", "error");
    } finally {
      setSavingFromCalc(false);
    }
  }

  const th =
    "px-3 py-2 text-[10px] font-semibold uppercase tracking-[.03em] text-muted border-b border-border";
  const td = "px-3 py-2.5 text-[12.5px] border-b border-[#F1ECE3]";

  return (
    <div className="flex-1 overflow-auto bg-bg px-[22px] py-4">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-1 text-[15px] font-bold">База товаров</div>
        <p className="mb-4 text-[11.5px] text-muted">
          Сохранённые позиции с типовым закупом и поставщиком. Добавляйте в расчёт в один
          клик.
        </p>

        {/* Поиск */}
        <div className="mb-3 rounded-[10px] border border-border bg-white px-3.5 py-2.5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Поиск по наименованию…"
            className="w-full border-none bg-transparent text-[13px] outline-none"
          />
        </div>

        {/* Список */}
        {products === null ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[46px] animate-pulse rounded-[10px] border border-border bg-white"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[#DDD4C5] bg-white px-6 py-14 text-center">
            <div className="text-[14px] font-semibold text-ink">
              {query ? "Ничего не найдено" : "База пуста"}
            </div>
            <div className="mt-1 text-[12.5px] text-muted">
              {query
                ? "Измените запрос поиска."
                : "Сохраните позиции из расчёта — они появятся здесь."}
            </div>
          </div>
        ) : (
          <div className="overflow-auto rounded-[12px] border border-border bg-white">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="bg-[#F3EEE4]">
                  <th className={`${th} text-left`}>№</th>
                  <th className={`${th} min-w-[240px] text-left`}>Наименование</th>
                  <th className={`${th} text-left`}>Ед.</th>
                  <th className={`${th} text-right`}>Типовой закуп</th>
                  <th className={`${th} min-w-[180px] text-left`}>Поставщик · ИНН</th>
                  <th className={`${th} text-center`}>Использ.</th>
                  <th className={`${th}`} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id ?? i}>
                    <td className={`${td} text-[#A89F90]`}>{i + 1}</td>
                    <td className={`${td} font-semibold`}>{p.name}</td>
                    <td className={`${td} text-muted`}>{p.unit}</td>
                    <td className={`${td} num text-right font-bold text-money`}>
                      {fmt(p.default_zakup)} ₽
                    </td>
                    <td className={td}>
                      <div>{p.supplier_name || "—"}</div>
                      <div className="num text-[10px] text-muted">
                        {p.supplier_inn || "—"}
                      </div>
                    </td>
                    <td className={`${td} num text-center text-muted`}>
                      ×{p.uses_count ?? 0}
                    </td>
                    <td className={`${td} whitespace-nowrap text-right`}>
                      <button
                        onClick={() => addToCalc(p)}
                        className="mr-1.5 rounded-[8px] bg-accent px-3 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-accent-dark"
                      >
                        + В расчёт
                      </button>
                      <button
                        onClick={() => remove(p)}
                        title="Удалить из базы"
                        className="rounded-[8px] border border-border bg-white px-2 py-1.5 text-[11.5px] font-semibold text-[#A89F90] transition-colors hover:border-risk hover:text-risk"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Сохранение из текущего расчёта */}
        <div className="mt-4 flex items-center gap-3 rounded-[12px] border border-border bg-white px-4 py-3.5">
          <div className="flex-1 text-[12px] text-muted">
            Возьмём позиции из текущего расчёта (вкладка «Расчёт КП») и сохраним в базу без
            дублей.
          </div>
          <button
            onClick={saveFromCalc}
            disabled={savingFromCalc}
            className="shrink-0 rounded-[10px] bg-accent px-4 py-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-60"
          >
            {savingFromCalc ? "Сохранение…" : "Сохранить позиции из расчёта в базу"}
          </button>
        </div>
      </div>
    </div>
  );
}
