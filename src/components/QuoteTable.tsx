"use client";

import { QuoteTableRow } from "./QuoteTableRow";
import { calcRow, calcTotals, fmt, fmtPct } from "@/lib/formulas";
import type { RowState } from "@/lib/types";

interface Props {
  rows: RowState[];
  coeffKp2: number;
  coeffKp3: number;
  onField: (id: string, field: keyof RowState, value: string) => void;
  onDelete: (id: string) => void;
  onAddRow: () => void;
}

const th =
  "px-2 py-2 text-[10px] font-semibold uppercase tracking-[.03em] text-muted border-b border-border";

export function QuoteTable({
  rows,
  coeffKp2,
  coeffKp3,
  onField,
  onDelete,
  onAddRow,
}: Props) {
  const totals = calcTotals(rows, coeffKp2, coeffKp3);

  return (
    <div className="overflow-auto rounded-[12px] border border-border bg-white">
      <table className="w-full min-w-[1120px] border-collapse">
        <thead>
          <tr className="bg-[#F3EEE4]">
            <th className={`${th} text-left`}>№</th>
            <th className={`${th} min-w-[230px] text-left`}>Наименование</th>
            <th className={`${th} text-right`}>Кол</th>
            <th className={`${th} text-left`}>Ед.</th>
            <th className={`${th} bg-sand text-right text-money`}>Закупка</th>
            <th className={`${th} bg-sand text-right text-money`}>Доставка</th>
            <th className={`${th} bg-sand-dark text-right font-bold text-money`}>
              Закуп+дост
            </th>
            <th className={`${th} text-right`}>Нац.&nbsp;%</th>
            <th className={`${th} bg-blue-50 text-right font-bold text-accent-dark`}>
              Цена&nbsp;PSK
            </th>
            <th className={`${th} text-right`}>Альт&nbsp;1</th>
            <th className={`${th} text-right`}>Альт&nbsp;2</th>
            <th className={`${th} text-right`}>Сумма</th>
            <th className={`${th} min-w-[180px] text-left`}>Поставщик · ИНН</th>
            <th className={`${th}`} />
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={14} className="px-4 py-14 text-center">
                <div className="text-[14px] font-semibold text-ink">
                  Добавьте первую позицию
                </div>
                <div className="mt-1 text-[12.5px] text-muted">
                  Таблица пуста — начните с одной строки расчёта.
                </div>
                <button
                  onClick={onAddRow}
                  className="mt-4 rounded-[10px] bg-accent px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_10px_rgba(42,111,219,.25)] transition-colors hover:bg-accent-dark"
                >
                  + Добавить строку
                </button>
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <QuoteTableRow
                key={row.id}
                index={i + 1}
                row={row}
                calc={calcRow(row, coeffKp2, coeffKp3)}
                onField={onField}
                onDelete={onDelete}
              />
            ))
          )}
        </tbody>

        {rows.length > 0 && (
          <tfoot>
            <tr className="bg-[#F3EEE4]">
              <td colSpan={4} className="px-2 py-2.5 text-[11.5px] font-semibold text-[#6F685D]">
                Итого
              </td>
              <td className="num bg-sand-dark px-1.5 py-2.5 text-right text-[12px] font-bold text-money">
                {fmt(totals.totalZakup)}
              </td>
              <td className="num bg-sand-dark px-1.5 py-2.5 text-right text-[12px] font-bold text-money">
                {fmt(totals.totalDost)}
              </td>
              <td className="num bg-[#F1E4C8] px-2 py-2.5 text-right text-[12.5px] font-extrabold text-money">
                {fmt(totals.totalReal)}
              </td>
              <td className="num px-1.5 py-2.5 text-right text-[11.5px] font-bold text-muted">
                {fmtPct(totals.avgMarkup)}%
              </td>
              <td className="num bg-[#E3EEFC] px-2 py-2.5 text-right text-[12.5px] font-extrabold text-accent-dark">
                {fmt(totals.totalPsk)}
              </td>
              <td colSpan={2} />
              <td className="num px-2 py-2.5 text-right text-[12.5px] font-extrabold text-accent-dark">
                {fmt(totals.totalPsk)}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        )}
      </table>

      {rows.length > 0 && (
        <div className="flex items-center gap-2 border-t border-border bg-[#FBFAF7] px-3.5 py-2.5">
          <button
            onClick={onAddRow}
            className="rounded-[9px] border border-dashed border-[#C9BEA9] bg-white px-3.5 py-[7px] text-[12px] font-semibold text-[#6F685D] transition-colors hover:bg-[#FCFBF8]"
          >
            + Добавить строку
          </button>
        </div>
      )}
    </div>
  );
}
