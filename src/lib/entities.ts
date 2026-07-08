import type { Entity } from "./types";

// Seed юрлиц — mirrors the `entities` table seed in the Supabase schema.
// Used as the source of truth in demo mode and as a fallback if the table
// is empty when Supabase is configured.
export const SEED_ENTITIES: Entity[] = [
  {
    code: "ip",
    name: "ИП Зиянгиров Н.Н.",
    full_name: "ИП Зиянгиров Назих Назихович",
    inn: "026813389549",
    kpp: null,
    ogrn: "324028000158894",
    tax_mode: "usn",
    vat_rate: 0,
    requisites: "ИНН 026813389549, ОГРНИП 324028000158894, г. Уфа",
    is_default_for: "psk",
  },
  {
    code: "tehnoprodukt",
    name: "ООО «Технопродукт»",
    full_name: null,
    inn: null,
    kpp: null,
    ogrn: null,
    tax_mode: "osn",
    vat_rate: 20,
    requisites: null,
    is_default_for: "alt1",
  },
  {
    code: "ata",
    name: "ООО «АТА»",
    full_name: null,
    inn: null,
    kpp: "507401001",
    ogrn: null,
    tax_mode: "osn",
    vat_rate: 20,
    requisites: null,
    is_default_for: "alt2",
  },
];
