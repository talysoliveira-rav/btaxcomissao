"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/org";
import { bool, decimal, reqStr, str } from "@/lib/form";

function productRow(fd: FormData) {
  return {
    name: reqStr(fd, "name"),
    description: str(fd, "description"),
    category: str(fd, "category"),
    price: decimal(fd, "price"),
    sku: str(fd, "sku"),
    image_url: str(fd, "image_url"),
  };
}

export async function createProduct(fd: FormData) {
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").insert({ ...productRow(fd), org_id: org.id }).select("id").single();
  if (error) throw new Error(error.message);
  redirect(`/app/catalogo/${data.id}`);
}

export async function updateProduct(fd: FormData) {
  const id = reqStr(fd, "id");
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ ...productRow(fd), active: bool(fd, "active") }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/catalogo`, "layout");
}

export async function deleteProduct(fd: FormData) {
  const id = reqStr(fd, "id");
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  redirect("/app/catalogo");
}

export async function addComponent(fd: FormData) {
  const { org } = await getOrgContext();
  const product_id = reqStr(fd, "product_id");
  const supabase = await createClient();
  const { error } = await supabase.from("product_components").upsert(
    { org_id: org.id, product_id, supply_id: reqStr(fd, "supply_id"), quantity: decimal(fd, "quantity", 1) },
    { onConflict: "product_id,supply_id" },
  );
  if (error) throw new Error(error.message);
  revalidatePath(`/app/catalogo/${product_id}`);
}

export async function removeComponent(fd: FormData) {
  const supabase = await createClient();
  await supabase.from("product_components").delete().eq("id", reqStr(fd, "id"));
  revalidatePath(`/app/catalogo/${reqStr(fd, "product_id")}`);
}
