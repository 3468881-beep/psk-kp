// Unified data-access layer used by client components.
// When Supabase is configured it talks to the real database (with RLS);
// otherwise it persists to localStorage so the app is fully usable in demo mode.
import { createClient } from "./supabase/client";
import { isSupabaseConfigured, DEMO_AUTH_COOKIE } from "./supabase/config";
import { SEED_ENTITIES } from "./entities";
import type { Entity, Product, Quote, QuoteItem } from "./types";

const DEMO_DB_KEY = "psk-demo-db";
const DEMO_PRODUCTS_KEY = "psk-demo-products";

interface DemoDB {
  quotes: Quote[];
  items: Record<string, QuoteItem[]>; // quote_id -> items
}

function readDemo(): DemoDB {
  if (typeof window === "undefined") return { quotes: [], items: {} };
  try {
    const raw = localStorage.getItem(DEMO_DB_KEY);
    if (raw) return JSON.parse(raw) as DemoDB;
  } catch {
    /* ignore corrupt data */
  }
  return { quotes: [], items: {} };
}

function writeDemo(db: DemoDB) {
  localStorage.setItem(DEMO_DB_KEY, JSON.stringify(db));
}

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ---------- Auth ----------

export async function signIn(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  if (isSupabaseConfigured) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }
  // Demo: accept any non-empty credentials, set the gate cookie.
  if (!email || !password) return { error: "Введите e-mail и пароль" };
  document.cookie = `${DEMO_AUTH_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 30}`;
  return { error: null };
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = createClient();
    await supabase.auth.signOut();
    return;
  }
  document.cookie = `${DEMO_AUTH_COOKIE}=; path=/; max-age=0`;
}

// ---------- Entities ----------

export async function getEntities(): Promise<Entity[]> {
  if (isSupabaseConfigured) {
    const supabase = createClient();
    const { data, error } = await supabase.from("entities").select("*");
    if (!error && data && data.length) return data as Entity[];
    // Fall back to seed if the table is empty / unreadable.
  }
  return SEED_ENTITIES;
}

// ---------- Quotes ----------

export interface SaveResult {
  id: string;
  error: string | null;
}

export async function saveQuote(
  quote: Quote,
  items: QuoteItem[],
): Promise<SaveResult> {
  if (isSupabaseConfigured) {
    const supabase = createClient();

    const payload = { ...quote, status: "saved" as const };
    delete (payload as { created_at?: string }).created_at;

    let quoteId = quote.id;
    if (!quoteId) {
      const { id: _omit, ...insert } = payload;
      void _omit;
      const { data, error } = await supabase
        .from("quotes")
        .insert(insert)
        .select("id")
        .single();
      if (error || !data) return { id: "", error: error?.message ?? "Ошибка сохранения" };
      quoteId = data.id as string;
    } else {
      const { error } = await supabase.from("quotes").update(payload).eq("id", quoteId);
      if (error) return { id: "", error: error.message };
    }

    // Atomically-ish replace items: keep a snapshot so a failed insert can roll back.
    const { data: previousItems, error: prevErr } = await supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", quoteId);
    if (prevErr) return { id: quoteId!, error: prevErr.message };

    const { error: delErr } = await supabase
      .from("quote_items")
      .delete()
      .eq("quote_id", quoteId);
    if (delErr) return { id: quoteId!, error: delErr.message };

    const rows = items.map((it) => {
      const { id: _dropId, quote_id: _dropQ, ...rest } = it;
      void _dropId;
      void _dropQ;
      return { ...rest, quote_id: quoteId };
    });
    if (rows.length) {
      const { error } = await supabase.from("quote_items").insert(rows);
      if (error) {
        // Restore previous lines so the office does not lose the list.
        if (previousItems && previousItems.length) {
          const rollback = previousItems.map((it) => {
            const row = { ...(it as Record<string, unknown>) };
            delete row.id;
            return row;
          });
          await supabase.from("quote_items").insert(rollback);
        }
        return {
          id: quoteId!,
          error: error.message + " (позиции восстановлены из предыдущей версии)",
        };
      }
    }
    return { id: quoteId!, error: null };
  }

  // ----- Demo -----
  const db = readDemo();
  const id = quote.id ?? uuid();
  const stored: Quote = {
    ...quote,
    id,
    status: "saved",
    created_at: quote.created_at ?? new Date().toISOString(),
  };
  const idx = db.quotes.findIndex((q) => q.id === id);
  if (idx >= 0) db.quotes[idx] = stored;
  else db.quotes.unshift(stored);
  db.items[id] = items.map((it, i) => ({ ...it, id: uuid(), quote_id: id, position: i + 1 }));
  writeDemo(db);
  return { id, error: null };
}

