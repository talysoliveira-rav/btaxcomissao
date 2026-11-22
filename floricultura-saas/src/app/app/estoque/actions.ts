"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import { bool, decimal, reqStr, str } from "@/lib/form";

function supplyRow(fd: FormData) {
  const shelf = str(fd, "shelf_life_days");
  return {
    name: reqStr(fd, "name"),
    unit: str(fd, "unit") ?? "un",
    category_id: str(fd, "category_id"),
    min_quantity: decimal(fd, "min_quantity"),
    cost: decimal(fd, "cost"),
    shelf_life_days: shelf ? Number(shelf) : null,
    purchase_multiple: Math.max(0.01, decimal(fd, "purchase_multiple", 1) || 1),
  };
}

export async function createSupply(fd: FormData) {
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const { data, error } = await supabase.from("supplies").insert({ ...supplyRow(fd), org_id: org.id }).select("id").single();
  if (error) throw new Error(error.message);
  const initial = decimal(fd, "initial_quantity");
  if (initial > 0) {
    await supabase.rpc("receive_supply", { p_supply: data.id, p_quantity: initial, p_unit_cost: decimal(fd, "cost"), p_supplier: null, p_expires_at: null });
  }
  revalidatePath("/app/estoque");
}

export async function updateSupply(fd: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("supplies").update({ ...supplyRow(fd), active: bool(fd, "active") }).eq("id", reqStr(fd, "id"));
  if (error) throw new Error(error.message);
  revalidatePath("/app/estoque", "layout");
}

export async function receiveSupply(fd: FormData) {
  const id = reqStr(fd, "supply_id");
  const supabase = await createClient();
  const { error } = await supabase.rpc("receive_supply", {
    p_supply: id,
    p_quantity: decimal(fd, "quantity"),
    p_unit_cost: decimal(fd, "unit_cost"),
    p_supplier: str(fd, "supplier"),
    p_expires_at: str(fd, "expires_at"),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/estoque", "layout");
}

/** Perda, saída avulsa ou ajuste de inventário. */
export async function adjustSupply(fd: FormData) {
  const { org } = await getOrgContext();
  const id = reqStr(fd, "supply_id");
  const type = reqStr(fd, "type") as "perda" | "saida" | "ajuste";
  const supabase = await createClient();
  let quantity = decimal(fd, "quantity");
  if (type === "ajuste") {
    // Ajuste informa a contagem real; registramos a diferença
    const { data } = await supabase.from("supplies").select("quantity").eq("id", id).single();
    quantity = quantity - Number(data?.quantity ?? 0);
    if (quantity === 0) return;
  } else {
    quantity = -Math.abs(quantity);
  }
  const { error } = await supabase.from("stock_movements").insert({ org_id: org.id, supply_id: id, type, quantity, reason: str(fd, "reason") });
  if (error) throw new Error(error.message);
  revalidatePath("/app/estoque", "layout");
}

export async function discardBatch(fd: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("discard_batch", { p_batch: reqStr(fd, "batch_id"), p_reason: "Lote vencido/descartado" });
  if (error) throw new Error(error.message);
  revalidatePath("/app", "layout");
}

export async function deleteSupply(fd: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("supplies").delete().eq("id", reqStr(fd, "id"));
  if (error) throw new Error(error.message.includes("foreign key") ? "Insumo usado em ficha técnica — desative em vez de excluir." : error.message);
  redirect("/app/estoque");
}

/** Perda parcial de um lote específico (ex.: 5 de 20 hastes murcharam). */
export async function registerBatchLoss(fd: FormData) {
  const { org } = await getOrgContext();
  const batchId = reqStr(fd, "batch_id");
  const supabase = await createClient();
  const { data: batch } = await supabase.from("supply_batches").select("supply_id, remaining").eq("id", batchId).single();
  if (!batch) throw new Error("Lote não encontrado.");
  const qty = Math.min(Math.abs(decimal(fd, "quantity")), Number(batch.remaining));
  if (qty <= 0) return;
  const { error } = await supabase.from("stock_movements").insert({
    org_id: org.id,
    supply_id: batch.supply_id,
    batch_id: batchId,
    type: "perda",
    quantity: -qty,
    reason: str(fd, "reason") ?? "Perda no lote",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app", "layout");
}

/** Registra várias entradas de uma vez (depois de fazer as compras da lista). */
export async function receiveMany(items: { supply_id: string; quantity: number; unit_cost: number; supplier: string | null }[]): Promise<{ error?: string; count?: number }> {
  const supabase = await createClient();
  let count = 0;
  for (const it of items.slice(0, 200)) {
    const qty = Number(it.quantity);
    if (!it.supply_id || !(qty > 0)) continue;
    const { error } = await supabase.rpc("receive_supply", {
      p_supply: it.supply_id,
      p_quantity: qty,
      p_unit_cost: Math.max(0, Number(it.unit_cost) || 0),
      p_supplier: it.supplier?.trim() || null,
      p_expires_at: null, // usa a validade média do insumo
    });
    if (error) return { error: `Parou no item ${count + 1}: ${error.message}`, count };
    count++;
  }
  revalidatePath("/app", "layout");
  return { count };
}
