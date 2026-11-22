"use client";
import { useState } from "react";
import { Check, Copy, ExternalLink, Share2 } from "lucide-react";

/** Copiar link, enviar pelo WhatsApp e compartilhar nativo (celular). */
export function ShareLink({ url, message, compact = false }: { url: string; message: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const text = `${message}\n${url}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copie o link:", url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: message, url });
      } catch {
        /* cancelado */
      }
    } else copy();
  };
  const btn = "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition duration-200 active:scale-[0.98]";
  return (
    <div className="space-y-2">
      {!compact && (
        <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white/80 px-3 py-2 text-sm">
          <span className="min-w-0 flex-1 truncate text-stone-600">{url.replace(/^https?:\/\//, "")}</span>
          <a href={url} target="_blank" className="shrink-0 text-stone-400 hover:text-brand-700" aria-label="Abrir link" title="Abrir">
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" className={`${btn} bg-[#25D366] text-[#fff] hover:brightness-95`}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.6-.1 1.1Z" />
          </svg>
          Enviar no WhatsApp
        </a>
        <button type="button" onClick={copy} className={`${btn} border border-stone-200 bg-white/80 text-stone-700 hover:bg-white`}>
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado!" : "Copiar link"}
        </button>
        <button type="button" onClick={nativeShare} className={`${btn} border border-stone-200 bg-white/80 text-stone-700 hover:bg-white sm:hidden`}>
          <Share2 className="h-4 w-4" /> Compartilhar
        </button>
      </div>
    </div>
  );
}
