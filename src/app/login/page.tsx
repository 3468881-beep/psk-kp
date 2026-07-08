"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signIn(email.trim(), password);
    if (error) {
      setError(error);
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EDE7DD] p-6">
      <div className="fadein w-full max-w-[380px] overflow-hidden rounded-[18px] border border-border bg-white shadow-[0_24px_60px_rgba(0,0,0,.12)]">
        <div className="px-7 pb-5 pt-7 text-center">
          <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-accent text-[25px] font-extrabold text-white shadow-[0_6px_14px_rgba(42,111,219,.3)]">
            П
          </div>
          <div className="text-[18px] font-extrabold text-ink">ПрофКласс · КП AI</div>
          <div className="mt-0.5 text-[12px] text-muted">
            Вход для менеджера · оснащение СПО
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-7 pb-7">
          <div>
            <div className="mb-1 text-[11px] font-semibold text-muted">Эл. почта</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="w-full rounded-[8px] border border-border bg-white px-3 py-2.5 text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_2px_rgba(42,111,219,.12)]"
              placeholder="manager@profklass.ru"
            />
          </div>
          <div>
            <div className="mb-1 text-[11px] font-semibold text-muted">Пароль</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-[8px] border border-border bg-white px-3 py-2.5 text-[13px] outline-none focus:border-accent focus:shadow-[0_0_0_2px_rgba(42,111,219,.12)]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-[8px] bg-risk-bg px-3 py-2 text-[12px] font-medium text-risk">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-[11px] bg-accent px-4 py-3 text-[14px] font-bold text-white shadow-[0_4px_10px_rgba(42,111,219,.25)] transition-colors hover:bg-accent-dark disabled:opacity-60"
          >
            {loading ? "Вход…" : "Войти"}
          </button>

          <div className="mt-0.5 text-center text-[11px] text-[#A89F90]">
            {isSupabaseConfigured
              ? "Supabase Auth · вход по корпоративной почте"
              : "Демо-режим · вход по любому e-mail и паролю"}
          </div>
        </form>
      </div>
    </div>
  );
}
