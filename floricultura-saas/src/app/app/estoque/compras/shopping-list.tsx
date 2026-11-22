"use client";
import { useMemo, useState, useTransition } from "react";
import { Check, ChevronDown, ClipboardCopy, PackageCheck, Printer, RefreshCw, Store } from "lucide-react";
import { Alert, Button, Card, Input } from "@/components/ui";
import { money, num } from "@/lib/format";
import { supplierMessage, type ShopRow } from "@/lib/shopping";
import { receiveMany } from "../actions";

type Props = { rows: ShopRow[]; storeName: string; forDate: string };

const qtyFmt = (n: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(n);
const parseNum = (v: string) => {
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export function ShoppingList({ rows, storeName, forDate }: Props) {
  const [qty, setQty] = useState<Record<string, string>>(() => Object.fromEntries(rows.map((r) => [r.supply.id, r.suggested ? qtyFmt(r.suggested) : ""])));
  const [cost, setCost] = useState<Record<string, string>>(() => Object.fromEntries(rows.map((r) => [r.supply.id, r.unitCost ? r.unitCost.toFixed(2).replace(".", ",") : ""])));
  const [supplierOf, setSupplierOf] = useState<Record<string, string>>(() => Object.fromEntries(rows.map((r) => [r.supply.id, r.supplier.startsWith("Sem ") ? "" : r.supplier])));
  const [showAll, setShowAll] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok?: string; error?: string } | null>(null);
  const [pending, start] = useTransition();

  const q = (id: string) => parseNum(qty[id] ?? "");
  const visible = rows.filter((r) => showAll || r.suggested > 0 || q(r.supply.id) > 0);
  const groups = useMemo(() => {
    const m = new Map<string, ShopRow[]>();
    for (const r of visible) m.set(r.supplier, [...(m.get(r.supplier) ?? []), r]);
    return [...m.entries()].sort((a, b) => (a[0].startsWith("Sem ") ? 1 : b[0].startsWith("Sem ") ? -1 : a[0].localeCompare(b[0], "pt-BR")));
  }, [visible]);
  const toBuy = rows.filter((r) => q(r.supply.id) > 0);
  const total = toBuy.reduce((a, r) => a + q(r.supply.id) * parseNum(cost[r.supply.id] ?? "0"), 0);

  const message = (supplier: string, list: ShopRow[]) =>
    supplierMessage(
      storeName,
      supplier,
      list.filter((r) => q(r.supply.id) > 0).map((r) => ({ name: r.supply.name, qty: q(r.supply.id), unit: r.supply.unit })),
      forDate,
    );
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      window.prompt("Copie o pedido:", text);
    }
  };

  const register = () =>
    start(async () => {
      const res = await receiveMany(
        toBuy.map((r) => ({ supply_id: r.supply.id, quantity: q(r.supply.id), unit_cost: parseNum(cost[r.supply.id] ?? "0"), supplier: supplierOf[r.supply.id] || null })),
      );
      if (res.error) setResult({ error: res.error });
      else {
        setResult({ ok: `${res.count} entrada(s) registrada(s). Os lotes já estão no estoque com a validade de cada flor.` });
        setReceiving(false);
      }
    });

  return (
    <div className="space-y-6">
      {result?.ok && <Alert kind="success">{result.ok}</Alert>}
      {result?.error && <Alert>{result.error}</Alert>}

      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          Mostrar também o que não precisa comprar
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden /> Imprimir</Button>
          <Button type="button" onClick={() => setReceiving((v) => !v)} disabled={toBuy.length === 0}>
            <PackageCheck className="h-4 w-4" aria-hidden /> Já comprei: registrar entradas
          </Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-stone-500">Nada para comprar neste período. O estoque atual cobre os pedidos agendados e o ritmo normal de vendas.</p>
        </Card>
      ) : (
        groups.map(([supplier, list]) => {
          const buying = list.filter((r) => q(r.supply.id) > 0);
          const groupCost = buying.reduce((a, r) => a + q(r.supply.id) * parseNum(cost[r.supply.id] ?? "0"), 0);
          const msg = message(supplier, list);
          return (
            <Card
              key={supplier}
              icon={Store}
              title={
                <span>
                  {supplier} <span className="font-normal text-stone-500">· {buying.length} item(ns) · {money(groupCost)}</span>
                </span>
              }
              actions={
                buying.length > 0 && (
                  <span className="no-print flex gap-1.5">
                    <a href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" className="inline-flex items-center gap-1 rounded-lg bg-[#25D366] px-2.5 py-1.5 text-xs font-medium text-[#fff] hover:brightness-95">
                      Enviar pedido
                    </a>
                    <button type="button" onClick={() => copy(supplier, msg)} className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white/80 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-white">
                      {copied === supplier ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <ClipboardCopy className="h-3.5 w-3.5" />} {copied === supplier ? "Copiado" : "Copiar"}
                    </button>
                  </span>
                )
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-medium uppercase tracking-wide text-stone-500">
                      <th className="py-2 pr-3">Insumo</th>
                      <th className="px-2 py-2 text-right">Em estoque</th>
                      <th className="px-2 py-2 text-right">Agendado</th>
                      <th className="px-2 py-2 text-right">Ritmo normal</th>
                      <th className="px-2 py-2 text-right">Comprar</th>
                      <th className="px-2 py-2 text-right">Custo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((r) => {
                      const id = r.supply.id;
                      const changed = q(id) !== r.suggested;
                      return (
                        <tr key={id} className="border-t border-stone-200/60 align-top">
                          <td className="py-2.5 pr-3">
                            <p className="font-medium text-stone-900">{r.supply.name}</p>
                            {r.rebuyIn && <p className="text-xs font-medium text-amber-700"><RefreshCw className="mr-1 inline h-3 w-3" aria-hidden />Dura {r.rebuyIn} dia(s): compre de novo em {r.rebuyIn} dia(s)</p>}
                            <details className="group no-print">
                              <summary className="mt-0.5 inline-flex cursor-pointer list-none items-center gap-0.5 text-xs text-stone-500 hover:text-brand-700">
                                Por quê? <ChevronDown className="h-3 w-3 transition group-open:rotate-180" aria-hidden />
                              </summary>
                              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-stone-500">
                                {r.reasons.map((x) => <li key={x}>{x}</li>)}
                                {r.bookedOrders.length > 0 && <li>pedidos: {r.bookedOrders.map((n) => `#${n}`).join(", ")}</li>}
                              </ul>
                            </details>
                          </td>
                          <td className={`px-2 py-2.5 text-right tabular-nums ${r.expiringSoon > 0 ? "text-amber-700" : "text-stone-600"}`} title={r.expiringSoon > 0 ? `${num(r.expiringSoon)} vencem no período` : undefined}>
                            {num(r.usable)}
                          </td>
                          <td className="px-2 py-2.5 text-right tabular-nums text-stone-600">{r.booked ? num(r.booked) : "—"}</td>
                          <td className="px-2 py-2.5 text-right tabular-nums text-stone-600">{r.forecast ? num(r.forecast) : "—"}</td>
                          <td className="px-2 py-2.5 text-right">
                            <span className="inline-flex items-center gap-1.5">
                              <Input
                                value={qty[id] ?? ""}
                                onChange={(e) => setQty({ ...qty, [id]: e.target.value })}
                                inputMode="decimal"
                                placeholder="0"
                                aria-label={`Quantidade de ${r.supply.name}`}
                                className={`!w-20 py-1.5 text-right font-semibold ${changed ? "border-amber-300" : ""}`}
                              />
                              <span className="w-10 text-left text-xs text-stone-500">{r.supply.unit}</span>
                            </span>
                            {changed && r.suggested > 0 && (
                              <button type="button" onClick={() => setQty({ ...qty, [id]: qtyFmt(r.suggested) })} className="no-print mt-0.5 block w-full text-right text-[11px] text-brand-700 hover:underline">
                                sugerido: {qtyFmt(r.suggested)}
                              </button>
                            )}
                          </td>
                          <td className="px-2 py-2.5 text-right tabular-nums text-stone-700">{q(id) ? money(q(id) * parseNum(cost[id] ?? "0")) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })
      )}

      {toBuy.length > 0 && (
        <div className="surface flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-5 py-4">
          <span className="text-sm text-stone-600">{toBuy.length} item(ns) para comprar</span>
          <span className="text-lg font-semibold text-stone-900">Total estimado: {money(total)}</span>
        </div>
      )}

      {receiving && (
        <Card className="no-print" icon={PackageCheck} title="Registrar as compras feitas">
          <p className="mb-3 text-sm text-stone-600">Confira o que realmente chegou. Ao salvar, cada item vira um lote no estoque com a validade média da flor.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-medium uppercase tracking-wide text-stone-500">
                  <th className="py-2 pr-3">Insumo</th><th className="px-2 py-2">Qtd recebida</th><th className="px-2 py-2">Custo unit. (R$)</th><th className="px-2 py-2">Fornecedor</th>
                </tr>
              </thead>
              <tbody>
                {toBuy.map((r) => (
                  <tr key={r.supply.id} className="border-t border-stone-200/60">
                    <td className="py-2 pr-3 font-medium text-stone-900">{r.supply.name}</td>
                    <td className="px-2 py-2"><Input value={qty[r.supply.id]} onChange={(e) => setQty({ ...qty, [r.supply.id]: e.target.value })} inputMode="decimal" className="!w-24 py-1.5" aria-label="Quantidade recebida" /></td>
                    <td className="px-2 py-2"><Input value={cost[r.supply.id] ?? ""} onChange={(e) => setCost({ ...cost, [r.supply.id]: e.target.value })} inputMode="decimal" className="!w-24 py-1.5" aria-label="Custo unitário" /></td>
                    <td className="px-2 py-2"><Input value={supplierOf[r.supply.id] ?? ""} onChange={(e) => setSupplierOf({ ...supplierOf, [r.supply.id]: e.target.value })} placeholder="CEASA, Holambra…" className="!w-40 py-1.5" aria-label="Fornecedor" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setReceiving(false)}>Cancelar</Button>
            <Button type="button" onClick={register} disabled={pending}>{pending ? "Registrando…" : `Registrar ${toBuy.length} entrada(s)`}</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
