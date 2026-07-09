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

// Shared items table. Each template styles it via its own CSS (all black & white).
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

function totalAndVat(items: KpData["items"], taxMode: string, vatRate: number) {
  const total = items.reduce((s, i) => s + (i.price ?? 0) * (i.qty ?? 1), 0);
  const vatLine =
    taxMode === "osn"
      ? `В т.ч. НДС ${vatRate}%: ${fmt((total * vatRate) / (100 + vatRate))} ₽`
      : "НДС не облагается (применяется УСН)";
  return { total, vatLine };
}

// ─── ИП Зиянгиров (PSK) ───────────────────────────────────────────────────
// Деловой бланк на Times New Roman: шапка-таблица с логотипом, вводный текст,
// две колонки условий внизу, подпись. Чёрно-белый.
export function buildPskHtml(d: KpData): string {
  const { total, vatLine } = totalAndVat(d.items, d.taxMode, d.vatRate);
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: "Times New Roman", Times, serif; font-size: 12pt; color:#000;
       padding: 15mm 20mm; }
.header-table { width:100%; border-collapse:collapse; margin-bottom:8mm;
                border:1.5px solid #000; }
.header-table td { padding: 5mm; vertical-align:middle; }
.logo-cell { width:22%; text-align:center; font-size:44pt; font-weight:bold;
             color:#000; border-right:1.5px solid #000; }
.req-cell { font-size:10pt; line-height:1.7; }
.req-name { font-size:12pt; font-weight:bold; margin-bottom:2mm; }
h1 { text-align:center; font-size:16pt; font-weight:bold; letter-spacing:2px;
     margin: 7mm 0 5mm; text-transform:uppercase; }
.meta { margin-bottom:5mm; }
.meta p { margin-bottom:2mm; font-weight:bold; }
.intro { font-size:11pt; margin-bottom:5mm; line-height:1.5; text-align:justify; }
table { width:100%; border-collapse:collapse; margin-bottom:5mm; }
th { background:#000; color:#fff; padding:5px 7px; font-size:10pt;
     text-align:left; border:1px solid #000; }
td { padding:5px 7px; border:1px solid #000; font-size:10.5pt; }
.r { text-align:right; font-variant-numeric:tabular-nums; }
.c { text-align:center; }
.total-block { text-align:right; margin-bottom:6mm; }
.total-line { font-size:14pt; font-weight:bold; }
.vat-line { font-size:10pt; margin-top:1mm; }
.footer-table { width:100%; border-collapse:collapse; margin-top:6mm; border:1px solid #000; }
.footer-table td { padding:6px 9px; font-size:10pt; vertical-align:top;
                   border:1px solid #000; width:50%; line-height:1.6; }
.footer-title { font-weight:bold; margin-bottom:2mm; display:block; }
.sign { margin-top:8mm; font-size:11pt; line-height:1.8; }
.sign strong { display:block; font-size:12pt; margin-bottom:1mm; }
</style></head><body>

<table class="header-table">
  <tr>
    <td class="logo-cell">П</td>
    <td class="req-cell">
      <div class="req-name">Индивидуальный предприниматель Зиянгиров Нафис Назихович</div>
      ИНН 026813389549 / ОГРНИП 324028000158894<br>
      e-mail: znafis@yandex.ru<br>
      р/с 40802810620000387808, ООО «Банк Точка», БИК 044525104
    </td>
  </tr>
</table>

<h1>Коммерческое предложение</h1>

<div class="meta">
  <p>Заказчик: ${esc(d.customer)}</p>
  <p>Дата: ${esc(d.kpDate)}</p>
</div>

<p class="intro">Благодарим за обращение. Направляем коммерческое предложение на поставку товаров
согласно вашему запросу. Гарантируем соблюдение сроков поставки, качество продукции
и полный комплект сопроводительных документов.</p>

${buildTable(d.items)}

<div class="total-block">
  <div class="total-line">Итого: ${fmt(total)} ₽</div>
  <div class="vat-line">${vatLine}</div>
</div>

<table class="footer-table">
  <tr>
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
  </tr>
</table>

<div class="sign">
  <strong>С уважением,</strong>
  ИП Зиянгиров Нафис Назихович<br>
  +7 (993) 046-82-81<br>
  znafis@yandex.ru
</div>

</body></html>`;
}

// ─── ООО «Технопродукт» ───────────────────────────────────────────────────
// Максимально простой минималистичный бланк на Arial. Чёрно-белый.
export function buildTehnoproduktHtml(d: KpData): string {
  const { total, vatLine } = totalAndVat(d.items, d.taxMode, d.vatRate);
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size:11pt; color:#000;
       padding:18mm 20mm; }
.company-name { font-size:14pt; font-weight:bold; margin-bottom:2mm; }
.company-info { font-size:10.5pt; line-height:1.6; margin-bottom:8mm; }
h1 { font-size:12.5pt; font-weight:bold; margin:0 0 5mm; }
.meta { margin-bottom:5mm; font-size:10.5pt; }
table { width:100%; border-collapse:collapse; margin-bottom:5mm; }
th { padding:5px 7px; font-size:9.5pt; text-align:left; border:1px solid #000;
     border-bottom:2px solid #000; font-weight:bold; }
td { padding:5px 7px; border:1px solid #000; font-size:10pt; }
.r { text-align:right; font-variant-numeric:tabular-nums; }
.c { text-align:center; }
.total-block { text-align:right; margin-bottom:5mm; }
.total-line { font-size:12.5pt; font-weight:bold; }
.vat-line { font-size:9.5pt; margin-top:1mm; }
.footer { margin-top:6mm; font-size:11pt; font-weight:bold; }
</style></head><body>

<div class="company-name">ООО «Технопродукт»</div>
<div class="company-info">
  450077, РФ, Респ. Башкортостан, г. Уфа, ул. Коммунистическая, д.45/3 пом. 209<br>
  ИНН/КПП: 0275914810/027501001 &nbsp; ОГРН: 1180280026563
</div>

<h1>Ценовое предложение б/н от ${esc(d.kpDate)}</h1>

<div class="meta">Заказчик (покупатель): ${esc(d.customer)}</div>

${buildTable(d.items)}

<div class="total-block">
  <div class="total-line">Итого: ${fmt(total)} ₽</div>
  <div class="vat-line">${vatLine}</div>
</div>

<div class="footer">Срок поставки: 10 рабочих дней</div>

</body></html>`;
}

// ─── ООО «АТА» ────────────────────────────────────────────────────────────
// Заголовок сверху, затем реквизиты компании отдельным блоком в рамке. Arial, ч/б.
export function buildAtaHtml(d: KpData): string {
  const { total, vatLine } = totalAndVat(d.items, d.taxMode, d.vatRate);
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size:11pt; color:#000;
       padding:15mm 20mm; }
h1 { font-size:13pt; font-weight:bold; text-align:center; margin-bottom:6mm; }
.meta { margin-bottom:5mm; font-size:10.5pt; }
.company-block { margin-bottom:6mm; font-size:10pt; line-height:1.8;
                 border:1px solid #000; padding:5mm 6mm; }
.company-name { font-size:12pt; font-weight:bold; margin-bottom:2mm; }
table { width:100%; border-collapse:collapse; margin-bottom:5mm; }
th { padding:5px 7px; font-size:9.5pt; text-align:left; border:1px solid #000;
     background:#e6e6e6; font-weight:bold; }
td { padding:5px 7px; border:1px solid #000; font-size:10pt; }
.r { text-align:right; font-variant-numeric:tabular-nums; }
.c { text-align:center; }
.total-block { text-align:right; margin-bottom:5mm; }
.total-line { font-size:13pt; font-weight:bold; }
.vat-line { font-size:9.5pt; margin-top:1mm; }
.footer { margin-top:5mm; font-size:10.5pt; line-height:1.8; }
</style></head><body>

<h1>Коммерческое предложение б/н от ${esc(d.kpDate)}</h1>

<div class="meta">Заказчик (покупатель): ${esc(d.customer)}</div>

<div class="company-block">
  <div class="company-name">ООО «АТА»</div>
  Местонахождение: 142117, Московская область, г. Подольск, Парковая ул., д. 54, офис 11-1<br>
  Банковские реквизиты: р/с 40702810940000085470, ПАО СБЕРБАНК, к/с 30101810600000000225, БИК 044525225<br>
  ИНН: 5074065643, КПП: 507401001
</div>

${buildTable(d.items)}

<div class="total-block">
  <div class="total-line">Итого: ${fmt(total)} ₽</div>
  <div class="vat-line">${vatLine}</div>
</div>

<div class="footer">
  Срок доставки товара: 14 календарных дней. Срок действия предложения 1 рабочий день.
</div>

</body></html>`;
}

// ─── Диспетчер ────────────────────────────────────────────────────────────
export function buildKpHtml(entityCode: string, data: KpData): string {
  if (entityCode === "ip") return buildPskHtml(data);
  if (entityCode === "tehnoprodukt") return buildTehnoproduktHtml(data);
  if (entityCode === "ata") return buildAtaHtml(data);
  return buildPskHtml(data);
}
