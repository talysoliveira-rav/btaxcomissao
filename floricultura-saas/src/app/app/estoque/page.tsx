import { Boxes, Hourglass, PackagePlus, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Select, Table } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { dateBR, money, num, todayISO } from "@/lib/format";
import type { Supply } from "@/lib/types";
import { createSupply, discardBatch } from "./actions";
import { StockTabs } from "./tabs";
import { perishAlertCount } from "@/lib/perishability-server";
import { SupplyFields } from "./supply-fields";

export const metadata = { title: "Estoque" };

export default async function StockPage({ searchParams }: { searchParams: Promise<{ q?: string; baixo?: string; cat?: string }> }) {
  const sp = await searchParams;
  const { org } = await getOrgContext();
  const supabase = await createClient();
  let q = supabase.from("supplies").select("*, supply_categories(name)").eq("org_id", org.id).order("active", { ascending: false }).order("name");
  if (sp.q) q = q.ilike("name", `%${sp.q}%`);
  if (sp.cat) q = q.eq("category_id", sp.cat);
  const [{ data }, { data: cats }, { data: batches }] = await Promise.all([
    q,
    supabase.from("supply_categories").select("id, name").eq("org_id", org.id).order("name"),
    supabase.from("supply_batches").select("id, remaining, expires_at, supplier, supplies(name, unit)").eq("org_id", org.id).gt("remaining", 0).lte("expires_at", todayISO(3)).order("expires_at"),
  ]);
  const alerts = await perishAlertCount(org.id);
  let supplies = (data ?? []) as Supply[];
  if (sp.baixo) supplies = supplies.filter((s) => s.active && Number(s.quantity) <= Number(s.min_quantity));
  const totalValue = supplies.reduce((a, s) => a + Math.max(0, Number(s.quantity)) * Number(s.cost), 0);
  const expiring = (batches ?? []) as unknown as { id: string; remaining: number; expires_at: string; supplier: string | null; supplies: { name: string; unit: string } }[];
  const today = todayISO();

  return (
    <>
      <PageHeader
        title="Estoque"
        subtitle={`${supplies.length} insumo(s) · valor em estoque ${money(totalValue)}`}
      />
      <StockTabs active="insumos" alerts={alerts} />

      {expiring.length > 0 && (
        <Card className="mb-6 !border-amber-200" icon={Hourglass} title="Lotes vencendo (próximos 3 dias)" actions={<Link href="/app/estoque/perecibilidade" className="text-xs font-medium text-brand-700 hover:underline">Ver perecibilidade →</Link>}>
          <ul className="divide-y divide-stone-100 text-sm">
            {expiring.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-2 py-2">
                <span>
                  <b>{b.supplies.name}</b> — {num(b.remaining)} {b.supplies.unit}
                  {b.supplier && <span className="text-stone-500"> · {b.supplier}</span>}
                </span>
                <span className="flex items-center gap-2">
                  <Badge className={b.expires_at < today ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}>
                    {b.expires_at < today ? "venceu" : "vence"} {dateBR(b.expires_at)}
                  </Badge>
                  <form action={discardBatch}>
                    <input type="hidden" name="batch_id" value={b.id} />
                    <button className="text-xs text-red-600 hover:underline">descartar como perda</button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <form className="mb-3 flex flex-wrap gap-2">
            <Input name="q" defaultValue={sp.q} placeholder="Buscar insumo…" className="flex-1" />
            <Select name="cat" defaultValue={sp.cat ?? ""} className="w-48">
              <option value="">Todas categorias</option>
              {(cats ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="baixo" value="1" defaultChecked={!!sp.baixo} /> só estoque baixo</label>
            <Button variant="secondary">Filtrar</Button>
          </form>
          {supplies.length === 0 ? (
            sp.q || sp.cat || sp.baixo ? (
              <Empty>Nenhum insumo encontrado com esses filtros.</Empty>
            ) : (
              <Empty icon={Boxes} title="Nenhum insumo cadastrado">
                Cadastre flores, folhagens, vasos e embalagens no formulário ao lado. Eles serão usados nas fichas técnicas dos produtos.
              </Empty>
            )
          ) : (
            <Table>
              <thead><tr><th>Insumo</th><th className="text-right">Saldo</th><th className="text-right">Mínimo</th><th className="text-right">Custo</th></tr></thead>
              <tbody>
                {supplies.map((s) => {
                  const low = Number(s.quantity) <= Number(s.min_quantity);
                  return (
                    <tr key={s.id} className={s.active ? "" : "opacity-50"}>
                      <td>
                        <Link href={`/app/estoque/${s.id}`} className="font-medium hover:text-brand-700">{s.name}</Link>
                        <span className="block text-xs text-stone-500">{s.supply_categories?.name ?? "—"}</span>
                      </td>
                      <td className={`text-right font-medium ${low ? "text-red-700" : ""}`}><span className="inline-flex items-center gap-1">{low && <TriangleAlert className="h-3.5 w-3.5" aria-label="Abaixo do mínimo" />}{num(s.quantity)} {s.unit}</span></td>
                      <td className="text-right text-stone-500">{num(s.min_quantity)}</td>
                      <td className="text-right text-stone-600">{money(s.cost)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>

        <Card icon={PackagePlus} title="Novo insumo">
          <form action={createSupply} className="space-y-3">
            <SupplyFields categories={cats ?? []} />
            <Field label="Quantidade inicial (opcional)"><Input name="initial_quantity" inputMode="decimal" /></Field>
            <SubmitButton className="w-full">Cadastrar insumo</SubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}
