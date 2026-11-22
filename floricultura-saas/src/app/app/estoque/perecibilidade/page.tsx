import Link from "next/link";
import { CircleAlert, Flower2, Hourglass, ShieldCheck, TrendingDown, TriangleAlert, Wallet } from "lucide-react";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, Empty, PageHeader, Stat } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import { dateBR, money, num, todayISO } from "@/lib/format";
import {
  LOSS_BENCHMARK, URGENCY, URGENCY_ORDER, classify, daysLeftLabel, freshnessPct, lossRateTone, type Urgency,
} from "@/lib/perishability";
import { discardBatch, registerBatchLoss } from "../actions";
import { StockTabs } from "../tabs";

export const metadata = { title: "Perecibilidade" };

type BatchRow = {
  id: string;
  supply_id: string;
  quantity: number;
  remaining: number;
  unit_cost: number;
  supplier: string | null;
  received_at: string;
  expires_at: string | null;
  supplies: { name: string; unit: string; cost: number; shelf_life_days: number | null };
};
type MoveRow = { type: "entrada" | "perda"; quantity: number; created_at: string; supply_id: string; supplies: { name: string; cost: number } };

const WEEKS = 8;

export default async function PerishabilityPage() {
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const today = todayISO();
  const since = todayISO(-WEEKS * 7);

  const [{ data: batchData }, { data: moveData }, { data: noShelf }] = await Promise.all([
    supabase
      .from("supply_batches")
      .select("id, supply_id, quantity, remaining, unit_cost, supplier, received_at, expires_at, supplies(name, unit, cost, shelf_life_days)")
      .eq("org_id", org.id)
      .gt("remaining", 0)
      .order("expires_at", { nullsFirst: false }),
    supabase
      .from("stock_movements")
      .select("type, quantity, created_at, supply_id, supplies(name, cost)")
      .eq("org_id", org.id)
      .in("type", ["entrada", "perda"])
      .gte("created_at", since),
    supabase
      .from("supplies")
      .select("id, name")
      .eq("org_id", org.id)
      .eq("active", true)
      .is("shelf_life_days", null)
      .order("name"),
  ]);

  const batches = ((batchData ?? []) as unknown as BatchRow[]).map((b) => {
    const { urgency, daysLeft } = classify(b.expires_at, today);
    const cost = Number(b.unit_cost) || Number(b.supplies.cost) || 0;
    return { ...b, urgency, daysLeft, value: Number(b.remaining) * cost, fresh: freshnessPct(b.received_at, b.expires_at, today) };
  });
  const groups = URGENCY_ORDER.map((u) => ({ urgency: u, items: batches.filter((b) => b.urgency === u) })).filter((g) => g.items.length);
  const sum = (u: Urgency[]) => batches.filter((b) => u.includes(b.urgency)).reduce((a, b) => a + b.value, 0);
  const count = (u: Urgency[]) => batches.filter((b) => u.includes(b.urgency)).length;

  // Onde usar primeiro: produtos que levam os insumos em risco
  const riskySupplyIds = [...new Set(batches.filter((b) => ["vencido", "critico", "atencao"].includes(b.urgency)).map((b) => b.supply_id))];
  const { data: usesData } = riskySupplyIds.length
    ? await supabase.from("product_components").select("supply_id, products(id, name, active)").in("supply_id", riskySupplyIds)
    : { data: [] };
  const usesBySupply = new Map<string, { id: string; name: string }[]>();
  for (const u of (usesData ?? []) as unknown as { supply_id: string; products: { id: string; name: string; active: boolean } }[]) {
    if (!u.products?.active) continue;
    usesBySupply.set(u.supply_id, [...(usesBySupply.get(u.supply_id) ?? []), u.products]);
  }

  // Taxa de perda: perdas ÷ compras (30 dias) e evolução semanal
  const moves = (moveData ?? []) as unknown as MoveRow[];
  const valueOf = (m: MoveRow) => Math.abs(Number(m.quantity)) * Number(m.supplies?.cost ?? 0);
  const inWindow = (m: MoveRow, from: string, to: string) => m.created_at >= from && m.created_at < to;
  const d30 = todayISO(-30), d60 = todayISO(-60), tomorrow = todayISO(1);
  const purchases30 = moves.filter((m) => m.type === "entrada" && inWindow(m, d30, tomorrow)).reduce((a, m) => a + valueOf(m), 0);
  const losses30 = moves.filter((m) => m.type === "perda" && inWindow(m, d30, tomorrow)).reduce((a, m) => a + valueOf(m), 0);
  const purchasesPrev = moves.filter((m) => m.type === "entrada" && inWindow(m, d60, d30)).reduce((a, m) => a + valueOf(m), 0);
  const lossesPrev = moves.filter((m) => m.type === "perda" && inWindow(m, d60, d30)).reduce((a, m) => a + valueOf(m), 0);
  const rate = purchases30 > 0 ? (losses30 / purchases30) * 100 : null;
  const ratePrev = purchasesPrev > 0 ? (lossesPrev / purchasesPrev) * 100 : null;
  const tone = lossRateTone(rate);
  const onePoint = purchases30 * 0.01; // quanto vale cada ponto percentual a menos de perda

  const weeks = Array.from({ length: WEEKS }, (_, i) => {
    const from = todayISO(-(WEEKS - i) * 7 + 1);
    const to = todayISO(-(WEEKS - i - 1) * 7 + 1);
    const lost = moves.filter((m) => m.type === "perda" && inWindow(m, from, to)).reduce((a, m) => a + valueOf(m), 0);
    return { label: dateBR(from).slice(0, 5), lost };
  });
  const maxWeek = Math.max(1, ...weeks.map((w) => w.lost));

  const lossBySupply = new Map<string, { name: string; value: number }>();
  for (const m of moves.filter((m) => m.type === "perda" && inWindow(m, d30, tomorrow))) {
    const cur = lossBySupply.get(m.supply_id) ?? { name: m.supplies?.name ?? "—", value: 0 };
    lossBySupply.set(m.supply_id, { ...cur, value: cur.value + valueOf(m) });
  }
  const topLosses = [...lossBySupply.entries()].sort((a, b) => b[1].value - a[1].value).slice(0, 5);

  const gaugePos = rate === null ? 0 : Math.min(100, (rate / 30) * 100);

  return (
    <>
      <PageHeader title="Estoque" subtitle="Acompanhe a vida útil das flores e aja antes que virem prejuízo." />
      <StockTabs active="perecibilidade" alerts={count(["vencido", "critico"])} />

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Stat icon={TriangleAlert} tone={count(["vencido"]) ? "warn" : "default"} label="Vencido no estoque" value={money(sum(["vencido"]))} hint={`${count(["vencido"])} lote(s) · descartar ou baixar`} />
        <Stat icon={Hourglass} tone={count(["critico"]) ? "warn" : "default"} label="Vence hoje/amanhã" value={money(sum(["critico"]))} hint={`${count(["critico"])} lote(s) · usar primeiro`} />
        <Stat icon={CircleAlert} label="Vence em 2–3 dias" value={money(sum(["atencao"]))} hint={`${count(["atencao"])} lote(s) · priorizar`} />
        <Stat
          icon={TrendingDown}
          tone={rate !== null && rate > LOSS_BENCHMARK.good ? "warn" : "default"}
          label="Perda (30 dias)"
          value={rate === null ? "—" : `${rate.toFixed(1)}%`}
          hint={<span className={tone.cls}>{tone.label}</span>}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {groups.length === 0 ? (
            <Card>
              <Empty icon={Flower2} title="Nenhum lote com saldo" action={{ href: "/app/estoque", label: "Registrar entrada" }}>
                Registre as compras na ficha de cada insumo com a validade. Os alertas de perecibilidade aparecem aqui.
              </Empty>
            </Card>
          ) : (
            groups.map((g) => {
              const meta = URGENCY[g.urgency];
              const total = g.items.reduce((a, b) => a + b.value, 0);
              return (
                <Card
                  key={g.urgency}
                  title={
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} aria-hidden />
                      {meta.label}
                      <span className="whitespace-nowrap font-normal text-stone-500">· {g.items.length} lote(s) · {money(total)}</span>
                    </span>
                  }
                >
                  <p className="-mt-1 mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                    {meta.hint}
                    {(g.urgency === "critico" || g.urgency === "atencao") && (
                      <Link href="/app/catalogo/ofertas" className="inline-flex items-center gap-1 rounded-full bg-[image:var(--rose-gradient)] px-2.5 py-1 font-semibold text-[#fff]">
                        Criar oferta do dia →
                      </Link>
                    )}
                  </p>
                  <ul className="divide-y divide-stone-200/60">
                    {g.items.map((b) => {
                      const uses = usesBySupply.get(b.supply_id) ?? [];
                      const showUses = b.urgency === "critico" || b.urgency === "atencao";
                      return (
                        <li key={b.id} className="grid gap-3 py-3 sm:grid-cols-12 sm:items-center">
                          <div className="min-w-0 sm:col-span-5">
                            <Link href={`/app/estoque/${b.supply_id}`} className="font-medium text-stone-900 hover:text-brand-700">
                              {b.supplies.name}
                            </Link>
                            <p className="text-xs text-stone-500">
                              {num(b.remaining)} de {num(b.quantity)} {b.supplies.unit} · {money(b.value)}
                              {b.supplier && ` · ${b.supplier}`} · chegou {dateBR(b.received_at).slice(0, 5)}
                            </p>
                            {showUses && uses.length > 0 && (
                              <p className="mt-1 flex flex-wrap items-center gap-1 text-xs">
                                <span className="text-stone-500">Use em:</span>
                                {uses.slice(0, 3).map((p) => (
                                  <Link key={p.id} href={`/app/catalogo/${p.id}`} className="rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700 hover:bg-brand-100">
                                    {p.name}
                                  </Link>
                                ))}
                              </p>
                            )}
                          </div>

                          <div className="sm:col-span-4">
                            <div className="flex items-center justify-between text-xs">
                              <Badge className={`border ${meta.tone}`}>{daysLeftLabel(b.daysLeft)}</Badge>
                              {b.expires_at && <span className="text-stone-500">validade {dateBR(b.expires_at).slice(0, 5)}</span>}
                            </div>
                            {b.fresh !== null && (
                              <div className="mt-1.5" title={`${b.fresh}% da vida útil restante`}>
                                <div className="h-1.5 overflow-hidden rounded-full bg-stone-200/70" role="meter" aria-valuenow={b.fresh} aria-valuemin={0} aria-valuemax={100} aria-label="Vida útil restante">
                                  <div className={`h-full rounded-full ${meta.bar} transition-all`} style={{ width: `${Math.max(b.fresh, 3)}%` }} />
                                </div>
                                <p className="mt-0.5 text-[11px] text-stone-500">{b.fresh}% de vida útil</p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:col-span-3 sm:justify-end">
                            <details className="group w-full sm:relative sm:w-auto">
                              <summary className="cursor-pointer list-none rounded-lg border border-stone-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-stone-700 transition hover:border-brand-200 hover:text-brand-700">
                                Perda parcial
                              </summary>
                              <form action={registerBatchLoss} className="glass-strong mt-2 flex w-full flex-col gap-2 rounded-xl border border-white p-3 shadow-lg sm:absolute sm:right-0 sm:z-20 sm:mt-1 sm:w-56">
                                <input type="hidden" name="batch_id" value={b.id} />
                                <label className="text-xs text-stone-600">
                                  Quantidade perdida ({b.supplies.unit})
                                  <input name="quantity" inputMode="decimal" required className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-sm" />
                                </label>
                                <input name="reason" placeholder="Motivo (murchou, quebrou…)" className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-sm" />
                                <button className="btn-primary rounded-lg py-1.5 text-xs font-medium">Registrar perda</button>
                              </form>
                            </details>
                            <form action={discardBatch}>
                              <input type="hidden" name="batch_id" value={b.id} />
                              <ConfirmButton
                                variant={b.urgency === "vencido" ? "danger" : "ghost"}
                                className="px-2.5 py-1 text-xs"
                                message={`Descartar ${num(b.remaining)} ${b.supplies.unit} de ${b.supplies.name} como perda (${money(b.value)})?`}
                              >
                                Descartar tudo
                              </ConfirmButton>
                            </form>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              );
            })
          )}
        </div>

        <div className="space-y-6">
          <Card icon={Wallet} title="Taxa de perda">
            <p className="text-3xl font-semibold tracking-tight text-stone-900">{rate === null ? "—" : `${rate.toFixed(1)}%`}</p>
            <p className={`text-sm font-medium ${tone.cls}`}>{tone.label}</p>
            <p className="mt-1 text-xs text-stone-500">
              {money(losses30)} perdidos de {money(purchases30)} comprados nos últimos 30 dias
              {ratePrev !== null && rate !== null && (
                <> · {rate <= ratePrev ? "melhor" : "pior"} que os 30 dias anteriores ({ratePrev.toFixed(1)}%)</>
              )}
            </p>

            {/* Régua: verde < 10%, âmbar 10–20% (média do setor), vermelho > 20% */}
            <div className="relative mt-4">
              <div className="flex h-2 overflow-hidden rounded-full">
                <div className="bg-emerald-400" style={{ width: `${(LOSS_BENCHMARK.good / 30) * 100}%` }} />
                <div className="bg-amber-300" style={{ width: `${((LOSS_BENCHMARK.bad - LOSS_BENCHMARK.good) / 30) * 100}%` }} />
                <div className="flex-1 bg-red-400" />
              </div>
              {rate !== null && (
                <div className="absolute -top-1 h-4 w-1 -translate-x-1/2 rounded-full bg-stone-900 ring-2 ring-white" style={{ left: `${gaugePos}%` }} aria-hidden />
              )}
              <div className="relative mt-1 h-3 text-[10px] text-stone-400">
                {[0, 10, 20, 30].map((v) => (
                  <span key={v} className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full" style={{ left: `${(v / 30) * 100}%` }}>
                    {v}%{v === 30 ? "+" : ""}
                  </span>
                ))}
              </div>
            </div>

            {purchases30 > 0 && (
              <p className="mt-4 rounded-lg bg-brand-50/80 p-3 text-xs text-brand-800">
                <ShieldCheck className="mr-1 inline h-3.5 w-3.5 align-[-2px]" aria-hidden />
                Cada ponto percentual a menos de perda economiza cerca de <b>{money(onePoint)}</b> por mês.
                {rate !== null && rate > 8 && <> Chegar a 8% pouparia <b>{money((rate - 8) * onePoint)}</b>/mês.</>}
              </p>
            )}
          </Card>

          <Card icon={TrendingDown} title={`Perdas por semana (${WEEKS} semanas)`}>
            <div className="flex h-28 items-end gap-1.5" role="img" aria-label="Valor perdido por semana">
              {weeks.map((w, i) => (
                <div key={i} className="group flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-brand-500/70 to-brand-300/70 transition group-hover:from-brand-600 group-hover:to-brand-400"
                    style={{ height: `${Math.max(2, (w.lost / maxWeek) * 96)}px` }}
                    title={`Semana de ${w.label}: ${money(w.lost)}`}
                  />
                  <span className="text-[9px] text-stone-400">{w.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card icon={TriangleAlert} title="Maiores perdas (30 dias)">
            {topLosses.length === 0 ? (
              <Empty>Nenhuma perda registrada nos últimos 30 dias.</Empty>
            ) : (
              <ul className="space-y-2 text-sm">
                {topLosses.map(([id, l]) => (
                  <li key={id} className="flex items-center justify-between gap-2">
                    <Link href={`/app/estoque/${id}`} className="truncate hover:text-brand-700">{l.name}</Link>
                    <span className="shrink-0 font-medium text-red-700">{money(l.value)}</span>
                  </li>
                ))}
              </ul>
            )}
            {topLosses.length > 0 && <p className="mt-3 text-xs text-stone-500">Compre menos destes ou em lotes menores e mais frequentes.</p>}
          </Card>

          {(noShelf ?? []).length > 0 && (
            <Card icon={CircleAlert} title="Insumos sem validade definida">
              <p className="mb-2 text-xs text-stone-500">Sem a validade média, o sistema não consegue avisar quando o lote vai vencer.</p>
              <ul className="flex flex-wrap gap-1.5">
                {(noShelf as { id: string; name: string }[]).slice(0, 12).map((s) => (
                  <li key={s.id}>
                    <Link href={`/app/estoque/${s.id}`} className="inline-block rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-700 hover:bg-brand-50 hover:text-brand-700">
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
