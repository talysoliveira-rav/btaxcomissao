/* eslint-disable @next/next/no-img-element -- miniaturas já otimizadas */
import Link from "next/link";
import { Hourglass, ImageOff, Sparkles, Store } from "lucide-react";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, ButtonLink, Card, Empty, Field, Input, PageHeader, Select } from "@/components/ui";
import { dateBR, money, num, todayISO } from "@/lib/format";
import { daysLeftLabel, daysBetween } from "@/lib/perishability";
import { offerActive, offerCandidates } from "@/lib/offers-server";
import { storePath } from "@/lib/site";
import { CatalogTabs } from "../tabs";
import { clearOffer, setOffer } from "../vitrine-actions";

export const metadata = { title: "Ofertas do dia" };

type P = { id: string; name: string; price: number; image_url: string | null; offer_price: number | null; offer_until: string | null };

function Thumb({ src }: { src: string | null }) {
  return src ? (
    <img src={src} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" loading="lazy" />
  ) : (
    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-400"><ImageOff className="h-5 w-5" /></span>
  );
}

function UntilSelect({ defaultValue }: { defaultValue: string }) {
  const opts = [0, 1, 2, 3, 6].map((d) => ({ v: todayISO(d), l: d === 0 ? "Só hoje" : d === 1 ? "Até amanhã" : `Até ${dateBR(todayISO(d)).slice(0, 5)}` }));
  if (!opts.some((o) => o.v === defaultValue)) opts.push({ v: defaultValue, l: `Até ${dateBR(defaultValue).slice(0, 5)}` });
  return (
    <Select name="offer_until" defaultValue={defaultValue} aria-label="Validade da oferta" className="w-36">
      {opts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </Select>
  );
}

const suggested = (price: number) => (Math.floor(price * 0.85 * 10) / 10).toFixed(2).replace(".", ",");

export default async function OffersPage() {
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const [candidates, { data: prods }] = await Promise.all([
    offerCandidates(org.id),
    supabase.from("products").select("id, name, price, image_url, offer_price, offer_until").eq("org_id", org.id).eq("active", true).order("name"),
  ]);
  const products = (prods ?? []) as P[];
  const active = products.filter(offerActive);
  const pending = candidates.filter((c) => !offerActive(c.product));
  const today = todayISO();

  return (
    <>
      <PageHeader
        title="Catálogo"
        subtitle="Transforme flores que estão para vencer em venda, com preço especial na vitrine."
        actions={org.storefront_enabled ? <ButtonLink variant="secondary" href={`${storePath(org.slug)}#ofertas`} target="_blank"><Store className="h-4 w-4" aria-hidden /> Ver na vitrine</ButtonLink> : undefined}
      />
      <CatalogTabs active="ofertas" offerAlerts={pending.length} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card icon={Hourglass} title={`Sugestões: usam flores que estão vencendo (${pending.length})`}>
            {pending.length === 0 ? (
              <Empty>
                Nenhum produto com flores vencendo até {dateBR(todayISO(2)).slice(0, 5)}. As sugestões aparecem quando um lote fica perto da validade e o produto usa esse insumo na ficha técnica.
              </Empty>
            ) : (
              <ul className="divide-y divide-stone-200/60">
                {pending.map(({ product: p, flowers, soonest }) => (
                  <li key={p.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Thumb src={p.image_url} />
                      <div className="min-w-0">
                        <Link href={`/app/catalogo/${p.id}`} className="font-medium text-stone-900 hover:text-brand-700">{p.name}</Link>
                        <p className="text-xs text-stone-500">{money(p.price)}</p>
                        <p className="mt-0.5 text-xs text-orange-700">
                          {flowers.map((f) => `${f.name}: ${num(f.remaining)} ${f.unit} ${daysLeftLabel(daysBetween(today, f.expires_at))}`).join(" · ")}
                        </p>
                      </div>
                    </div>
                    <form action={setOffer} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="product_id" value={p.id} />
                      <Input name="offer_price" inputMode="decimal" defaultValue={suggested(Number(p.price))} className="w-24" aria-label="Preço da oferta" title="Preço da oferta (sugestão: 15% off)" />
                      <UntilSelect defaultValue={soonest < today ? today : soonest} />
                      <Button><Sparkles className="h-4 w-4" aria-hidden /> Ativar</Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card icon={Sparkles} title={`Ofertas ativas (${active.length})`}>
            {active.length === 0 ? (
              <Empty>Nenhuma oferta no ar. Elas aparecem na vitrine numa seção “Ofertas do dia”, com o preço antigo riscado.</Empty>
            ) : (
              <ul className="divide-y divide-stone-200/60">
                {active.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-3">
                    <Thumb src={p.image_url} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/app/catalogo/${p.id}`} className="font-medium text-stone-900 hover:text-brand-700">{p.name}</Link>
                      <p className="text-sm">
                        <span className="font-semibold text-brand-700">{money(p.offer_price)}</span>
                        <span className="ml-2 text-xs text-stone-400 line-through">{money(p.price)}</span>
                        <Badge className="ml-2 bg-brand-50 text-brand-700">−{Math.round((1 - Number(p.offer_price) / Number(p.price)) * 100)}%</Badge>
                      </p>
                      <p className="text-xs text-stone-500">{p.offer_until === today ? "Termina hoje" : `Até ${dateBR(p.offer_until)}`}</p>
                    </div>
                    <form action={clearOffer}>
                      <input type="hidden" name="product_id" value={p.id} />
                      <Button variant="ghost" className="text-xs">Encerrar</Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card icon={Sparkles} title="Oferta para outro produto">
          <form action={setOffer} className="space-y-3">
            <Field label="Produto">
              <Select name="product_id" required defaultValue="">
                <option value="" disabled>Escolha…</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {money(p.price)}</option>)}
              </Select>
            </Field>
            <Field label="Preço da oferta (R$)"><Input name="offer_price" inputMode="decimal" required placeholder="129,90" /></Field>
            <Field label="Validade"><UntilSelect defaultValue={today} /></Field>
            <Button className="w-full"><Sparkles className="h-4 w-4" aria-hidden /> Ativar oferta</Button>
          </form>
          <p className="mt-3 text-xs text-stone-500">A oferta sai da vitrine sozinha no fim do último dia.</p>
        </Card>
      </div>
    </>
  );
}
