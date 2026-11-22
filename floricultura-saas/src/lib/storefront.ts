import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import type { PriceMode } from "./types";

export type StoreProduct = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  price_mode: PriceMode;
  sku: string | null;
  featured: boolean;
  offer_price: number | null;
  offer_until: string | null;
  images: { url: string; thumb_url: string }[];
  /** só em seleções personalizadas */
  custom_price?: number | null;
  item_note?: string | null;
};

/** Preço que vale agora: preço da seleção > oferta do dia > preço normal. */
export function currentPrice(p: StoreProduct): { value: number; original: number | null; off: number | null } {
  const base = Number(p.price);
  const special = p.custom_price != null ? Number(p.custom_price) : p.offer_price != null ? Number(p.offer_price) : null;
  if (special == null || special >= base || p.price_mode === "sob_consulta") return { value: base, original: null, off: null };
  return { value: special, original: base, off: Math.round((1 - special / base) * 100) };
}

export function priceText(p: StoreProduct) {
  const { value, original } = currentPrice(p);
  if (p.price_mode === "sob_consulta") return "Sob consulta";
  const v = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  return p.price_mode === "a_partir_de" && !original ? `a partir de ${v}` : v;
}

export type Store = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  whatsapp: string | null;
  instagram: string | null;
  opening_hours: string | null;
  delivery_area: string | null;
  business_hours: unknown;
  delivery_regions: unknown;
  address: string | null;
  logo_url: string | null;
  cover_url: string | null;
};

/** Cliente sem sessão: a vitrine só lê pela função pública. */
function publicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const getStore = cache(async (slug: string) => {
  const { data, error } = await publicClient().rpc("public_store", { p_slug: slug });
  if (error || !data) return null;
  return data as { store: Store; products: StoreProduct[] };
});

export function groupByCategory(products: StoreProduct[]) {
  const map = new Map<string, StoreProduct[]>();
  for (const p of products) {
    const key = p.category?.trim() || "Outros";
    map.set(key, [...(map.get(key) ?? []), p]);
  }
  return [...map.entries()].sort((a, b) => (a[0] === "Outros" ? 1 : b[0] === "Outros" ? -1 : a[0].localeCompare(b[0], "pt-BR")));
}

export const categorySlug = (c: string) =>
  c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export type SelectionData = {
  store: Pick<Store, "id" | "name" | "slug" | "tagline" | "whatsapp" | "logo_url" | "cover_url" | "business_hours" | "delivery_area">;
  selection: { code: string; title: string; customer_name: string | null; note: string | null; expires_at: string; expired: boolean };
  items: StoreProduct[];
};

export const getSelection = cache(async (code: string) => {
  if (!/^[a-z0-9]{6,12}$/.test(code)) return null;
  const { data, error } = await publicClient().rpc("public_selection", { p_code: code });
  if (error || !data) return null;
  return data as SelectionData;
});

export function orderMessage(storeName: string, p: StoreProduct, priceText: string, url: string) {
  return `Olá, ${storeName}! Vi na vitrine e tenho interesse em:\n*${p.name}* (${priceText})${p.sku ? ` · cód. ${p.sku}` : ""}\n${url}`;
}
