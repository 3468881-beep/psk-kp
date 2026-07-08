"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/store";

const TABS = [
  { href: "/", label: "Расчёт КП" },
  { href: "/market", label: "Проверка рынка" },
  { href: "/inn", label: "Поставщик по ИНН" },
  { href: "/products", label: "База товаров" },
  { href: "/archive", label: "Архив КП" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-[22px] py-[13px]">
        <div className="flex items-center gap-3">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-accent text-[20px] font-extrabold text-white shadow-[0_4px_10px_rgba(42,111,219,.28)]">
            П
          </div>
          <div>
            <div className="text-[15px] font-bold leading-tight">
              ПрофКласс <span className="font-semibold text-[#A89F90]">·</span>{" "}
              <span className="text-accent">КП&nbsp;AI</span>
            </div>
            <div className="mt-px text-[11.5px] font-medium text-muted">
              Оснащение СПО · обоснование НМЦК
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-[10px] border border-border bg-white px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-[#FBFAF7]"
        >
          Выйти
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-[22px] pt-3">
        <div className="inline-flex gap-0.5 rounded-[11px] bg-[#EFE9DE] p-[3px]">
          {TABS.map((t) => {
            const active =
              t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`rounded-[9px] px-[15px] py-[7px] text-[13px] font-semibold transition-colors ${
                  active
                    ? "bg-accent text-white shadow-[0_2px_5px_rgba(42,111,219,.25)]"
                    : "text-muted hover:text-ink"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="mt-3 h-px bg-border" />
    </header>
  );
}
