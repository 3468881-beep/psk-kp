import { LOGO_PSK, STAMP_PSK, SIGN_TEHNO, SIGN_ATA } from "./pdf-assets";

// Диагностика: убеждаемся, что base64-ассеты действительно вшиты в бандл.
console.log("LOGO_PSK length:", LOGO_PSK?.length);

export interface KpData {
  entityCode: "ip" | "tehnoprodukt" | "ata";
  entityName: string;
  entityFullName: string;
  entityInn: string;
  entityKpp?: string;
  entityOgrn?: string;
  entityRequisites: string;
  taxMode: "usn" | "osn";
  vatRate: number;
  customer: string;
  kpNo: string;
  kpDate: string;
  // Оформление (из тумблеров «Логотип» / «Печать» / «Подпись»). По умолчанию — как в Word-образце.
  showLogo?: boolean;
  showStamp?: boolean;
  items: Array<{
    position: number;
    name: string;
    unit: string;
    qty: number;
    price: number;
  }>;
}

function fmt(n: number): string {
  return (n ?? 0).toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Escape user-provided text so it can't break the HTML markup.
function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Shared items table markup. Each template styles it via its own CSS.
function buildTable(items: KpData["items"]): string {
  const rows = items
    .map((item) => {
      const summa = (item.price ?? 0) * (item.qty ?? 1);
      return `<tr>
      <td>${item.position}</td>
      <td>${esc(item.name)}</td>
      <td class="c">${esc(item.unit ?? "шт")}</td>
      <td class="r">${fmt(item.qty ?? 1)}</td>
      <td class="r">${fmt(item.price ?? 0)}</td>
      <td class="r">${fmt(summa)}</td>
    </tr>`;
    })
    .join("");

  return `<table>
    <thead><tr>
      <th style="width:5%">№</th>
      <th style="width:47%">Наименование</th>
      <th style="width:7%" class="c">Ед.</th>
      <th style="width:9%" class="r">Кол.</th>
      <th style="width:16%" class="r">Цена, ₽</th>
      <th style="width:16%" class="r">Сумма, ₽</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// Ставка НДС для ОСН — 22%.
const VAT_RATE = 22;

function totalAndVat(items: KpData["items"], taxMode: string) {
  const total = items.reduce((s, i) => s + (i.price ?? 0) * (i.qty ?? 1), 0);
  const vatLine =
    taxMode === "osn"
      ? `В т.ч. НДС ${VAT_RATE}%: ${fmt((total * VAT_RATE) / (100 + VAT_RATE))} ₽`
      : "НДС не облагается (применяется УСН)";
  return { total, vatLine };
}

// ─── ИП Зиянгиров (PSK) — по образцу Шаблон_КП_PSK.docx ────────────────────
// Шрифт Cambria, тёмно-синий заголовок #003366, логотип PSK в шапке-таблице,
// вводный текст, две колонки условий внизу, подпись + печать.
export function buildPskHtml(d: KpData): string {
  const { total, vatLine } = totalAndVat(d.items, d.taxMode);
  // Пока показываем логотип и печать всегда, независимо от тумблеров.
  const showLogo = true;
  const showStamp = true;
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: Cambria, Georgia, "Times New Roman", serif; font-size:11pt; color:#000;
       padding:12mm 15mm; }
.header-table { width:100%; border-collapse:collapse; margin-bottom:6mm; }
.header-table td { vertical-align:middle; padding:0 4mm; }
.logo-cell { width:180px; text-align:center; }
.logo-cell img { height:90px; width:auto; }
.req-cell { font-size:10pt; line-height:1.6; padding-left:6mm; border-left:1px solid #ccc; }
.req-name { font-size:12pt; font-weight:bold; margin-bottom:2mm; }
h1 { text-align:center; font-size:24pt; font-weight:bold; color:#003366;
     margin:5mm 0 5mm; }
.meta p { font-size:11pt; margin-bottom:2mm; }
.meta b { font-weight:bold; }
.intro { font-size:11pt; margin:4mm 0 5mm; line-height:1.5; text-align:justify; }
table { width:100%; border-collapse:collapse; margin-bottom:4mm; }
th { background:#003366; color:#fff; padding:6px 7px; font-size:10pt; font-weight:bold;
     text-align:left; border:1px solid #003366; }
td { padding:5px 7px; border:1px solid #b9c4d4; font-size:10.5pt; }
tbody tr:nth-child(even) td { background:#eef2f8; }
.r { text-align:right; font-variant-numeric:tabular-nums; }
.c { text-align:center; }
.total-block { text-align:right; margin-bottom:6mm; }
.total-line { font-size:14pt; font-weight:bold; color:#003366; }
.vat-line { font-size:10pt; color:#333; margin-top:1mm; }
.footer-table { width:100%; border-collapse:collapse; margin-top:5mm; }
.footer-table td { padding:0 6mm 0 0; font-size:11pt; vertical-align:top; width:50%; line-height:1.65; }
.footer-table td + td { padding:0 0 0 6mm; }
.footer-title { font-weight:bold; font-size:14pt; margin-bottom:2mm; display:block; }
.sign { margin-top:7mm; font-size:11pt; line-height:1.7; position:relative; }
.sign strong { display:block; font-weight:bold; margin-bottom:1mm; }
.stamp { position:absolute; top:-10mm; left:45mm; }
.stamp img { height:150px; width:auto; }
</style></head><body>

<table class="header-table"><tr>
  <td class="logo-cell">${showLogo ? `<img src="${LOGO_PSK}" alt="PSK" style="height: 90px; width: auto;">` : ""}</td>
  <td class="req-cell">
    <div class="req-name">Индивидуальный предприниматель Зиянгиров Нафис Назихович</div>
    ИНН 026813389549 / ОГРНИП 324028000158894<br>
    e-mail: znafis@yandex.ru<br>
    р/с 40802810620000387808, ООО «Банк Точка», БИК 044525104
  </td>
</tr></table>

<h1>КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</h1>

<div class="meta">
  <p><b>Заказчик:</b> ${esc(d.customer)}</p>
  <p><b>Дата предложения:</b> ${esc(d.kpDate)}</p>
</div>

<p class="intro">Благодарим за обращение. Направляем коммерческое предложение на поставку товаров
согласно вашему запросу. Гарантируем соблюдение сроков поставки, качество продукции
и полный комплект сопроводительных документов.</p>

${buildTable(d.items)}

<div class="total-block">
  <div class="total-line">Итого: ${fmt(total)} ₽</div>
  <div class="vat-line">${vatLine}</div>
</div>

<table class="footer-table"><tr>
  <td>
    <span class="footer-title">Условия поставки:</span>
    — срок поставки: 14 рабочих дней<br>
    — оплата: безналичный расчёт<br>
    — цена включает доставку (при необходимости)<br>
    — предоставляется полный комплект документов<br>
    — цена действительна в течение 3 календарных дней
  </td>
  <td>
    <span class="footer-title">Почему выбирают нас:</span>
    — оперативная обработка заявок<br>
    — работа с гос. и коммерческими организациями<br>
    — контроль сроков поставки<br>
    — надёжные поставщики и проверенная продукция<br>
    — персональное сопровождение сделки
  </td>
</tr></table>

<div class="sign">
  <strong>С уважением,</strong>
  ИП Зиянгиров Нафис Назихович<br>
  +7 (993) 046-82-81<br>
  znafis@yandex.ru
  ${showStamp ? `<span class="stamp"><img src="${STAMP_PSK}" alt="" style="height: 150px; width: auto;"></span>` : ""}
</div>

</body></html>`;
}

// ─── ООО «Технопродукт» — по образцу Шаблон_КП_Технопродукт.docx ───────────
// Шрифт Times New Roman, заголовок-название компании, центрированный подзаголовок,
// минималистичная таблица, подпись+печать директора внизу.
export function buildTehnoproduktHtml(d: KpData): string {
  const { total, vatLine } = totalAndVat(d.items, d.taxMode);
  const showStamp = true;
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: "Times New Roman", Times, serif; font-size:11pt; color:#000;
       padding:18mm 20mm; }
.company-name { font-size:18pt; font-weight:bold; margin-bottom:2mm; }
.company-info { font-size:11pt; line-height:1.6; margin-bottom:7mm; }
h1 { text-align:center; font-size:14pt; font-weight:bold; color:#1a1a1a; margin:4mm 0 5mm; }
.meta { margin-bottom:5mm; font-size:11.5pt; color:#1a1a1a; }
table { width:100%; border-collapse:collapse; margin-bottom:4mm; }
th { padding:5px 7px; font-size:10pt; text-align:left; border:1px solid #000;
     border-bottom:2px solid #000; font-weight:bold; }
td { padding:5px 7px; border:1px solid #000; font-size:10.5pt; }
.r { text-align:right; font-variant-numeric:tabular-nums; }
.c { text-align:center; }
.total-block { text-align:right; margin-bottom:5mm; }
.total-line { font-size:14pt; font-weight:bold; color:#1a1a1a; }
.vat-line { font-size:10pt; color:#333; margin-top:1mm; }
.term { margin-top:5mm; font-size:11pt; font-weight:bold; }
.sign img { margin-top:8mm; width:135mm; max-width:100%; height:auto; }
</style></head><body>

<div class="company-name">ООО «Технопродукт»</div>
<div class="company-info">
  450077, РФ, Респ. Башкортостан, г. Уфа, ул. Коммунистическая, д.45/3 помещение 209<br>
  ИНН/КПП: 0275914810 / 027501001<br>
  ОГРН: 1180280026563
</div>

<h1>Ценовое предложение б/н от ${esc(d.kpDate)}</h1>

<div class="meta">Заказчик (покупатель): ${esc(d.customer)}</div>

${buildTable(d.items)}

<div class="total-block">
  <div class="total-line">Итого: ${fmt(total)} ₽</div>
  <div class="vat-line">${vatLine}</div>
</div>

<div class="term">Срок поставки: 10 рабочих дней</div>

${showStamp ? `<div class="sign"><img src="${SIGN_TEHNO}" alt=""></div>` : ""}

</body></html>`;
}

// ─── ООО «АТА» — по образцу Шаблон_КП_АТА.docx ─────────────────────────────
// Шрифт Helvetica Neue, тёмно-серый #1A1A1A, центрированный заголовок сверху,
// реквизиты компании обычным текстом, минимализм, подпись+печать внизу.
export function buildAtaHtml(d: KpData): string {
  const { total, vatLine } = totalAndVat(d.items, d.taxMode);
  const showStamp = true;
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; font-size:11.5pt;
       color:#1a1a1a; padding:15mm 20mm; }
h1 { text-align:center; font-size:11.5pt; font-weight:bold; margin-bottom:6mm; }
.meta { margin-bottom:4mm; font-size:11.5pt; }
.company { margin-bottom:6mm; font-size:11.5pt; line-height:1.7; }
.company-name { font-size:11.5pt; margin-bottom:1mm; }
table { width:100%; border-collapse:collapse; margin-bottom:4mm; }
th { padding:5px 7px; font-size:10pt; text-align:left; border:1px solid #000;
     background:#e6e6e6; font-weight:bold; }
td { padding:5px 7px; border:1px solid #000; font-size:10.5pt; }
.r { text-align:right; font-variant-numeric:tabular-nums; }
.c { text-align:center; }
.total-block { text-align:right; margin-bottom:5mm; }
.total-line { font-size:13pt; font-weight:bold; }
.vat-line { font-size:10pt; color:#333; margin-top:1mm; }
.term { margin-top:5mm; font-size:11.5pt; line-height:1.7; }
.sign img { margin-top:8mm; width:95mm; max-width:100%; height:auto; }
</style></head><body>

<h1>Коммерческое предложение б/н от ${esc(d.kpDate)}</h1>

<div class="meta">Заказчик (покупатель): ${esc(d.customer)}</div>

<div class="company">
  <div class="company-name">ООО «АТА»</div>
  Местонахождение: 142117, Московская область, г. Подольск, Парковая ул., д. 54, офис 11-1<br>
  Банковские реквизиты: р/с 40702810940000085470, ПАО СБЕРБАНК, к/с 30101810600000000225, БИК 044525225<br>
  ИНН: 5074065643 &nbsp; КПП: 507401001
</div>

${buildTable(d.items)}

<div class="total-block">
  <div class="total-line">Итого: ${fmt(total)} ₽</div>
  <div class="vat-line">${vatLine}</div>
</div>

<div class="term">
  Срок доставки товара: 14 календарных дней. Срок действия предложения 1 рабочий день.
</div>

${showStamp ? `<div class="sign"><img src="${SIGN_ATA}" alt=""></div>` : ""}

</body></html>`;
}

// ─── Диспетчер ────────────────────────────────────────────────────────────
export function buildKpHtml(entityCode: string, data: KpData): string {
  if (entityCode === "ip") return buildPskHtml(data);
  if (entityCode === "tehnoprodukt") return buildTehnoproduktHtml(data);
  if (entityCode === "ata") return buildAtaHtml(data);
  return buildPskHtml(data);
}
