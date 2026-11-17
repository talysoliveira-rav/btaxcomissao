import { Cake, ClipboardList, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, ButtonLink, Card, Empty, Field, Input, PageHeader, Stat, Table, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmButton } from "@/components/confirm-button";
import { dateBR, money, STATUS_COLOR, STATUS_LABEL, whatsappLink } from "@/lib/format";
import type { Customer, CustomerAddress, Order, SpecialDate } from "@/lib/types";
import { addAddress, addSpecialDate, deleteCustomer, removeAddress, removeSpecialDate, updateCustomer } from "../actions";

export const metadata = { title: "Cliente" };

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const [{ data: customer }, { data: addresses }, { data: dates }, { data: orders }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).eq("org_id", org.id).maybeSingle(),
    supabase.from("customer_addresses").select("*").eq("customer_id", id).order("created_at"),
    supabase.from("special_dates").select("*").eq("customer_id", id).order("month").order("day"),
    supabase.from("orders").select("*").eq("customer_id", id).order("created_at", { ascending: false }).limit(100),
  ]);
  if (!customer) notFound();
  const c = customer as Customer;
  const os = (orders ?? []) as Order[];
  const valid = os.filter((o) => o.status !== "cancelado");
  const spent = valid.reduce((a, o) => a + Number(o.total), 0);
  const wa = whatsappLink(c.phone);

  return (
    <>
      <PageHeader
        title={c.name}
        subtitle={<Link href="/app/clientes" className="hover:underline">← Clientes</Link>}
        actions={
          <>
            {wa && <a href={wa} target="_blank" className="rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700">WhatsApp</a>}
            <ButtonLink href="/app/pedidos/novo">+ Novo pedido</ButtonLink>
          </>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:gap-4 sm:grid-cols-3">
        <Stat label="Pedidos" value={valid.length} />
        <Stat label="Total comprado" value={money(spent)} />
        <Stat label="Ticket médio" value={money(valid.length ? spent / valid.length : 0)} hint={valid[0] ? `último em ${dateBR(valid[0].created_at)}` : undefined} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card icon={Cake} title="Datas especiais">
            {(dates ?? []).length === 0 ? <p className="mb-3 text-sm text-stone-400">Nenhuma data cadastrada. Aniversários e bodas viram lembretes de venda!</p> : (
              <ul className="mb-4 divide-y divide-stone-100">
                {((dates ?? []) as SpecialDate[]).map((d) => (
                  <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                    <span><Badge className="mr-2 bg-brand-50 text-brand-700">{String(d.day).padStart(2, "0")} {MONTHS[d.month - 1]}</Badge>{d.title}{d.person_name && <span className="text-stone-500"> · {d.person_name}</span>}</span>
                    <form action={removeSpecialDate}>
                      <input type="hidden" name="id" value={d.id} /><input type="hidden" name="customer_id" value={c.id} />
                      <button className="text-xs text-red-600 hover:underline">remover</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <form action={addSpecialDate} className="grid gap-2 border-t border-stone-100 pt-3 sm:grid-cols-4">
              <input type="hidden" name="customer_id" value={c.id} />
              <Input name="title" required placeholder="Ex.: Aniversário da esposa" className="sm:col-span-2" />
              <Input name="person_name" placeholder="Nome da pessoa" />
              <Input name="date" type="date" required aria-label="Data (o ano é ignorado)" />
              <Button variant="secondary" className="sm:col-span-4 sm:justify-self-start">Adicionar data</Button>
            </form>
          </Card>

          <Card icon={MapPin} title="Endereços">
            {(addresses ?? []).length === 0 ? <p className="mb-3 text-sm text-stone-400">Nenhum endereço salvo.</p> : (
              <ul className="mb-4 divide-y divide-stone-100">
                {((addresses ?? []) as CustomerAddress[]).map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                    <span>
                      {a.label && <b>{a.label}: </b>}{a.street}, {a.number}{a.complement && ` — ${a.complement}`}
                      <span className="block text-xs text-stone-500">{[a.neighborhood, a.city, a.state, a.zip].filter(Boolean).join(" · ")}{a.reference && ` · Ref.: ${a.reference}`}</span>
                    </span>
                    <form action={removeAddress}>
                      <input type="hidden" name="id" value={a.id} /><input type="hidden" name="customer_id" value={c.id} />
                      <button className="text-xs text-red-600 hover:underline">remover</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <form action={addAddress} className="grid grid-cols-6 gap-2 border-t border-stone-100 pt-3">
              <input type="hidden" name="customer_id" value={c.id} />
              <Input name="label" placeholder="Apelido (Casa, Mãe…)" className="col-span-6 sm:col-span-2" />
              <Input name="street" required placeholder="Rua" className="col-span-4 sm:col-span-3" />
              <Input name="number" placeholder="Nº" className="col-span-2 sm:col-span-1" />
              <Input name="complement" placeholder="Complemento" className="col-span-3 sm:col-span-2" />
              <Input name="neighborhood" placeholder="Bairro" className="col-span-3 sm:col-span-2" />
              <Input name="city" placeholder="Cidade" className="col-span-4 sm:col-span-1" />
              <Input name="state" placeholder="UF" maxLength={2} className="col-span-2 sm:col-span-1" />
              <Input name="zip" placeholder="CEP" className="col-span-2" />
              <Input name="reference" placeholder="Ponto de referência" className="col-span-4" />
              <Button variant="secondary" className="col-span-6 justify-self-start">Adicionar endereço</Button>
            </form>
          </Card>

          <Card icon={ClipboardList} title="Histórico de pedidos">
            {os.length === 0 ? <Empty icon={ClipboardList} title="Nenhum pedido ainda" action={{ href: "/app/pedidos/novo", label: "Criar pedido" }} /> : (
              <Table>
                <thead><tr><th>Nº</th><th>Data</th><th>Destinatário</th><th>Status</th><th className="text-right">Total</th></tr></thead>
                <tbody>
                  {os.map((o) => (
                    <tr key={o.id}>
                      <td><Link className="font-medium text-brand-700 hover:underline" href={`/app/pedidos/${o.id}`}>#{o.number}</Link></td>
                      <td>{dateBR(o.delivery_date ?? o.created_at)}</td>
                      <td>{o.recipient_name ?? "—"}</td>
                      <td><Badge className={STATUS_COLOR[o.status]}>{STATUS_LABEL[o.status]}</Badge></td>
                      <td className="text-right">{money(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>

        <Card title="Dados do cliente">
          <form action={updateCustomer} className="space-y-3">
            <input type="hidden" name="id" value={c.id} />
            <Field label="Nome"><Input name="name" required defaultValue={c.name} /></Field>
            <Field label="Telefone / WhatsApp"><Input name="phone" defaultValue={c.phone ?? ""} /></Field>
            <Field label="E-mail"><Input name="email" type="email" defaultValue={c.email ?? ""} /></Field>
            <Field label="CPF/CNPJ"><Input name="document" defaultValue={c.document ?? ""} /></Field>
            <Field label="Observações"><Textarea name="notes" defaultValue={c.notes ?? ""} /></Field>
            <SubmitButton>Salvar</SubmitButton>
          </form>
          <form action={deleteCustomer} className="mt-3 border-t border-stone-100 pt-3">
            <input type="hidden" name="id" value={c.id} />
            <ConfirmButton variant="danger" message="Excluir este cliente? Os pedidos são mantidos sem vínculo.">Excluir cliente</ConfirmButton>
          </form>
        </Card>
      </div>
    </>
  );
}
