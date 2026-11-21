import Link from "next/link";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { Button, Card, Empty, Input, PageHeader, Select, Table } from "@/components/ui";
import { dateTimeBR, MOVEMENT_LABEL, num, todayISO } from "@/lib/format";
import type { StockMovementType } from "@/lib/types";
import { StockTabs } from "../tabs";

export const metadata = { title: "Movimentações de estoque" };

export default async function MovementsPage({ searchParams }: { searchParams: Promise<{ tipo?: string; de?: string; ate?: string }> }) {
  const sp = await searchParams;
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const de = sp.de ?? todayISO(-30);
  let q = supabase
    .from("stock_movements")
    .select("*, supplies(name, unit, cost)")
    .eq("org_id", org.id)
    .gte("created_at", de)
    .order("created_at", { ascending: false })
    .limit(500);
  if (sp.ate) q = q.lte("created_at", `${sp.ate}T23:59:59`);
  if (sp.tipo) q = q.eq("type", sp.tipo);
  const { data } = await q;
  type Row = { id: string; created_at: string; type: StockMovementType; quantity: number; reason: string | null; order_id: string | null; supply_id: string; supplies: { name: string; unit: string; cost: number } };
  const rows = (data ?? []) as Row[];

  return (
    <>
      <PageHeader title="Estoque" subtitle="Entradas, saídas, perdas e consumo dos pedidos." />
      <StockTabs active="movimentacoes" />
      <form className="mb-4 flex flex-wrap gap-2 rounded-xl border border-stone-200 bg-white p-3">
        <Select name="tipo" defaultValue={sp.tipo ?? ""} className="w-48">
          <option value="">Todos os tipos</option>
          {Object.entries(MOVEMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Input type="date" name="de" defaultValue={de} className="w-40" />
        <Input type="date" name="ate" defaultValue={sp.ate} className="w-40" />
        <Button variant="secondary">Filtrar</Button>
      </form>
      <Card>
        {rows.length === 0 ? <Empty>Nenhuma movimentação no período.</Empty> : (
          <Table>
            <thead><tr><th>Quando</th><th>Insumo</th><th>Tipo</th><th className="text-right">Qtd</th><th>Motivo</th></tr></thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap">{dateTimeBR(m.created_at)}</td>
                  <td><Link href={`/app/estoque/${m.supply_id}`} className="hover:text-brand-700">{m.supplies?.name}</Link></td>
                  <td>{MOVEMENT_LABEL[m.type]}</td>
                  <td className={`text-right font-medium ${Number(m.quantity) < 0 ? "text-red-700" : "text-emerald-700"}`}>{Number(m.quantity) > 0 ? "+" : ""}{num(m.quantity)} {m.supplies?.unit}</td>
                  <td>{m.order_id ? <Link href={`/app/pedidos/${m.order_id}`} className="hover:underline">{m.reason}</Link> : m.reason}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
