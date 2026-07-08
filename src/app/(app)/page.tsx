"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { QuoteTable } from "@/components/QuoteTable";
import { QuoteSidebar } from "@/components/QuoteSidebar";
import { useToast } from "@/components/ui/Toast";
import {
  calcRow,
  calcTotals,
  defaultMarkup,
  num,
} from "@/lib/formulas";
import {
  getEntities,
  getQuoteWithItems,
  saveQuote,
} from "@/lib/store";
import type { Entity, Quote, QuoteItem, RowState } from "@/lib/types";

const TODAY = "2026-07-07";

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "row-" + Math.random().toString(36).slice(2);
}

function emptyRow(coeffPsk: string): RowState {
  return {
    id: newId(),
    name: "",
    category: "",
    unit: "шт",
    qty: "1",
    zakup: "0",
    dostavka: "0",
    markup: String(defaultMarkup(num(coeffPsk))),
    supplier_name: "",
    supplier_inn: "",
  };
}

function CalcScreen() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const loadId = searchParams.get("load");

  const [rows, setRows] = useState<RowState[]>([]);
  const [coeffPsk, setCoeffPsk] = useState("1.30");
  const [coeffKp2, setCoeffKp2] = useState("1.08");
  const [coeffKp3, setCoeffKp3] = useState("1.16");

  const [customer, setCustomer] = useState("");
  const [kpDate, setKpDate] = useState(TODAY);
  const [kpNo, setKpNo] = useState("");

  const [entities, setEntities] = useState<Entity[]>([]);
  const [entityPsk, setEntityPsk] = useState("ip");
  const [entityAlt1, setEntityAlt1] = useState("tehnoprodukt");
  const [entityAlt2, setEntityAlt2] = useState("ata");

  const [optPechat, setOptPechat] = useState(false);
  const [optPodpis, setOptPodpis] = useState(false);
  const [optLogo, setOptLogo] = useState(false);

  const [quoteId, setQuoteId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  // Load юрлица once.
  useEffect(() => {
    getEntities()
      .then(setEntities)
      .catch(() => toast("Не удалось загрузить юрлица", "error"));
  }, [toast]);

  // Restore a saved quote when navigated with ?load=<id>.
  useEffect(() => {
    if (!loadId) return;
    getQuoteWithItems(loadId)
      .then(({ quote, items }) => {
        applyQuote(quote, items);
        toast("Расчёт загружен в таблицу");
      })
      .catch((e) => toast(e instanceof Error ? e.message : "Ошибка загрузки", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadId]);

  function applyQuote(quote: Quote, items: QuoteItem[]) {
    setQuoteId(quote.id);
    setCoeffPsk(String(quote.coeff_psk));
    setCoeffKp2(String(quote.coeff_kp2));
    setCoeffKp3(String(quote.coeff_kp3));
    setCustomer(quote.customer ?? "");
    setKpDate(quote.kp_date ?? TODAY);
    setKpNo(quote.kp_no ?? "");
    setEntityPsk(quote.entity_psk ?? "ip");
    setEntityAlt1(quote.entity_alt1 ?? "tehnoprodukt");
    setEntityAlt2(quote.entity_alt2 ?? "ata");
    setOptPechat(!!quote.opt_pechat);
    setOptPodpis(!!quote.opt_podpis);
    setOptLogo(!!quote.opt_logo);
    setRows(
      items
        .sort((a, b) => a.position - b.position)
        .map((it) => ({
          id: it.id ?? newId(),
          name: it.name ?? "",
          category: it.category ?? "",
          unit: it.unit ?? "шт",
          qty: String(it.qty ?? 1),
          zakup: String(it.zakup ?? 0),
          dostavka: String(it.dostavka ?? 0),
          markup: String(it.markup ?? 0),
          supplier_name: it.supplier_name ?? "",
          supplier_inn: it.supplier_inn ?? "",
        })),
    );
  }

  const onField = useCallback(
    (id: string, field: keyof RowState, value: string) => {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    },
    [],
  );

  const onAddRow = useCallback(() => {
    setRows((prev) => [...prev, emptyRow(coeffPsk)]);
  }, [coeffPsk]);

  const onDelete = useCallback((id: string) => {
    setRows((prev) => {
      const row = prev.find((r) => r.id === id);
      const notEmpty =
        row && (row.name || num(row.zakup) || num(row.dostavka) || row.supplier_name);
      if (notEmpty && !window.confirm("Удалить позицию из расчёта?")) return prev;
      return prev.filter((r) => r.id !== id);
    });
  }, []);

  function onCoeffChange(field: "coeff_psk" | "coeff_kp2" | "coeff_kp3", value: string) {
    if (field === "coeff_psk") setCoeffPsk(value);
    else if (field === "coeff_kp2") setCoeffKp2(value);
    else setCoeffKp3(value);
  }

  function onApplyCoeff() {
    const m = String(defaultMarkup(num(coeffPsk)));
    setRows((prev) => prev.map((r) => ({ ...r, markup: m })));
    toast("Наценка применена ко всем строкам");
  }

  function onDocChange(field: "customer" | "kp_date" | "kp_no", value: string) {
    if (field === "customer") setCustomer(value);
    else if (field === "kp_date") setKpDate(value);
    else setKpNo(value);
  }

  function onEntityChange(slot: "psk" | "alt1" | "alt2", code: string) {
    if (slot === "psk") setEntityPsk(code);
    else if (slot === "alt1") setEntityAlt1(code);
    else setEntityAlt2(code);
  }

  function onToggle(opt: "pechat" | "podpis" | "logo") {
    if (opt === "pechat") setOptPechat((v) => !v);
    else if (opt === "podpis") setOptPodpis((v) => !v);
    else setOptLogo((v) => !v);
  }

  function onNew() {
    setRows([]);
    setQuoteId(undefined);
    setCustomer("");
    setKpNo("");
    setKpDate(TODAY);
    setOptPechat(false);
    setOptPodpis(false);
    setOptLogo(false);
    toast("Новый расчёт");
  }

  async function onSave() {
    if (rows.length === 0) {
      toast("Добавьте хотя бы одну позицию", "error");
      return;
    }
    setSaving(true);
    const kp2 = num(coeffKp2);
    const kp3 = num(coeffKp3);
    const totals = calcTotals(rows, kp2, kp3);
    const items: QuoteItem[] = rows.map((r, i) => {
      const c = calcRow(r, kp2, kp3);
      return {
        position: i + 1,
        name: r.name,
        category: r.category,
        unit: r.unit,
        qty: num(r.qty),
        zakup: num(r.zakup),
        dostavka: num(r.dostavka),
        markup: num(r.markup),
        supplier_name: r.supplier_name,
        supplier_inn: r.supplier_inn,
        price_psk: c.pricePsk,
        price_alt1: c.priceAlt1,
        price_alt2: c.priceAlt2,
        summa: c.summa,
      };
    });
    const quote: Quote = {
      id: quoteId,
      kp_no: kpNo,
      customer,
      kp_date: kpDate,
      requisites,
      coeff_psk: num(coeffPsk),
      coeff_kp2: kp2,
      coeff_kp3: kp3,
      entity_psk: entityPsk,
      entity_alt1: entityAlt1,
      entity_alt2: entityAlt2,
      opt_pechat: optPechat,
      opt_podpis: optPodpis,
      opt_logo: optLogo,
      status: "saved",
      total_real: totals.totalReal,
      total_psk: totals.totalPsk,
      avg_markup: totals.avgMarkup,
    };

    const res = await saveQuote(quote, items);
    setSaving(false);
    if (res.error) {
      toast(`Ошибка сохранения: ${res.error}`, "error");
      return;
    }
    setQuoteId(res.id);
    toast("Расчёт сохранён");
  }

  const kp2 = num(coeffKp2);
  const kp3 = num(coeffKp3);
  const totals = calcTotals(rows, kp2, kp3);
  const requisites = entities.find((e) => e.code === entityPsk)?.requisites ?? "";

  const checkedSuppliers = rows.filter((r) => r.supplier_name).length;

  return (
    <div className="flex min-h-0 flex-1 bg-bg">
      {/* Left: table */}
      <div className="min-w-0 flex-1 overflow-auto p-[18px]">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[13px] text-[#6F685D]">
            <b className="text-ink">{rows.length}</b> позиций · поставщик выбран{" "}
            <b className="text-ink">
              {checkedSuppliers}/{rows.length}
            </b>
          </div>
          {kpNo || customer ? (
            <div className="text-[12px] text-muted">
              КП № {kpNo || "—"} · {customer || "без заказчика"}
            </div>
          ) : null}
        </div>

        <QuoteTable
          rows={rows}
          coeffKp2={kp2}
          coeffKp3={kp3}
          onField={onField}
          onDelete={onDelete}
          onAddRow={onAddRow}
        />
      </div>

      {/* Right: settings */}
      <QuoteSidebar
        coeffPsk={coeffPsk}
        coeffKp2={coeffKp2}
        coeffKp3={coeffKp3}
        onCoeffChange={onCoeffChange}
        onApplyCoeff={onApplyCoeff}
        totals={totals}
        customer={customer}
        kpDate={kpDate}
        kpNo={kpNo}
        onDocChange={onDocChange}
        requisites={requisites}
        entities={entities}
        entityPsk={entityPsk}
        entityAlt1={entityAlt1}
        entityAlt2={entityAlt2}
        onEntityChange={onEntityChange}
        optPechat={optPechat}
        optPodpis={optPodpis}
        optLogo={optLogo}
        onToggle={onToggle}
        saving={saving}
        onSave={onSave}
        onNew={onNew}
        onPdf={() => toast("Генерация PDF появится в Шаге 2")}
      />
    </div>
  );
}

export default function CalcPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-bg" />}>
      <CalcScreen />
    </Suspense>
  );
}
