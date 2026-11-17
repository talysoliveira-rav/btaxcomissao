import { Field, Input, Textarea } from "@/components/ui";
import type { Product } from "@/lib/types";

export function ProductFields({ p }: { p?: Product }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Nome" className="sm:col-span-2"><Input name="name" required defaultValue={p?.name} placeholder="Buquê 12 rosas vermelhas" /></Field>
      <Field label="Preço de venda (R$)"><Input name="price" inputMode="decimal" required defaultValue={p?.price} /></Field>
      <Field label="Categoria"><Input name="category" defaultValue={p?.category ?? ""} placeholder="Buquês, Arranjos, Cestas, Plantas…" list="categories" /></Field>
      <Field label="Código / SKU"><Input name="sku" defaultValue={p?.sku ?? ""} /></Field>
      <Field label="URL da foto"><Input name="image_url" type="url" defaultValue={p?.image_url ?? ""} /></Field>
      <Field label="Descrição" className="sm:col-span-2"><Textarea name="description" defaultValue={p?.description ?? ""} /></Field>
      <datalist id="categories">
        {["Buquês", "Arranjos", "Cestas", "Plantas", "Coroas", "Casamento", "Corporativo"].map((c) => <option key={c} value={c} />)}
      </datalist>
    </div>
  );
}
