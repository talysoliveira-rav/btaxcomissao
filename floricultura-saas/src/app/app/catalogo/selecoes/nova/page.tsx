import Link from "next/link";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { siteUrl } from "@/lib/site";
import { SelectionForm } from "../selection-form";

export const metadata = { title: "Nova seleção" };

export default async function NewSelectionPage() {
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const [{ data: products }, { data: customers }, base] = await Promise.all([
    supabase.from("products").select("id, name, price, category, image_url, offer_price, offer_until").eq("org_id", org.id).eq("active", true).order("name"),
    supabase.from("customers").select("id, name").eq("org_id", org.id).order("name").limit(1000),
    siteUrl(),
  ]);
  return (
    <>
      <PageHeader
        title="Nova seleção"
        subtitle={<Link href="/app/catalogo/selecoes" className="hover:underline">← Seleções</Link>}
      />
      {!org.storefront_enabled && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          A vitrine online está desligada: o link só abre depois de ativar em{" "}
          <Link href="/app/configuracoes#vitrine" className="font-medium underline">Configurações → Vitrine</Link>.
        </p>
      )}
      <SelectionForm products={products ?? []} customers={customers ?? []} baseUrl={base} storeName={org.name} />
    </>
  );
}
