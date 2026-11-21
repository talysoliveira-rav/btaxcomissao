import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/format";

/** Lotes com saldo que já venceram ou vencem até amanhã. */
export async function perishAlertCount(orgId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("supply_batches")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .gt("remaining", 0)
    .lte("expires_at", todayISO(1));
  return count ?? 0;
}
