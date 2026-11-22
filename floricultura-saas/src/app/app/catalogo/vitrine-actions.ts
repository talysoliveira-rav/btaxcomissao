"use server";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import { decimal, reqStr, str } from "@/lib/form";

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // sem 0/o/1/l para não confundir

function newCode(len = 8) {
  const bytes = randomBytes(len);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

const selectionSchema = z.object({
  title: z.string().trim().min(2, "Dê um título para a seleção.").max(90),
  customer_id: z.string().uuid().nullable(),
  customer_name: z.string().trim().max(60).nullable(),
  note: z.string().trim().max(600).nullable(),
  days: z.number().int().min(1).max(60),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        custom_price: z.number().min(0).nullable(),
        note: z.string().trim().max(200).nullable(),
      }),
    )
    .min(1, "Escolha pelo menos um produto.")
    .max(8, "Escolha no máximo 8 produtos."),
});

export type SelectionState = { error?: string; code?: string };

export async function createSelection(_: SelectionState, fd: FormData): Promise<SelectionState> {
  let payload: unknown;
  try {
    payload = JSON.parse(String(fd.get("payload") ?? "{}"));
  } catch {
    return { error: "Dados inválidos." };
  }
  const parsed = selectionSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const p = parsed.data;
  const { org } = await getOrgContext();
  const supabase = await createClient();

  // validade em dias a partir de hoje (Brasília)
  const expires = new Date(Date.now() + p.days * 86_400_000).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  let selectionId: string | null = null;
  let code = "";
  for (let attempt = 0; attempt < 4 && !selectionId; attempt++) {
    code = newCode();
    const { data, error } = await supabase
      .from("selections")
      .insert({ org_id: org.id, code, title: p.title, customer_id: p.customer_id, customer_name: p.customer_name || null, note: p.note || null, expires_at: expires })
      .select("id")
      .single();
    if (!error) selectionId = data.id;
    else if (error.code !== "23505") return { error: "Não foi possível criar a seleção." };
  }
  if (!selectionId) return { error: "Não foi possível criar a seleção. Tente de novo." };

  const { error } = await supabase.from("selection_items").insert(
    p.items.map((it, i) => ({ org_id: org.id, selection_id: selectionId, product_id: it.product_id, position: i, custom_price: it.custom_price, note: it.note || null })),
  );
  if (error) {
    await supabase.from("selections").delete().eq("id", selectionId);
    return { error: "Não foi possível salvar os produtos da seleção." };
  }
  revalidatePath("/app/catalogo/selecoes");
  return { code };
}

export async function deleteSelection(fd: FormData) {
  const supabase = await createClient();
  await supabase.from("selections").delete().eq("id", reqStr(fd, "id"));
  revalidatePath("/app/catalogo/selecoes");
}

export async function extendSelection(fd: FormData) {
  const supabase = await createClient();
  const until = new Date(Date.now() + 14 * 86_400_000).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  await supabase.from("selections").update({ expires_at: until }).eq("id", reqStr(fd, "id"));
  revalidatePath("/app/catalogo/selecoes");
}

export async function setOffer(fd: FormData) {
  const { org } = await getOrgContext();
  const id = reqStr(fd, "product_id");
  const price = decimal(fd, "offer_price", -1);
  const until = str(fd, "offer_until");
  if (price < 0 || !until || !/^\d{4}-\d{2}-\d{2}$/.test(until)) throw new Error("Informe o preço e a validade da oferta.");
  const supabase = await createClient();
  await supabase.from("products").update({ offer_price: price, offer_until: until }).eq("id", id).eq("org_id", org.id);
  revalidatePath("/app/catalogo", "layout");
  revalidatePath(`/loja/${org.slug}`, "layout");
}

export async function clearOffer(fd: FormData) {
  const { org } = await getOrgContext();
  const supabase = await createClient();
  await supabase.from("products").update({ offer_price: null, offer_until: null }).eq("id", reqStr(fd, "product_id")).eq("org_id", org.id);
  revalidatePath("/app/catalogo", "layout");
  revalidatePath(`/loja/${org.slug}`, "layout");
}
