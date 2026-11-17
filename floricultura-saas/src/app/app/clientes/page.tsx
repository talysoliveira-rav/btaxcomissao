import { UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { Button, Card, Empty, Field, Input, PageHeader, Table, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { dateBR, whatsappLink } from "@/lib/format";
import type { Customer } from "@/lib/types";
import { createCustomer } from "./actions";

export const metadata = { title: "Clientes" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const { org } = await getOrgContext();
  const supabase = await createClient();
  let q = supabase.from("customers").select("*", { count: "exact" }).eq("org_id", org.id).order("name").limit(200);
  if (sp.q) {
    const term = sp.q.replace(/[,()]/g, " ").trim();
    q = q.or(`name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`);
  }
  const { data, count } = await q;
  const customers = (data ?? []) as Customer[];

  return (
    <>
      <PageHeader title="Clientes" subtitle={`${count ?? 0} cliente(s)`} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <form className="mb-3 flex gap-2">
            <Input name="q" defaultValue={sp.q} placeholder="Nome, telefone ou e-mail…" />
            <Button variant="secondary">Buscar</Button>
          </form>
          {customers.length === 0 ? sp.q ? (
            <Empty>Nenhum cliente encontrado.</Empty>
          ) : (
            <Empty icon={Users} title="Nenhum cliente ainda">
              Cadastre ao lado ou crie direto no pedido. Clientes novos também entram pelo formulário de pedido.
            </Empty>
          ) : (
            <Table>
              <thead><tr><th>Nome</th><th>Contato</th><th>Desde</th></tr></thead>
              <tbody>
                {customers.map((c) => {
                  const wa = whatsappLink(c.phone);
                  return (
                    <tr key={c.id}>
                      <td><Link href={`/app/clientes/${c.id}`} className="font-medium hover:text-brand-700">{c.name}</Link></td>
                      <td className="text-stone-600">
                        {c.phone && (wa ? <a href={wa} target="_blank" className="hover:text-emerald-700">{c.phone}</a> : c.phone)}
                        {c.email && <span className="block text-xs text-stone-500">{c.email}</span>}
                      </td>
                      <td className="text-stone-500">{dateBR(c.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>
        <Card icon={UserPlus} title="Novo cliente">
          <form action={createCustomer} className="space-y-3">
            <Field label="Nome"><Input name="name" required /></Field>
            <Field label="Telefone / WhatsApp"><Input name="phone" /></Field>
            <Field label="E-mail"><Input name="email" type="email" /></Field>
            <Field label="CPF/CNPJ"><Input name="document" /></Field>
            <Field label="Observações"><Textarea name="notes" placeholder="Preferências, alergias, flores favoritas…" /></Field>
            <SubmitButton className="w-full">Cadastrar</SubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}
