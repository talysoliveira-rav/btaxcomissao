import { createClient } from "@/lib/supabase/server";
import type { CustomerAddress, Product } from "@/lib/types";

export async function loadOrderFormData(orgId: string) {
  const supabase = await createClient();
  const [c, p] = await Promise.all([
    supabase.from("customers").select("id, name, phone, customer_addresses(*)").eq("org_id", orgId).order("name").limit(2000),
    supabase.from("products").select("*").eq("org_id", orgId).eq("active", true).order("name"),
  ]);
  return {
    customers: (c.data ?? []) as { id: string; name: string; phone: string | null; customer_addresses: CustomerAddress[] }[],
    products: (p.data ?? []) as Product[],
  };
}