export async function listQuotes(): Promise<Quote[]> {
  if (isSupabaseConfigured) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Quote[];
  }
  const db = readDemo();
  return [...db.quotes].sort((a, b) =>
    (b.created_at ?? "").localeCompare(a.created_at ?? ""),
  );
}

export async function getQuoteWithItems(
  id: string,
): Promise<{ quote: Quote; items: QuoteItem[] }> {
  if (isSupabaseConfigured) {
    const supabase = createClient();
    const [{ data: quote, error: qErr }, { data: items, error: iErr }] =
      await Promise.all([
        supabase.from("quotes").select("*").eq("id", id).single(),
        supabase.from("quote_items").select("*").eq("quote_id", id).order("position"),
      ]);
    if (qErr || !quote) throw new Error(qErr?.message ?? "Расчёт не найден");
    if (iErr) throw new Error(iErr.message);
    return { quote: quote as Quote, items: (items ?? []) as QuoteItem[] };
  }
  const db = readDemo();
  const quote = db.quotes.find((q) => q.id === id);
  if (!quote) throw new Error("Расчёт не найден");
  return { quote, items: db.items[id] ?? [] };
}

// ---------- Products (База товаров) ----------

export interface ProductInput {
  name: string;
  unit: string;
  default_zakup: number;
  supplier_name: string;
  supplier_inn: string;
}

function readDemoProducts(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DEMO_PRODUCTS_KEY);
    if (raw) return JSON.parse(raw) as Product[];
  } catch {
    /* ignore */
  }
  return [];
}

function writeDemoProducts(list: Product[]) {
  localStorage.setItem(DEMO_PRODUCTS_KEY, JSON.stringify(list));
}

export async function listProducts(): Promise<Product[]> {
  if (isSupabaseConfigured) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("uses_count", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Product[];
  }
  return readDemoProducts().sort((a, b) => (b.uses_count ?? 0) - (a.uses_count ?? 0));
}

// Upsert by name (без дублей). Возвращает сколько новых позиций добавлено.
export async function saveProducts(
  items: ProductInput[],
): Promise<{ saved: number; total: number }> {
  const byName = new Map<string, ProductInput>();
  for (const i of items) {
    const name = (i.name ?? "").trim();
    if (name) byName.set(name, { ...i, name });
  }
  const list = Array.from(byName.values());
  if (list.length === 0) return { saved: 0, total: 0 };

  if (isSupabaseConfigured) {
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("products")
      .select("name")
      .in(
        "name",
        list.map((i) => i.name),
      );
    const existingNames = new Set(
      (existing ?? []).map((e: { name: string }) => e.name),
    );
    const saved = list.filter((i) => !existingNames.has(i.name)).length;
    const { error } = await supabase.from("products").upsert(
      list.map((i) => ({
        name: i.name,
        unit: i.unit || "шт",
        default_zakup: i.default_zakup,
        supplier_name: i.supplier_name,
        supplier_inn: i.supplier_inn,
      })),
      { onConflict: "name" },
    );
    if (error) throw new Error(error.message);
    return { saved, total: list.length };
  }

  // demo
  const current = readDemoProducts();
  const pos = new Map(current.map((p, i) => [p.name, i]));
  let saved = 0;
  for (const i of list) {
    if (pos.has(i.name)) {
      const idx = pos.get(i.name)!;
      current[idx] = {
        ...current[idx],
        unit: i.unit || current[idx].unit,
        default_zakup: i.default_zakup,
        supplier_name: i.supplier_name,
        supplier_inn: i.supplier_inn,
      };
    } else {
      saved++;
      current.unshift({
        id: uuid(),
        name: i.name,
        unit: i.unit || "шт",
        default_zakup: i.default_zakup,
        supplier_name: i.supplier_name,
        supplier_inn: i.supplier_inn,
        uses_count: 0,
        created_at: new Date().toISOString(),
      });
    }
  }
  writeDemoProducts(current);
  return { saved, total: list.length };
}

export async function deleteProduct(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  writeDemoProducts(readDemoProducts().filter((p) => p.id !== id));
}

export async function incrementProductUse(
  id: string,
  currentCount: number,
): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = createClient();
    await supabase
      .from("products")
      .update({ uses_count: (currentCount ?? 0) + 1 })
      .eq("id", id);
    return;
  }
  writeDemoProducts(
    readDemoProducts().map((p) =>
      p.id === id ? { ...p, uses_count: (p.uses_count ?? 0) + 1 } : p,
    ),
  );
}
