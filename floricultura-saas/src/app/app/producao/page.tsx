import Link from "next/link";
import { Columns3, Plus } from "lucide-react";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink, Card, Empty, PageHeader } from "@/components/ui";
import { todayISO } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";
import { Board, type BoardCard } from "./board";

export const metadata = { title: "Produção" };

const OPEN: OrderStatus[] = ["novo", "confirmado", "em_producao", "pronto", "em_rota"];

const PERIODS = [
  { key: "hoje", label: "Hoje", hint: "inclui atrasados" },
  { key: "amanha", label: "Amanhã" },
  { key: "semana", label: "7 dias" },
  { key: "todos", label: "Todos em aberto" },
] as const;
type Period = (typeof PERIODS)[number]["key"];

type Row = Order & { order_items: { description: string; quantity: number }[] };

export default async function ProductionPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const sp = await searchParams;
  const period: Period = PERIODS.some((p) => p.key === sp.periodo) ? (sp.periodo as Period) : "hoje";
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const today = todayISO();
  const tomorrow = todayISO(1);

  let open = supabase
    .from("orders")
    .select("*, customers(name), drivers(name), order_items(description, quantity)")
    .eq("org_id", org.id)
    .in("status", OPEN)
    .order("delivery_date", { nullsFirst: false })
    .order("delivery_time", { nullsFirst: false })
    .order("number");
  if (period === "hoje") open = open.lte("delivery_date", today);
  else if (period === "amanha") open = open.eq("delivery_date", tomorrow);
  else if (period === "semana") open = open.lte("delivery_date", todayISO(7));

  const [{ data: openData }, { data: doneData }] = await Promise.all([
    open,
    supabase
      .from("orders")
      .select("*, customers(name), drivers(name), order_items(description, quantity)")
      .eq("org_id", org.id)
      .eq("status", "entregue")
      .gte("delivered_at", `${today}T00:00:00-03:00`)
      .order("delivered_at", { ascending: false }),
  ]);

  const toCard = (o: Row): BoardCard => ({
    id: o.id,
    number: o.number,
    status: o.status,
    title: o.recipient_name || o.customers?.name || "Sem destinatário",
    fulfillment: o.fulfillment,
    delivery_date: o.delivery_date,
    delivery_period: o.delivery_period,
    delivery_time: o.delivery_time,
    neighborhood: o.address_neighborhood,
    driver: o.drivers?.name ?? null,
    items: o.order_items.map((i) => `${i.quantity}× ${i.description}`).join(", "),
    unpaid: o.payment_status !== "pago",
    overdue: !!o.delivery_date && o.delivery_date < today,
  });

  const cards = [...((openData ?? []) as Row[]), ...((doneData ?? []) as Row[])].map(toCard);
  const overdue = cards.filter((c) => c.overdue && c.status !== "entregue").length;

  return (
    <>
      <PageHeader
        title="Produção"
        subtitle={
          <>
            Arraste os cartões entre as colunas ou use o botão de avançar.
            {overdue > 0 && <span className="ml-1 font-medium text-red-700">{overdue} pedido(s) atrasado(s).</span>}
          </>
        }
        actions={
          <ButtonLink href="/app/pedidos/novo">
            <Plus className="h-4 w-4" aria-hidden /> Novo pedido
          </ButtonLink>
        }
      />

      <nav aria-label="Período" className="mb-4 flex flex-wrap gap-1.5">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={p.key === "hoje" ? "/app/producao" : `/app/producao?periodo=${p.key}`}
            aria-current={p.key === period ? "page" : undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-300 ${
              p.key === period ? "accent-active" : "bg-white/60 text-stone-600 ring-1 ring-white/80 backdrop-blur hover:bg-white/90"
            }`}
          >
            {p.label}
            {"hint" in p && p.key === period && <span className="ml-1 font-normal opacity-70">· {p.hint}</span>}
          </Link>
        ))}
      </nav>

      {cards.length === 0 ? (
        <Card>
          <Empty icon={Columns3} title="Nada na produção neste período" action={{ href: "/app/pedidos/novo", label: "Criar pedido" }}>
            Os pedidos em aberto aparecem aqui organizados por etapa.
          </Empty>
        </Card>
      ) : (
        <Board cards={cards} showDate={period !== "hoje" && period !== "amanha"} />
      )}
    </>
  );
}
