/* eslint-disable @next/next/no-img-element -- fotos já otimizadas no envio */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, Flower2, MessageCircleHeart } from "lucide-react";
import { dateBR, whatsappLink } from "@/lib/format";
import { openStatus, parseHours } from "@/lib/hours";
import { currentPrice, getSelection, priceText } from "@/lib/storefront";
import { siteUrl, storePath } from "@/lib/site";
import { Track, WhatsAppLink } from "@/components/track";
import { StoreFooter, StoreHeader, WhatsAppIcon } from "@/app/loja/[slug]/ui";

type Props = { params: Promise<{ code: string }> };
const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const d = await getSelection(code);
  if (!d) return { title: { absolute: "Seleção não encontrada" }, robots: { index: false } };
  const image = d.items.find((i) => i.images[0])?.images[0].thumb_url ?? d.store.cover_url ?? undefined;
  const title = d.selection.customer_name ? `${d.selection.customer_name}, separamos estas opções para você` : d.selection.title;
  const description = `${d.items.length} opções escolhidas pela ${d.store.name}. Toque para ver e escolher.`;
  return {
    title: { absolute: `${d.selection.title} · ${d.store.name}` },
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, images: image ? [{ url: image }] : undefined },
  };
}

export default async function SelectionPage({ params }: Props) {
  const { code } = await params;
  const d = await getSelection(code);
  if (!d) notFound();
  const { store, selection, items } = d;
  const url = `${await siteUrl()}/s/${code}`;
  const hours = parseHours(store.business_hours);
  const status = hours ? openStatus(hours) : null;
  const help = whatsappLink(store.whatsapp, `Olá, ${store.name}! Vi a seleção "${selection.title}" e queria tirar uma dúvida.`);

  return (
    <div className="min-h-screen">
      <Track slug={store.slug} kind="view_selection" selection={code} />
      <StoreHeader store={store} />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Seleção especial</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
            {selection.customer_name ? `${selection.customer_name}, separamos estas opções para você` : selection.title}
          </h1>
          {selection.customer_name && <p className="mt-1 text-stone-500">{selection.title}</p>}
          {selection.note && (
            <p className="surface mx-auto mt-4 max-w-xl whitespace-pre-line rounded-2xl border px-4 py-3 text-left text-sm leading-relaxed text-stone-700">
              <MessageCircleHeart className="mr-1.5 inline h-4 w-4 align-[-3px] text-brand-500" aria-hidden />
              {selection.note}
            </p>
          )}
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-stone-500">
            {!selection.expired && (
              <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" aria-hidden /> Válida até {dateBR(selection.expires_at)}</span>
            )}
            {status && <span className={status.open ? "text-emerald-700" : ""}>{status.text}</span>}
          </p>
        </header>

        {selection.expired || items.length === 0 ? (
          <div className="surface mt-8 rounded-3xl border p-8 text-center">
            <p className="font-medium text-stone-900">{selection.expired ? "Esta seleção expirou" : "Estas opções não estão mais disponíveis"}</p>
            <p className="mt-1 text-sm text-stone-500">Mas temos muitas outras flores esperando por você.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link href={storePath(store.slug)} className="rounded-xl border border-stone-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-white">Ver a vitrine</Link>
              {help && (
                <WhatsAppLink href={help} slug={store.slug} selection={code} className="btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold">
                  <WhatsAppIcon /> Falar no WhatsApp
                </WhatsAppLink>
              )}
            </div>
          </div>
        ) : (
          <ol className="mt-8 space-y-5">
            {items.map((p, i) => {
              const n = i + 1;
              const { original, off } = currentPrice(p);
              const price = priceText(p);
              const msg = `Olá, ${store.name}! Escolhi a *opção ${n}* da seleção "${selection.title}":\n*${p.name}* (${price})${p.sku ? ` · cód. ${p.sku}` : ""}\n${url}`;
              const wa = whatsappLink(store.whatsapp, msg);
              return (
                <li key={p.id} className="surface overflow-hidden rounded-3xl border sm:flex">
                  <div className="relative aspect-[4/3] bg-stone-100 sm:aspect-auto sm:w-64 sm:shrink-0">
                    {p.images[0] ? (
                      <img src={p.images[0].url} alt={p.name} className="h-full w-full object-cover" loading={i < 2 ? "eager" : "lazy"} />
                    ) : (
                      <span className="grid h-full min-h-48 w-full place-items-center bg-gradient-to-br from-brand-50 to-stone-100 text-brand-300">
                        <Flower2 className="h-12 w-12" strokeWidth={1} aria-hidden />
                      </span>
                    )}
                    <span className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-[image:var(--rose-gradient)] text-sm font-bold text-[#fff] shadow-md">
                      {n}
                    </span>
                    {p.images.length > 1 && (
                      <div className="absolute bottom-2 left-2 flex gap-1">
                        {p.images.slice(1, 4).map((img) => (
                          <img key={img.thumb_url} src={img.thumb_url} alt="" className="h-10 w-10 rounded-lg object-cover ring-2 ring-white" />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Opção {n}</p>
                    <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-stone-900">{p.name}</h2>
                    <p className="mt-1 text-lg font-semibold text-brand-700">
                      {price}
                      {original != null && <span className="ml-2 text-sm font-normal text-stone-400 line-through">{brl(original)}</span>}
                      {off != null && <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">−{off}%</span>}
                    </p>
                    {p.item_note && <p className="mt-2 rounded-xl bg-brand-50/70 px-3 py-2 text-sm text-brand-800">{p.item_note}</p>}
                    {p.description && <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-stone-600">{p.description}</p>}
                    <div className="mt-auto pt-4">
                      {wa && (
                        <WhatsAppLink href={wa} slug={store.slug} product={p.id} selection={code} className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold sm:w-auto">
                          <WhatsAppIcon /> Quero a opção {n}
                        </WhatsAppLink>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {!selection.expired && items.length > 0 && (
          <p className="mt-8 text-center text-sm text-stone-500">
            Nenhuma é a ideal?{" "}
            {help ? (
              <WhatsAppLink href={help} slug={store.slug} selection={code} className="font-medium text-brand-700 underline">Fale com a gente</WhatsAppLink>
            ) : null}{" "}
            ou <Link href={storePath(store.slug)} className="font-medium text-brand-700 underline">veja a vitrine completa</Link>.
          </p>
        )}
      </main>
      <StoreFooter />
    </div>
  );
}
