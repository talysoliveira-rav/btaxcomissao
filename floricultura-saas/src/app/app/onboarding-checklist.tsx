import Link from "next/link";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hideOnboarding } from "./actions";

type Step = { done: boolean; title: string; text: string; href: string; cta: string };

export async function OnboardingChecklist({ orgId }: { orgId: string }) {
  const supabase = await createClient();
  const count = (table: string) =>
    supabase.from(table).select("id", { count: "exact", head: true }).eq("org_id", orgId).then((r) => r.count ?? 0);

  const [supplies, components, customers, drivers, orders] = await Promise.all([
    count("supplies"),
    count("product_components"),
    count("customers"),
    count("drivers"),
    count("orders"),
  ]);

  const steps: Step[] = [
    { done: supplies > 0, title: "Cadastre seus insumos", text: "Flores, folhagens, vasos e embalagens, com custo e estoque mínimo.", href: "/app/estoque", cta: "Ir para Estoque" },
    { done: components > 0, title: "Monte um produto com ficha técnica", text: "Diga quais insumos vão em cada arranjo. O estoque baixa sozinho na produção.", href: "/app/catalogo", cta: "Ir para Catálogo" },
    { done: customers > 0, title: "Cadastre um cliente", text: "Com endereço e datas especiais, ele vira lembrete de venda.", href: "/app/clientes", cta: "Ir para Clientes" },
    { done: drivers > 0, title: "Adicione um entregador", text: "Para distribuir as entregas do dia e imprimir a rota.", href: "/app/configuracoes", cta: "Ir para Configurações" },
    { done: orders > 0, title: "Lance o primeiro pedido", text: "Depois acompanhe pelo quadro de Produção.", href: "/app/pedidos/novo", cta: "Novo pedido" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;
  const nextIdx = steps.findIndex((s) => !s.done);
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <section aria-labelledby="onb-title" className="mb-6 overflow-hidden rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white shadow-sm">
      <header className="flex flex-wrap items-center gap-3 px-4 pb-3 pt-4">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
          <Sparkles className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="onb-title" className="font-semibold text-stone-900">Primeiros passos</h2>
          <p className="text-xs text-stone-500">{doneCount} de {steps.length} concluídos</p>
        </div>
        <form action={hideOnboarding}>
          <button className="text-xs font-medium text-stone-500 hover:text-stone-800">Ocultar</button>
        </form>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso">
          <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </header>
      <ol className="divide-y divide-brand-100 border-t border-brand-100 bg-white/60">
        {steps.map((s, i) => (
          <li key={s.title}>
            <Link href={s.href} className={`group flex items-center gap-3 px-4 py-3 transition hover:bg-white ${i === nextIdx ? "bg-white" : ""}`}>
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                  s.done ? "bg-emerald-500 text-white" : i === nextIdx ? "bg-brand-600 text-white" : "border border-stone-300 text-stone-400"
                }`}
              >
                {s.done ? <Check className="h-3.5 w-3.5" aria-label="Concluído" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-medium ${s.done ? "text-stone-400 line-through" : "text-stone-900"}`}>{s.title}</span>
                {!s.done && <span className="block text-xs text-stone-500">{s.text}</span>}
              </span>
              {!s.done && (
                <span className={`hidden shrink-0 items-center gap-0.5 text-xs font-medium sm:inline-flex ${i === nextIdx ? "text-brand-700" : "text-stone-400 group-hover:text-stone-700"}`}>
                  {s.cta} <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
