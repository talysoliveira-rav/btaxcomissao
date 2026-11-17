"use client";
import { Store, Truck, X } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { Alert, Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { CHANNELS, PAYMENT_METHODS, money, todayISO } from "@/lib/format";
import type { CustomerAddress, Order, OrderItem, Product } from "@/lib/types";
import { saveOrder, type OrderFormState, type OrderPayload } from "./actions";

type CustomerOpt = { id: string; name: string; phone: string | null; customer_addresses: CustomerAddress[] };
type Item = { key: number; product_id: string | null; description: string; quantity: number; unit_price: number; notes: string };

const MESSAGES = [
  "Feliz aniversário! Que seu dia seja tão lindo quanto estas flores.",
  "Com todo o meu amor.",
  "Parabéns pela conquista!",
  "Desejo melhoras. Estou com você.",
  "Com carinho e saudade.",
  "Nossos sentimentos. Que a paz conforte seu coração.",
];

export function OrderForm({
  customers,
  products,
  defaultFee,
  order,
  items: initialItems,
  itemsLocked,
}: {
  customers: CustomerOpt[];
  products: Product[];
  defaultFee: number;
  order?: Order;
  items?: OrderItem[];
  itemsLocked?: boolean;
}) {
  const [state, action] = useActionState<OrderFormState, FormData>(saveOrder, {});
  let nextKey = 1;
  const [items, setItems] = useState<Item[]>(
    initialItems?.length
      ? initialItems.map((i) => ({ key: nextKey++, product_id: i.product_id, description: i.description, quantity: i.quantity, unit_price: Number(i.unit_price), notes: i.notes ?? "" }))
      : [{ key: 0, product_id: null, description: "", quantity: 1, unit_price: 0, notes: "" }],
  );
  const [customerMode, setCustomerMode] = useState<"existing" | "new" | "none">(order?.customer_id ? "existing" : "existing");
  const [customerId, setCustomerId] = useState(order?.customer_id ?? "");
  const [customerQuery, setCustomerQuery] = useState("");
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
  const [fulfillment, setFulfillment] = useState<"entrega" | "retirada">(order?.fulfillment ?? "entrega");
  const [period, setPeriod] = useState(order?.delivery_period ?? "manha");
  const [addr, setAddr] = useState({
    recipient_name: order?.recipient_name ?? "",
    recipient_phone: order?.recipient_phone ?? "",
    address_street: order?.address_street ?? "",
    address_number: order?.address_number ?? "",
    address_complement: order?.address_complement ?? "",
    address_neighborhood: order?.address_neighborhood ?? "",
    address_city: order?.address_city ?? "",
    address_reference: order?.address_reference ?? "",
  });
  const [saveAddress, setSaveAddress] = useState(false);
  const [fee, setFee] = useState(String(order ? order.delivery_fee : defaultFee));
  const [discount, setDiscount] = useState(String(order?.discount ?? 0));
  const [cardMessage, setCardMessage] = useState(order?.card_message ?? "");

  const customer = customers.find((c) => c.id === customerId);
  const filteredCustomers = useMemo(() => {
    const q = customerQuery.toLowerCase().trim();
    if (!q) return customers.slice(0, 50);
    return customers.filter((c) => c.name.toLowerCase().includes(q) || (c.phone ?? "").replace(/\D/g, "").includes(q.replace(/\D/g, "") || "§")).slice(0, 50);
  }, [customers, customerQuery]);

  const subtotal = items.reduce((a, i) => a + i.quantity * i.unit_price, 0);
  const total = subtotal + (fulfillment === "entrega" ? Number(fee.replace(",", ".")) || 0 : 0) - (Number(discount.replace(",", ".")) || 0);

  const updateItem = (key: number, patch: Partial<Item>) => setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  const fillAddress = (a: CustomerAddress) =>
    setAddr((cur) => ({
      ...cur,
      recipient_name: cur.recipient_name || a.label || "",
      address_street: a.street,
      address_number: a.number ?? "",
      address_complement: a.complement ?? "",
      address_neighborhood: a.neighborhood ?? "",
      address_city: a.city ?? "",
      address_reference: a.reference ?? "",
    }));

  const n = (v: string) => v.trim() || null;

  const buildPayload = (fd: FormData): OrderPayload => ({
    customer_id: customerMode === "existing" && customerId ? customerId : null,
    new_customer_name: customerMode === "new" ? n(newCustomer.name) : null,
    new_customer_phone: customerMode === "new" ? n(newCustomer.phone) : null,
    fulfillment,
    channel: n(String(fd.get("channel") ?? "")),
    delivery_date: n(String(fd.get("delivery_date") ?? "")),
    delivery_period: period as OrderPayload["delivery_period"],
    delivery_time: n(String(fd.get("delivery_time") ?? "")),
    recipient_name: n(addr.recipient_name),
    recipient_phone: n(addr.recipient_phone),
    address_street: n(addr.address_street),
    address_number: n(addr.address_number),
    address_complement: n(addr.address_complement),
    address_neighborhood: n(addr.address_neighborhood),
    address_city: n(addr.address_city),
    address_reference: n(addr.address_reference),
    save_address: saveAddress,
    card_message: n(cardMessage),
    card_signature: n(String(fd.get("card_signature") ?? "")),
    anonymous: fd.get("anonymous") === "on",
    internal_notes: n(String(fd.get("internal_notes") ?? "")),
    delivery_fee: Number(fee.replace(",", ".")) || 0,
    discount: Number(discount.replace(",", ".")) || 0,
    payment_method: n(String(fd.get("payment_method") ?? "")),
    payment_status: (String(fd.get("payment_status")) as OrderPayload["payment_status"]) || "pendente",
    items: items
      .filter((i) => i.description.trim())
      .map((i) => ({ product_id: i.product_id, description: i.description.trim(), quantity: i.quantity, unit_price: i.unit_price, notes: n(i.notes) })),
  });

  return (
    <form
      action={(fd) => {
        fd.set("payload", JSON.stringify(buildPayload(fd)));
        return action(fd);
      }}
      className="grid gap-6 lg:grid-cols-3"
    >
      {order && <input type="hidden" name="order_id" value={order.id} />}
      <div className="space-y-6 lg:col-span-2">
        {state.error && <Alert>{state.error}</Alert>}

        <Card title="Cliente (quem compra)">
          <div className="mb-3 flex gap-2 text-sm">
            {(["existing", "new", "none"] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setCustomerMode(m)}
                className={`rounded-full px-3 py-1 ${customerMode === m ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-700"}`}
              >
                {m === "existing" ? "Cliente cadastrado" : m === "new" ? "Novo cliente" : "Sem cadastro"}
              </button>
            ))}
          </div>
          {customerMode === "existing" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Buscar por nome ou telefone">
                <Input value={customerQuery} onChange={(e) => setCustomerQuery(e.target.value)} placeholder="Digite para filtrar…" />
              </Field>
              <Field label="Cliente">
                <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">Selecione…</option>
                  {customer && !filteredCustomers.includes(customer) && <option value={customer.id}>{customer.name}</option>}
                  {filteredCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.phone ? ` · ${c.phone}` : ""}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}
          {customerMode === "new" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome">
                <Input value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} required />
              </Field>
              <Field label="Telefone / WhatsApp">
                <Input value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
              </Field>
            </div>
          )}
        </Card>

        <Card title="Itens do pedido">
          {itemsLocked && <Alert kind="info">A produção já começou e o estoque foi baixado — os itens não podem mais ser alterados.</Alert>}
          <div className="space-y-3">
            {items.map((i) => (
              <div key={i.key} className="grid grid-cols-12 gap-2 rounded-lg border border-stone-100 bg-stone-50/50 p-2">
                <div className="col-span-12 sm:col-span-5">
                  <Select
                    disabled={itemsLocked}
                    value={i.product_id ?? ""}
                    onChange={(e) => {
                      const p = products.find((x) => x.id === e.target.value);
                      updateItem(i.key, p ? { product_id: p.id, description: p.name, unit_price: Number(p.price) } : { product_id: null });
                    }}
                  >
                    <option value="">Item avulso (digite abaixo)</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {money(p.price)}
                      </option>
                    ))}
                  </Select>
                  <Input
                    className="mt-2"
                    disabled={itemsLocked}
                    placeholder="Descrição"
                    value={i.description}
                    onChange={(e) => updateItem(i.key, { description: e.target.value })}
                  />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <Input disabled={itemsLocked} type="number" min={1} value={i.quantity} onChange={(e) => updateItem(i.key, { quantity: Math.max(1, Number(e.target.value)) })} aria-label="Quantidade" />
                </div>
                <div className="col-span-5 sm:col-span-2">
                  <Input disabled={itemsLocked} type="number" step="0.01" min={0} value={i.unit_price} onChange={(e) => updateItem(i.key, { unit_price: Number(e.target.value) })} aria-label="Preço unitário" />
                </div>
                <div className="col-span-4 flex items-start justify-end gap-2 sm:col-span-3">
                  <span className="py-2 text-sm font-medium">{money(i.quantity * i.unit_price)}</span>
                  {!itemsLocked && items.length > 1 && (
                    <Button type="button" variant="ghost" onClick={() => setItems(items.filter((x) => x.key !== i.key))} aria-label="Remover">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="col-span-12">
                  <Input disabled={itemsLocked} placeholder="Observação do item (cores, troca de flor…)" value={i.notes} onChange={(e) => updateItem(i.key, { notes: e.target.value })} />
                </div>
              </div>
            ))}
          </div>
          {!itemsLocked && (
            <Button
              type="button"
              variant="secondary"
              className="mt-3"
              onClick={() => setItems([...items, { key: Date.now(), product_id: null, description: "", quantity: 1, unit_price: 0, notes: "" }])}
            >
              + Adicionar item
            </Button>
          )}
        </Card>

        <Card title="Entrega">
          <div className="mb-4 flex gap-2 text-sm">
            {(["entrega", "retirada"] as const).map((f) => (
              <button
                type="button"
                key={f}
                onClick={() => setFulfillment(f)}
                className={`rounded-full px-3 py-1 ${fulfillment === f ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-700"}`}
              >
                {f === "entrega" ? <><Truck className="mr-1 inline h-4 w-4" aria-hidden />Entrega</> : <><Store className="mr-1 inline h-4 w-4" aria-hidden />Retirada na loja</>}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Data">
              <Input type="date" name="delivery_date" defaultValue={order?.delivery_date ?? todayISO()} required />
            </Field>
            <Field label="Período">
              <Select value={period} onChange={(e) => setPeriod(e.target.value as typeof period)}>
                <option value="manha">Manhã</option>
                <option value="tarde">Tarde</option>
                <option value="noite">Noite</option>
                <option value="horario">Horário marcado</option>
              </Select>
            </Field>
            {period === "horario" && (
              <Field label="Horário">
                <Input type="time" name="delivery_time" defaultValue={order?.delivery_time?.slice(0, 5) ?? ""} />
              </Field>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Destinatário (quem recebe)">
              <Input value={addr.recipient_name} onChange={(e) => setAddr({ ...addr, recipient_name: e.target.value })} />
            </Field>
            <Field label="Telefone do destinatário">
              <Input value={addr.recipient_phone} onChange={(e) => setAddr({ ...addr, recipient_phone: e.target.value })} />
            </Field>
          </div>

          {fulfillment === "entrega" && (
            <>
              {customer && customer.customer_addresses.length > 0 && (
                <div className="mt-4">
                  <p className="mb-1 text-xs font-medium text-stone-600">Endereços salvos do cliente</p>
                  <div className="flex flex-wrap gap-2">
                    {customer.customer_addresses.map((a) => (
                      <button type="button" key={a.id} onClick={() => fillAddress(a)} className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs hover:border-brand-500">
                        {a.label ? <b>{a.label}: </b> : null}
                        {a.street}, {a.number}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4 grid grid-cols-6 gap-3">
                <Field label="Rua" className="col-span-6 sm:col-span-4">
                  <Input value={addr.address_street} onChange={(e) => setAddr({ ...addr, address_street: e.target.value })} />
                </Field>
                <Field label="Número" className="col-span-2">
                  <Input value={addr.address_number} onChange={(e) => setAddr({ ...addr, address_number: e.target.value })} />
                </Field>
                <Field label="Complemento" className="col-span-4 sm:col-span-2">
                  <Input value={addr.address_complement} onChange={(e) => setAddr({ ...addr, address_complement: e.target.value })} />
                </Field>
                <Field label="Bairro" className="col-span-3 sm:col-span-2">
                  <Input value={addr.address_neighborhood} onChange={(e) => setAddr({ ...addr, address_neighborhood: e.target.value })} />
                </Field>
                <Field label="Cidade" className="col-span-3 sm:col-span-2">
                  <Input value={addr.address_city} onChange={(e) => setAddr({ ...addr, address_city: e.target.value })} />
                </Field>
                <Field label="Ponto de referência" className="col-span-6">
                  <Input value={addr.address_reference} onChange={(e) => setAddr({ ...addr, address_reference: e.target.value })} />
                </Field>
              </div>
              {(customerMode !== "none") && (
                <label className="mt-3 flex items-center gap-2 text-sm text-stone-600">
                  <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                  Salvar este endereço no cadastro do cliente
                </label>
              )}
            </>
          )}
        </Card>

        <Card title="Cartão de mensagem">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {MESSAGES.map((m) => (
              <button type="button" key={m} onClick={() => setCardMessage(m)} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-700 hover:bg-brand-100">
                {m.slice(0, 28)}…
              </button>
            ))}
          </div>
          <Textarea value={cardMessage} onChange={(e) => setCardMessage(e.target.value)} rows={4} placeholder="Mensagem que vai no cartão" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Assinatura">
              <Input name="card_signature" defaultValue={order?.card_signature ?? ""} placeholder="Ex.: Com amor, João" />
            </Field>
            <label className="flex items-end gap-2 pb-2 text-sm text-stone-600">
              <input type="checkbox" name="anonymous" defaultChecked={order?.anonymous} /> Entrega anônima (não revelar remetente)
            </label>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Pagamento" className="lg:sticky lg:top-6">
          <div className="space-y-3">
            <Field label="Canal de venda">
              <Select name="channel" defaultValue={order?.channel ?? "WhatsApp"}>
                <option value="">—</option>
                {CHANNELS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Forma de pagamento">
              <Select name="payment_method" defaultValue={order?.payment_method ?? "Pix"}>
                <option value="">—</option>
                {PAYMENT_METHODS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Situação">
              <Select name="payment_status" defaultValue={order?.payment_status ?? "pendente"}>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="estornado">Estornado</option>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Taxa de entrega">
                <Input value={fee} onChange={(e) => setFee(e.target.value)} disabled={fulfillment === "retirada"} inputMode="decimal" />
              </Field>
              <Field label="Desconto">
                <Input value={discount} onChange={(e) => setDiscount(e.target.value)} inputMode="decimal" />
              </Field>
            </div>
            <dl className="space-y-1 border-t border-stone-100 pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-stone-500">Subtotal</dt><dd>{money(subtotal)}</dd></div>
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{money(total)}</dd></div>
            </dl>
            <Field label="Observações internas">
              <Textarea name="internal_notes" defaultValue={order?.internal_notes ?? ""} rows={2} />
            </Field>
            <SubmitButton className="w-full">{order ? "Salvar alterações" : "Criar pedido"}</SubmitButton>
          </div>
        </Card>
      </div>
    </form>
  );
}
