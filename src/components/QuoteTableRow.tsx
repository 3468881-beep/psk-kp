"use client";

import { fmt, type RowCalc } from "@/lib/formulas";
import type { RowState } from "@/lib/types";

interface Props {
  index: number;
  row: RowState;
  calc: RowCalc;
  onField: (id: string, field: keyof RowState, value: string) => void;
  onDelete: (id: string) => void;
}

export function QuoteTableRow({ index, row, calc, onField, onDelete }: Props) {
  const set = (field: keyof RowState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onField(row.id, field, e.target.value);

  return (
    <tr className="border-b border-[#F1ECE3]">
      <td className="px-2 py-1.5 text-[12px] text-[#A89F90]">{index}</td>

      {/* Наименование + категория */}
      <td className="px-2 py-1.5">
        <input
          className="cellinput font-semibold"
          value={row.name}
          onChange={set("name")}
          placeholder="Наименование позиции"
        />
        <input
          className="cellinput mt-0.5 text-[10px] text-muted"
          value={row.category}
          onChange={set("category")}
          placeholder="Категория"
        />
      </td>

      {/* Кол / Ед */}
      <td className="px-1 py-1.5">
        <input
          className="cellinput tnum w-[46px]"
          inputMode="decimal"
          value={row.qty}
          onChange={set("qty")}
        />
      </td>
      <td className="px-1 py-1.5">
        <input className="cellinput w-[48px]" value={row.unit} onChange={set("unit")} />
      </td>

      {/* Закупка / Доставка (bg-sand) — принимают дробные (копейки) */}
      <td className="bg-sand px-1 py-1.5">
        <input
          className="cellinput tnum w-[74px]"
          inputMode="decimal"
          step="0.01"
          value={row.zakup}
          onChange={set("zakup")}
        />
      </td>
      <td className="bg-sand px-1 py-1.5">
        <input
          className="cellinput tnum w-[62px]"
          inputMode="decimal"
          step="0.01"
          value={row.dostavka}
          onChange={set("dostavka")}
        />
      </td>

      {/* Закуп+дост (computed, bg-sand-dark) */}
      <td className="num bg-sand-dark px-2 py-1.5 text-right text-[12.5px] font-bold text-money">
        {fmt(calc.realZakup)}
      </td>

      {/* Наценка % */}
      <td className="px-1 py-1.5">
        <input
          className="cellinput tnum w-[44px] text-muted"
          inputMode="decimal"
          step="0.01"
          value={row.markup}
          onChange={set("markup")}
        />
      </td>

      {/* Цена PSK (computed, bg-blue-50) */}
      <td className="num bg-blue-50 px-2 py-1.5 text-right text-[12.5px] font-bold text-accent-dark">
        {fmt(calc.pricePsk)}
      </td>

      {/* Альт 1 / Альт 2 (computed) */}
      <td className="num px-1.5 py-1.5 text-right text-[12px] text-[#6F685D]">
        {fmt(calc.priceAlt1)}
      </td>
      <td className="num px-1.5 py-1.5 text-right text-[12px] text-[#6F685D]">
        {fmt(calc.priceAlt2)}
      </td>

      {/* Сумма (computed) */}
      <td className="num px-2 py-1.5 text-right text-[12.5px] font-semibold">
        {fmt(calc.summa)}
      </td>

      {/* Поставщик + ИНН */}
      <td className="px-2 py-1.5">
        <input
          className="cellinput text-[11.5px] font-semibold"
          value={row.supplier_name}
          onChange={set("supplier_name")}
          placeholder="Выбрать поставщика…"
        />
        <div className="flex items-center gap-1.5 px-1.5 text-[9.5px] text-muted">
          ИНН
          <input
            className="cellinput num w-[90px] px-1 py-0.5 text-[9.5px]"
            value={row.supplier_inn}
            onChange={set("supplier_inn")}
            placeholder="—"
          />
        </div>
      </td>

      {/* Delete */}
      <td className="px-1.5 py-1.5 text-center">
        <button
          onClick={() => onDelete(row.id)}
          title="Удалить"
          className="p-1 text-[15px] leading-none text-[#C9BEA9] transition-colors hover:text-risk"
        >
          ×
        </button>
      </td>
    </tr>
  );
}
