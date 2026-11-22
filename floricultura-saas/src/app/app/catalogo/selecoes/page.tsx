import Link from "next/link";
import { CalendarClock, Eye, Link2, MousePointerClick, Plus } from "lucide-react";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink, Card, Empty, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import { ShareLink } from "@/components/share-link";
import { dateBR, todayISO } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import { offerCandidates, offerActive } from "@/lib/offers-server";
import type { Selection } from "@/lib/types";
import { CatalogTabs } from "../tabs";
import { deleteSelection, extendSelection } from "../vitrine-actions";

export const metadata = { title: "Seleções" };

type Row = Selection & { selection_items: { product_id: string; products: { name: string } | null }[] };

export default async function SelectionsPage() {
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const [{ data }, base, candidates] = await Promise.all([
    supabase.from("selections").select("*, selection_items(product_id, products(name))").eq("org_id", org.id).order("created_at", { ascending: false }).limit(60),
    siteUrl(),
    offerCandidates(org.id),
  ]);
  const selections = (data ?? []) as unknown as Row[];
  const ids = selections.map((s) => s.id);
  const { data: evs } = ids.length
    ? await supabase.from("storefront_events").select("selection_id, kind").in("selection_id", ids)
    : { data: [] };
  const stats = new Map<string, { views: number; clicks: number }>();
  for (const e of (evs ?? []) as { selection_id: string; kind: string }[]) {
    const s = stats.get(e.selection_id) ?? { views: 0, clicks: 0 };
    if (e.kind === "view_selection") s.views++;
    if (e.kind === "click_whatsapp") s.clicks++;
    stats.set(e.selection_id, s);
  }
  const today = todayISO();

  return (
    <>
      <PageHeader
        title="Catálogo"
        subtitle="Monte um link com algumas opções para um cliente escolher pelo WhatsApp."
        actions={<ButtonLink href="/app/catalogo/selecoes/nova"><Plus className="h-4 w-4" aria-hidden /> Nova seleção</ButtonLink>}
      />
      <CatalogTabs active="selecoes" offerAlerts={candidates.filter((c) => !offerActive(c.product)).length} />

      {selections.length === 0 ? (
        <Card>
          <Empty icon={Link2} title="Nenhuma seleção ainda" action={{ href: "/app/catalogo/selecoes/nova", label: "Criar primeira seleção" }}>
            Quando um cliente pedir “o que vocês têm até R$ 150?”, escolha 3 a 5 opções e mande um link só com elas. Ele responde “quero a opção 2” direto no seu WhatsApp.
          </Empty>
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {selections.map((s) => {
            const st = stats.get(s.id) ?? { views: 0, clicks: 0 };
            const expired = s.expires_at < today;
            const url = `${base}/s/${s.code}`;
            return (
              <li key={s.id}>
                <Card
                  title={<span className="truncate">{s.customer_name ? `${s.customer_name} · ` : ""}{s.title}</span>}
                  actions={expired ? <Badge className="bg-stone-100 text-stone-500">Expirada</Badge> : <Badge className="bg-emerald-50 text-emerald-700">Ativa</Badge>}
                >
                  <p className="text-sm text-stone-600">
                    {s.selection_items.map((i, n) => `${n + 1}. ${i.products?.name ?? "—"}`).join(" · ")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                    <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" aria-hidden /> {st.views} abertura(s)</span>
                    <span className="inline-flex items-center gap-1"><MousePointerClick className="h-3.5 w-3.5" aria-hidden /> {st.clicks} clique(s) no WhatsApp</span>
                    <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" aria-hidden /> {expired ? "expirou" : "válida até"} {dateBR(s.expires_at)}</span>
                  </div>
                  <div className="mt-3">
                    {!expired ? (
                      <ShareLink url={url} message={`${s.customer_name ? `${s.customer_name.split(" ")[0]}, ` : ""}separei algumas opções para você — ${org.name}`} />
                    ) : (
                      <form action={extendSelection}>
                        <input type="hidden" name="id" value={s.id} />
                        <button className="text-sm font-medium text-brand-700 hover:underline">Reativar por mais 14 dias</button>
                      </form>
                    )}
                  </div>
                  <div className="mt-3 flex justify-between border-t border-stone-200/60 pt-3 text-xs">
                    <span className="text-stone-400">Criada em {dateBR(s.created_at)}</span>
                    <form action={deleteSelection}>
                      <input type="hidden" name="id" value={s.id} />
                      <ConfirmButton variant="ghost" className="px-2 py-0.5 text-xs text-red-600" message="Excluir esta seleção? O link deixa de funcionar.">Excluir</ConfirmButton>
                    </form>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-6 text-center text-xs text-stone-400">
        Dica: na conversa do WhatsApp, o link aparece com a foto da primeira opção. <Link href="/app/catalogo/desempenho" className="underline">Ver desempenho</Link>
      </p>
    </>
  );
}
