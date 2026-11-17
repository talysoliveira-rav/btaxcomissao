import Link from "next/link";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink, Card, Empty, Input, PageHeader, Select, Table, Button } from "@/components/ui";
import { dateBR, money, PAYMENT_LABEL, PERIOD_LABEL, STATUS_COLOR, STATUS_LABEL } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

export const metadata = { title: "Pedidos" };

const PAGE = 50;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; de?: string; ate?: string; pagamento?: string; p?: string }>;
}) {
  const sp = await searchParams;
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const page = Math.max(0, Number(sp.p ?? 0));

  let query = supabase
    .from("orders")
    .select("*, customers(name, phone), drivers(name)", { count: "exact" })
    .eq("org_id", org.id)
    .order("delivery_date", { ascending: false, nullsFirst: true })
    .order("number", { ascending: false })
    .range(page * PAGE, page * PAGE + PAGE - 1);

  if (sp.status) query = query.in("status", sp.status.split(",") as OrderStatus[]);
  if (sp.de) query = query.gte("delivery_date", sp.de);
  if (sp.ate) query = query.lte("delivery_date", sp.ate);
  if (sp.pagamento) query = query.eq("payment_status", sp.pagamento);
  if (sp.q) {
    const q = sp.q.replace(/[,()]/g, " ").trim();
    const asNum = Number(q.replace("#", ""));
    query = Number.isInteger(asNum) && asNum > 0
      ? query.eq("number", asNum)
      : query.or(`recipient_name.ilike.%${q}%,address_street.ilike.%${q}%,card_message.ilike.%${q}%`);
  }

  const { data, count } = await query;
  const orders = (data ?? []) as Order[];
  const qs = (p: number) => {
    const u = new URLSearchParams(Object.entries(sp).filter(([k, v]) => k !== "p" && v) as [string, string][]);
    u.set("p", String(p));
    return `?${u}`;
  };

  return (
    <>
      <PageHeader title="Pedidos" subtitle={`${count ?? 0} pedido(s)`} actions={<ButtonLink href="/app/pedidos/novo">+ Novo pedido</ButtonLink>} />

      <form className="mb-4 grid gap-2 rounded-xl border border-stone-200 bg-white p-3 sm:grid-cols-6">
        <Input name="q" defaultValue={sp.q} placeholder="Nº, destinatário, rua…" className="sm:col-span-2" />
        <Select name="status" defaultValue={sp.status ?? ""}>
          <option value="">Todos os status</option>
          <option value="novo,confirmado">Aguardando produção</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        <Select name="pagamento" defaultValue={sp.pagamento ?? ""}>
          <option value="">Pagamento: todos</option>
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
        </Select>
        <Input type="date" name="de" defaultValue={sp.de} aria-label="De" />
        <div className="flex gap-2">
          <Input type="date" name="ate" defaultValue={sp.ate} aria-label="Até" />
          <Button variant="secondary">Filtrar</Button>
        </div>
      </form>

      <Card>
        {orders.length === 0 ? (
          <Empty>Nenhum pedido encontrado.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Nº</th>
                <th>Entrega</th>
                <th>Cliente / destinatário</th>
                <th>Status</th>
                <th>Pagamento</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/app/pedidos/${o.id}`} className="font-medium text-brand-700 hover:underline">#{o.number}</Link></td>
                  <td className="whitespace-nowrap">
                    {dateBR(o.delivery_date)}
                    <span className="block text-xs text-stone-500">
                      {o.fulfillment === "retirada" ? "Retirada" : o.delivery_period ? PERIOD_LABEL[o.delivery_period] : ""}
                      {o.delivery_time ? ` ${o.delivery_time.slice(0, 5)}` : ""}
                    </span>
                  </td>
                  <td>
                    <Link href={`/app/pedidos/${o.id}`} className="hover:underline">{o.customers?.name ?? "—"}</Link>
                    {o.recipient_name && <span className="block text-xs text-stone-500">para {o.recipient_name}</span>}
                  </td>
                  <td><Badge className={STATUS_COLOR[o.status]}>{STATUS_LABEL[o.status]}</Badge></td>
                  <td>
                    <Badge className={o.payment_status === "pago" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>
                      {PAYMENT_LABEL[o.payment_status]}
                    </Badge>
                  </td>
                  <td className="text-right font-medium">{money(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {(count ?? 0) > PAGE && (
          <div className="mt-3 flex justify-between text-sm">
            {page > 0 ? <Link href={qs(page - 1)} className="text-brand-700">← Anteriores</Link> : <span />}
            {(page + 1) * PAGE < (count ?? 0) && <Link href={qs(page + 1)} className="text-brand-700">Próximos →</Link>}
          </div>
        )}
      </Card>
    </>
  );
}
