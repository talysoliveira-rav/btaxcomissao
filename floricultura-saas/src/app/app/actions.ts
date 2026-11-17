"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ONBOARDING_HIDDEN_COOKIE, ORG_COOKIE } from "@/lib/org";

export async function switchOrg(fd: FormData) {
  const id = String(fd.get("org_id") ?? "");
  if (id === "__new") redirect("/onboarding?nova=1");
  (await cookies()).set(ORG_COOKIE, id, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  redirect("/app");
}


export async function hideOnboarding() {
  (await cookies()).set(ONBOARDING_HIDDEN_COOKIE, "1", { path: "/", maxAge: 60 * 60 * 24 * 365 });
  redirect("/app");
}
