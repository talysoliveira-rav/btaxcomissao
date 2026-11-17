import { Truck } from "lucide-react";
import Link from "next/link";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, ButtonLink, Card, Empty, Input, PageHeader, Select } from "@/components/ui";
import { PrintButton } from "@/components/print-button";
import { dateBR, formatAddress, money, PERIOD_LABEL, STATUS_COLOR, STATUS_LABEL, todayISO, weekdayBR } from "@/lib/format";
import type { DeliveryPeriod, Driver, Order } from "@/lib/types";
import { assignDriver, setOrderStatus } from "../pedidos/actions";

export const metadata = { title: "Entregas" };

const PERIODS: (DeliveryPeriod | "sem")[] = ["manha", "horario", "tarde", "noite", "sem"];

function shift(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export default async function DeliveriesPage({ searchParams }: { searchParams: Promise<{ data?: string; entregador?: string }> }) {
  const sp = await searchParams;
  const date = sp.data && /^\d{4}-\d{2}-\d{2}$/.test(sp.data) ? sp.data : todayISO();
  const { org } = await getOrgContext();
  const supabase = await createClient();

  let q = supabase
    .from("orders")
    .select("*, customers(name, phone), drivers(name), order_items(description, quantity)")
    .eq("org_id", org.id)
    .eq("delivery_date", date)
    .neq("status", "cancelado")
    .order("delivery_time", { nullsFirst: false })
    .order("address_neighborhood");
  if (sp.entregador === "sem") q = q.is("driver_id", null);
  else if (sp.entregador) q = q.eq("driver_id", sp.entregador);

  const [{ data }, { data: driversData }] = await Promise.all([
    q,
    supabase.from("drivers").select("*").eq("org_id", org.id).eq("active", true).order("name"),
  ]);
  type Row = Order & { order_items: { description: string; quantity: number }[] };
  const orders = (data ?? []) as Row[];
  const drivers = (driversData ?? []) as Driver[];
  const deliveries = orders.filter((o) => o.fulfillment === "entrega");
  const pickups = orders.filter((o) => o.fulfillment === "retirada");
  const done = orders.filter((o) => o.status === "entregue").length;

  const groups = PERIODS.map((p) => ({
    period: p,
    items: deliveries.filter((o) => (p === "sem" ? !o.delivery_period : o.delivery_period === p)),
  })).filter((g) => g.items.length);

  const OrderRow = ({ o }: { o: Row }) => (
    <li className="grid gap-3 py-3 sm:grid-cols-12">
      <div className="sm:col-span-5">
        <Link href={`/app/pedidos/${o.id}`} className="font-medium hover:text-brand-700">
          #{o.number} · {o.recipient_name || o.customers?.name || "—"}
        </Link>
        {o.recipient_phone && <span className="ml-1 text-xs text-stone-500">{o.recipient_phone}</span>}
        {o.fulfillment === "entrega" && (
          <p className="text-sm text-stone-600">
            {formatAddress(o)}
            {o.address_reference && <span className="text-stone-400"> · {o.address_reference}</span>}
          </p>
        )}
        <p className="text-xs text-stone-500">
          {o.order_items.map((i) => `${i.quantity}× ${i.description}`).join(", ")}
          {o.payment_status !== "pago" && <span className="ml-1 font-medium text-amber-700">· cobrar {money(o.total)}</span>}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:col-span-7 sm:justify-end">
        {o.delivery_time && <Badge>{o.delivery_time.slice(0, 5)}</Badge>}
        <Badge className={STATUS_COLOR[o.status]}>{STATUS_LABEL[o.status]}</Badge>
        {o.fulfillment === "entrega" && (
          <form action={assignDriver} className="no-print flex gap-1">
            <input type="hidden" name="id" value={o.id} />
            <Select name="driver_id" defaultValue={o.driver_id ?? ""} className="w-36 py-1">
              <option value="">Entregador…</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <Button variant="secondary" className="px-2 py-1">OK</Button>
          </form>
        )}
        <span className="hidden text-sm print:inline">{o.drivers?.name}</span>
        {o.status !== "entregue" && (
          <form action={setOrderStatus} className="no-print">
            <input type="hidden" name="id" value={o.id} />
            {o.fulfillment === "entrega" && o.status !== "em_rota" ? (
              <><input type="hidden" name="status" value="em_rota" /><Button variant="secondary" className="px-2 py-1">Saiu p/ entrega</Button></>
            ) : (
              <><input type="hidden" name="status" value="entregue" /><Button variant="leaf" className="px-2 py-1">{o.fulfillment === "retirada" ? "Retirado" : "Entregue"}</Button></>
            )}
          </form>
        )}
      </div>
    </li>
  );

  return (
    <>
      <PageHeader
        title="Entregas"
        subtitle={<span className="capitalize">{weekdayBR(date)}, {dateBR(date)} · {done}/{orders.length} concluídas</span>}
        actions={<PrintButton label="Folha de rota" />}
      />

      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        <ButtonLink variant="secondary" href={`?data=${shift(date, -1)}${sp.entregador ? `&entregador=${sp.entregador}` : ""}`}>←</ButtonLink>
        <ButtonLink variant={date === todayISO() ? "primary" : "secondary"} href="?">Hoje</ButtonLink>
        <ButtonLink variant={date === todayISO(1) ? "primary" : "secondary"} href={`?data=${todayISO(1)}`}>Amanhã</ButtonLink>
        <ButtonLink variant="secondary" href={`?data=${shift(date, 1)}${sp.entregador ? `&entregador=${sp.entregador}` : ""}`}>→</ButtonLink>
        <form className="flex gap-2">
          <Input type="date" name="data" defaultValue={date} className="w-40" />
          <Select name="entregador" defaultValue={sp.entregador ?? ""} className="w-44">
            <option value="">Todos entregadores</option>
            <option value="sem">Sem entregador</option>
            {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Button variant="secondary">Ver</Button>
        </form>
      </div>

      {orders.length === 0 ? (
        <Card><Empty icon={Truck} title="Nenhuma entrega ou retirada neste dia" action={{ href: "/app/pedidos/novo", label: "Criar pedido" }}>Use as setas para ver outros dias.</Empty></Card>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <Card key={g.period} title={`${g.period === "sem" ? "Sem período" : PERIOD_LABEL[g.period]} (${g.items.length})`}>
              <ul className="divide-y divide-stone-100">{g.items.map((o) => <OrderRow key={o.id} o={o} />)}</ul>
            </Card>
          ))}
          {pickups.length > 0 && (
            <Card title={`Retiradas na loja (${pickups.length})`}>
              <ul className="divide-y divide-stone-100">{pickups.map((o) => <OrderRow key={o.id} o={o} />)}</ul>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
