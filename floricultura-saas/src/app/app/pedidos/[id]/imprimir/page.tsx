import { notFound } from "next/navigation";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "@/components/print-button";
import { ButtonLink } from "@/components/ui";
import { dateBR, formatAddress, money, PERIOD_LABEL } from "@/lib/format";
import type { Order, OrderItem } from "@/lib/types";

export const metadata = { title: "Imprimir pedido" };

export default async function PrintOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from("orders").select("*, customers(name, phone)").eq("id", id).eq("org_id", org.id).maybeSingle(),
    supabase.from("order_items").select("*").eq("order_id", id),
  ]);
  if (!order) notFound();
  const o = order as Order;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="no-print mb-4 flex gap-2">
        <ButtonLink variant="ghost" href={`/app/pedidos/${o.id}`}>← Voltar</ButtonLink>
        <PrintButton />
      </div>

      {/* Ficha de produção / entrega */}
      <section className="print-break rounded-xl border border-stone-300 bg-white p-6 text-sm">
        <div className="flex items-start justify-between border-b border-dashed border-stone-300 pb-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-stone-500">{org.name}</p>
            <h1 className="text-2xl font-bold">Pedido #{o.number}</h1>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">{dateBR(o.delivery_date)}</p>
            <p>{o.fulfillment === "retirada" ? "RETIRADA" : o.delivery_period === "horario" ? o.delivery_time?.slice(0, 5) : o.delivery_period ? PERIOD_LABEL[o.delivery_period] : ""}</p>
          </div>
        </div>
        <h2 className="mt-4 font-semibold">Produção</h2>
        <ul className="mt-1 list-disc pl-5">
          {((items ?? []) as OrderItem[]).map((i) => (
            <li key={i.id}><b>{i.quantity}×</b> {i.description}{i.notes && ` — ${i.notes}`}</li>
          ))}
        </ul>
        {o.fulfillment === "entrega" && (
          <>
            <h2 className="mt-4 font-semibold">Entrega</h2>
            <p>{o.recipient_name} {o.recipient_phone && `· ${o.recipient_phone}`}</p>
            <p>{formatAddress(o)}</p>
            {o.address_reference && <p>Ref.: {o.address_reference}</p>}
          </>
        )}
        {!o.anonymous && o.customers?.name && <p className="mt-4 text-stone-600">Comprador: {o.customers.name} {o.customers.phone && `· ${o.customers.phone}`}</p>}
        {o.anonymous && <p className="mt-4 font-semibold">ENTREGA ANÔNIMA</p>}
        <p className="mt-2 text-stone-600">Total: {money(o.total)} · {o.payment_status === "pago" ? "PAGO" : "A RECEBER"}</p>
        {o.internal_notes && <p className="mt-2 rounded bg-stone-100 p-2">Obs.: {o.internal_notes}</p>}
      </section>

      {/* Cartão */}
      {o.card_message && (
        <section className="mt-6 flex min-h-[10cm] flex-col justify-center rounded-xl border border-stone-300 bg-white p-10 text-center">
          <p className="whitespace-pre-wrap font-serif text-2xl italic leading-relaxed">{o.card_message}</p>
          {o.card_signature && <p className="mt-6 font-serif text-lg">{o.card_signature}</p>}
        </section>
      )}
    </div>
  );
}
