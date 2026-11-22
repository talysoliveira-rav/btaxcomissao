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
  images: { url: string; thumb_url: string }[];
};

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

export function orderMessage(storeName: string, p: StoreProduct, priceText: string, url: string) {
  return `Olá, ${storeName}! Vi na vitrine e tenho interesse em:\n*${p.name}* (${priceText})${p.sku ? ` · cód. ${p.sku}` : ""}\n${url}`;
}
