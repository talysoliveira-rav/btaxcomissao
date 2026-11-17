import Link from "next/link";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, Empty, Input, PageHeader, Table, Button } from "@/components/ui";
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
  const { data } = await q;
  const products = (data ?? []) as Row[];

  return (
    <>
      <PageHeader title="Catálogo" subtitle="Produtos vendidos e sua ficha técnica (insumos usados em cada um)." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <form className="mb-3 flex gap-2">
            <Input name="q" defaultValue={sp.q} placeholder="Buscar produto…" />
            <Button variant="secondary">Buscar</Button>
          </form>
          {products.length === 0 ? (
            <Empty>Nenhum produto cadastrado ainda.</Empty>
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
                        <Link href={`/app/catalogo/${p.id}`} className="font-medium hover:text-brand-700">{p.name}</Link>
                        <span className="block text-xs text-stone-500">
                          {p.category ?? "Sem categoria"}
                          {!p.active && " · inativo"}
                          {p.product_components.length === 0 && <Badge className="ml-2 bg-amber-50 text-amber-700">sem ficha técnica</Badge>}
                        </span>
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
        <Card title="Novo produto">
          <form action={createProduct} className="space-y-3">
            <ProductFields />
            <SubmitButton className="w-full">Cadastrar e montar ficha técnica</SubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}
