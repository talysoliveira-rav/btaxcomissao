import { Field, Input, Select, Textarea } from "@/components/ui";
import { PRICE_MODE_LABEL } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductFields({ p }: { p?: Product }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Nome" className="sm:col-span-2"><Input name="name" required defaultValue={p?.name} placeholder="Buquê 12 rosas vermelhas" /></Field>
      <Field label="Preço de venda (R$)"><Input name="price" inputMode="decimal" required defaultValue={p?.price} /></Field>
      <Field label="Como mostrar o preço na vitrine" hint="“A partir de” é bom para arranjos que variam de tamanho.">
        <Select name="price_mode" defaultValue={p?.price_mode ?? "exato"}>
          {Object.entries(PRICE_MODE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </Field>
      <Field label="Categoria"><Input name="category" defaultValue={p?.category ?? ""} placeholder="Buquês, Arranjos, Cestas, Plantas…" list="categories" /></Field>
      <Field label="Código / SKU"><Input name="sku" defaultValue={p?.sku ?? ""} /></Field>
      <Field label="Descrição" className="sm:col-span-2"><Textarea name="description" defaultValue={p?.description ?? ""} /></Field>
      <datalist id="categories">
        {["Buquês", "Arranjos", "Cestas", "Plantas", "Coroas", "Casamento", "Corporativo"].map((c) => <option key={c} value={c} />)}
      </datalist>
    </div>
  );
}
