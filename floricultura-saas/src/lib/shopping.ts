/**
 * Lista de compras inteligente: quanto comprar de cada insumo para os próximos dias.
 * Função pura (sem banco) para poder ser testada.
 */

export type ShopSupply = {
  id: string;
  name: string;
  unit: string;
  min_quantity: number;
  cost: number;
  shelf_life_days: number | null;
  purchase_multiple: number;
  category: string | null;
};
export type ShopBatch = { supply_id: string; remaining: number; expires_at: string | null; supplier: string | null; unit_cost: number; received_at: string };
/** Uso já agendado: quantidade de um insumo necessária numa data (pedidos ainda não produzidos). */
export type ShopNeed = { supply_id: string; date: string; qty: number; order: number };

export type ShopRow = {
  supply: ShopSupply;
  usable: number; // em estoque e ainda dentro da validade
  expiringSoon: number; // parte do estoque útil que vence dentro do período
  booked: number; // pedidos agendados no período considerado
  bookedOrders: number[];
  forecast: number; // ritmo normal (média histórica × dias × ajuste)
  avgDaily: number;
  demand: number;
  need: number;
  suggested: number;
  unitCost: number;
  estCost: number;
  supplier: string;
  daysCovered: number; // período efetivo (limitado pela validade)
  rebuyIn: number | null; // dias até precisar comprar de novo (flores de vida curta)
  reasons: string[];
};

const DAY = 86_400_000;
const utc = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const addDays = (iso: string, n: number) => new Date(utc(iso) + n * DAY).toISOString().slice(0, 10);
const fmt = (n: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(n);

export function computeShopping(opts: {
  today: string;
  horizon: number; // dias
  multiplier: number; // ajuste para datas especiais (aplicado ao ritmo normal)
  historyDays: number;
  supplies: ShopSupply[];
  batches: ShopBatch[];
  needs: ShopNeed[];
  consumption: Map<string, number>; // total consumido no histórico (positivo)
}): ShopRow[] {
  const { today, horizon, multiplier, historyDays, supplies, batches, needs, consumption } = opts;
  const end = addDays(today, horizon - 1);

  return supplies.map((s) => {
    const mine = batches.filter((b) => b.supply_id === s.id);
    const live = mine.filter((b) => Number(b.remaining) > 0 && (!b.expires_at || b.expires_at >= today));
    const usable = live.reduce((a, b) => a + Number(b.remaining), 0);
    const expiringSoon = live.filter((b) => b.expires_at && b.expires_at <= end).reduce((a, b) => a + Number(b.remaining), 0);

    // flor que dura menos que o período: compra só para os dias de validade
    const shelf = s.shelf_life_days && s.shelf_life_days > 0 ? s.shelf_life_days : null;
    const daysCovered = shelf ? Math.min(horizon, shelf) : horizon;
    const coverEnd = addDays(today, daysCovered - 1);

    const myNeeds = needs.filter((n) => n.supply_id === s.id && n.date <= coverEnd);
    const booked = myNeeds.reduce((a, n) => a + n.qty, 0);
    const bookedOrders = [...new Set(myNeeds.map((n) => n.order))].sort((a, b) => a - b);

    const avgDaily = (consumption.get(s.id) ?? 0) / historyDays;
    const forecast = avgDaily * daysCovered * multiplier;
    const demand = Math.max(booked, forecast);
    const min = Number(s.min_quantity) || 0;
    const need = demand + min - usable;
    const multiple = Number(s.purchase_multiple) > 0 ? Number(s.purchase_multiple) : 1;
    const suggested = need > 0.0001 ? Math.ceil(need / multiple - 1e-9) * multiple : 0;

    // fornecedor e custo da compra mais recente
    const last = [...mine].sort((a, b) => b.received_at.localeCompare(a.received_at))[0];
    const unitCost = Number(last?.unit_cost) || Number(s.cost) || 0;

    const reasons: string[] = [];
    if (booked > 0) reasons.push(`${bookedOrders.length} pedido(s) agendado(s) usam ${fmt(booked)} ${s.unit}`);
    if (avgDaily > 0) reasons.push(`ritmo normal: ${fmt(avgDaily)} ${s.unit}/dia${multiplier !== 1 ? ` × ${fmt(multiplier)} (data especial)` : ""}`);
    if (forecast > booked && booked > 0) reasons.push("previsão pelo ritmo normal é maior que os pedidos agendados");
    reasons.push(`em estoque útil: ${fmt(usable)} ${s.unit}`);
    if (min > 0) reasons.push(`mínimo: ${fmt(min)} ${s.unit}`);
    if (expiringSoon > 0) reasons.push(`${fmt(expiringSoon)} ${s.unit} vencem até ${end.slice(8, 10)}/${end.slice(5, 7)}: use primeiro`);
    if (multiple > 1 && suggested > 0) reasons.push(`arredondado para múltiplos de ${fmt(multiple)}`);
    if (shelf && shelf < horizon) reasons.push(`dura ${shelf} dia(s): compra só para esse período`);

    return {
      supply: s,
      usable,
      expiringSoon,
      booked,
      bookedOrders,
      forecast,
      avgDaily,
      demand,
      need,
      suggested,
      unitCost,
      estCost: suggested * unitCost,
      supplier: last?.supplier?.trim() || "Sem fornecedor definido",
      daysCovered,
      rebuyIn: shelf && shelf < horizon ? shelf : null,
      reasons,
    };
  });
}

/** Texto do pedido para enviar ao fornecedor pelo WhatsApp. */
export function supplierMessage(store: string, supplier: string, rows: { name: string; qty: number; unit: string }[], dateBR: string) {
  const lines = rows.map((r) => `• ${r.name}: ${fmt(r.qty)} ${r.unit}`);
  return `Olá${supplier && !supplier.startsWith("Sem ") ? `, ${supplier}` : ""}! Pedido da ${store} para ${dateBR}:\n\n${lines.join("\n")}\n\nObrigado!`;
}
