import Link from "next/link";
import QRCode from "qrcode";
import { Bike, Download, Globe, QrCode, Store, Tag, Users } from "lucide-react";
import { ShareLink } from "@/components/share-link";
import { siteUrl, storePath } from "@/lib/site";
import { StorefrontForm } from "./storefront-form";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Card, Field, Input, PageHeader, Select, Table } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmButton } from "@/components/confirm-button";
import type { Driver, MemberRole } from "@/lib/types";
import { cancelInvite, inviteMember, removeMember, saveCategory, saveDriver, updateMemberRole, updateOrganization } from "./actions";

export const metadata = { title: "Configurações" };

const ROLE_LABEL: Record<MemberRole, string> = { owner: "Dono", admin: "Administrador", staff: "Equipe" };

export default async function SettingsPage() {
  const { org, role, userId } = await getOrgContext();
  const isAdmin = role !== "staff";
  const supabase = await createClient();
  const [{ data: members }, { data: invites }, { data: drivers }, { data: cats }] = await Promise.all([
    supabase.from("memberships").select("user_id, role, created_at").eq("org_id", org.id).order("created_at"),
    isAdmin ? supabase.from("invitations").select("*").eq("org_id", org.id) : Promise.resolve({ data: [] }),
    supabase.from("drivers").select("*").eq("org_id", org.id).order("active", { ascending: false }).order("name"),
    supabase.from("supply_categories").select("id, name").eq("org_id", org.id).order("name"),
  ]);
  const ids = (members ?? []).map((m: { user_id: string }) => m.user_id);
  const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const profileMap = new Map((profiles ?? []).map((p: { id: string; full_name: string | null; email: string | null }) => [p.id, p]));
  const base = await siteUrl();
  const storeUrl = `${base}${storePath(org.slug)}`;
  const qrSvg = await QRCode.toString(storeUrl, { type: "svg", margin: 1, color: { dark: "#9d174d", light: "#ffffff" } });

  return (
    <>
      <PageHeader title="Configurações" actions={<Link href="/redefinir-senha" className="text-sm font-medium text-brand-700 hover:underline">Alterar minha senha</Link>} />

      <section id="vitrine" className="mb-6 grid scroll-mt-6 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" icon={Globe} title="Vitrine online">
          <p className="mb-4 text-sm text-stone-600">
            Uma página com seus buquês, arranjos e cestas para enviar aos clientes. Eles escolhem pelas fotos e tocam em
            “Pedir”, que abre o seu WhatsApp com a mensagem pronta.
          </p>
          <StorefrontForm org={org} baseUrl={base} disabled={!isAdmin} />
        </Card>
        <Card icon={QrCode} title="Compartilhar">
          {org.storefront_enabled ? (
            <>
              <ShareLink url={storeUrl} message={`Conheça nossos buquês e arranjos — ${org.name}`} />
              <div className="mt-4 rounded-xl bg-white p-3 text-center">
                <div className="mx-auto w-40 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                <p className="mt-2 text-xs text-stone-500">Para o balcão, cartões e bio do Instagram</p>
                <a
                  href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`}
                  download={`qrcode-${org.slug}.svg`}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden /> Baixar QR code
                </a>
              </div>
            </>
          ) : (
            <p className="text-sm text-stone-500">Ative a vitrine para gerar o link e o QR code.</p>
          )}
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card icon={Store} title="Dados da floricultura">
          <form action={updateOrganization} className="space-y-3">
            <fieldset disabled={!isAdmin} className="space-y-3">
              <Field label="Nome"><Input name="name" defaultValue={org.name} required /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Telefone / WhatsApp"><Input name="phone" defaultValue={org.phone ?? ""} /></Field>
                <Field label="CNPJ / CPF"><Input name="document" defaultValue={org.document ?? ""} /></Field>
              </div>
              <Field label="Endereço da loja"><Input name="address" defaultValue={org.address ?? ""} /></Field>
              <Field label="Taxa de entrega padrão (R$)"><Input name="delivery_fee_default" inputMode="decimal" defaultValue={org.delivery_fee_default} /></Field>
            </fieldset>
            {isAdmin ? <SubmitButton>Salvar</SubmitButton> : <p className="text-xs text-stone-500">Somente administradores podem alterar.</p>}
          </form>
        </Card>

        <Card icon={Bike} title="Entregadores">
          <ul className="mb-4 divide-y divide-stone-100">
            {((drivers ?? []) as Driver[]).map((d) => (
              <li key={d.id} className="py-2">
                <form action={saveDriver} className="grid grid-cols-12 items-center gap-2">
                  <input type="hidden" name="id" value={d.id} />
                  <Input name="name" defaultValue={d.name} className="col-span-4" />
                  <Input name="phone" defaultValue={d.phone ?? ""} placeholder="Telefone" className="col-span-3" />
                  <Input name="vehicle" defaultValue={d.vehicle ?? ""} placeholder="Moto, carro…" className="col-span-2" />
                  <label className="col-span-1 text-xs"><input type="checkbox" name="active" defaultChecked={d.active} /> ativo</label>
                  <Button variant="ghost" className="col-span-2">Salvar</Button>
                </form>
              </li>
            ))}
          </ul>
          <form action={saveDriver} className="grid grid-cols-12 gap-2 border-t border-stone-100 pt-3">
            <Input name="name" placeholder="Nome" required className="col-span-4" />
            <Input name="phone" placeholder="Telefone" className="col-span-3" />
            <Input name="vehicle" placeholder="Veículo" className="col-span-3" />
            <Button variant="secondary" className="col-span-2">Adicionar</Button>
          </form>
        </Card>

        <Card icon={Users} title="Equipe">
          <Table>
            <tbody>
              {(members ?? []).map((m: { user_id: string; role: MemberRole }) => {
                const p = profileMap.get(m.user_id);
                return (
                  <tr key={m.user_id}>
                    <td>{p?.full_name ?? "—"}<span className="block text-xs text-stone-500">{p?.email}</span></td>
                    <td>
                      {isAdmin && m.role !== "owner" && m.user_id !== userId ? (
                        <form action={updateMemberRole} className="flex gap-1">
                          <input type="hidden" name="user_id" value={m.user_id} />
                          <Select name="role" defaultValue={m.role} className="py-1">
                            <option value="admin">Administrador</option>
                            <option value="staff">Equipe</option>
                          </Select>
                          <Button variant="ghost" className="px-2 py-1">OK</Button>
                        </form>
                      ) : <Badge>{ROLE_LABEL[m.role]}</Badge>}
                    </td>
                    <td className="text-right">
                      {isAdmin && m.role !== "owner" && m.user_id !== userId && (
                        <form action={removeMember}>
                          <input type="hidden" name="user_id" value={m.user_id} />
                          <ConfirmButton variant="ghost" className="px-2 py-1 text-red-600" message="Remover esta pessoa da floricultura?">remover</ConfirmButton>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
              {(invites ?? []).map((i: { id: string; email: string; role: MemberRole }) => (
                <tr key={i.id}>
                  <td className="text-stone-500">{i.email}<span className="block text-xs">convite pendente</span></td>
                  <td><Badge className="bg-amber-50 text-amber-700">{ROLE_LABEL[i.role]}</Badge></td>
                  <td className="text-right">
                    <form action={cancelInvite}><input type="hidden" name="id" value={i.id} /><button className="text-xs text-red-600 hover:underline">cancelar</button></form>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {isAdmin && (
            <form action={inviteMember} className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
              <Input name="email" type="email" placeholder="email@exemplo.com" required className="min-w-48 flex-1" />
              <Select name="role" className="w-40"><option value="staff">Equipe</option><option value="admin">Administrador</option></Select>
              <Button variant="secondary">Convidar</Button>
              <p className="w-full text-xs text-stone-500">Se a pessoa ainda não tem conta, ela entra automaticamente ao se cadastrar com este e-mail.</p>
            </form>
          )}
        </Card>

        <Card icon={Tag} title="Categorias de insumos">
          <ul className="mb-3 flex flex-wrap gap-2">
            {(cats ?? []).map((c: { id: string; name: string }) => (
              <li key={c.id}>
                <form action={saveCategory} className="flex items-center gap-1 rounded-full bg-stone-100 py-1 pl-3 pr-1 text-sm">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="delete" value="1" />
                  {c.name}
                  <button className="rounded-full px-1.5 text-stone-400 hover:bg-stone-200 hover:text-red-600" aria-label="Remover">×</button>
                </form>
              </li>
            ))}
          </ul>
          <form action={saveCategory} className="flex gap-2">
            <Input name="name" placeholder="Nova categoria" required />
            <Button variant="secondary">Adicionar</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
