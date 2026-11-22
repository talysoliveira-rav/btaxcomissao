"use client";
/* eslint-disable @next/next/no-img-element -- miniaturas já otimizadas */
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, ImageOff, PartyPopper, Search, X } from "lucide-react";
import { Alert, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { ShareLink } from "@/components/share-link";
import { money } from "@/lib/format";
import { createSelection, type SelectionState } from "../vitrine-actions";

type P = { id: string; name: string; price: number; category: string | null; image_url: string | null; offer_price: number | null; offer_until: string | null };
type C = { id: string; name: string };
type Item = { product_id: string; custom_price: string; note: string };

const MAX = 8;
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function SelectionForm({ products, customers, baseUrl, storeName }: { products: P[]; customers: C[]; baseUrl: string; storeName: string }) {
  const [state, action] = useActionState<SelectionState, FormData>(createSelection, {});
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [title, setTitle] = useState("Opções especiais para você");
  const [note, setNote] = useState("");
  const [days, setDays] = useState("7");

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const filtered = useMemo(() => {
    const t = norm(q.trim());
    return t ? products.filter((p) => norm(`${p.name} ${p.category ?? ""}`).includes(t)) : products;
  }, [q, products]);
  const picked = (id: string) => items.some((i) => i.product_id === id);
  const toggle = (id: string) =>
    setItems((list) => (list.some((i) => i.product_id === id) ? list.filter((i) => i.product_id !== id) : list.length >= MAX ? list : [...list, { product_id: id, custom_price: "", note: "" }]));
  const update = (id: string, patch: Partial<Item>) => setItems((list) => list.map((i) => (i.product_id === id ? { ...i, ...patch } : i)));
  const move = (idx: number, dir: -1 | 1) =>
    setItems((list) => {
      const j = idx + dir;
      if (j < 0 || j >= list.length) return list;
      const copy = [...list];
      [copy[idx], copy[j]] = [copy[j], copy[idx]];
      return copy;
    });

  if (state.code) {
    const url = `${baseUrl}/s/${state.code}`;
    const who = customerName || customers.find((c) => c.id === customerId)?.name;
    return (
      <Card>
        <div className="flex flex-col items-center py-6 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[image:var(--rose-gradient)] text-[#fff]">
            <PartyPopper className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="mt-3 text-lg font-semibold text-stone-900">Seleção criada!</h2>
          <p className="mt-1 max-w-md text-sm text-stone-500">Envie o link para {who ?? "o cliente"}. Ele vê as {items.length} opções com fotos e toca em “Quero a opção…”, que abre o seu WhatsApp com a escolha.</p>
          <div className="mt-5 w-full max-w-lg text-left">
            <ShareLink url={url} message={`${who ? `${who.split(" ")[0]}, ` : ""}separei algumas opções para você 💐 ${storeName}`} />
          </div>
          <Link href="/app/catalogo/selecoes" className="mt-5 text-sm font-medium text-brand-700 hover:underline">Ver todas as seleções</Link>
        </div>
      </Card>
    );
  }

  const payload = JSON.stringify({
    title: title.trim(),
    customer_id: customerId || null,
    customer_name: (customerName || customers.find((c) => c.id === customerId)?.name || "").trim() || null,
    note: note.trim() || null,
    days: Number(days),
    items: items.map((i) => ({
      product_id: i.product_id,
      custom_price: i.custom_price.trim() ? Number(i.custom_price.replace(",", ".")) : null,
      note: i.note.trim() || null,
    })),
  });

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-5">
      <input type="hidden" name="payload" value={payload} />
      <Card className="lg:col-span-3" title={`1. Escolha os produtos (${items.length}/${MAX})`}>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou categoria…" className="pl-9" />
        </div>
        {products.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-500">Cadastre produtos no catálogo para montar seleções.</p>
        ) : (
          <ul className="grid max-h-[32rem] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
            {filtered.map((p) => {
              const on = picked(p.id);
              const order = items.findIndex((i) => i.product_id === p.id) + 1;
              const full = !on && items.length >= MAX;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={full}
                    onClick={() => toggle(p.id)}
                    className={`group relative w-full overflow-hidden rounded-xl border text-left transition ${on ? "border-brand-400 ring-2 ring-brand-200" : "border-stone-200 hover:border-brand-200"} disabled:opacity-40`}
                  >
                    <div className="aspect-square bg-stone-100">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <span className="grid h-full place-items-center text-stone-300"><ImageOff className="h-6 w-6" /></span>
                      )}
                    </div>
                    <span className={`absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${on ? "bg-[image:var(--rose-gradient)] text-[#fff]" : "bg-white/90 text-stone-400"}`}>
                      {on ? order : <Check className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />}
                    </span>
                    <div className="p-2">
                      <p className="line-clamp-1 text-xs font-medium text-stone-900">{p.name}</p>
                      <p className="text-xs text-stone-500">{money(p.price)}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="space-y-6 lg:col-span-2">
        <Card title="2. Ajuste as opções">
          {items.length === 0 ? (
            <p className="py-4 text-center text-sm text-stone-500">Toque nos produtos ao lado. Eles aparecem aqui na ordem em que o cliente vai ver.</p>
          ) : (
            <ol className="space-y-3">
              {items.map((it, idx) => {
                const p = byId.get(it.product_id)!;
                return (
                  <li key={it.product_id} className="rounded-xl border border-stone-200/80 bg-white/60 p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[image:var(--rose-gradient)] text-xs font-bold text-[#fff]">{idx + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-900">{p.name}</span>
                      <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Subir" className="grid h-7 w-7 place-items-center rounded-lg text-stone-500 hover:bg-stone-100 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => move(idx, 1)} disabled={idx === items.length - 1} aria-label="Descer" className="grid h-7 w-7 place-items-center rounded-lg text-stone-500 hover:bg-stone-100 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => toggle(p.id)} aria-label="Remover" className="grid h-7 w-7 place-items-center rounded-lg text-stone-500 hover:bg-red-50 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="mt-2 grid grid-cols-[7rem_1fr] gap-2">
                      <Input value={it.custom_price} onChange={(e) => update(p.id, { custom_price: e.target.value })} inputMode="decimal" placeholder={`R$ ${Number(p.price).toFixed(2).replace(".", ",")}`} aria-label="Preço especial" title="Preço especial (opcional)" />
                      <Input value={it.note} onChange={(e) => update(p.id, { note: e.target.value })} placeholder="Observação (ex.: com rosas brancas)" aria-label="Observação" maxLength={200} />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          {items.length > 0 && <p className="mt-2 text-xs text-stone-500">Preço especial é opcional; vazio usa o preço do catálogo.</p>}
        </Card>

        <Card title="3. Para quem é">
          <div className="space-y-3">
            {state.error && <Alert>{state.error}</Alert>}
            <Field label="Cliente cadastrado (opcional)">
              <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">—</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Nome que aparece na página" hint="Ex.: “Ana, separamos estas opções para você”">
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder={customers.find((c) => c.id === customerId)?.name.split(" ")[0] ?? "Ana"} maxLength={60} />
            </Field>
            <Field label="Título">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={90} required />
            </Field>
            <Field label="Recado (opcional)">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={600} placeholder="Separei opções nos tons que você pediu. Qualquer ajuste é só falar!" />
            </Field>
            <Field label="Link válido por">
              <Select value={days} onChange={(e) => setDays(e.target.value)}>
                {[3, 7, 14, 30].map((d) => <option key={d} value={d}>{d} dias</option>)}
              </Select>
            </Field>
            <SubmitButton className="w-full" disabled={items.length === 0} pendingText="Criando link…">Criar link da seleção</SubmitButton>
          </div>
        </Card>
      </div>
    </form>
  );
}
