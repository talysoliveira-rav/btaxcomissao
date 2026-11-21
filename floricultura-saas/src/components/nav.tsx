"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Boxes, CalendarHeart, ChartColumn, ClipboardList, Columns3, Flower2, Gem, House, Menu, PanelLeftClose, PanelLeftOpen,
  Settings, Truck, Users, X, type LucideIcon,
} from "lucide-react";
import { FLOWER_BY_SECTION } from "./flowers";

type Item = { href: string; label: string; icon: LucideIcon };

const GROUPS: { label?: string; items: Item[] }[] = [
  {
    items: [
      { href: "/app", label: "Início", icon: House },
      { href: "/app/pedidos", label: "Pedidos", icon: ClipboardList },
      { href: "/app/producao", label: "Produção", icon: Columns3 },
      { href: "/app/entregas", label: "Entregas", icon: Truck },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { href: "/app/catalogo", label: "Catálogo", icon: Flower2 },
      { href: "/app/estoque", label: "Estoque", icon: Boxes },
      { href: "/app/clientes", label: "Clientes", icon: Users },
      { href: "/app/datas", label: "Datas especiais", icon: CalendarHeart },
    ],
  },
  {
    label: "Gestão",
    items: [
      { href: "/app/relatorios", label: "Relatórios", icon: ChartColumn },
      { href: "/app/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
];

const TABS = GROUPS[0].items;
const YEAR = 60 * 60 * 24 * 365;

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${YEAR}; samesite=lax`;
}

function useActive() {
  const path = usePathname();
  return (href: string) => (href === "/app" ? path === "/app" : path === href || path.startsWith(href + "/"));
}

type Badges = Record<string, number>;

function NavList({ collapsed = false, onNavigate, badges = {} }: { collapsed?: boolean; onNavigate?: () => void; badges?: Badges }) {
  const isActive = useActive();
  return (
    <nav aria-label="Principal" className="space-y-4">
      {GROUPS.map((g, gi) => (
        <div key={gi}>
          {g.label &&
            (collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-stone-300/60" aria-hidden />
            ) : (
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">{g.label}</p>
            ))}
          <ul className="space-y-1">
            {g.items.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              const badge = badges[href] ?? 0;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    title={collapsed ? (badge ? `${label} · ${badge} alerta(s)` : label) : undefined}
                    aria-label={collapsed ? label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex items-center rounded-xl text-sm font-medium transition-all duration-300 ${
                      collapsed ? "mx-auto h-10 w-10 justify-center" : "gap-2.5 px-3 py-2"
                    } ${active ? "accent-active" : "text-stone-600 hover:bg-white/70 hover:text-stone-900"}`}
                  >
                    <Icon
                      className={`accent-icon h-[18px] w-[18px] shrink-0 transition-transform duration-300 group-hover:scale-110 ${active ? "" : "text-stone-400 group-hover:text-brand-600"}`}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    {!collapsed && <span className="truncate">{label}</span>}
                    {badge > 0 &&
                      (collapsed ? (
                        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white" aria-label={`${badge} alerta(s)`} />
                      ) : (
                        <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1.5 text-[11px] font-semibold text-white" aria-label={`${badge} alerta(s)`}>
                          {badge}
                        </span>
                      ))}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Alterna entre destaque "vidro" e "rosa em degradê". */
export function AccentToggle({ initial, compact = false }: { initial: "glass" | "gradient"; compact?: boolean }) {
  const [accent, setAccent] = useState(initial);
  const apply = (a: "glass" | "gradient") => {
    setAccent(a);
    setCookie("flora_accent", a);
    document.getElementById("app-shell")?.setAttribute("data-accent", a);
  };
  if (compact) {
    return (
      <button
        type="button"
        onClick={() => apply(accent === "glass" ? "gradient" : "glass")}
        title={accent === "glass" ? "Mudar para rosa em degradê" : "Mudar para vidro"}
        aria-label="Alternar estilo de destaque"
        className="mx-auto grid h-9 w-9 place-items-center rounded-xl text-stone-500 transition hover:bg-white/70 hover:text-brand-600"
      >
        <Gem className="h-4 w-4" strokeWidth={1.75} />
      </button>
    );
  }
  return (
    <div role="radiogroup" aria-label="Estilo de destaque" className="grid grid-cols-2 gap-1 rounded-xl bg-stone-900/5 p-1 text-xs font-medium">
      {(
        [
          ["glass", "Vidro"],
          ["gradient", "Rosa"],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={accent === key}
          onClick={() => apply(key)}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all duration-300 ${
            accent === key ? "accent-active" : "text-stone-500 hover:text-stone-800"
          }`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${key === "glass" ? "border border-brand-300 bg-white" : "bg-[image:var(--rose-gradient)]"}`}
            aria-hidden
          />
          {label}
        </button>
      ))}
    </div>
  );
}

/** Barra lateral do desktop, recolhível. O estado fica salvo num cookie. */
export function Sidebar({
  initialCollapsed,
  initialAccent,
  logo,
  logoCompact,
  orgSwitcher,
  account,
  accountCompact,
  badges,
}: {
  badges?: Badges;
  initialCollapsed: boolean;
  initialAccent: "glass" | "gradient";
  logo: React.ReactNode;
  logoCompact: React.ReactNode;
  orgSwitcher: React.ReactNode;
  account: React.ReactNode;
  accountCompact: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const toggle = () =>
    setCollapsed((c) => {
      setCookie("flora_sidebar", c ? "open" : "collapsed");
      return !c;
    });

  useEffect(() => {
    // Atalho: Ctrl/⌘ + B
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <aside
      data-collapsed={collapsed}
      className={`glass no-print relative hidden border-r border-white/70 shadow-[1px_0_0_rgb(231_229_228/0.6)] transition-[width] duration-300 ease-[var(--ease-out)] md:sticky md:top-0 md:z-30 md:flex md:h-screen md:shrink-0 md:flex-col ${
        collapsed ? "md:w-[76px]" : "md:w-64"
      }`}
    >
      <div className={`flex items-center pt-4 ${collapsed ? "justify-center px-2" : "px-4"}`}>
        <Link href="/app" aria-label="Início">{collapsed ? logoCompact : logo}</Link>
      </div>
      {!collapsed && <div className="px-4 pt-4">{orgSwitcher}</div>}

      <div className={`flex-1 overflow-y-auto overflow-x-hidden py-4 ${collapsed ? "px-2" : "px-3"}`}>
        <NavList collapsed={collapsed} badges={badges} />
      </div>

      <div className={`space-y-3 border-t border-stone-200/60 ${collapsed ? "px-2 py-3" : "p-4"}`}>
        <AccentToggle initial={initialAccent} compact={collapsed} />
        {collapsed ? accountCompact : account}
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        aria-expanded={!collapsed}
        title={`${collapsed ? "Expandir" : "Recolher"} menu (Ctrl+B)`}
        className="glass-strong absolute -right-3.5 top-6 grid h-7 w-7 place-items-center rounded-full border border-white text-stone-500 shadow-md transition hover:scale-110 hover:text-brand-600"
      >
        {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );
}

/** Botão de menu + gaveta (celular) */
export function MobileDrawer({ header, footer, badges }: { header: React.ReactNode; footer: React.ReactNode; badges?: Badges }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid h-9 w-9 place-items-center rounded-xl text-stone-700 transition hover:bg-white/70"
        aria-label="Abrir menu"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" />
      </button>
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 md:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!open}
      >
        <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div
          className={`glass-strong absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col shadow-2xl transition-transform duration-300 ease-[var(--ease-out)] ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-stone-200/60 p-4">
            {header}
            <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-white/70" aria-label="Fechar menu">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <NavList onNavigate={() => setOpen(false)} badges={badges} />
          </div>
          <div className="space-y-3 border-t border-stone-200/60 p-4">{footer}</div>
        </div>
      </div>
    </>
  );
}

/** Abas inferiores (celular) */
export function BottomTabs() {
  const isActive = useActive();
  return (
    <nav aria-label="Atalhos" className="glass-strong no-print fixed inset-x-0 bottom-0 z-40 border-t border-white/70 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-16px_rgb(157_23_77/0.25)] md:hidden">
      <ul className="grid grid-cols-4 gap-1 px-2 py-1.5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-all duration-300 ${
                  active ? "accent-active" : "text-stone-500"
                }`}
              >
                <Icon className="accent-icon h-5 w-5" strokeWidth={1.75} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Flor desenhada em traço fino, semitransparente, diferente em cada aba. */
export function FlowerBackdrop() {
  const path = usePathname();
  const section = path.split("/")[2] ?? "inicio";
  const Flower = FLOWER_BY_SECTION[section] ?? FLOWER_BY_SECTION.inicio;
  return (
    <div aria-hidden className="pointer-events-none fixed bottom-0 right-0 z-0 overflow-hidden print:hidden">
      <Flower
        key={section}
        className="flower-watermark h-[340px] w-[340px] translate-x-[12%] translate-y-[8%] md:h-[520px] md:w-[520px]"
        strokeWidth={0.9}
      />
    </div>
  );
}
