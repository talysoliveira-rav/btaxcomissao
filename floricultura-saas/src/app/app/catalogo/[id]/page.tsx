import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { Camera, Store } from "lucide-react";
import { Badge, Button, ButtonLink, Card, Empty, Field, Input, PageHeader, Select, Stat, Table } from "@/components/ui";
import { ShareLink } from "@/components/share-link";
import { productPath, siteUrl } from "@/lib/site";
import { ImageManager } from "../image-manager";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmButton } from "@/components/confirm-button";
import { money, num, priceLabel } from "@/lib/format";
import type { Product, ProductImage, Supply } from "@/lib/types";
import { addComponent, deleteProduct, removeComponent, updateProduct } from "../actions";
import { ProductFields } from "../product-fields";

export const metadata = { title: "Produto" };

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const [{ data: product }, { data: comps }, { data: supplies }, { data: sold }, { data: imgs }, base] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).eq("org_id", org.id).maybeSingle(),
    supabase.from("product_components").select("id, quantity, supply_id, supplies(name, unit, cost, quantity)").eq("product_id", id),
    supabase.from("supplies").select("*").eq("org_id", org.id).eq("active", true).order("name"),
    supabase.from("order_items").select("quantity, orders!inner(status)").eq("product_id", id).neq("orders.status", "cancelado"),
    supabase.from("product_images").select("*").eq("product_id", id).order("position").order("created_at"),
    siteUrl(),
  ]);
  if (!product) notFound();
  const p = product as Product;
  const components = (comps ?? []) as unknown as { id: string; quantity: number; supply_id: string; supplies: { name: string; unit: string; cost: number; quantity: number } }[];
  const cost = components.reduce((a, c) => a + Number(c.quantity) * Number(c.supplies.cost), 0);
  const margin = Number(p.price) > 0 ? ((Number(p.price) - cost) / Number(p.price)) * 100 : 0;
  const canMake = components.length ? Math.floor(Math.min(...components.map((c) => Number(c.supplies.quantity) / Number(c.quantity)))) : null;
  const soldQty = (sold ?? []).reduce((a: number, r: { quantity: number }) => a + r.quantity, 0);
  const images = (imgs ?? []) as ProductImage[];
  const link = `${base}${productPath(org.slug, p.id)}`;
  const visible = org.storefront_enabled && p.active && p.show_in_store;

  return (
    <>
      <PageHeader
        title={p.name}
        subtitle={<Link href="/app/catalogo" className="hover:underline">← Catálogo</Link>}
        actions={visible ? <ButtonLink variant="secondary" href={productPath(org.slug, p.id)} target="_blank"><Store className="h-4 w-4" aria-hidden /> Ver na vitrine</ButtonLink> : undefined}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Stat label="Preço" value={money(p.price)} />
        <Stat label="Custo dos insumos" value={money(cost)} />
        <Stat label="Margem bruta" value={`${margin.toFixed(0)}%`} hint={`${money(Number(p.price) - cost)} por unidade`} />
        <Stat label="Dá para montar" value={canMake === null ? "—" : canMake} hint={`com o estoque atual · ${soldQty} vendidos`} />
      </div>
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" icon={Camera} title={`Fotos (${images.length})`}>
          <ImageManager orgId={org.id} productId={p.id} images={images} />
        </Card>
        <Card icon={Store} title="Na vitrine" actions={visible ? <Badge className="bg-emerald-50 text-emerald-700">Visível</Badge> : <Badge>Oculto</Badge>}>
          {!org.storefront_enabled ? (
            <p className="text-sm text-stone-600">
              A vitrine online ainda está desligada. Ative em{" "}
              <Link href="/app/configuracoes#vitrine" className="font-medium text-brand-700 underline">Configurações → Vitrine</Link>.
            </p>
          ) : !visible ? (
            <p className="text-sm text-stone-600">Este produto não aparece na vitrine. Marque “Mostrar na vitrine” em Dados do produto.</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-stone-600">
                Aparece como <b className="text-stone-900">{priceLabel(p.price, p.price_mode)}</b>
                {images.length === 0 && <span className="text-amber-700"> · sem foto (adicione ao lado)</span>}.
                O cliente toca em “Pedir” e volta para o seu WhatsApp com a mensagem pronta.
              </p>
              <ShareLink url={link} message={`${p.name} — ${priceLabel(p.price, p.price_mode)}`} />
            </>
          )}
        </Card>
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
            <div className="space-y-2 rounded-lg bg-stone-100/60 p-3 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={p.active} /> Ativo (aparece na criação de pedidos)</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="show_in_store" defaultChecked={p.show_in_store} /> Mostrar na vitrine online</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={p.featured} /> Destaque (aparece primeiro na vitrine)</label>
            </div>
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
