// Unified data-access layer used by client components.
// When Supabase is configured it talks to the real database (with RLS);
// otherwise it persists to localStorage so the app is fully usable in demo mode.
import { createClient } from "./supabase/client";
import { isSupabaseConfigured, DEMO_AUTH_COOKIE } from "./supabase/config";
import { SEED_ENTITIES } from "./entities";
import type { Entity, Quote, QuoteItem } from "./types";

const DEMO_DB_KEY = "psk-demo-db";

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

    // Replace all items.
    await supabase.from("quote_items").delete().eq("quote_id", quoteId);
    const rows = items.map((it) => {
      const { id: _dropId, quote_id: _dropQ, ...rest } = it;
      void _dropId;
      void _dropQ;
      return { ...rest, quote_id: quoteId };
    });
    if (rows.length) {
      const { error } = await supabase.from("quote_items").insert(rows);
      if (error) return { id: quoteId!, error: error.message };
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
