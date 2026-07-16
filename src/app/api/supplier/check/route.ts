import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";
export const maxDuration = 30;

function verdictFor(score: number): string {
  if (score >= 70) return "Можно работать";
  if (score >= 40) return "Проверьте вручную";
  return "Высокий риск";
}

export async function POST(req: NextRequest) {
  const { inn } = await req.json().catch(() => ({}));
  if (!inn) return NextResponse.json({ error: "inn required" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let supabase: any = null;
  if (isSupabaseConfigured) {
    supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Кэш (не старше 7 дней)
    const { data: cached } = await supabase
      .from("suppliers")
      .select("*")
      .eq("inn", inn)
      .gte("checked_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .single();
    if (cached) {
      return NextResponse.json({
        ...cached,
        verdict: verdictFor(cached.reliability_score ?? 0),
        fromCache: true,
      });
    }
  }

  const dadataKey = process.env.DADATA_API_KEY;
  if (!dadataKey) {
    return NextResponse.json({ error: "DADATA_API_KEY not set" }, { status: 500 });
  }

  const dadataRes = await fetch(
    "https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Token ${dadataKey}`,
      },
      body: JSON.stringify({ query: inn }),
    },
  );

  const dadataData = await dadataRes.json();
  const party = dadataData.suggestions?.[0]?.data;
  if (!party) {
    return NextResponse.json({ error: "Контрагент не найден", inn }, { status: 404 });
  }

  // Скоринг надёжности
  let score = 50;
  const checks: Record<string, string> = {};

  const status = party.state?.status;
  if (status === "ACTIVE") {
    score += 25;
    checks.status = "Действующая ✓";
  } else if (status === "LIQUIDATING") {
    score -= 30;
    checks.status = "В процессе ликвидации ⚠";
  } else if (status === "LIQUIDATED") {
    score -= 45;
    checks.status = "Ликвидирована ✗";
  } else if (status === "BANKRUPT") {
    score -= 45;
    checks.status = "Банкрот ✗";
  } else if (status === "REORGANIZING") {
    score -= 20;
    checks.status = "Реорганизация ⚠";
  }

  const regDate = party.state?.registration_date;
  if (regDate) {
    const ageYears =
      (Date.now() - new Date(regDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (ageYears >= 3) {
      score += 15;
      checks.age = `Возраст ${Math.floor(ageYears)} лет ✓`;
    } else if (ageYears >= 1) {
      score += 5;
      checks.age = `Возраст ${Math.floor(ageYears * 12)} мес ✓`;
    } else {
      checks.age = "Менее 1 года ⚠";
    }
  }

  const debt = party.finance?.debt;
  if (debt === null || debt === 0 || debt === undefined) {
    score += 15;
    checks.tax = "Нет задолженности ✓";
  } else if (debt > 0) {
    score -= 15;
    checks.tax = `Задолженность ${debt} ₽ ✗`;
  } else {
    checks.tax = "Данные недоступны";
  }

  if (party.finance?.type) {
    score += 10;
    checks.msp = "В реестре МСП ✓";
  }

  const okved = party.okved ?? "";
  if (
    okved.startsWith("46") ||
    okved.startsWith("47") ||
    okved.startsWith("85") ||
    okved.startsWith("26") ||
    okved.startsWith("28")
  ) {
    score += 10;
    checks.okved = `ОКВЭД ${okved} — профильный ✓`;
  } else if (okved) {
    checks.okved = `ОКВЭД ${okved}`;
  }

  // 1. Смена руководителя. DaData обычно не отдаёт дату назначения руководителя,
  // поэтому пробуем найти дату; если её нет — используем возраст компании как прокси.
  const mgmt = party.management;
  if (mgmt?.name) {
    const mgmtDateRaw: string | null =
      mgmt.start_date ?? mgmt.date ?? mgmt.registration_date ?? null;
    const refDate = mgmtDateRaw ?? regDate ?? null;
    let recent = false;
    if (refDate) {
      const months =
        (Date.now() - new Date(refDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
      recent = months < 12;
    }
    if (recent) {
      score -= 10;
      checks.management = `Смена руководителя < 1 года ⚠ (${mgmt.name})`;
    } else {
      checks.management = `Руководитель стабильный ✓ (${mgmt.post ?? "рук."}: ${mgmt.name})`;
    }
  } else {
    checks.management = "Руководитель — данные недоступны";
  }

  // 2. Арбитражные дела через открытый поиск kad.arbitr.ru (официального API нет,
  // сайт защищён WAF — при блокировке помечаем как «не проверялось»). Таймаут 5 сек.
  let arbitrCount: number | null = null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const kadRes = await fetch("https://kad.arbitr.ru/Kad/SearchInstances", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/javascript, */*; q=0.01",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          Referer: "https://kad.arbitr.ru/",
        },
        body: JSON.stringify({
          Page: 1,
          Count: 10,
          Courts: [],
          Sides: [{ Name: "", Inn: inn, Type: 1 }],
          DateFrom: null,
          DateTo: null,
          SessionFrom: null,
          SessionTo: null,
          CaseType: 0,
          WithVKSInstances: false,
        }),
      });
      if (kadRes.ok) {
        const kadData = await kadRes.json();
        arbitrCount = kadData?.Result?.TotalCount ?? kadData?.Result?.Items?.length ?? 0;
        if ((arbitrCount ?? 0) > 0) {
          score -= 15;
          checks.arbitr = `Найдено ${arbitrCount} арбитражных дел ⚠`;
        } else {
          score += 10;
          checks.arbitr = "Арбитражных дел не найдено ✓";
        }
      } else {
        checks.arbitr = "Арбитраж — не проверялось";
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    checks.arbitr = "Арбитраж — не проверялось";
  }

  // 3. Выручка из финансовых данных DaData (отдаются не всегда).
  const fin = party.finance;
  const revenue: number | null = fin?.revenue ?? fin?.income ?? null;
  const revenueYear: number | null = fin?.year ?? null;
  if (revenue != null && revenue > 0) {
    score += 5;
    checks.finance = `Выручка ${revenueYear ?? "—"}: ${revenue.toLocaleString("ru-RU")} ₽`;
  } else {
    checks.finance = "Финансы — данные недоступны";
  }

  score = Math.max(0, Math.min(100, score));

  // Строка для кэша (только колонки таблицы suppliers — без verdict).
  const supplierRow = {
    inn,
    name: party.name?.short_with_opf ?? party.name?.full_with_opf ?? "",
    full_name: party.name?.full_with_opf ?? "",
    kpp: party.kpp ?? "",
    ogrn: party.ogrn ?? "",
    registered_at: regDate ? new Date(regDate).toISOString().split("T")[0] : null,
    manager_name: party.management?.name ?? "",
    status: status?.toLowerCase() ?? "",
    msp: !!party.finance?.type,
    okved,
    address: party.address?.unrestricted_value ?? "",
    tax_debt: typeof debt === "number" ? debt : 0,
    reliability_score: score,
    checks,
    raw: party,
    checked_at: new Date().toISOString(),
  };

  if (supabase) {
    await supabase.from("suppliers").upsert(supplierRow, { onConflict: "inn" });
  }

  return NextResponse.json({
    ...supplierRow,
    verdict: verdictFor(score),
    arbitr_count: arbitrCount,
    revenue,
    revenue_year: revenueYear,
  });
}
