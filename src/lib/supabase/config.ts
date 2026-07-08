// Detect whether real Supabase credentials are present.
// When they are NOT, the app falls back to a local demo store so the whole
// flow (login → calc → save → archive) is testable out of the box.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20;

export const DEMO_AUTH_COOKIE = "psk-demo-auth";
