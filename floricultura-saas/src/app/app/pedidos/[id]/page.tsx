import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, ButtonLink, Card, Input, PageHeader, Select, Table } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import {
  dateBR, dateTimeBR, formatAddress, money, PAYMENT_LABEL, PAYMENT_METHODS, PERIOD_LABEL, STATUS_COLOR, STATUS_FLOW, STATUS_LABEL, whatsappLink,
} from "@/lib/format";
import type { Driver, Order, OrderItem, OrderStatus } from "@/lib/types";
import { assignDriver, duplicateOrder, markPaid, setOrderStatus } from "../actions";

export const metadata = { title: "Pedido" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const [{ data: order }, { data: items }, { data: history }, { data: drivers }] = await Promise.all([
    supabase.from("orders").select("*, customers(name, phone), drivers(name)").eq("id", id).eq("org_id", org.id).maybeSingle(),
    supabase.from("order_items").select("*").eq("order_id", id),
    supabase.from("order_status_history").select("*").eq("order_id", id).order("created_at"),
    supabase.from("drivers").select("*").eq("org_id", org.id).eq("active", true).order("name"),
  ]);
  if (!order) notFound();
  const o = order as Order;
  const its = (items ?? []) as OrderItem[];
  const idx = STATUS_FLOW.indexOf(o.status);
  const next: OrderStatus | undefined = idx >= 0 ? STATUS_FLOW[idx + 1] : undefined;
  const closed = o.status === "entregue" || o.status === "cancelado";
  const customerPhone = o.customers?.phone;
  const waCustomer = whatsappLink(
    customerPhone,
    o.status === "entregue"
      ? `Olá! Seu pedido #${o.number} foi entregue${o.recipient_name ? ` para ${o.recipient_name}` : ""}. Obrigado pela preferência! 🌷`
      : `Olá! Aqui é da ${org.name}. Sobre o seu pedido #${o.number}: status atual "${STATUS_LABEL[o.status]}".`,
  );

  return (
    <>
      <PageHeader
        title={`Pedido #${o.number}`}
        subtitle={<>Criado em {dateTimeBR(o.created_at)}{o.channel && ` · via ${o.channel}`}</>}
        actions={
          <>
            <ButtonLink variant="secondary" href={`/app/pedidos/${o.id}/imprimir`}>🖨️ Imprimir</ButtonLink>
            {!closed && <ButtonLink variant="secondary" href={`/app/pedidos/${o.id}/editar`}>Editar</ButtonLink>}
            <form action={duplicateOrder}>
              <input type="hidden" name="id" value={o.id} />
              <Button variant="ghost">Duplicar</Button>
            </form>
          </>
        }
      />

      {/* Linha do tempo de status */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FLOW.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${o.status === "cancelado" ? "bg-stone-100 text-stone-400" : i <= idx ? STATUS_COLOR[s] : "bg-stone-100 text-stone-400"}`}>
                {STATUS_LABEL[s]}
              </span>
              {i < STATUS_FLOW.length - 1 && <span className="text-stone-300">→</span>}
            </div>
          ))}
          {o.status === "cancelado" && <Badge className={STATUS_COLOR.cancelado}>Cancelado</Badge>}
        </div>
        {!closed && (
          <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-stone-100 pt-4">
            {next && (
              <form action={setOrderStatus} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={o.id} />
                <input type="hidden" name="status" value={next} />
                {next === "entregue" && <Input name="delivery_proof" placeholder="Recebido por… (opcional)" className="w-56" />}
                <Button variant={next === "entregue" ? "leaf" : "primary"}>Avançar para “{STATUS_LABEL[next]}”</Button>
              </form>
            )}
            <form action={setOrderStatus}>
              <input type="hidden" name="id" value={o.id} />
              <input type="hidden" name="status" value="cancelado" />
              <ConfirmButton variant="danger" message={`Cancelar o pedido #${o.number}?${o.stock_consumed ? " Os insumos voltarão ao estoque." : ""}`}>
                Cancelar pedido
              </ConfirmButton>
            </form>
            {(next === "em_producao") && <p className="text-xs text-stone-500">Ao entrar em produção, os insumos da ficha técnica são baixados do estoque.</p>}
          </div>
        )}
        {o.status === "cancelado" && (
          <form action={setOrderStatus} className="mt-4 border-t border-stone-100 pt-4">
            <input type="hidden" name="id" value={o.id} />
            <input type="hidden" name="status" value="novo" />
            <Button variant="secondary">Reabrir pedido</Button>
          </form>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Itens">
            <Table>
              <thead>
                <tr><th>Item</th><th className="text-right">Qtd</th><th className="text-right">Unit.</th><th className="text-right">Total</th></tr>
              </thead>
              <tbody>
                {its.map((i) => (
                  <tr key={i.id}>
                    <td>
                      {i.product_id ? <Link className="hover:underline" href={`/app/catalogo/${i.product_id}`}>{i.description}</Link> : i.description}
                      {i.notes && <span className="block text-xs text-stone-500">{i.notes}</span>}
                    </td>
                    <td className="text-right">{i.quantity}</td>
                    <td className="text-right">{money(i.unit_price)}</td>
                    <td className="text-right">{money(i.quantity * Number(i.unit_price))}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <dl className="ml-auto mt-3 max-w-xs space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-stone-500">Subtotal</dt><dd>{money(o.subtotal)}</dd></div>
              {Number(o.delivery_fee) > 0 && <div className="flex justify-between"><dt className="text-stone-500">Entrega</dt><dd>{money(o.delivery_fee)}</dd></div>}
              {Number(o.discount) > 0 && <div className="flex justify-between"><dt className="text-stone-500">Desconto</dt><dd>− {money(o.discount)}</dd></div>}
              <div className="flex justify-between border-t border-stone-100 pt-1 text-base font-semibold"><dt>Total</dt><dd>{money(o.total)}</dd></div>
            </dl>
          </Card>

          <Card title={o.fulfillment === "entrega" ? "Entrega" : "Retirada na loja"}>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-stone-500">Data</dt><dd>{dateBR(o.delivery_date)} {o.delivery_period && `· ${o.delivery_period === "horario" ? o.delivery_time?.slice(0, 5) : PERIOD_LABEL[o.delivery_period]}`}</dd></div>
              <div><dt className="text-xs text-stone-500">Destinatário</dt><dd>{o.recipient_name ?? "—"} {o.recipient_phone && `· ${o.recipient_phone}`}</dd></div>
              {o.fulfillment === "entrega" && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-stone-500">Endereço</dt>
                  <dd>
                    {formatAddress(o)}
                    {o.address_reference && <span className="block text-xs text-stone-500">Ref.: {o.address_reference}</span>}
                    <a className="mt-1 inline-block text-xs font-medium text-brand-700" target="_blank" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(o))}`}>
                      Abrir no mapa ↗
                    </a>
                  </dd>
                </div>
              )}
              {o.delivered_at && <div><dt className="text-xs text-stone-500">Entregue em</dt><dd>{dateTimeBR(o.delivered_at)}{o.delivery_proof && ` · ${o.delivery_proof}`}</dd></div>}
            </dl>
          </Card>

          <Card title="Cartão">
            {o.card_message ? (
              <blockquote className="rounded-lg bg-brand-50 p-4 font-serif text-lg italic text-stone-800">
                “{o.card_message}”
                {o.card_signature && <footer className="mt-2 text-right text-sm not-italic text-stone-600">— {o.card_signature}</footer>}
              </blockquote>
            ) : (
              <p className="text-sm text-stone-400">Sem cartão.</p>
            )}
            {o.anonymous && <p className="mt-2 text-xs font-medium text-amber-700">⚠️ Entrega anônima — não revelar remetente.</p>}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Cliente">
            {o.customer_id ? (
              <div className="text-sm">
                <Link href={`/app/clientes/${o.customer_id}`} className="font-medium hover:text-brand-700">{o.customers?.name}</Link>
                {customerPhone && <p className="text-stone-500">{customerPhone}</p>}
                {waCustomer && <a href={waCustomer} target="_blank" className="mt-2 inline-block rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Avisar no WhatsApp</a>}
              </div>
            ) : (
              <p className="text-sm text-stone-400">Venda sem cadastro.</p>
            )}
          </Card>

          <Card title="Pagamento">
            <p className="text-sm">
              <Badge className={o.payment_status === "pago" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>{PAYMENT_LABEL[o.payment_status]}</Badge>
              {o.payment_method && <span className="ml-2 text-stone-600">{o.payment_method}</span>}
            </p>
            {o.payment_status === "pendente" && (
              <form action={markPaid} className="mt-3 flex gap-2">
                <input type="hidden" name="id" value={o.id} />
                <Select name="payment_method" defaultValue={o.payment_method ?? "Pix"}>
                  {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
                </Select>
                <Button variant="leaf">Marcar pago</Button>
              </form>
            )}
          </Card>

          {o.fulfillment === "entrega" && (
            <Card title="Entregador">
              <form action={assignDriver} className="flex gap-2">
                <input type="hidden" name="id" value={o.id} />
                <Select name="driver_id" defaultValue={o.driver_id ?? ""}>
                  <option value="">— sem entregador —</option>
                  {((drivers ?? []) as Driver[]).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
                <Button variant="secondary">Salvar</Button>
              </form>
              {(drivers ?? []).length === 0 && <p className="mt-2 text-xs text-stone-500">Cadastre entregadores em <Link className="underline" href="/app/configuracoes">Configurações</Link>.</p>}
            </Card>
          )}

          {o.internal_notes && <Card title="Observações internas"><p className="whitespace-pre-wrap text-sm">{o.internal_notes}</p></Card>}

          <Card title="Histórico">
            <ol className="space-y-2 text-sm">
              {(history ?? []).map((h: { id: string; to_status: OrderStatus; created_at: string }) => (
                <li key={h.id} className="flex justify-between gap-2">
                  <span>{STATUS_LABEL[h.to_status]}</span>
                  <span className="text-xs text-stone-500">{dateTimeBR(h.created_at)}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
