import Link from "next/link";
import { ChartColumn, Flower2, Link2, Sparkles } from "lucide-react";

const TABS = [
  { key: "produtos", href: "/app/catalogo", label: "Produtos", icon: Flower2 },
  { key: "selecoes", href: "/app/catalogo/selecoes", label: "Seleções", icon: Link2 },
  { key: "ofertas", href: "/app/catalogo/ofertas", label: "Ofertas do dia", icon: Sparkles },
  { key: "desempenho", href: "/app/catalogo/desempenho", label: "Desempenho", icon: ChartColumn },
] as const;

export function CatalogTabs({ active, offerAlerts = 0 }: { active: (typeof TABS)[number]["key"]; offerAlerts?: number }) {
  return (
    <nav aria-label="Seções do catálogo" className="mb-6 flex flex-wrap gap-1.5">
      {TABS.map(({ key, href, label, icon: Icon }) => (
        <Link
          key={key}
          href={href}
          aria-current={key === active ? "page" : undefined}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-300 ${
            key === active ? "accent-active" : "bg-white/60 text-stone-600 ring-1 ring-white/80 backdrop-blur hover:bg-white/90"
          }`}
        >
          <Icon className="accent-icon h-4 w-4" strokeWidth={1.75} aria-hidden />
          {label}
          {key === "ofertas" && offerAlerts > 0 && (
            <span className="ml-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1.5 text-[11px] font-semibold text-[#fff]" title="Produtos com flores vencendo">
              {offerAlerts}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
