import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageCircleHeart } from "lucide-react";
import { priceLabel, whatsappLink } from "@/lib/format";
import { getStore, orderMessage } from "@/lib/storefront";
import { productPath, siteUrl } from "@/lib/site";
import { ProductCard, StoreFooter, StoreHeader, WhatsAppIcon } from "../../ui";
import { Gallery } from "./gallery";

type Props = { params: Promise<{ slug: string; id: string }> };

async function load(slug: string, id: string) {
  const data = await getStore(slug);
  const product = data?.products.find((p) => p.id === id);
  return data && product ? { ...data, product } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  const d = await load(slug, id);
  if (!d) return { title: { absolute: "Produto não encontrado" } };
  const { store, product: p } = d;
  const price = priceLabel(p.price, p.price_mode);
  const description = `${price}${p.description ? ` · ${p.description.slice(0, 140)}` : ""} — ${store.name}`;
  const url = `${await siteUrl()}${productPath(slug, id)}`;
  // miniatura em JPEG: é o formato que a prévia de link do WhatsApp sempre aceita
  const image = p.images[0]?.thumb_url ?? store.cover_url ?? undefined;
  return {
    title: { absolute: `${p.name} · ${store.name}` },
    description,
    alternates: { canonical: url },
    openGraph: { title: `${p.name} — ${price}`, description, url, type: "website", images: image ? [{ url: image }] : undefined },
    twitter: { card: "summary_large_image", title: p.name, description, images: image ? [image] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug, id } = await params;
  const d = await load(slug, id);
  if (!d) notFound();
  const { store, products, product: p } = d;
  const price = priceLabel(p.price, p.price_mode);
  const url = `${await siteUrl()}${productPath(slug, id)}`;
  const wa = whatsappLink(store.whatsapp, orderMessage(store.name, p, price, url));
  const related = products.filter((x) => x.id !== p.id && (x.category ?? "") === (p.category ?? "")).slice(0, 4);
  const more = related.length ? related : products.filter((x) => x.id !== p.id).slice(0, 4);

  return (
    <div className="min-h-screen">
      <StoreHeader store={store} back />
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 md:pb-10 md:pt-8">
        <div className="grid gap-6 md:grid-cols-2 md:gap-10">
          <Gallery images={p.images} alt={p.name} />
          <div className="md:pt-2">
            {p.category && <p className="text-xs font-medium uppercase tracking-wider text-brand-600">{p.category}</p>}
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">{p.name}</h1>
            <p className={`mt-2 text-xl ${p.price_mode === "sob_consulta" ? "text-stone-600" : "font-semibold text-brand-700"}`}>{price}</p>
            {p.price_mode === "a_partir_de" && <p className="mt-1 text-xs text-stone-500">O valor final depende do tamanho e das flores escolhidas.</p>}
            {p.description && <p className="mt-5 whitespace-pre-line leading-relaxed text-stone-700">{p.description}</p>}
            {p.sku && <p className="mt-4 text-xs text-stone-400">Código: {p.sku}</p>}

            {wa && (
              <div className="glass-strong fixed inset-x-0 bottom-0 z-30 border-t border-white/70 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:mt-8 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
                <a href={wa} target="_blank" className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-base font-semibold">
                  <WhatsAppIcon className="h-5 w-5" /> Pedir pelo WhatsApp
                </a>
              </div>
            )}
            <p className="mt-4 hidden items-start gap-2 text-sm text-stone-500 md:flex">
              <MessageCircleHeart className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden />
              Ao tocar em “Pedir”, abrimos uma conversa no WhatsApp com este produto já na mensagem. É só combinar a entrega e o cartão.
            </p>
          </div>
        </div>

        {more.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-3 text-lg font-semibold tracking-tight text-stone-900">Você também pode gostar</h2>
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-4">
              {more.map((x) => <ProductCard key={x.id} slug={slug} p={x} />)}
            </div>
          </section>
        )}
      </main>
      <StoreFooter />
    </div>
  );
}
