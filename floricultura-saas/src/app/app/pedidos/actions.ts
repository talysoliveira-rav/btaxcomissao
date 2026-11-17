"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import type { OrderStatus } from "@/lib/types";

const itemSchema = z.object({
  product_id: z.string().uuid().nullable(),
  description: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  unit_price: z.coerce.number().min(0),
  notes: z.string().nullable().optional(),
});

const orderSchema = z.object({
  customer_id: z.string().uuid().nullable(),
  new_customer_name: z.string().nullable(),
  new_customer_phone: z.string().nullable(),
  fulfillment: z.enum(["entrega", "retirada"]),
  channel: z.string().nullable(),
  delivery_date: z.string().nullable(),
  delivery_period: z.enum(["manha", "tarde", "noite", "horario"]).nullable(),
  delivery_time: z.string().nullable(),
  recipient_name: z.string().nullable(),
  recipient_phone: z.string().nullable(),
  address_street: z.string().nullable(),
  address_number: z.string().nullable(),
  address_complement: z.string().nullable(),
  address_neighborhood: z.string().nullable(),
  address_city: z.string().nullable(),
  address_reference: z.string().nullable(),
  save_address: z.boolean(),
  card_message: z.string().nullable(),
  card_signature: z.string().nullable(),
  anonymous: z.boolean(),
  internal_notes: z.string().nullable(),
  delivery_fee: z.coerce.number().min(0),
  discount: z.coerce.number().min(0),
  payment_method: z.string().nullable(),
  payment_status: z.enum(["pendente", "pago", "estornado"]),
  items: z.array(itemSchema).min(1, "Adicione pelo menos um item."),
});

export type OrderPayload = z.infer<typeof orderSchema>;
export type OrderFormState = { error?: string };

async function persist(orderId: string | null, payload: unknown): Promise<OrderFormState | string> {
  const parsed = orderSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const p = parsed.data;
  if (p.fulfillment === "entrega" && !p.address_street) return { error: "Informe o endereço de entrega." };
  if (!p.delivery_date) return { error: "Informe a data de entrega/retirada." };

  const { org } = await getOrgContext();
  const supabase = await createClient();

  let customerId = p.customer_id;
  if (!customerId && p.new_customer_name) {
    const { data, error } = await supabase
      .from("customers")
      .insert({ org_id: org.id, name: p.new_customer_name, phone: p.new_customer_phone })
      .select("id")
      .single();
    if (error) return { error: error.message };
    customerId = data.id;
  }

  if (customerId && p.save_address && p.fulfillment === "entrega" && p.address_street) {
    await supabase.from("customer_addresses").insert({
      org_id: org.id,
      customer_id: customerId,
      label: p.recipient_name,
      street: p.address_street,
      number: p.address_number,
      complement: p.address_complement,
      neighborhood: p.address_neighborhood,
      city: p.address_city,
      reference: p.address_reference,
    });
  }

  const isDelivery = p.fulfillment === "entrega";
  const row = {
    org_id: org.id,
    customer_id: customerId,
    fulfillment: p.fulfillment,
    channel: p.channel,
    delivery_date: p.delivery_date,
    delivery_period: p.delivery_period,
    delivery_time: p.delivery_period === "horario" ? p.delivery_time : null,
    recipient_name: p.recipient_name,
    recipient_phone: p.recipient_phone,
    address_street: isDelivery ? p.address_street : null,
    address_number: isDelivery ? p.address_number : null,
    address_complement: isDelivery ? p.address_complement : null,
    address_neighborhood: isDelivery ? p.address_neighborhood : null,
    address_city: isDelivery ? p.address_city : null,
    address_reference: isDelivery ? p.address_reference : null,
    card_message: p.card_message,
    card_signature: p.card_signature,
    anonymous: p.anonymous,
    internal_notes: p.internal_notes,
    delivery_fee: isDelivery ? p.delivery_fee : 0,
    discount: p.discount,
    payment_method: p.payment_method,
    payment_status: p.payment_status,
  };

  let id = orderId;
  if (id) {
    const { data: current } = await supabase.from("orders").select("stock_consumed").eq("id", id).single();
    const { error } = await supabase.from("orders").update(row).eq("id", id);
    if (error) return { error: error.message };
    if (!current?.stock_consumed) {
      await supabase.from("order_items").delete().eq("order_id", id);
    } else {
      return id; // itens travados após a produção começar
    }
  } else {
    const { data, error } = await supabase.from("orders").insert(row).select("id").single();
    if (error) return { error: error.message };
    id = data.id as string;
  }

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(p.items.map((i) => ({ ...i, notes: i.notes || null, org_id: org.id, order_id: id })));
  if (itemsError) return { error: itemsError.message };
  return id!;
}

export async function saveOrder(_: OrderFormState, fd: FormData): Promise<OrderFormState> {
  const orderId = (fd.get("order_id") as string) || null;
  let payload: unknown;
  try {
    payload = JSON.parse(String(fd.get("payload") ?? "{}"));
  } catch {
    return { error: "Dados inválidos." };
  }
  const res = await persist(orderId, payload);
  if (typeof res !== "string") return res;
  revalidatePath("/app", "layout");
  redirect(`/app/pedidos/${res}`);
}

export async function setOrderStatus(fd: FormData) {
  const id = String(fd.get("id"));
  const status = String(fd.get("status")) as OrderStatus;
  const supabase = await createClient();
  const update: Record<string, unknown> = { status };
  const proof = fd.get("delivery_proof");
  if (typeof proof === "string" && proof.trim()) update.delivery_proof = proof.trim();
  const { error } = await supabase.from("orders").update(update).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/app", "layout");
}

export async function assignDriver(fd: FormData) {
  const id = String(fd.get("id"));
  const driver = String(fd.get("driver_id") ?? "");
  const supabase = await createClient();
  await supabase.from("orders").update({ driver_id: driver || null }).eq("id", id);
  revalidatePath("/app", "layout");
}

export async function markPaid(fd: FormData) {
  const id = String(fd.get("id"));
  const supabase = await createClient();
  const method = fd.get("payment_method");
  await supabase
    .from("orders")
    .update({ payment_status: "pago", ...(typeof method === "string" && method ? { payment_method: method } : {}) })
    .eq("id", id);
  revalidatePath("/app", "layout");
}

export async function duplicateOrder(fd: FormData) {
  const id = String(fd.get("id"));
  const supabase = await createClient();
  const { data: o } = await supabase.from("orders").select("*").eq("id", id).single();
  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", id);
  if (!o) throw new Error("Pedido não encontrado");
  const {
    id: _id, number: _n, total: _t, subtotal: _s, status: _st, stock_consumed: _sc, delivered_at: _d,
    delivery_proof: _p, created_at: _c, updated_at: _u, created_by: _cb, driver_id: _dr, payment_status: _ps,
    ...rest
  } = o;
  const { data: copy, error } = await supabase.from("orders").insert({ ...rest, delivery_date: null }).select("id").single();
  if (error) throw new Error(error.message);
  if (items?.length) {
    await supabase.from("order_items").insert(
      items.map(({ id: _i, order_id: _o, ...it }) => ({ ...it, order_id: copy.id })),
    );
  }
  redirect(`/app/pedidos/${copy.id}/editar`);
}
