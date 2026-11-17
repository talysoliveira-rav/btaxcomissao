import { notFound } from "next/navigation";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { OrderForm } from "../../order-form";
import { loadOrderFormData } from "../../form-data";
import type { Order, OrderItem } from "@/lib/types";

export const metadata = { title: "Editar pedido" };

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const [{ data: order }, { data: items }, formData] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).eq("org_id", org.id).maybeSingle(),
    supabase.from("order_items").select("*").eq("order_id", id),
    loadOrderFormData(org.id),
  ]);
  if (!order) notFound();
  const o = order as Order;
  return (
    <>
      <PageHeader title={`Editar pedido #${o.number}`} />
      <OrderForm
        {...formData}
        defaultFee={Number(org.delivery_fee_default)}
        order={o}
        items={(items ?? []) as OrderItem[]}
        itemsLocked={o.stock_consumed}
      />
    </>
  );
}
