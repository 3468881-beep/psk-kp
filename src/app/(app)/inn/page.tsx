"use client";

import { useState } from "react";

interface Supplier {
  inn: string;
  name: string;
  full_name: string;
  kpp: string;
  ogrn: string;
  registered_at: string;
  manager_name: string;
  status: string;
  msp: boolean;
  okved: string;
  address: string;
  tax_debt: number;
  reliability_score: number;
  verdict: string;
  checks: Record<string, string>;
  fromCache?: boolean;
}

const statusLabels: Record<string, string> = {
  active: "Действующая",
  liquidating: "Ликвидация",
  liquidated: "Ликвидирована",
  bankrupt: "Банкрот",
  reorganizing: "Реорганизация",
};

export default function InnPage() {
  const [inn, setInn] = useState("");
  const [loading, setLoading] = useState(false);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [error, setError] = useState("");

  async function check() {
    if (inn.length < 10) return;
    setLoading(true);
    setError("");
    setSupplier(null);
    try {
      const res = await fetch("/api/supplier/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inn: inn.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ошибка проверки");
      setSupplier(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка проверки");
    } finally {
      setLoading(false);
    }
  }

  const scoreColor = supplier
    ? supplier.reliability_score >= 70
      ? "text-ok"
      : supplier.reliability_score >= 40
        ? "text-warn"
        : "text-risk"
    : "text-muted";

  return (
    <div className="flex-1 overflow-auto bg-bg px-[22px] py-6">
      <div className="mx-auto max-w-[720px]">
        <h1 className="mb-1 text-[20px] font-bold">Проверка поставщика по ИНН</h1>
        <p className="mb-5 text-[12.5px] text-muted">
          Данные из DaData / ФНС: статус, возраст, задолженность, МСП, ОКВЭД — и скоринг
          надёжности 0–100.
        </p>

        <div className="mb-6 flex gap-2">
          <input
            value={inn}
            onChange={(e) => setInn(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && check()}
            placeholder="Введите ИНН (10 или 12 цифр)…"
            maxLength={12}
            inputMode="numeric"
            className="num flex-1 rounded-[8px] border border-border bg-white px-3.5 py-2.5 text-[14px] tracking-wide outline-none focus:border-accent focus:shadow-[0_0_0_2px_rgba(42,111,219,.12)]"
          />
          <button
            onClick={check}
            disabled={loading || inn.length < 10}
            className="rounded-[8px] bg-accent px-6 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Проверяю…" : "Проверить"}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-[8px] bg-risk-bg px-3 py-3 text-[13px] text-risk">
            Ошибка: {error}
          </div>
        )}

        {supplier && (
          <div>
            {/* Шапка: имя + скоринг */}
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-1 text-[18px] font-bold">{supplier.name}</div>
                <div className="text-[12px] text-muted">
                  {statusLabels[supplier.status] ?? supplier.status}
                  {supplier.fromCache ? " · из кэша" : ""}
                </div>
              </div>
              <div className="min-w-[90px] text-center">
                <div className={`num text-[36px] font-extrabold leading-none ${scoreColor}`}>
                  {supplier.reliability_score}
                </div>
                <div className={`mt-1 text-[11px] font-semibold ${scoreColor}`}>
                  {supplier.verdict}
                </div>
              </div>
            </div>

            {/* Реквизиты */}
            <div className="mb-4 rounded-[10px] border border-border bg-white p-4 text-[13px]">
              {(
                [
                  ["ИНН", supplier.inn],
                  ["КПП", supplier.kpp],
                  ["ОГРН", supplier.ogrn],
                  ["Руководитель", supplier.manager_name],
                  ["ОКВЭД", supplier.okved],
                  ["Зарегистрирована", supplier.registered_at],
                  ["Адрес", supplier.address],
                ] as const
              )
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label} className="mb-1.5 flex gap-3">
                    <span className="min-w-[130px] text-muted">{label}</span>
                    <span className="text-ink">{value}</span>
                  </div>
                ))}
            </div>

            {/* Чеклист проверок */}
            <div className="text-[13px]">
              <div className="mb-2 font-semibold">Проверки:</div>
              {Object.entries(supplier.checks).map(([key, value]) => (
                <div
                  key={key}
                  className="mb-1.5 rounded-[6px] border border-border bg-white px-3 py-2 text-ink"
                >
                  {value}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
