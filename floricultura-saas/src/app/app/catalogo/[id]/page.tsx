import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { Button, Card, Empty, Field, Input, PageHeader, Select, Stat, Table } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmButton } from "@/components/confirm-button";
import { money, num } from "@/lib/format";
import type { Product, Supply } from "@/lib/types";
import { addComponent, deleteProduct, removeComponent, updateProduct } from "../actions";
import { ProductFields } from "../product-fields";

export const metadata = { title: "Produto" };

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const [{ data: product }, { data: comps }, { data: supplies }, { data: sold }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).eq("org_id", org.id).maybeSingle(),
    supabase.from("product_components").select("id, quantity, supply_id, supplies(name, unit, cost, quantity)").eq("product_id", id),
    supabase.from("supplies").select("*").eq("org_id", org.id).eq("active", true).order("name"),
    supabase.from("order_items").select("quantity, orders!inner(status)").eq("product_id", id).neq("orders.status", "cancelado"),
  ]);
  if (!product) notFound();
  const p = product as Product;
  const components = (comps ?? []) as unknown as { id: string; quantity: number; supply_id: string; supplies: { name: string; unit: string; cost: number; quantity: number } }[];
  const cost = components.reduce((a, c) => a + Number(c.quantity) * Number(c.supplies.cost), 0);
  const margin = Number(p.price) > 0 ? ((Number(p.price) - cost) / Number(p.price)) * 100 : 0;
  const canMake = components.length ? Math.floor(Math.min(...components.map((c) => Number(c.supplies.quantity) / Number(c.quantity)))) : null;
  const soldQty = (sold ?? []).reduce((a: number, r: { quantity: number }) => a + r.quantity, 0);

  return (
    <>
      <PageHeader title={p.name} subtitle={<Link href="/app/catalogo" className="hover:underline">← Catálogo</Link>} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Stat label="Preço" value={money(p.price)} />
        <Stat label="Custo dos insumos" value={money(cost)} />
        <Stat label="Margem bruta" value={`${margin.toFixed(0)}%`} hint={`${money(Number(p.price) - cost)} por unidade`} />
        <Stat label="Dá para montar" value={canMake === null ? "—" : canMake} hint={`com o estoque atual · ${soldQty} vendidos`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Ficha técnica (por unidade)">
          {components.length === 0 ? (
            <Empty>Adicione os insumos usados para montar este produto. Eles serão baixados do estoque quando o pedido entrar em produção.</Empty>
          ) : (
            <Table>
              <thead><tr><th>Insumo</th><th className="text-right">Qtd</th><th className="text-right">Custo</th><th /></tr></thead>
              <tbody>
                {components.map((c) => (
                  <tr key={c.id}>
                    <td>{c.supplies.name}</td>
                    <td className="text-right">{num(c.quantity)} {c.supplies.unit}</td>
                    <td className="text-right">{money(Number(c.quantity) * Number(c.supplies.cost))}</td>
                    <td className="text-right">
                      <form action={removeComponent}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="product_id" value={p.id} />
                        <button className="text-xs text-red-600 hover:underline">remover</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <form action={addComponent} className="mt-4 flex flex-wrap items-end gap-2 border-t border-stone-100 pt-4">
            <input type="hidden" name="product_id" value={p.id} />
            <Field label="Insumo" className="min-w-48 flex-1">
              <Select name="supply_id" required>
                <option value="">Selecione…</option>
                {((supplies ?? []) as Supply[]).map((s) => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
              </Select>
            </Field>
            <Field label="Quantidade" className="w-28"><Input name="quantity" inputMode="decimal" defaultValue="1" required /></Field>
            <Button variant="secondary">Adicionar</Button>
          </form>
          {(supplies ?? []).length === 0 && <p className="mt-2 text-xs text-stone-500">Cadastre insumos em <Link href="/app/estoque" className="underline">Estoque</Link> primeiro.</p>}
        </Card>

        <Card title="Dados do produto">
          <form action={updateProduct} className="space-y-3">
            <input type="hidden" name="id" value={p.id} />
            <ProductFields p={p} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={p.active} /> Ativo (aparece na criação de pedidos)</label>
            <div className="flex justify-between">
              <SubmitButton>Salvar</SubmitButton>
            </div>
          </form>
          <form action={deleteProduct} className="mt-3 border-t border-stone-100 pt-3">
            <input type="hidden" name="id" value={p.id} />
            <ConfirmButton variant="danger" message="Excluir este produto? Pedidos antigos mantêm a descrição.">Excluir produto</ConfirmButton>
          </form>
        </Card>
      </div>
    </>
  );
}
