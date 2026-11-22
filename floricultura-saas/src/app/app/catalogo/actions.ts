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
    price_mode: (str(fd, "price_mode") ?? "exato") as "exato" | "a_partir_de" | "sob_consulta",
  };
}

async function revalidateStore() {
  const { org } = await getOrgContext();
  revalidatePath(`/loja/${org.slug}`, "layout");
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
  const { error } = await supabase
    .from("products")
    .update({ ...productRow(fd), active: bool(fd, "active"), show_in_store: bool(fd, "show_in_store"), featured: bool(fd, "featured") })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/catalogo`, "layout");
  await revalidateStore();
}

export async function deleteProduct(fd: FormData) {
  const id = reqStr(fd, "id");
  const supabase = await createClient();
  const { data: imgs } = await supabase.from("product_images").select("path, thumb_path").eq("product_id", id);
  const files = (imgs ?? []).flatMap((i) => [i.path, i.thumb_path]).filter(Boolean) as string[];
  if (files.length) await supabase.storage.from("store").remove(files);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await revalidateStore();
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

// ---------------------------------------------------------------------
// Fotos (o envio do arquivo é feito no navegador direto para o storage)
// ---------------------------------------------------------------------
function publicUrl(supabase: Awaited<ReturnType<typeof createClient>>, path: string) {
  return supabase.storage.from("store").getPublicUrl(path).data.publicUrl;
}

export async function addProductImages(productId: string, items: { path: string; thumbPath: string }[]) {
  const { org } = await getOrgContext();
  const supabase = await createClient();
  // só aceita arquivos dentro da pasta da própria floricultura
  const valid = items.filter((i) => i.path.startsWith(`${org.id}/`) && i.thumbPath.startsWith(`${org.id}/`));
  const { data: last } = await supabase.from("product_images").select("position").eq("product_id", productId).order("position", { ascending: false }).limit(1);
  let pos = (last?.[0]?.position ?? -1) + 1;
  const rows = valid.map((i) => ({
    org_id: org.id,
    product_id: productId,
    path: i.path,
    thumb_path: i.thumbPath,
    url: publicUrl(supabase, i.path),
    thumb_url: publicUrl(supabase, i.thumbPath),
    position: pos++,
  }));
  if (rows.length) {
    const { error } = await supabase.from("product_images").insert(rows);
    if (error) return { error: "Não foi possível salvar as fotos." };
    // mantém image_url (usado em listas antigas) apontando para a capa
    const { data: cover } = await supabase.from("product_images").select("url").eq("product_id", productId).order("position").limit(1).single();
    if (cover) await supabase.from("products").update({ image_url: cover.url }).eq("id", productId);
  }
  revalidatePath(`/app/catalogo/${productId}`);
  revalidatePath("/app/catalogo");
  await revalidateStore();
  return {};
}

export async function setCoverImage(fd: FormData) {
  const id = reqStr(fd, "id");
  const productId = reqStr(fd, "product_id");
  const supabase = await createClient();
  const { data: imgs } = await supabase.from("product_images").select("id, url").eq("product_id", productId).order("position");
  const ordered = [...(imgs ?? []).filter((i) => i.id === id), ...(imgs ?? []).filter((i) => i.id !== id)];
  for (const [i, img] of ordered.entries()) await supabase.from("product_images").update({ position: i }).eq("id", img.id);
  if (ordered[0]) await supabase.from("products").update({ image_url: ordered[0].url }).eq("id", productId);
  revalidatePath(`/app/catalogo/${productId}`);
  revalidatePath("/app/catalogo");
  await revalidateStore();
}

export async function deleteProductImage(fd: FormData) {
  const id = reqStr(fd, "id");
  const productId = reqStr(fd, "product_id");
  const supabase = await createClient();
  const { data: img } = await supabase.from("product_images").select("path, thumb_path").eq("id", id).single();
  if (img) await supabase.storage.from("store").remove([img.path, img.thumb_path].filter(Boolean) as string[]);
  await supabase.from("product_images").delete().eq("id", id);
  const { data: cover } = await supabase.from("product_images").select("url").eq("product_id", productId).order("position").limit(1).maybeSingle();
  await supabase.from("products").update({ image_url: cover?.url ?? null }).eq("id", productId);
  revalidatePath(`/app/catalogo/${productId}`);
  revalidatePath("/app/catalogo");
  await revalidateStore();
}
