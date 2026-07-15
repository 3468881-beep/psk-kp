"use client";

import { fmt, fmtPct, type Totals } from "@/lib/formulas";
import type { Entity } from "@/lib/types";
import { Toggle } from "./ui/Toggle";

type CoeffField = "coeff_psk" | "coeff_kp2" | "coeff_kp3";
type DocField = "customer" | "kp_date" | "kp_no";
type EntitySlot = "psk" | "alt1" | "alt2";
type PdfOpt = "pechat" | "podpis" | "logo";

interface Props {
  coeffPsk: string;
  coeffKp2: string;
  coeffKp3: string;
  onCoeffChange: (field: CoeffField, value: string) => void;
  onApplyCoeff: () => void;

  totals: Totals;

  customer: string;
  kpDate: string;
  kpNo: string;
  onDocChange: (field: DocField, value: string) => void;
  requisites: string;

  entities: Entity[];
  entityPsk: string;
  entityAlt1: string;
  entityAlt2: string;
  onEntityChange: (slot: EntitySlot, code: string) => void;

  optPechat: boolean;
  optPodpis: boolean;
  optLogo: boolean;
  onToggle: (opt: PdfOpt) => void;

  saving: boolean;
  canPdf: boolean;
  onSave: () => void;
  onNew: () => void;
  onPdf: () => void;
}

const sectionTitle =
  "mb-2 text-[11px] font-bold uppercase tracking-[.05em] text-muted";

function VatBadge({ entity }: { entity?: Entity }) {
  if (!entity) return null;
  const usn = entity.tax_mode === "usn";
  const label = usn ? "Без НДС" : `НДС ${entity.vat_rate ?? 22}%`;
  return (
    <span
      className={`ml-2 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        usn ? "bg-[#EFE9DE] text-muted" : "bg-[#EAF1FC] text-accent-dark"
      }`}
    >
      {label}
    </span>
  );
}

