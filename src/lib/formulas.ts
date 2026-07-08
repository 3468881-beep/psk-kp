import type { RowState } from "./types";

// Parse a possibly comma-decimal string into a number (0 on failure).
export const num = (v: unknown): number => {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return isNaN(n) ? 0 : n;
};

// Russian-formatted money with thousands separators and 2 decimals (kopecks).
export const fmt = (n: number): string =>
  (n || 0).toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Russian-formatted percentage value with 2 decimals (no % sign).
export const fmtPct = (n: number): string =>
  (n || 0).toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export interface RowCalc {
  realZakup: number;
  pricePsk: number;
  priceAlt1: number;
  priceAlt2: number;
  summa: number;
}

// Per-unit / per-row math. Mirrors the spec exactly:
//   realZakup = zakup + dostavka
//   pricePsk  = realZakup * (1 + markup/100)
//   priceAlt1 = pricePsk * coeffKp2
//   priceAlt2 = pricePsk * coeffKp3
//   summa     = pricePsk * qty
export function calcRow(
  r: Pick<RowState, "zakup" | "dostavka" | "markup" | "qty">,
  coeffKp2: number,
  coeffKp3: number,
): RowCalc {
  const zakup = num(r.zakup);
  const dostavka = num(r.dostavka);
  const markup = num(r.markup);
  const qty = num(r.qty);

  const realZakup = zakup + dostavka;
  const pricePsk = realZakup * (1 + markup / 100);
  const priceAlt1 = pricePsk * coeffKp2;
  const priceAlt2 = pricePsk * coeffKp3;
  const summa = pricePsk * qty;
  return { realZakup, pricePsk, priceAlt1, priceAlt2, summa };
}

export interface Totals {
  totalZakup: number;
  totalDost: number;
  totalReal: number;
  totalPsk: number;
  totalAlt1: number;
  totalAlt2: number;
  avgMarkup: number;
  profit: number;
}

export function calcTotals(
  rows: RowState[],
  coeffKp2: number,
  coeffKp3: number,
): Totals {
  let totalZakup = 0;
  let totalDost = 0;
  let totalReal = 0;
  let totalPsk = 0;
  let totalAlt1 = 0;
  let totalAlt2 = 0;

  for (const r of rows) {
    const qty = num(r.qty);
    const c = calcRow(r, coeffKp2, coeffKp3);
    totalZakup += num(r.zakup) * qty;
    totalDost += num(r.dostavka) * qty;
    totalReal += c.realZakup * qty;
    totalPsk += c.summa;
    totalAlt1 += c.priceAlt1 * qty;
    totalAlt2 += c.priceAlt2 * qty;
  }

  const avgMarkup = totalReal > 0 ? (totalPsk / totalReal - 1) * 100 : 0;
  const profit = totalPsk - totalReal;

  return {
    totalZakup,
    totalDost,
    totalReal,
    totalPsk,
    totalAlt1,
    totalAlt2,
    avgMarkup,
    profit,
  };
}

// Default markup (%) for a new row, derived from the PSK coefficient.
export const defaultMarkup = (coeffPsk: number): number =>
  Math.round((coeffPsk - 1) * 100);
