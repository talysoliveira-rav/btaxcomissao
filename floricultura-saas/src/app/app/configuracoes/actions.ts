"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext, requireAdmin } from "@/lib/org";
import { bool, decimal, reqStr, str } from "@/lib/form";
import { hoursError, parseHours, summarizeHours } from "@/lib/hours";
import { parseRegions, summarizeRegions } from "@/lib/regions";

export async function updateOrganization(fd: FormData) {
  const { org } = await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ name: reqStr(fd, "name"), phone: str(fd, "phone"), document: str(fd, "document"), address: str(fd, "address"), delivery_fee_default: decimal(fd, "delivery_fee_default") })
    .eq("id", org.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app", "layout");
}

export async function saveDriver(fd: FormData) {
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const id = str(fd, "id");
  const row = { name: reqStr(fd, "name"), phone: str(fd, "phone"), vehicle: str(fd, "vehicle") };
  if (id) await supabase.from("drivers").update({ ...row, active: bool(fd, "active") }).eq("id", id);
  else await supabase.from("drivers").insert({ ...row, org_id: org.id });
  revalidatePath("/app/configuracoes");
}

export async function inviteMember(fd: FormData) {
  const { org } = await requireAdmin();
  const supabase = await createClient();
  const email = reqStr(fd, "email").toLowerCase();
  const role = (str(fd, "role") ?? "staff") as "admin" | "staff";

  // Se a pessoa já tem conta, entra direto; senão o convite fica pendente até o cadastro.
  const { data: profile } = await supabase.rpc("find_user_by_email", { p_org: org.id, p_email: email });
  if (profile) {
    const { error } = await supabase.rpc("add_member", { p_org: org.id, p_user: profile, p_role: role });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("invitations").upsert({ org_id: org.id, email, role }, { onConflict: "org_id,email" });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/app/configuracoes");
}

export async function cancelInvite(fd: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("invitations").delete().eq("id", reqStr(fd, "id"));
  revalidatePath("/app/configuracoes");
}

export async function updateMemberRole(fd: FormData) {
  const { org } = await requireAdmin();
  const supabase = await createClient();
  await supabase.from("memberships").update({ role: reqStr(fd, "role") }).eq("org_id", org.id).eq("user_id", reqStr(fd, "user_id"));
  revalidatePath("/app/configuracoes");
}

export async function removeMember(fd: FormData) {
  const { org } = await requireAdmin();
  const supabase = await createClient();
  await supabase.from("memberships").delete().eq("org_id", org.id).eq("user_id", reqStr(fd, "user_id"));
  revalidatePath("/app/configuracoes");
}

export async function saveCategory(fd: FormData) {
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const id = str(fd, "id");
  if (id && fd.get("delete")) await supabase.from("supply_categories").delete().eq("id", id);
  else await supabase.from("supply_categories").insert({ org_id: org.id, name: reqStr(fd, "name") });
  revalidatePath("/app/configuracoes");
}

export type StorefrontState = { error?: string; ok?: boolean };

export async function updateStorefront(_: StorefrontState, fd: FormData): Promise<StorefrontState> {
  let ctx;
  try {
    ctx = await requireAdmin();
  } catch {
    return { error: "Somente administradores podem alterar a vitrine." };
  }
  const slug = (str(fd, "slug") ?? "").toLowerCase();
  if (!/^[a-z0-9-]{3,40}$/.test(slug)) return { error: "O endereço deve ter de 3 a 40 letras minúsculas, números ou hífen." };
  const clean = (u: string | null) => (u && /^https:\/\//.test(u) ? u : null);
  const json = (k: string) => {
    try {
      return JSON.parse(String(fd.get(k) ?? "null"));
    } catch {
      return null;
    }
  };
  const hours = parseHours(json("business_hours"));
  if (hours) {
    const err = hoursError(hours);
    if (err) return { error: err };
  }
  const regions = parseRegions(json("delivery_regions"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      storefront_enabled: bool(fd, "storefront_enabled"),
      slug,
      tagline: str(fd, "tagline"),
      store_description: str(fd, "store_description"),
      whatsapp: str(fd, "whatsapp"),
      instagram: str(fd, "instagram")?.replace(/^@/, "") ?? null,
      business_hours: hours,
      opening_hours: hours ? summarizeHours(hours) : null,
      delivery_regions: regions,
      delivery_area: regions.length ? summarizeRegions(regions) : null,
      logo_url: clean(str(fd, "logo_url")),
      cover_url: clean(str(fd, "cover_url")),
    })
    .eq("id", ctx.org.id);
  if (error) return { error: error.code === "23505" ? "Esse endereço já está em uso por outra floricultura." : "Não foi possível salvar." };
  revalidatePath("/app", "layout");
  revalidatePath(`/loja/${ctx.org.slug}`, "layout");
  revalidatePath(`/loja/${slug}`, "layout");
  return { ok: true };
}
