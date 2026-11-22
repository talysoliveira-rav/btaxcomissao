/* eslint-disable @next/next/no-img-element -- fotos já otimizadas no envio */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AtSign, Clock, MapPin, Truck } from "lucide-react";
import { whatsappLink } from "@/lib/format";
import { categorySlug, getStore, groupByCategory } from "@/lib/storefront";
import { siteUrl, storePath } from "@/lib/site";
import { ProductCard, StoreAvatar, StoreFooter, StoreHeader, WhatsAppIcon } from "./ui";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getStore(slug);
  if (!data) return { title: { absolute: "Vitrine não encontrada" } };
  const { store, products } = data;
  const image = store.cover_url ?? products.find((p) => p.images[0])?.images[0].thumb_url ?? store.logo_url ?? undefined;
  const description = store.tagline ?? `Buquês, arranjos e presentes de ${store.name}. Escolha pelas fotos e peça pelo WhatsApp.`;
  const url = `${await siteUrl()}${storePath(slug)}`;
  return {
    title: { absolute: `${store.name} · Vitrine` },
    description,
    alternates: { canonical: url },
    openGraph: { title: store.name, description, url, type: "website", images: image ? [{ url: image }] : undefined },
    twitter: { card: "summary_large_image", title: store.name, description, images: image ? [image] : undefined },
  };
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  const data = await getStore(slug);
  if (!data) notFound();
  const { store, products } = data;
  const featured = products.filter((p) => p.featured);
  const groups = groupByCategory(products);
  const wa = whatsappLink(store.whatsapp, `Olá, ${store.name}! Vim pela vitrine e gostaria de ajuda para escolher.`);
  const info = [
    store.opening_hours && { icon: Clock, text: store.opening_hours },
    store.delivery_area && { icon: Truck, text: `Entregamos: ${store.delivery_area}` },
    store.address && { icon: MapPin, text: store.address },
    store.instagram && { icon: AtSign, text: store.instagram, href: `https://instagram.com/${store.instagram}` },
  ].filter(Boolean) as { icon: typeof Clock; text: string; href?: string }[];

  return (
    <div className="min-h-screen">
      <StoreHeader store={store} />

      {/* Capa */}
      <section className="relative">
        <div className="relative h-56 overflow-hidden sm:h-72 md:h-80">
          {store.cover_url ? (
            <img src={store.cover_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-[image:var(--rose-gradient)] opacity-90" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        </div>
        <div className="mx-auto -mt-16 max-w-6xl px-4">
          <div className="surface relative rounded-3xl border p-5 sm:flex sm:items-end sm:gap-5 sm:p-6">
            <StoreAvatar store={store} className="-mt-14 h-20 w-20 text-2xl sm:-mt-16 sm:h-24 sm:w-24" />
            <div className="mt-3 min-w-0 flex-1 sm:mt-0">
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">{store.name}</h1>
              {store.tagline && <p className="mt-1 text-stone-600">{store.tagline}</p>}
            </div>
            {wa && (
              <a href={wa} target="_blank" className="btn-primary mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold sm:mt-0 sm:w-auto">
                <WhatsAppIcon /> Pedir pelo WhatsApp
              </a>
            )}
          </div>
          {info.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2 text-xs text-stone-600">
              {info.map(({ icon: Icon, text, href }) => (
                <li key={text}>
                  {href ? (
                    <a href={href} target="_blank" className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 ring-1 ring-white hover:text-brand-700">
                      <Icon className="h-3.5 w-3.5" aria-hidden /> {text}
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 ring-1 ring-white">
                      <Icon className="h-3.5 w-3.5" aria-hidden /> {text}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Categorias */}
      {groups.length > 1 && (
        <nav aria-label="Categorias" className="glass sticky top-[57px] z-20 mt-6 border-y border-white/60">
          <ul className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2.5 [scrollbar-width:none]">
            {featured.length > 0 && (
              <li><a href="#destaques" className="block whitespace-nowrap rounded-full bg-white/80 px-3.5 py-1.5 text-sm font-medium text-brand-700 ring-1 ring-brand-100">Destaques</a></li>
            )}
            {groups.map(([cat, items]) => (
              <li key={cat}>
                <a href={`#${categorySlug(cat)}`} className="block whitespace-nowrap rounded-full bg-white/80 px-3.5 py-1.5 text-sm font-medium text-stone-700 ring-1 ring-white hover:text-brand-700">
                  {cat} <span className="text-stone-400">{items.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <main className="mx-auto max-w-6xl px-4">
        {products.length === 0 && (
          <p className="py-20 text-center text-stone-500">Em breve, novidades por aqui. Fale com a gente pelo WhatsApp!</p>
        )}

        {featured.length > 0 && (
          <section id="destaques" className="scroll-mt-32 pt-8">
            <h2 className="mb-3 text-lg font-semibold tracking-tight text-stone-900">Destaques</h2>
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
              {featured.map((p) => (
                <div key={p.id} className="w-[62%] shrink-0 snap-start sm:w-64">
                  <ProductCard slug={slug} p={p} large />
                </div>
              ))}
            </div>
          </section>
        )}

        {groups.map(([cat, items]) => (
          <section key={cat} id={categorySlug(cat)} className="scroll-mt-32 pt-10">
            <h2 className="mb-3 text-lg font-semibold tracking-tight text-stone-900">{cat}</h2>
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((p) => <ProductCard key={p.id} slug={slug} p={p} />)}
            </div>
          </section>
        ))}

        {store.description && (
          <section className="surface mt-12 rounded-3xl border p-6">
            <h2 className="mb-2 text-lg font-semibold tracking-tight text-stone-900">Sobre a {store.name}</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-stone-600">{store.description}</p>
          </section>
        )}
      </main>

      <StoreFooter />

      {wa && (
        <a
          href={wa}
          target="_blank"
          aria-label="Falar no WhatsApp"
          className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-[#fff] shadow-[0_10px_30px_-8px_rgb(37_211_102/0.7)] transition hover:scale-105 sm:hidden"
        >
          <WhatsAppIcon className="h-7 w-7" />
        </a>
      )}
    </div>
  );
}
