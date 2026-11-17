import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { Button, Card, Empty, Input, PageHeader, Stat, Table } from "@/components/ui";
import { money, num, todayISO } from "@/lib/format";

export const metadata = { title: "Relatórios" };

type OrderRow = {
  id: string; total: number; channel: string | null; payment_method: string | null; payment_status: string;
  fulfillment: string; status: string; delivery_fee: number; drivers: { name: string } | null;
  order_items: { description: string; quantity: number; unit_price: number; product_id: string | null }[];
};

function Bars({ rows }: { rows: { label: string; value: number; extra?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <Empty>Sem dados no período.</Empty>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="flex justify-between"><span>{r.label}</span><span className="font-medium">{money(r.value)}{r.extra && <span className="ml-1 text-xs text-stone-500">{r.extra}</span>}</span></div>
          <div className="mt-1 h-2 rounded-full bg-stone-100"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

function groupSum(rows: OrderRow[], key: (o: OrderRow) => string) {
  const m = new Map<string, { value: number; n: number }>();
  for (const o of rows) {
    const k = key(o);
    const cur = m.get(k) ?? { value: 0, n: 0 };
    m.set(k, { value: cur.value + Number(o.total), n: cur.n + 1 });
  }
  return [...m.entries()].map(([label, v]) => ({ label, value: v.value, extra: `(${v.n})` })).sort((a, b) => b.value - a.value);
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ de?: string; ate?: string }> }) {
  const sp = await searchParams;
  const de = sp.de ?? todayISO().slice(0, 8) + "01";
  const ate = sp.ate ?? todayISO();
  const { org } = await getOrgContext();
  const supabase = await createClient();

  const [{ data }, { data: losses }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, total, channel, payment_method, payment_status, fulfillment, status, delivery_fee, drivers(name), order_items(description, quantity, unit_price, product_id)")
      .eq("org_id", org.id)
      .neq("status", "cancelado")
      .gte("delivery_date", de)
      .lte("delivery_date", ate),
    supabase
      .from("stock_movements")
      .select("quantity, supplies(name, cost)")
      .eq("org_id", org.id)
      .eq("type", "perda")
      .gte("created_at", de)
      .lte("created_at", `${ate}T23:59:59`),
  ]);
  const orders = (data ?? []) as unknown as OrderRow[];
  const revenue = orders.reduce((a, o) => a + Number(o.total), 0);
  const received = orders.filter((o) => o.payment_status === "pago").reduce((a, o) => a + Number(o.total), 0);

  const products = new Map<string, { qty: number; value: number }>();
  for (const o of orders) for (const i of o.order_items) {
    const cur = products.get(i.description) ?? { qty: 0, value: 0 };
    products.set(i.description, { qty: cur.qty + i.quantity, value: cur.value + i.quantity * Number(i.unit_price) });
  }
  const topProducts = [...products.entries()].sort((a, b) => b[1].value - a[1].value).slice(0, 10);

  const lossRows = (losses ?? []) as unknown as { quantity: number; supplies: { name: string; cost: number } }[];
  const lossBySupply = new Map<string, number>();
  for (const l of lossRows) lossBySupply.set(l.supplies.name, (lossBySupply.get(l.supplies.name) ?? 0) + -Number(l.quantity) * Number(l.supplies.cost));
  const lossTotal = [...lossBySupply.values()].reduce((a, b) => a + b, 0);

  const deliveries = orders.filter((o) => o.fulfillment === "entrega");
  const byDriver = new Map<string, { n: number; fee: number }>();
  for (const o of deliveries.filter((o) => o.status === "entregue")) {
    const k = o.drivers?.name ?? "Sem entregador";
    const cur = byDriver.get(k) ?? { n: 0, fee: 0 };
    byDriver.set(k, { n: cur.n + 1, fee: cur.fee + Number(o.delivery_fee) });
  }

  return (
    <>
      <PageHeader title="Relatórios" subtitle="Considera a data de entrega/retirada dos pedidos não cancelados." />
      <form className="mb-6 flex flex-wrap items-end gap-2">
        <Input type="date" name="de" defaultValue={de} className="w-40" />
        <Input type="date" name="ate" defaultValue={ate} className="w-40" />
        <Button variant="secondary">Atualizar</Button>
      </form>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Faturamento" value={money(revenue)} hint={`${orders.length} pedidos`} />
        <Stat label="Recebido" value={money(received)} hint={`a receber ${money(revenue - received)}`} />
        <Stat label="Ticket médio" value={money(orders.length ? revenue / orders.length : 0)} />
        <Stat label="Perdas de estoque" value={money(lossTotal)} hint={revenue ? `${((lossTotal / revenue) * 100).toFixed(1)}% do faturamento` : undefined} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Por canal de venda"><Bars rows={groupSum(orders, (o) => o.channel ?? "Não informado")} /></Card>
        <Card title="Por forma de pagamento"><Bars rows={groupSum(orders, (o) => o.payment_method ?? "Não informado")} /></Card>
        <Card title="Produtos mais vendidos">
          {topProducts.length === 0 ? <Empty>Sem vendas no período.</Empty> : (
            <Table>
              <thead><tr><th>Produto</th><th className="text-right">Qtd</th><th className="text-right">Valor</th></tr></thead>
              <tbody>{topProducts.map(([name, v]) => <tr key={name}><td>{name}</td><td className="text-right">{v.qty}</td><td className="text-right">{money(v.value)}</td></tr>)}</tbody>
            </Table>
          )}
        </Card>
        <div className="space-y-6">
          <Card title="Entregas realizadas por entregador">
            {byDriver.size === 0 ? <Empty>Nenhuma entrega concluída.</Empty> : (
              <Table>
                <thead><tr><th>Entregador</th><th className="text-right">Entregas</th><th className="text-right">Taxas</th></tr></thead>
                <tbody>{[...byDriver.entries()].map(([n, v]) => <tr key={n}><td>{n}</td><td className="text-right">{v.n}</td><td className="text-right">{money(v.fee)}</td></tr>)}</tbody>
              </Table>
            )}
          </Card>
          <Card title="Perdas por insumo">
            {lossBySupply.size === 0 ? <Empty>Nenhuma perda registrada. 🌿</Empty> : (
              <ul className="space-y-1 text-sm">
                {[...lossBySupply.entries()].sort((a, b) => b[1] - a[1]).map(([n, v]) => <li key={n} className="flex justify-between"><span>{n}</span><span>{money(v)}</span></li>)}
              </ul>
            )}
            <p className="mt-3 text-xs text-stone-500">{num(lossRows.length)} registro(s) de perda no período.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
