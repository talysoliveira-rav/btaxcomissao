import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const variants = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  secondary: "bg-white text-stone-800 border border-stone-300 hover:bg-stone-50",
  ghost: "text-stone-700 hover:bg-stone-100",
  danger: "bg-white text-red-700 border border-red-200 hover:bg-red-50",
  leaf: "bg-leaf-600 text-white hover:bg-leaf-700",
};
type Variant = keyof typeof variants;
const btnBase =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none";

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
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

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

export function Card({ className, children, title, actions }: { className?: string; children: ReactNode; title?: ReactNode; actions?: ReactNode }) {
  return (
    <section className={cx("rounded-xl border border-stone-200 bg-white shadow-sm", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-2 border-b border-stone-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-stone-800">{title}</h2>
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

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-stone-400">{children}</p>;
}

export function Stat({ label, value, hint, href }: { label: string; value: ReactNode; hint?: ReactNode; href?: string }) {
  const body = (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-brand-200">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-stone-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm [&_td]:px-3 [&_td]:py-2.5 [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-stone-500 [&_tbody_tr]:border-t [&_tbody_tr]:border-stone-100 [&_tbody_tr:hover]:bg-stone-50">
        {children}
      </table>
    </div>
  );
}

export function Alert({ kind = "error", children }: { kind?: "error" | "info" | "success"; children: ReactNode }) {
  const c = { error: "bg-red-50 text-red-800 border-red-200", info: "bg-sky-50 text-sky-800 border-sky-200", success: "bg-emerald-50 text-emerald-800 border-emerald-200" }[kind];
  return <div className={cx("rounded-lg border px-3 py-2 text-sm", c)}>{children}</div>;
}
