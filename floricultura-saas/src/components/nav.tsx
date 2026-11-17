"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const items = [
  { href: "/app", label: "Início", icon: "🏠" },
  { href: "/app/pedidos", label: "Pedidos", icon: "🧾" },
  { href: "/app/entregas", label: "Entregas", icon: "🚚" },
  { href: "/app/catalogo", label: "Catálogo", icon: "💐" },
  { href: "/app/estoque", label: "Estoque", icon: "🌹" },
  { href: "/app/clientes", label: "Clientes", icon: "👥" },
  { href: "/app/datas", label: "Datas especiais", icon: "🎂" },
  { href: "/app/relatorios", label: "Relatórios", icon: "📊" },
  { href: "/app/configuracoes", label: "Configurações", icon: "⚙️" },
];

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));
  return (
    <>
      <button className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm md:hidden" onClick={() => setOpen(!open)}>
        ☰ Menu
      </button>
      <nav className={`${open ? "block" : "hidden"} mt-3 space-y-0.5 md:mt-6 md:block`}>
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active(i.href) ? "bg-brand-50 text-brand-700" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            <span className="w-5 text-center">{i.icon}</span>
            {i.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
