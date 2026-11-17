import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const variants = {
  primary: "btn-primary",
  secondary: "bg-white/80 text-stone-800 border border-stone-200 hover:bg-white hover:border-stone-300 shadow-sm",
  ghost: "text-stone-700 hover:bg-white/70",
  danger: "bg-white text-red-700 border border-red-200 hover:bg-red-50",
  leaf: "bg-leaf-600 text-white hover:bg-leaf-700",
};
type Variant = keyof typeof variants;
const btnBase =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

export function Button({ variant = "primary", className, ...p }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cx(btnBase, variants[variant], className)} {...p} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...p
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(btnBase, variants[variant], className)} {...p} />;
}

const field =
  "w-full rounded-lg border border-stone-200 bg-white/90 px-3 py-2 text-sm shadow-sm outline-none transition duration-200 focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-100";

export function Input({ className, ...p }: ComponentProps<"input">) {
  return <input className={cx(field, className)} {...p} />;
}
export function Select({ className, ...p }: ComponentProps<"select">) {
  return <select className={cx(field, className)} {...p} />;
}
export function Textarea({ className, ...p }: ComponentProps<"textarea">) {
  return <textarea className={cx(field, className)} rows={3} {...p} />;
}

export function Field({ label, children, hint, className }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cx("block space-y-1", className)}>
      <span className="text-xs font-medium text-stone-600">{label}</span>
      {children}
      {hint && <span className="block text-xs text-stone-400">{hint}</span>}
    </label>
  );
}

export function Card({
  className,
  children,
  title,
  actions,
  icon: Icon,
}: {
  className?: string;
  children: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <section className={cx("surface rounded-2xl border", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-2 border-b border-stone-200/60 px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-stone-800">
            {Icon && <Icon className="h-4 w-4 text-brand-600" aria-hidden />}
            {title}
          </h2>
          <div className="flex items-center gap-2">{actions}</div>
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
      </div>
      {actions && <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", className ?? "bg-stone-100 text-stone-700")}>{children}</span>;
}

/** Estado vazio. Versão simples: <Empty>texto</Empty>. Completa: com ícone, título e ação. */
export function Empty({
  children,
  icon: Icon,
  title,
  action,
}: {
  children?: ReactNode;
  icon?: LucideIcon;
  title?: string;
  action?: { href: string; label: string };
}) {
  if (!Icon && !title && !action) return <p className="py-8 text-center text-sm text-stone-400">{children}</p>;
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      {Icon && (
        <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
      )}
      {title && <p className="font-medium text-stone-800">{title}</p>}
      {children && <p className="mt-1 max-w-sm text-sm text-stone-500">{children}</p>}
      {action && (
        <Link href={action.href} className={cx(btnBase, variants.primary, "mt-4")}>
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  href,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
  icon?: LucideIcon;
  tone?: "default" | "warn";
}) {
  const body = (
    <div className={cx("surface h-full rounded-2xl border p-4 transition duration-300", tone === "warn" && "!border-amber-200", href && "hover:-translate-y-0.5 hover:!border-brand-200")}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500 md:text-xs">{label}</p>
        {Icon && <Icon className={cx("h-4 w-4", tone === "warn" ? "text-amber-600" : "text-stone-400")} aria-hidden />}
      </div>
      <p className="mt-1 truncate text-xl font-semibold tracking-tight text-stone-900 md:text-2xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm [&_td]:px-3 [&_td]:py-2.5 [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-stone-500 [&_tbody_tr]:border-t [&_tbody_tr]:border-stone-200/50 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-white/70">
        {children}
      </table>
    </div>
  );
}

export function Alert({ kind = "error", children }: { kind?: "error" | "info" | "success"; children: ReactNode }) {
  const c = { error: "bg-red-50 text-red-800 border-red-200", info: "bg-sky-50 text-sky-800 border-sky-200", success: "bg-emerald-50 text-emerald-800 border-emerald-200" }[kind];
  return <div className={cx("rounded-lg border px-3 py-2 text-sm", c)}>{children}</div>;
}
