import Link from "next/link";
import { CalendarHeart, ClipboardList, ShoppingBasket, TrendingUp } from "lucide-react";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink, Card, PageHeader, Stat } from "@/components/ui";
import { dateBR, money, todayISO, weekdayBR } from "@/lib/format";
import { commercialDates } from "@/lib/commercial-dates";
import { computeShopping, type ShopBatch, type ShopNeed, type ShopSupply } from "@/lib/shopping";
import { perishAlertCount } from "@/lib/perishability-server";
import { StockTabs } from "../tabs";
import { ShoppingList } from "./shopping-list";

export const metadata = { title: "Lista de compras" };

const HORIZONS = [2, 3, 5, 7];
const MULTS = [1, 1.5, 2, 2.5, 3];
const HISTORY_DAYS = 28;

export default async function ShoppingPage({ searchParams }: { searchParams: Promise<{ dias?: string; ajuste?: string }> }) {
  const sp = await searchParams;
  const horizon = HORIZONS.includes(Number(sp.dias)) ? Number(sp.dias) : 3;
  const multiplier = MULTS.includes(Number(sp.ajuste)) ? Number(sp.ajuste) : 1;
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const today = todayISO();
  const end = todayISO(horizon - 1);

  const [{ data: sup }, { data: bat }, { data: ord }, { data: mov }, alerts] = await Promise.all([
    supabase.from("supplies").select("id, name, unit, min_quantity, cost, shelf_life_days, purchase_multiple, supply_categories(name)").eq("org_id", org.id).eq("active", true).order("name"),
    supabase
      .from("supply_batches")
      .select("supply_id, remaining, expires_at, supplier, unit_cost, received_at")
      .eq("org_id", org.id)
      .or(`remaining.gt.0,received_at.gte.${todayISO(-90)}`),
    supabase
      .from("orders")
      .select("id, number, delivery_date, order_items(product_id, quantity)")
      .eq("org_id", org.id)
      .in("status", ["novo", "confirmado"])
      .eq("stock_consumed", false)
      .not("delivery_date", "is", null)
      .lte("delivery_date", end),
    supabase
      .from("stock_movements")
      .select("supply_id, quantity")
      .eq("org_id", org.id)
      .in("type", ["consumo_pedido", "estorno_pedido", "saida"])
      .gte("created_at", `${todayISO(-HISTORY_DAYS)}T00:00:00-03:00`),
    perishAlertCount(org.id),
  ]);

  const supplies: ShopSupply[] = ((sup ?? []) as unknown as (Omit<ShopSupply, "category"> & { supply_categories: { name: string } | null })[]).map((s) => ({
    ...s,
    category: s.supply_categories?.name ?? null,
  }));
  const orders = (ord ?? []) as unknown as { id: string; number: number; delivery_date: string; order_items: { product_id: string | null; quantity: number }[] }[];

  // Pedidos agendados → insumos pela ficha técnica
  const productIds = [...new Set(orders.flatMap((o) => o.order_items.map((i) => i.product_id).filter(Boolean)))] as string[];
  const { data: comps } = productIds.length
    ? await supabase.from("product_components").select("product_id, supply_id, quantity").in("product_id", productIds)
    : { data: [] };
  const compsByProduct = new Map<string, { supply_id: string; quantity: number }[]>();
  for (const c of (comps ?? []) as { product_id: string; supply_id: string; quantity: number }[]) {
    compsByProduct.set(c.product_id, [...(compsByProduct.get(c.product_id) ?? []), c]);
  }
  const needs: ShopNeed[] = [];
  for (const o of orders) {
    const date = o.delivery_date < today ? today : o.delivery_date; // atrasados contam para hoje
    for (const it of o.order_items) {
      for (const c of compsByProduct.get(it.product_id ?? "") ?? []) needs.push({ supply_id: c.supply_id, date, qty: Number(c.quantity) * it.quantity, order: o.number });
    }
  }

  // Consumo das últimas semanas (consumo de pedidos − estornos + saídas avulsas)
  const consumption = new Map<string, number>();
  for (const m of (mov ?? []) as { supply_id: string; quantity: number }[]) consumption.set(m.supply_id, (consumption.get(m.supply_id) ?? 0) - Number(m.quantity));

  const rows = computeShopping({ today, horizon, multiplier, historyDays: HISTORY_DAYS, supplies, batches: (bat ?? []) as ShopBatch[], needs, consumption });
  const toBuy = rows.filter((r) => r.suggested > 0);
  const estTotal = toBuy.reduce((a, r) => a + r.estCost, 0);
  const special = commercialDates(today).find((c) => c.daysUntil <= horizon + 3);
  const qs = (d: number, a: number) => `?dias=${d}${a !== 1 ? `&ajuste=${a}` : ""}`;

  return (
    <>
      <PageHeader title="Estoque" subtitle="Quanto comprar de cada flor para os próximos dias, sem faltar e sem sobrar." />
      <StockTabs active="compras" alerts={alerts} />

      <div className="no-print mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-stone-600">Comprar para</span>
          {HORIZONS.map((d) => (
            <ButtonLink key={d} variant={d === horizon ? "primary" : "secondary"} href={qs(d, multiplier)} className="px-3 py-1.5">{d} dias</ButtonLink>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-stone-600">Procura esperada</span>
          {MULTS.map((m) => (
            <ButtonLink key={m} variant={m === multiplier ? "primary" : "secondary"} href={qs(horizon, m)} className="px-3 py-1.5">
              {m === 1 ? "normal" : `×${String(m).replace(".", ",")}`}
            </ButtonLink>
          ))}
        </div>
      </div>

      {special && multiplier === 1 && (
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50/80 px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-brand-800">
            <CalendarHeart className="h-4 w-4 shrink-0" aria-hidden />
            <span><b>{special.title}</b> {special.daysUntil === 0 ? "é hoje" : `em ${special.daysUntil} dia(s)`} ({dateBR(special.iso).slice(0, 5)}). A procura costuma ser maior.</span>
          </span>
          <ButtonLink href={qs(horizon, special.boost)} className="px-3 py-1.5">Ajustar previsão ×{String(special.boost).replace(".", ",")}</ButtonLink>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Stat icon={ShoppingBasket} label="Itens a comprar" value={toBuy.length} hint={`de ${rows.length} insumo(s) ativos`} />
        <Stat icon={TrendingUp} label="Custo estimado" value={money(estTotal)} hint="pelo último preço pago" />
        <Stat icon={ClipboardList} label="Pedidos considerados" value={orders.length} hint={`até ${dateBR(end).slice(0, 5)} (${weekdayBR(end).split("-")[0]})`} />
        <Stat icon={CalendarHeart} label="Período" value={`${horizon} dias`} hint={multiplier === 1 ? "procura normal" : `procura ×${String(multiplier).replace(".", ",")}`} />
      </div>

      {supplies.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-stone-500">
            Cadastre seus insumos em <Link href="/app/estoque" className="font-medium text-brand-700 underline">Estoque → Insumos</Link> para gerar a lista de compras.
          </p>
        </Card>
      ) : (
        <ShoppingList key={`${horizon}-${multiplier}`} rows={rows} storeName={org.name} forDate={dateBR(todayISO(1)).slice(0, 5)} />
      )}

      <p className="mt-6 text-xs text-stone-500">
        Como calculamos: para cada insumo, usamos o maior valor entre os pedidos agendados no período (pela ficha técnica) e o ritmo normal das últimas {HISTORY_DAYS / 7} semanas,
        somamos o estoque mínimo e descontamos o que está em estoque e ainda não venceu. Flores com validade menor que o período são compradas só para os dias que aguentam.
      </p>
    </>
  );
}
