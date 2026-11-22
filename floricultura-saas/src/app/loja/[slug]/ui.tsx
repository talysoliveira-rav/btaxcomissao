/* eslint-disable @next/next/no-img-element -- fotos já otimizadas no envio (WebP, 640/1600 px) */
import Link from "next/link";
import { Flower2 } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { priceLabel, whatsappLink } from "@/lib/format";
import type { Store, StoreProduct } from "@/lib/storefront";
import { productPath, storePath } from "@/lib/site";

export function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.6-.1 1.1Z" />
    </svg>
  );
}

export function StoreAvatar({ store, className = "h-10 w-10" }: { store: Pick<Store, "name" | "logo_url">; className?: string }) {
  return store.logo_url ? (
    <img src={store.logo_url} alt="" className={`${className} shrink-0 rounded-full object-cover ring-2 ring-white`} />
  ) : (
    <span className={`${className} grid shrink-0 place-items-center rounded-full bg-[image:var(--rose-gradient)] text-sm font-semibold text-[#fff] ring-2 ring-white`}>
      {store.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function StoreHeader({ store, back }: { store: Store; back?: boolean }) {
  const wa = whatsappLink(store.whatsapp, `Olá, ${store.name}! Vim pela vitrine e gostaria de ajuda.`);
  return (
    <header className="glass-strong sticky top-0 z-30 border-b border-white/70">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <Link href={storePath(store.slug)} className="flex min-w-0 items-center gap-2.5">
          <StoreAvatar store={store} className="h-9 w-9" />
          <span className="truncate font-semibold tracking-tight text-stone-900">{back ? `← ${store.name}` : store.name}</span>
        </Link>
        {wa && (
          <a href={wa} target="_blank" className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 py-2 text-sm font-medium text-[#fff] shadow-sm transition hover:brightness-95 active:scale-[0.98]">
            <WhatsAppIcon /> <span className="hidden sm:inline">Falar no WhatsApp</span><span className="sm:hidden">WhatsApp</span>
          </a>
        )}
      </div>
    </header>
  );
}

export function ProductCard({ slug, p, large = false }: { slug: string; p: StoreProduct; large?: boolean }) {
  const img = p.images[0];
  return (
    <Link href={productPath(slug, p.id)} className="group block">
      <div className={`relative overflow-hidden rounded-2xl bg-stone-100 ${large ? "aspect-[4/5]" : "aspect-[4/5]"}`}>
        {img ? (
          <img
            src={large ? img.url : img.thumb_url}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-50 to-stone-100 text-brand-300">
            <Flower2 className="h-10 w-10" strokeWidth={1.25} aria-hidden />
          </span>
        )}
        {p.featured && <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-brand-700 shadow-sm">Destaque</span>}
        {p.images.length > 1 && <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-[#fff]">{p.images.length} fotos</span>}
      </div>
      <div className="mt-2 px-0.5">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-stone-900">{p.name}</p>
        <p className={`mt-0.5 text-sm ${p.price_mode === "sob_consulta" ? "text-stone-500" : "font-semibold text-brand-700"}`}>{priceLabel(p.price, p.price_mode)}</p>
      </div>
    </Link>
  );
}

export function StoreFooter() {
  return (
    <footer className="mt-16 border-t border-stone-200/70 py-8 text-center text-xs text-stone-500">
      <Link href="/" className="inline-flex items-center gap-1.5 hover:text-stone-800">
        Vitrine criada com <LogoMark className="h-4 w-4" /> <b className="font-semibold">Florescer</b>
      </Link>
    </footer>
  );
}
