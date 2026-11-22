import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/format";

export type OfferCandidate = {
  product: { id: string; name: string; price: number; image_url: string | null; offer_price: number | null; offer_until: string | null };
  flowers: { name: string; unit: string; remaining: number; expires_at: string }[];
  soonest: string;
};

/** Produtos ativos cuja ficha técnica usa insumos com lote vencendo até depois de amanhã. */
export async function offerCandidates(orgId: string): Promise<OfferCandidate[]> {
  const supabase = await createClient();
  const { data: batches } = await supabase
    .from("supply_batches")
    .select("supply_id, remaining, expires_at, supplies(name, unit)")
    .eq("org_id", orgId)
    .gt("remaining", 0)
    .gte("expires_at", todayISO())
    .lte("expires_at", todayISO(2));
  const rows = (batches ?? []) as unknown as { supply_id: string; remaining: number; expires_at: string; supplies: { name: string; unit: string } }[];
  if (!rows.length) return [];
  const bySupply = new Map<string, { name: string; unit: string; remaining: number; expires_at: string }>();
  for (const b of rows) {
    const cur = bySupply.get(b.supply_id);
    bySupply.set(b.supply_id, {
      name: b.supplies.name,
      unit: b.supplies.unit,
      remaining: (cur?.remaining ?? 0) + Number(b.remaining),
      expires_at: cur && cur.expires_at < b.expires_at ? cur.expires_at : b.expires_at,
    });
  }
  const { data: comps } = await supabase
    .from("product_components")
    .select("supply_id, products!inner(id, name, price, image_url, offer_price, offer_until, active)")
    .in("supply_id", [...bySupply.keys()])
    .eq("products.active", true);
  const byProduct = new Map<string, OfferCandidate>();
  for (const c of (comps ?? []) as unknown as { supply_id: string; products: OfferCandidate["product"] }[]) {
    const f = bySupply.get(c.supply_id)!;
    const cur = byProduct.get(c.products.id) ?? { product: c.products, flowers: [], soonest: f.expires_at };
    cur.flowers.push(f);
    if (f.expires_at < cur.soonest) cur.soonest = f.expires_at;
    byProduct.set(c.products.id, cur);
  }
  return [...byProduct.values()].sort((a, b) => a.soonest.localeCompare(b.soonest));
}

export const offerActive = (p: { offer_price: number | null; offer_until: string | null }) =>
  p.offer_price != null && !!p.offer_until && p.offer_until >= todayISO();
