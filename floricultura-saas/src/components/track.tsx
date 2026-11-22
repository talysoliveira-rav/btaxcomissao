"use client";
import { useEffect } from "react";

type Ev = { slug: string; kind: "view_store" | "view_product" | "view_selection" | "click_whatsapp"; product?: string; selection?: string };

export function sendEvent(ev: Ev) {
  try {
    const body = JSON.stringify(ev);
    if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) {
      fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
    }
  } catch {
    /* ignora */
  }
}

/** Conta uma visualização por página e por sessão (recarregar não infla o número). */
export function Track(ev: Ev) {
  useEffect(() => {
    const key = `flo:${ev.kind}:${ev.slug}:${ev.product ?? ""}:${ev.selection ?? ""}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* navegação privada: conta mesmo assim */
    }
    sendEvent(ev);
  }, [ev.kind, ev.slug, ev.product, ev.selection]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** Link do WhatsApp que registra o clique antes de abrir a conversa. */
export function WhatsAppLink({ href, slug, product, selection, className, children, ...rest }: React.ComponentProps<"a"> & { href: string; slug: string; product?: string; selection?: string }) {
  return (
    <a
      {...rest}
      href={href}
      target="_blank"
      rel="noopener"
      className={className}
      onClick={() => sendEvent({ slug, kind: "click_whatsapp", product, selection })}
    >
      {children}
    </a>
  );
}