function EntitySelect({
  label,
  value,
  entities,
  onChange,
}: {
  label: string;
  value: string;
  entities: Entity[];
  onChange: (code: string) => void;
}) {
  const selected = entities.find((e) => e.code === value);
  return (
    <div>
      <div className="mb-1 flex items-center text-[10.5px] text-muted">
        {label}
        <VatBadge entity={selected} />
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[8px] border border-border bg-white px-2.5 py-2 text-[12px] text-ink outline-none focus:border-accent"
      >
        {entities.map((e) => (
          <option key={e.code} value={e.code}>
            {e.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function QuoteSidebar(p: Props) {
  const coeffInput =
    "w-[62px] rounded-[6px] border bg-white px-2 py-1 text-right text-[12.5px] font-bold tabular-nums outline-none focus:border-accent";

  return (
    <aside className="flex w-[336px] shrink-0 flex-col gap-4 overflow-auto border-l border-border bg-white p-4">
      {/* 1. Коэффициенты */}
      <section>
        <div className={sectionTitle}>Коэффициенты</div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between rounded-[9px] border border-[#DCE8FB] bg-[#EAF1FC] py-[7px] pl-3 pr-2">
            <span className="text-[12.5px] font-semibold text-accent-dark">Коэфф. PSK</span>
            <input
              className={`${coeffInput} border-[#DCE8FB]`}
              type="number"
              step="0.01"
              value={p.coeffPsk}
              onChange={(e) => p.onCoeffChange("coeff_psk", e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="flex flex-1 items-center justify-between rounded-[9px] border border-border bg-[#F8F5EF] py-[7px] pl-3 pr-2">
              <span className="text-[12px] font-semibold text-[#6F685D]">КП&nbsp;2</span>
              <input
                className={`${coeffInput} w-[52px] border-border`}
                type="number"
                step="0.01"
                value={p.coeffKp2}
                onChange={(e) => p.onCoeffChange("coeff_kp2", e.target.value)}
              />
            </div>
            <div className="flex flex-1 items-center justify-between rounded-[9px] border border-border bg-[#F8F5EF] py-[7px] pl-3 pr-2">
              <span className="text-[12px] font-semibold text-[#6F685D]">КП&nbsp;3</span>
              <input
                className={`${coeffInput} w-[52px] border-border`}
                type="number"
                step="0.01"
                value={p.coeffKp3}
                onChange={(e) => p.onCoeffChange("coeff_kp3", e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={p.onApplyCoeff}
            className="rounded-[8px] border border-[#DCE8FB] bg-white py-[7px] text-[11.5px] font-semibold text-accent-dark transition-colors hover:bg-[#EAF1FC]"
          >
            Применить наценку ко всем строкам
          </button>
          <div className="text-[10.5px] leading-snug text-[#A89F90]">
            Цена PSK = (Закупка + Доставка) × (1 + Наценка). Альт 1/2 = Цена PSK × КП&nbsp;2 / КП&nbsp;3.
          </div>
        </div>
      </section>

      {/* 2. Себестоимость */}
      <section className="rounded-[11px] border border-[#EBDCBE] bg-sand p-3.5 text-money">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[.05em]">
          Себестоимость · решение по наценке
        </div>
        <Row label="Σ Закупка (без доставки)" value={`${fmt(p.totals.totalZakup)} ₽`} />
        <Row label="Σ Доставка (нам)" value={`${fmt(p.totals.totalDost)} ₽`} />
        <div className="mt-1.5 flex justify-between border-t border-dashed border-[#E0CFA8] pt-1.5">
          <span className="text-[12.5px] font-bold">Σ Реальный закуп</span>
          <span className="num text-[14px] font-extrabold">{fmt(p.totals.totalReal)} ₽</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-[#EBDCBE] pt-2">
          <div>
            <div className="text-[10.5px] text-muted">Средняя наценка</div>
            <div className="num text-[16px] font-extrabold text-ink">
              {fmtPct(p.totals.avgMarkup)}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10.5px] text-muted">Прибыль</div>
            <div className="num text-[16px] font-extrabold text-ok">
              {fmt(p.totals.profit)} ₽
            </div>
          </div>
        </div>
      </section>

      {/* 3. Документ */}
      <section>
        <div className={sectionTitle}>Документ</div>
        <div className="flex flex-col gap-2">
          <Field label="Заказчик">
            <input
              className="w-full rounded-[8px] border border-border bg-white px-2.5 py-1.5 text-[12px] outline-none focus:border-accent"
              value={p.customer}
              onChange={(e) => p.onDocChange("customer", e.target.value)}
            />
          </Field>
          <div className="flex gap-2">
            <Field label="Дата КП" className="flex-1">
              <input
                type="date"
                className="num w-full rounded-[8px] border border-border bg-white px-2.5 py-1.5 text-[12px] outline-none focus:border-accent"
                value={p.kpDate}
                onChange={(e) => p.onDocChange("kp_date", e.target.value)}
              />
            </Field>
            <Field label="№ КП" className="flex-1">
              <input
                className="num w-full rounded-[8px] border border-border bg-white px-2.5 py-1.5 text-[12px] outline-none focus:border-accent"
                value={p.kpNo}
                onChange={(e) => p.onDocChange("kp_no", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Реквизиты">
            <div className="rounded-[8px] border border-border bg-[#FBFAF7] px-2.5 py-2 text-[11px] leading-snug text-[#6F685D]">
              {p.requisites || "Реквизиты юрлица не заполнены"}
            </div>
          </Field>
        </div>
      </section>

      {/* 4. Юрлица КП */}
      <section>
        <div className={sectionTitle}>Юрлица КП</div>
        <div className="flex flex-col gap-2">
          <EntitySelect
            label="КП PSK"
            value={p.entityPsk}
            entities={p.entities}
            onChange={(c) => p.onEntityChange("psk", c)}
          />
          <EntitySelect
            label="Альтернатива 1"
            value={p.entityAlt1}
            entities={p.entities}
            onChange={(c) => p.onEntityChange("alt1", c)}
          />
          <EntitySelect
            label="Альтернатива 2"
            value={p.entityAlt2}
            entities={p.entities}
            onChange={(c) => p.onEntityChange("alt2", c)}
          />
        </div>
      </section>

      {/* 5. Оформление PDF */}
      <section>
        <div className={sectionTitle}>Оформление PDF</div>
        <div className="flex flex-wrap gap-2">
          <Toggle label="Печать" on={p.optPechat} onToggle={() => p.onToggle("pechat")} />
          <Toggle label="Подпись" on={p.optPodpis} onToggle={() => p.onToggle("podpis")} />
          <Toggle label="Логотип" on={p.optLogo} onToggle={() => p.onToggle("logo")} />
        </div>
      </section>

      {/* 6. Итоги */}
      <section className="rounded-[11px] bg-[#F3EEE4] p-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[12px] font-semibold text-accent-dark">Σ КП PSK</span>
          <span className="num text-[15px] font-extrabold text-accent-dark">
            {fmt(p.totals.totalPsk)} ₽
          </span>
        </div>
        <Row label="Σ Альтернатива 1" value={`${fmt(p.totals.totalAlt1)} ₽`} muted />
        <Row label="Σ Альтернатива 2" value={`${fmt(p.totals.totalAlt2)} ₽`} muted />
      </section>

      {/* 7. Кнопки */}
      <section className="flex flex-col gap-2">
        <button
          onClick={p.onSave}
          disabled={p.saving}
          className="rounded-[10px] bg-accent px-4 py-3 text-[13px] font-bold text-white shadow-[0_4px_10px_rgba(42,111,219,.25)] transition-colors hover:bg-accent-dark disabled:opacity-60"
        >
          {p.saving ? "Сохранение…" : "Сохранить расчёт"}
        </button>
        <button
          onClick={p.onPdf}
          disabled={!p.canPdf}
          title={p.canPdf ? undefined : "Сначала сохраните расчёт"}
          className="rounded-[10px] border border-border bg-white px-4 py-2.5 text-[12.5px] font-semibold text-[#6F685D] transition-colors hover:bg-[#FBFAF7] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
        >
          📄 Сформировать 3 PDF
        </button>
        {!p.canPdf && (
          <div className="-mt-1 text-center text-[10.5px] text-[#A89F90]">
            Кнопка активна после сохранения расчёта
          </div>
        )}
        <button
          onClick={p.onNew}
          className="rounded-[10px] border border-border bg-white px-4 py-2 text-[11.5px] font-semibold text-[#6F685D] transition-colors hover:bg-[#FBFAF7]"
        >
          Новый расчёт
        </button>
      </section>
    </aside>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="mb-1 flex justify-between">
      <span className={`text-[${muted ? "11.5" : "12"}px] text-[#6F685D]`}>{label}</span>
      <span
        className={`num font-semibold ${muted ? "text-[12.5px] text-[#6F685D]" : "text-[12.5px]"}`}
      >
        {value}
      </span>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1 text-[10.5px] text-muted">{label}</div>
      {children}
    </div>
  );
}
