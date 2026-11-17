import { getOrgContext } from "@/lib/org";
import { PageHeader } from "@/components/ui";
import { OrderForm } from "../order-form";
import { loadOrderFormData } from "../form-data";

export const metadata = { title: "Novo pedido" };

export default async function NewOrderPage() {
  const { org } = await getOrgContext();
  const { customers, products } = await loadOrderFormData(org.id);
  return (
    <>
      <PageHeader title="Novo pedido" />
      <OrderForm customers={customers} products={products} defaultFee={Number(org.delivery_fee_default)} />
    </>
  );
}
