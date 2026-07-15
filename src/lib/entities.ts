import type { Entity } from "./types";

// Seed юрлиц — mirrors the `entities` table seed in the Supabase schema.
// Used as the source of truth in demo mode and as a fallback if the table
// is empty when Supabase is configured.
export const SEED_ENTITIES: Entity[] = [
  {
    code: "ip",
    name: "ИП Зиянгиров Н.Н.",
    full_name: "Индивидуальный предприниматель Зиянгиров Нафис Назихович",
    inn: "026813389549",
    kpp: null,
    ogrn: "324028000158894",
    tax_mode: "osn",
    vat_rate: 5,
    requisites:
      "р/с 40802810620000387808, ООО «Банк Точка», БИК 044525104",
    is_default_for: "psk",
  },
  {
    code: "tehnoprodukt",
    name: "ООО «Технопродукт»",
    full_name: "Общество с ограниченной ответственностью «Технопродукт»",
    inn: "0275914810",
    kpp: "027501001",
    ogrn: "1180280026563",
    tax_mode: "osn",
    vat_rate: 22,
    requisites:
      "450077, РФ, Респ. Башкортостан, г. Уфа, ул. Коммунистическая, д.45/3 пом. 209",
    is_default_for: "alt1",
  },
  {
    code: "ata",
    name: "ООО «АТА»",
    full_name: "Общество с ограниченной ответственностью «АТА»",
    inn: "5074065643",
    kpp: "507401001",
    ogrn: null,
    tax_mode: "osn",
    vat_rate: 22,
    requisites:
      "142117, Московская область, г. Подольск, Парковая ул., д. 54, офис 11-1. р/с 40702810940000085470, ПАО СБЕРБАНК, к/с 30101810600000000225, БИК 044525225",
    is_default_for: "alt2",
  },
];
