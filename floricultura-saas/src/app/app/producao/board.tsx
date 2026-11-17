"use client";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { ArrowRight, Bike, Clock, GripVertical, MapPin, Store, TriangleAlert, Wallet } from "lucide-react";
import { PERIOD_LABEL, STATUS_LABEL, dateBR } from "@/lib/format";
import type { DeliveryPeriod, OrderStatus } from "@/lib/types";
import { moveOrder } from "../pedidos/actions";

export type BoardCard = {
  id: string;
  number: number;
  status: OrderStatus;
  title: string;
  fulfillment: "entrega" | "retirada";
  delivery_date: string | null;
  delivery_period: DeliveryPeriod | null;
  delivery_time: string | null;
  neighborhood: string | null;
  driver: string | null;
  items: string;
  unpaid: boolean;
  overdue: boolean;
};

const COLUMNS: { status: OrderStatus; hint: string; accent: string }[] = [
  { status: "novo", hint: "Chegou, ainda não confirmado", accent: "bg-sky-500" },
  { status: "confirmado", hint: "Pago ou combinado com o cliente", accent: "bg-indigo-500" },
  { status: "em_producao", hint: "Montando · insumos já baixados", accent: "bg-amber-500" },
  { status: "pronto", hint: "Aguardando saída ou retirada", accent: "bg-lime-500" },
  { status: "em_rota", hint: "Com o entregador", accent: "bg-violet-500" },
  { status: "entregue", hint: "Concluídos hoje", accent: "bg-emerald-500" },
];

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  novo: "confirmado",
  confirmado: "em_producao",
  em_producao: "pronto",
  pronto: "em_rota",
  em_rota: "entregue",
};

function nextStatus(c: BoardCard): OrderStatus | undefined {
  // Retirada na loja pula "Em rota"
  if (c.status === "pronto" && c.fulfillment === "retirada") return "entregue";
  return NEXT[c.status];
}

function when(c: BoardCard) {
  if (c.delivery_period === "horario" && c.delivery_time) return c.delivery_time.slice(0, 5);
  return c.delivery_period ? PERIOD_LABEL[c.delivery_period] : null;
}

export function Board({ cards, showDate }: { cards: BoardCard[]; showDate: boolean }) {
  const [optimistic, applyMove] = useOptimistic(cards, (state, m: { id: string; status: OrderStatus }) =>
    state.map((c) => (c.id === m.id ? { ...c, status: m.status } : c)),
  );
  const [, startTransition] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  function move(id: string, status: OrderStatus) {
    const card = optimistic.find((c) => c.id === id);
    if (!card || card.status === status) return;
    setError(null);
    startTransition(async () => {
      applyMove({ id, status });
      const res = await moveOrder(id, status);
      if (res.error) setError(`Pedido #${card.number}: ${res.error}`);
    });
  }

  return (
    <>
      {error && (
        <div role="alert" className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <TriangleAlert className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
        {COLUMNS.map((col) => {
          const list = optimistic.filter((c) => c.status === col.status);
          const isOver = overCol === col.status && dragId !== null;
          return (
            <section
              key={col.status}
              aria-label={STATUS_LABEL[col.status]}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(col.status);
              }}
              onDragLeave={() => setOverCol((c) => (c === col.status ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                setOverCol(null);
                setDragId(null);
                if (id) move(id, col.status);
              }}
              className={`flex w-[78vw] max-w-72 shrink-0 snap-start flex-col rounded-2xl border backdrop-blur-md transition-all duration-300 sm:w-72 ${
                isOver ? "scale-[1.01] border-brand-300 bg-brand-50/80 shadow-[0_12px_30px_-14px_rgb(219_39_119/0.5)]" : "border-white/70 bg-white/45"
              }`}
            >
              <header className="px-3 pb-2 pt-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.accent}`} />
                  <h2 className="text-sm font-semibold text-stone-800">{STATUS_LABEL[col.status]}</h2>
                  <span className="ml-auto rounded-full bg-white/90 px-2 text-xs font-medium text-stone-600 shadow-sm">{list.length}</span>
                </div>
                <p className="mt-0.5 text-xs text-stone-500">{col.hint}</p>
              </header>
              <ul className="flex min-h-24 flex-1 flex-col gap-2 px-2 pb-2">
                {list.map((c) => {
                  const nxt = nextStatus(c);
                  const w = when(c);
                  return (
                    <li
                      key={c.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", c.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragId(c.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverCol(null);
                      }}
                      className={`group rounded-xl border bg-white/90 p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                        c.overdue && c.status !== "entregue" ? "border-red-300" : "border-stone-200"
                      } ${dragId === c.id ? "opacity-40" : ""} cursor-grab active:cursor-grabbing`}
                    >
                      <div className="flex items-start gap-1.5">
                        <GripVertical className="mt-0.5 hidden h-4 w-4 shrink-0 text-stone-300 md:block" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <Link href={`/app/pedidos/${c.id}`} className="block truncate text-sm font-medium text-stone-900 hover:text-brand-700">
                            <span className="text-stone-400">#{c.number}</span> {c.title}
                          </Link>
                          <p className="mt-0.5 line-clamp-2 text-xs text-stone-600">{c.items || "Sem itens"}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-600">
                        {(showDate || c.overdue) && c.delivery_date && (
                          <span className={`rounded px-1.5 py-0.5 ${c.overdue && c.status !== "entregue" ? "bg-red-50 font-medium text-red-700" : "bg-stone-100"}`}>
                            {c.overdue && c.status !== "entregue" ? "Atrasado · " : ""}
                            {dateBR(c.delivery_date).slice(0, 5)}
                          </span>
                        )}
                        {w && (
                          <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5">
                            <Clock className="h-3 w-3" aria-hidden /> {w}
                          </span>
                        )}
                        {c.fulfillment === "retirada" ? (
                          <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5">
                            <Store className="h-3 w-3" aria-hidden /> Retirada
                          </span>
                        ) : (
                          c.neighborhood && (
                            <span className="inline-flex max-w-full items-center gap-1 truncate rounded bg-stone-100 px-1.5 py-0.5">
                              <MapPin className="h-3 w-3 shrink-0" aria-hidden /> {c.neighborhood}
                            </span>
                          )
                        )}
                        {c.driver && (
                          <span className="inline-flex items-center gap-1 rounded bg-violet-50 px-1.5 py-0.5 text-violet-700">
                            <Bike className="h-3 w-3" aria-hidden /> {c.driver}
                          </span>
                        )}
                        {c.unpaid && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700">
                            <Wallet className="h-3 w-3" aria-hidden /> A receber
                          </span>
                        )}
                      </div>
                      {nxt && (
                        <button
                          type="button"
                          onClick={() => move(c.id, nxt)}
                          className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-stone-200/80 py-1 text-xs font-medium text-stone-700 transition-all duration-200 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                        >
                          {STATUS_LABEL[nxt]} <ArrowRight className="h-3 w-3" aria-hidden />
                        </button>
                      )}
                    </li>
                  );
                })}
                {list.length === 0 && (
                  <li className="grid flex-1 place-items-center rounded-xl border border-dashed border-stone-300/80 py-6 text-xs text-stone-400">
                    {dragId ? "Solte aqui" : "Nenhum pedido"}
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
