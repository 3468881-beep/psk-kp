export type TaxMode = "usn" | "osn";

export interface Entity {
  code: string; // 'ip' | 'tehnoprodukt' | 'ata'
  name: string;
  full_name?: string | null;
  inn?: string | null;
  kpp?: string | null;
  ogrn?: string | null;
  tax_mode: TaxMode;
  vat_rate: number; // 0 for УСН, 20 for ОСН
  requisites?: string | null;
  is_default_for?: string | null; // 'psk' | 'alt1' | 'alt2' | null
}

export type QuoteStatus = "draft" | "saved" | "sent" | "won" | "rejected";

export interface Quote {
  id?: string;
  created_at?: string;
  kp_no: string;
  customer: string;
  kp_date: string; // ISO date (yyyy-mm-dd)
  requisites?: string | null;
  coeff_psk: number;
  coeff_kp2: number;
  coeff_kp3: number;
  entity_psk: string;
  entity_alt1: string;
  entity_alt2: string;
  opt_pechat: boolean;
  opt_podpis: boolean;
  opt_logo: boolean;
  status: QuoteStatus;
  total_real?: number | null;
  total_psk?: number | null;
  avg_markup?: number | null;
}

export interface QuoteItem {
  id?: string;
  quote_id?: string;
  position: number;
  name: string;
  category: string;
  unit: string;
  qty: number;
  zakup: number;
  dostavka: number;
  markup: number; // %
  supplier_name: string;
  supplier_inn: string;
  price_psk?: number | null;
  price_alt1?: number | null;
  price_alt2?: number | null;
  summa?: number | null;
}

// Client-side editable row: values are kept as strings for smooth inline typing.
export interface RowState {
  id: string;
  name: string;
  category: string;
  unit: string;
  qty: string;
  zakup: string;
  dostavka: string;
  markup: string;
  supplier_name: string;
  supplier_inn: string;
}

// База товаров
export interface Product {
  id?: string;
  created_at?: string;
  name: string;
  unit: string;
  default_zakup: number;
  supplier_name: string;
  supplier_inn: string;
  uses_count: number;
}
