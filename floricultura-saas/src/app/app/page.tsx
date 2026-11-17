import Link from "next/link";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink, Card, Empty, PageHeader, Stat } from "@/components/ui";
import { money, num, PERIOD_LABEL, STATUS_COLOR, STATUS_LABEL, todayISO, dateBR, whatsappLink } from "@/lib/format";
import type { Order, Supply, UpcomingDate } from "@/lib/types";

export const metadata = { title: "Início" };

export default async function Dashboard() {
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const today = todayISO();
  const monthStart = today.slice(0, 8) + "01";

  const [todayRes, pendingRes, suppliesRes, datesRes, monthRes, expiringRes] = await Promise.all([
    supabase
      .from("orders")
      .select("*, customers(name, phone), drivers(name)")
      .eq("org_id", org.id)
      .eq("delivery_date", today)
      .neq("status", "cancelado")
      .order("delivery_period")
      .order("delivery_time"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("org_id", org.id).in("status", ["novo", "confirmado"]),
    supabase.from("supplies").select("id, name, unit, quantity, min_quantity").eq("org_id", org.id).eq("active", true),
    supabase.rpc("upcoming_special_dates", { p_org: org.id, p_days: 14 }),
    supabase.from("orders").select("total").eq("org_id", org.id).neq("status", "cancelado").gte("created_at", monthStart),
    supabase
      .from("supply_batches")
      .select("id, remaining, expires_at, supplies(name, unit)")
      .eq("org_id", org.id)
      .gt("remaining", 0)
      .lte("expires_at", todayISO(2))
      .order("expires_at"),
  ]);

  const todayOrders = (todayRes.data ?? []) as Order[];
  const lowStock = ((suppliesRes.data ?? []) as Supply[]).filter((s) => Number(s.quantity) <= Number(s.min_quantity));
  const dates = (datesRes.data ?? []) as UpcomingDate[];
  const monthRevenue = (monthRes.data ?? []).reduce((a, o: { total: number }) => a + Number(o.total), 0);
  const delivered = todayOrders.filter((o) => o.status === "entregue").length;
  const expiring = (expiringRes.data ?? []) as unknown as { id: string; remaining: number; expires_at: string; supplies: { name: string; unit: string } }[];

  return (
    <>
      <PageHeader
        title={`Olá, ${org.name} 🌸`}
        subtitle={`Hoje é ${new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Sao_Paulo" })}`}
        actions={<ButtonLink href="/app/pedidos/novo">+ Novo pedido</ButtonLink>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Entregas hoje" value={`${delivered}/${todayOrders.length}`} hint="entregues / total" href="/app/entregas" />
        <Stat label="Aguardando produção" value={pendingRes.count ?? 0} hint="pedidos novos ou confirmados" href="/app/pedidos?status=novo,confirmado" />
        <Stat label="Estoque baixo" value={lowStock.length} hint="insumos no mínimo ou abaixo" href="/app/estoque?baixo=1" />
        <Stat label="Vendas do mês" value={money(monthRevenue)} hint={`${monthRes.data?.length ?? 0} pedidos`} href="/app/relatorios" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Entregas de hoje" actions={<Link href="/app/entregas" className="text-xs font-medium text-brand-600">Ver agenda →</Link>}>
          {todayOrders.length === 0 ? (
            <Empty>Nenhuma entrega para hoje.</Empty>
          ) : (
            <ul className="divide-y divide-stone-100">
              {todayOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/app/pedidos/${o.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-stone-50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        #{o.number} · {o.recipient_name || o.customers?.name || "Sem destinatário"}
                      </p>
                      <p className="truncate text-xs text-stone-500">
                        {o.fulfillment === "retirada" ? "Retirada na loja" : [o.address_street, o.address_number, o.address_neighborhood].filter(Boolean).join(", ")}
                        {o.delivery_period && ` · ${o.delivery_period === "horario" && o.delivery_time ? o.delivery_time.slice(0, 5) : PERIOD_LABEL[o.delivery_period]}`}
                        {o.drivers?.name && ` · ${o.drivers.name}`}
                      </p>
                    </div>
                    <Badge className={STATUS_COLOR[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Datas especiais (14 dias)" actions={<Link href="/app/datas" className="text-xs font-medium text-brand-600">Todas →</Link>}>
            {dates.length === 0 ? (
              <Empty>Nenhuma data próxima.</Empty>
            ) : (
              <ul className="space-y-2.5">
                {dates.slice(0, 6).map((d) => {
                  const wa = whatsappLink(d.customer_phone, `Olá, ${d.customer_name.split(" ")[0]}! Lembramos que ${dateBR(d.next_date).slice(0, 5)} é ${d.title}. Que tal surpreender com flores? 💐`);
                  return (
                    <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
                      <div className="min-w-0">
                        <Link href={`/app/clientes/${d.customer_id}`} className="block truncate font-medium hover:text-brand-700">{d.title}</Link>
                        <p className="truncate text-xs text-stone-500">{d.customer_name} · {d.days_until === 0 ? "hoje" : `em ${d.days_until} dia(s)`}</p>
                      </div>
                      {wa && <a href={wa} target="_blank" className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">WhatsApp</a>}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Atenção no estoque">
            {lowStock.length === 0 && expiring.length === 0 ? (
              <Empty>Tudo em ordem. 🌿</Empty>
            ) : (
              <ul className="space-y-2 text-sm">
                {expiring.map((b) => (
                  <li key={b.id} className="flex justify-between gap-2">
                    <span className="truncate">⏳ {b.supplies.name}</span>
                    <span className="shrink-0 text-xs text-amber-700">{num(b.remaining)} {b.supplies.unit} vence {dateBR(b.expires_at)}</span>
                  </li>
                ))}
                {lowStock.map((s) => (
                  <li key={s.id} className="flex justify-between gap-2">
                    <Link href="/app/estoque?baixo=1" className="truncate hover:text-brand-700">⚠️ {s.name}</Link>
                    <span className="shrink-0 text-xs text-red-700">{num(s.quantity)} {s.unit} (mín. {num(s.min_quantity)})</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
