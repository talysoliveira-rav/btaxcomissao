import Link from "next/link";
import { ChartColumn, Eye, Link2, MousePointerClick, Store } from "lucide-react";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink, Card, Empty, PageHeader, Stat, Table } from "@/components/ui";
import { dateBR, todayISO } from "@/lib/format";
import { offerActive, offerCandidates } from "@/lib/offers-server";
import { CatalogTabs } from "../tabs";

export const metadata = { title: "Desempenho da vitrine" };

type Ev = { kind: string; product_id: string | null; selection_id: string | null; day: string };
const PERIODS = [7, 30, 90];

export default async function PerformancePage({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const sp = await searchParams;
  const days = PERIODS.includes(Number(sp.dias)) ? Number(sp.dias) : 30;
  const since = todayISO(-(days - 1));
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const [{ data }, { data: prods }, { data: sels }, candidates] = await Promise.all([
    supabase.from("storefront_events").select("kind, product_id, selection_id, day").eq("org_id", org.id).gte("day", since).limit(50000),
    supabase.from("products").select("id, name").eq("org_id", org.id),
    supabase.from("selections").select("id, title, customer_name").eq("org_id", org.id),
    offerCandidates(org.id),
  ]);
  const events = (data ?? []) as Ev[];
  const name = new Map((prods ?? []).map((p: { id: string; name: string }) => [p.id, p.name]));
  const selName = new Map((sels ?? []).map((s: { id: string; title: string; customer_name: string | null }) => [s.id, s.customer_name ? `${s.customer_name} · ${s.title}` : s.title]));

  const count = (k: string) => events.filter((e) => e.kind === k).length;
  const visits = count("view_store");
  const productViews = count("view_product");
  const selectionViews = count("view_selection");
  const clicks = count("click_whatsapp");
  const entries = visits + selectionViews;
  const rate = entries ? (clicks / entries) * 100 : null;

  // por dia
  const dayList = Array.from({ length: days }, (_, i) => todayISO(-(days - 1 - i)));
  const perDay = dayList.map((d) => ({
    d,
    views: events.filter((e) => e.day === d && (e.kind === "view_store" || e.kind === "view_selection")).length,
    clicks: events.filter((e) => e.day === d && e.kind === "click_whatsapp").length,
  }));
  const maxDay = Math.max(1, ...perDay.map((x) => Math.max(x.views, x.clicks)));

  // por produto
  const byProduct = new Map<string, { views: number; clicks: number }>();
  for (const e of events) {
    if (!e.product_id) continue;
    const cur = byProduct.get(e.product_id) ?? { views: 0, clicks: 0 };
    if (e.kind === "view_product") cur.views++;
    if (e.kind === "click_whatsapp") cur.clicks++;
    byProduct.set(e.product_id, cur);
  }
  const topProducts = [...byProduct.entries()].sort((a, b) => b[1].clicks - a[1].clicks || b[1].views - a[1].views).slice(0, 10);

  // por seleção
  const bySel = new Map<string, { views: number; clicks: number }>();
  for (const e of events) {
    if (!e.selection_id) continue;
    const cur = bySel.get(e.selection_id) ?? { views: 0, clicks: 0 };
    if (e.kind === "view_selection") cur.views++;
    if (e.kind === "click_whatsapp") cur.clicks++;
    bySel.set(e.selection_id, cur);
  }
  const topSelections = [...bySel.entries()].sort((a, b) => b[1].clicks - a[1].clicks || b[1].views - a[1].views).slice(0, 6);

  return (
    <>
      <PageHeader
        title="Catálogo"
        subtitle="Quantas pessoas viram sua vitrine e chamaram no WhatsApp."
        actions={PERIODS.map((d) => (
          <ButtonLink key={d} variant={d === days ? "primary" : "secondary"} href={`?dias=${d}`}>{d} dias</ButtonLink>
        ))}
      />
      <CatalogTabs active="desempenho" offerAlerts={candidates.filter((c) => !offerActive(c.product)).length} />

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Stat icon={Store} label="Visitas à vitrine" value={visits} hint={`${productViews} produto(s) vistos`} />
        <Stat icon={Link2} label="Seleções abertas" value={selectionViews} hint={<Link href="/app/catalogo/selecoes" className="underline">ver seleções</Link>} />
        <Stat icon={MousePointerClick} label="Cliques no WhatsApp" value={clicks} hint="pessoas que chamaram para pedir" />
        <Stat icon={ChartColumn} label="Taxa de clique" value={rate === null ? "—" : `${rate.toFixed(0)}%`} hint="cliques ÷ (visitas + seleções)" />
      </div>

      {events.length === 0 ? (
        <Card className="mt-6">
          <Empty icon={Eye} title="Ainda sem visitas no período" action={{ href: "/app/catalogo", label: "Compartilhar a vitrine" }}>
            Envie o link da vitrine ou uma seleção para seus clientes. Cada visita e cada toque em “Pedir pelo WhatsApp” aparece aqui.
          </Empty>
        </Card>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-3" icon={ChartColumn} title="Por dia">
            <div className="mb-2 flex gap-4 text-xs text-stone-500">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand-300" /> Visitas</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#25D366]" /> Cliques no WhatsApp</span>
            </div>
            <div className="flex h-40 items-end gap-[3px]" role="img" aria-label="Visitas e cliques por dia">
              {perDay.map((x) => (
                <div key={x.d} className="flex h-full flex-1 items-end gap-px" title={`${dateBR(x.d)}: ${x.views} visita(s), ${x.clicks} clique(s)`}>
                  <div className="flex-1 rounded-t-sm bg-brand-300" style={{ height: `${(x.views / maxDay) * 100}%`, minHeight: x.views ? 2 : 0 }} />
                  <div className="flex-1 rounded-t-sm bg-[#25D366]" style={{ height: `${(x.clicks / maxDay) * 100}%`, minHeight: x.clicks ? 2 : 0 }} />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-stone-400">
              <span>{dateBR(dayList[0]).slice(0, 5)}</span>
              <span>{dateBR(dayList[dayList.length - 1]).slice(0, 5)}</span>
            </div>
          </Card>

          <Card className="lg:col-span-2" title="Produtos que mais chamam atenção">
            {topProducts.length === 0 ? (
              <Empty>Nenhum produto visto no período.</Empty>
            ) : (
              <Table>
                <thead><tr><th>Produto</th><th className="text-right">Visto</th><th className="text-right">Cliques</th><th className="text-right">Conversão</th></tr></thead>
                <tbody>
                  {topProducts.map(([id, v]) => (
                    <tr key={id}>
                      <td><Link href={`/app/catalogo/${id}`} className="hover:text-brand-700">{name.get(id) ?? "Produto removido"}</Link></td>
                      <td className="text-right tabular-nums">{v.views}</td>
                      <td className="text-right tabular-nums font-medium text-emerald-700">{v.clicks}</td>
                      <td className="text-right tabular-nums text-stone-500">{v.views ? `${Math.round((v.clicks / v.views) * 100)}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
            <p className="mt-3 text-xs text-stone-500">Muito visto e pouco clicado? Reveja a foto, o preço ou a descrição.</p>
          </Card>

          <Card title="Seleções">
            {topSelections.length === 0 ? (
              <Empty>Nenhuma seleção aberta no período.</Empty>
            ) : (
              <ul className="space-y-2.5 text-sm">
                {topSelections.map(([id, v]) => (
                  <li key={id} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate">{selName.get(id) ?? "Seleção removida"}</span>
                    <span className="shrink-0 text-xs text-stone-500">{v.views} abert. · <b className="text-emerald-700">{v.clicks}</b> cliq.</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
      <p className="mt-6 text-center text-xs text-stone-400">Visitas repetidas da mesma pessoa no mesmo dia contam uma vez. Robôs e prévias de link não contam.</p>
    </>
  );
}
