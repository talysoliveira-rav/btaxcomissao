import { Flower2, Plus } from "lucide-react";
import Link from "next/link";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { ImageOff, Store } from "lucide-react";
import { Badge, ButtonLink, Card, Empty, Input, PageHeader, Table, Button } from "@/components/ui";
import { ShareLink } from "@/components/share-link";
import { siteUrl, storePath } from "@/lib/site";
import { SubmitButton } from "@/components/submit-button";
import { money } from "@/lib/format";
import type { Product } from "@/lib/types";
import { createProduct } from "./actions";
import { ProductFields } from "./product-fields";

export const metadata = { title: "Catálogo" };

type Row = Product & { product_components: { quantity: number; supplies: { cost: number } | null }[] };

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ q?: string; novo?: string }> }) {
  const sp = await searchParams;
  const { org } = await getOrgContext();
  const supabase = await createClient();
  let q = supabase.from("products").select("*, product_components(quantity, supplies(cost))").eq("org_id", org.id).order("active", { ascending: false }).order("name");
  if (sp.q) q = q.ilike("name", `%${sp.q}%`);
  const [{ data }, base] = await Promise.all([q, siteUrl()]);
  const products = (data ?? []) as Row[];

  return (
    <>
      <PageHeader
        title="Catálogo"
        subtitle="Produtos vendidos, fotos, ficha técnica e o que aparece na sua vitrine online."
        actions={
          org.storefront_enabled ? (
            <ButtonLink variant="secondary" href={storePath(org.slug)} target="_blank"><Store className="h-4 w-4" aria-hidden /> Ver vitrine</ButtonLink>
          ) : (
            <ButtonLink href="/app/configuracoes#vitrine"><Store className="h-4 w-4" aria-hidden /> Ativar vitrine online</ButtonLink>
          )
        }
      />
      {org.storefront_enabled && (
        <Card className="mb-6" icon={Store} title="Link da sua vitrine">
          <ShareLink url={`${base}${storePath(org.slug)}`} message={`Conheça nossos buquês e arranjos 💐 ${org.name}`} />
        </Card>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <form className="mb-3 flex gap-2">
            <Input name="q" defaultValue={sp.q} placeholder="Buscar produto…" />
            <Button variant="secondary">Buscar</Button>
          </form>
          {products.length === 0 ? (
            sp.q ? (
            <Empty>Nenhum produto encontrado.</Empty>
          ) : (
            <Empty icon={Flower2} title="Nenhum produto ainda">
              Cadastre buquês, arranjos e cestas ao lado. Depois monte a ficha técnica para calcular custo e margem.
            </Empty>
          )
          ) : (
            <Table>
              <thead><tr><th>Produto</th><th className="text-right">Preço</th><th className="text-right">Custo insumos</th><th className="text-right">Margem</th></tr></thead>
              <tbody>
                {products.map((p) => {
                  const cost = p.product_components.reduce((a, c) => a + Number(c.quantity) * Number(c.supplies?.cost ?? 0), 0);
                  const margin = Number(p.price) > 0 ? ((Number(p.price) - cost) / Number(p.price)) * 100 : 0;
                  return (
                    <tr key={p.id} className={p.active ? "" : "opacity-50"}>
                      <td>
                        <div className="flex items-center gap-3">
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image_url} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" loading="lazy" />
                        ) : (
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-400" title="Sem foto"><ImageOff className="h-4 w-4" /></span>
                        )}
                        <div className="min-w-0">
                        <Link href={`/app/catalogo/${p.id}`} className="font-medium hover:text-brand-700">{p.name}</Link>
                        <span className="block text-xs text-stone-500">
                          {p.category ?? "Sem categoria"}
                          {!p.active && " · inativo"}
                          {p.product_components.length === 0 && <Badge className="ml-2 bg-amber-50 text-amber-700">sem ficha técnica</Badge>}
                          {org.storefront_enabled && p.active && p.show_in_store && <Badge className="ml-2 bg-brand-50 text-brand-700">na vitrine</Badge>}
                        </span>
                        </div>
                        </div>
                      </td>
                      <td className="text-right">{money(p.price)}</td>
                      <td className="text-right text-stone-600">{p.product_components.length ? money(cost) : "—"}</td>
                      <td className={`text-right font-medium ${margin < 50 ? "text-amber-700" : "text-emerald-700"}`}>
                        {p.product_components.length ? `${margin.toFixed(0)}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>
        <Card icon={Plus} title="Novo produto">
          <form action={createProduct} className="space-y-3">
            <ProductFields />
            <SubmitButton className="w-full">Cadastrar e montar ficha técnica</SubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}
