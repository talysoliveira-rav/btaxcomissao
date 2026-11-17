"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ORG_COOKIE } from "@/lib/org";

export type OnboardingState = { error?: string };

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

export async function createOrganization(_: OnboardingState, fd: FormData): Promise<OnboardingState> {
  const name = String(fd.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Informe o nome da floricultura." };
  let slug = slugify(name);
  if (slug.length < 3) slug = `flora-${slug}`;
  slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const supabase = await createClient();
  const { data: orgId, error } = await supabase.rpc("create_organization", { p_name: name, p_slug: slug });
  if (error) return { error: error.message };

  const phone = String(fd.get("phone") ?? "").trim();
  if (phone) await supabase.from("organizations").update({ phone }).eq("id", orgId);

  (await cookies()).set(ORG_COOKIE, orgId as string, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  redirect("/app");
}
