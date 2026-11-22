"use client";
import { useId } from "react";

/** Marca do Florescer: tulipa em traço com linha de crescimento. Vetor, funciona nos temas claro e escuro. */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  // id único: a mesma logo aparece várias vezes na página (menu, celular, gaveta)
  const gid = `flo-g-${useId().replace(/:/g, "")}`;
  const g = `url(#${gid})`;
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="34" y1="6" x2="26" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff8a6b" />
          <stop offset="0.5" stopColor="#f2507f" />
          <stop offset="1" stopColor="#d1237a" />
        </linearGradient>
      </defs>
      <g stroke={g} strokeWidth={2.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M30 5.5c-4 3.8-5.4 8.8-4 13.8M30 5.5c4 3.8 5.4 8.8 4 13.8" />
        <path d="M16 11.5c5.6 1.4 9.8 5.4 12 11.4M16 11.5c-1 9.6 3 16.8 14 19.9" />
        <path d="M44 11.5c-5.6 1.4-9.8 5.4-12 11.4M44 11.5c1 9.6-3 16.8-14 19.9" />
        <path d="M30 31.4V61" />
        <path d="M5.5 46.5C10 42 13.5 39.6 18.5 39.3c5.2-.3 7.6-5 11.8-8 3-2.2 5.4-.2 7.8.3 3 .6 5.6-3.8 8.6-7.2l6.2-6.6" />
      </g>
      <circle cx="54.6" cy="16.4" r="2.9" fill={g} />
      <path d="M30 58.5c-9 0-15.3-5.8-15.5-15 8.8.4 15 6 15.5 15z" fill={g} />
      <path d="M30 58.5c.5-9 6.7-14.6 15.5-15-.2 9.2-6.5 15-15.5 15z" fill={g} />
    </svg>
  );
}

export function Logo({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <LogoMark className="h-9 w-9 shrink-0" />
      {!compact && <span className="text-stone-900">Florescer</span>}
    </span>
  );
}
