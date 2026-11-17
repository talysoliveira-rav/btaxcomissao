import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Organization, MemberRole } from "@/lib/types";

export const ORG_COOKIE = "flora_org";

export type OrgContext = {
  org: Organization;
  role: MemberRole;
  userId: string;
  userEmail: string | undefined;
  orgs: { id: string; name: string }[];
};

/** Floricultura ativa do usuário logado. Redireciona para login/onboarding se necessário. */
export const getOrgContext = cache(async (): Promise<OrgContext> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("memberships")
    .select("role, organizations(*)")
    .eq("user_id", user.id)
    .order("created_at");

  const list = (memberships ?? []) as unknown as { role: MemberRole; organizations: Organization }[];
  if (list.length === 0) redirect("/onboarding");

  const cookieStore = await cookies();
  const wanted = cookieStore.get(ORG_COOKIE)?.value;
  const current = list.find((m) => m.organizations.id === wanted) ?? list[0];

  return {
    org: current.organizations,
    role: current.role,
    userId: user.id,
    userEmail: user.email,
    orgs: list.map((m) => ({ id: m.organizations.id, name: m.organizations.name })),
  };
});

export async function requireAdmin() {
  const ctx = await getOrgContext();
  if (ctx.role === "staff") throw new Error("Apenas administradores podem fazer isso.");
  return ctx;
}
