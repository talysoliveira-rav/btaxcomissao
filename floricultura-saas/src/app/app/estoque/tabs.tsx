import Link from "next/link";
import { ArrowLeftRight, Boxes, Hourglass, ShoppingBasket } from "lucide-react";

const TABS = [
  { key: "insumos", href: "/app/estoque", label: "Insumos", icon: Boxes },
  { key: "perecibilidade", href: "/app/estoque/perecibilidade", label: "Perecibilidade", icon: Hourglass },
  { key: "compras", href: "/app/estoque/compras", label: "Compras", icon: ShoppingBasket },
  { key: "movimentacoes", href: "/app/estoque/movimentacoes", label: "Movimentações", icon: ArrowLeftRight },
] as const;

export function StockTabs({ active, alerts = 0 }: { active: (typeof TABS)[number]["key"]; alerts?: number }) {
  return (
    <nav aria-label="Seções do estoque" className="mb-6 flex flex-wrap gap-1.5">
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
          {key === "perecibilidade" && alerts > 0 && (
            <span className="ml-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1.5 text-[11px] font-semibold text-[#fff]">{alerts}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
