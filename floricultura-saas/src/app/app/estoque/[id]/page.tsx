import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, Empty, Field, Input, PageHeader, Select, Stat, Table } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmButton } from "@/components/confirm-button";
import { dateBR, dateTimeBR, money, MOVEMENT_LABEL, num, todayISO } from "@/lib/format";
import type { StockMovementType, Supply } from "@/lib/types";
import { adjustSupply, deleteSupply, discardBatch, receiveSupply, updateSupply } from "../actions";
import { SupplyFields } from "../supply-fields";

export const metadata = { title: "Insumo" };

export default async function SupplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const [{ data: supply }, { data: cats }, { data: batches }, { data: moves }, { data: usedIn }] = await Promise.all([
    supabase.from("supplies").select("*").eq("id", id).eq("org_id", org.id).maybeSingle(),
    supabase.from("supply_categories").select("id, name").eq("org_id", org.id).order("name"),
    supabase.from("supply_batches").select("*").eq("supply_id", id).gt("remaining", 0).order("expires_at", { nullsFirst: false }),
    supabase.from("stock_movements").select("*").eq("supply_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("product_components").select("quantity, products(id, name)").eq("supply_id", id),
  ]);
  if (!supply) notFound();
  const s = supply as Supply;
  const today = todayISO();
  const losses30 = (moves ?? []).filter((m: { type: string; created_at: string }) => m.type === "perda" && m.created_at >= todayISO(-30)).reduce((a: number, m: { quantity: number }) => a - Number(m.quantity), 0);

  return (
    <>
      <PageHeader title={s.name} subtitle={<Link href="/app/estoque" className="hover:underline">← Estoque</Link>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Saldo" value={`${num(s.quantity)} ${s.unit}`} hint={Number(s.quantity) <= Number(s.min_quantity) ? "⚠️ abaixo do mínimo" : `mínimo ${num(s.min_quantity)}`} />
        <Stat label="Custo unitário" value={money(s.cost)} />
        <Stat label="Valor em estoque" value={money(Math.max(0, Number(s.quantity)) * Number(s.cost))} />
        <Stat label="Perdas (30 dias)" value={`${num(losses30)} ${s.unit}`} hint={money(losses30 * Number(s.cost))} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-6 md:grid-cols-2">
            <Card title="📥 Entrada (compra)">
              <form action={receiveSupply} className="space-y-3">
                <input type="hidden" name="supply_id" value={s.id} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label={`Quantidade (${s.unit})`}><Input name="quantity" inputMode="decimal" required /></Field>
                  <Field label="Custo unit. (R$)"><Input name="unit_cost" inputMode="decimal" defaultValue={s.cost} /></Field>
                  <Field label="Fornecedor"><Input name="supplier" placeholder="CEASA, Holambra…" /></Field>
                  <Field label="Validade"><Input name="expires_at" type="date" /></Field>
                </div>
                {s.shelf_life_days && <p className="text-xs text-stone-500">Sem validade informada, usamos {s.shelf_life_days} dias a partir de hoje.</p>}
                <SubmitButton variant="leaf" className="w-full">Registrar entrada</SubmitButton>
              </form>
            </Card>
            <Card title="📤 Perda, saída ou inventário">
              <form action={adjustSupply} className="space-y-3">
                <input type="hidden" name="supply_id" value={s.id} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tipo">
                    <Select name="type">
                      <option value="perda">Perda (murchou, quebrou)</option>
                      <option value="saida">Saída avulsa</option>
                      <option value="ajuste">Inventário (contagem real)</option>
                    </Select>
                  </Field>
                  <Field label="Quantidade" hint="No inventário, informe o total contado."><Input name="quantity" inputMode="decimal" required /></Field>
                </div>
                <Field label="Motivo"><Input name="reason" /></Field>
                <SubmitButton variant="secondary" className="w-full">Registrar</SubmitButton>
              </form>
            </Card>
          </div>

          <Card title="Lotes em estoque">
            {(batches ?? []).length === 0 ? (
              <Empty>Nenhum lote com saldo.</Empty>
            ) : (
              <Table>
                <thead><tr><th>Recebido</th><th>Fornecedor</th><th className="text-right">Saldo</th><th>Validade</th><th /></tr></thead>
                <tbody>
                  {(batches ?? []).map((b: { id: string; received_at: string; supplier: string | null; remaining: number; quantity: number; expires_at: string | null }) => (
                    <tr key={b.id}>
                      <td>{dateBR(b.received_at)}</td>
                      <td>{b.supplier ?? "—"}</td>
                      <td className="text-right">{num(b.remaining)} / {num(b.quantity)}</td>
                      <td>{b.expires_at ? <Badge className={b.expires_at < today ? "bg-red-100 text-red-700" : b.expires_at <= todayISO(2) ? "bg-amber-100 text-amber-800" : ""}>{dateBR(b.expires_at)}</Badge> : "—"}</td>
                      <td className="text-right">
                        <form action={discardBatch}>
                          <input type="hidden" name="batch_id" value={b.id} />
                          <button className="text-xs text-red-600 hover:underline">descartar</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          <Card title="Últimas movimentações">
            {(moves ?? []).length === 0 ? <Empty>Sem movimentações.</Empty> : (
              <Table>
                <thead><tr><th>Quando</th><th>Tipo</th><th className="text-right">Qtd</th><th>Motivo</th></tr></thead>
                <tbody>
                  {(moves ?? []).map((m: { id: string; created_at: string; type: StockMovementType; quantity: number; reason: string | null; order_id: string | null }) => (
                    <tr key={m.id}>
                      <td className="whitespace-nowrap">{dateTimeBR(m.created_at)}</td>
                      <td>{MOVEMENT_LABEL[m.type]}</td>
                      <td className={`text-right font-medium ${Number(m.quantity) < 0 ? "text-red-700" : "text-emerald-700"}`}>{Number(m.quantity) > 0 ? "+" : ""}{num(m.quantity)}</td>
                      <td>{m.order_id ? <Link className="hover:underline" href={`/app/pedidos/${m.order_id}`}>{m.reason}</Link> : m.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Usado em">
            {(usedIn ?? []).length === 0 ? <p className="text-sm text-stone-400">Não está em nenhuma ficha técnica.</p> : (
              <ul className="space-y-1 text-sm">
                {(usedIn as unknown as { quantity: number; products: { id: string; name: string } }[]).map((u) => (
                  <li key={u.products.id} className="flex justify-between"><Link href={`/app/catalogo/${u.products.id}`} className="hover:text-brand-700">{u.products.name}</Link><span className="text-stone-500">{num(u.quantity)} {s.unit}</span></li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Dados do insumo">
            <form action={updateSupply} className="space-y-3">
              <input type="hidden" name="id" value={s.id} />
              <SupplyFields s={s} categories={cats ?? []} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={s.active} /> Ativo</label>
              <SubmitButton>Salvar</SubmitButton>
            </form>
            <form action={deleteSupply} className="mt-3 border-t border-stone-100 pt-3">
              <input type="hidden" name="id" value={s.id} />
              <ConfirmButton variant="danger" message="Excluir este insumo e seu histórico?">Excluir</ConfirmButton>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
