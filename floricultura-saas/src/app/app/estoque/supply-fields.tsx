import { Field, Input, Select } from "@/components/ui";
import type { Supply } from "@/lib/types";

export const UNITS = ["un", "haste", "maço", "kg", "m", "pacote", "caixa"];

export function SupplyFields({ s, categories }: { s?: Supply; categories: { id: string; name: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Nome" className="col-span-2"><Input name="name" required defaultValue={s?.name} placeholder="Rosa vermelha Carola" /></Field>
      <Field label="Categoria">
        <Select name="category_id" defaultValue={s?.category_id ?? ""}>
          <option value="">—</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </Field>
      <Field label="Unidade">
        <Select name="unit" defaultValue={s?.unit ?? "un"}>{UNITS.map((u) => <option key={u}>{u}</option>)}</Select>
      </Field>
      <Field label="Custo unitário (R$)"><Input name="cost" inputMode="decimal" defaultValue={s?.cost ?? ""} /></Field>
      <Field label="Estoque mínimo"><Input name="min_quantity" inputMode="decimal" defaultValue={s?.min_quantity ?? ""} /></Field>
      <Field label="Validade média (dias)" hint="Calcula o vencimento dos lotes.">
        <Input name="shelf_life_days" type="number" min={1} defaultValue={s?.shelf_life_days ?? ""} />
      </Field>
      <Field label="Vendido em múltiplos de" hint="Ex.: 20 se vem em maço de 20. Avulso = 1.">
        <Input name="purchase_multiple" inputMode="decimal" defaultValue={s?.purchase_multiple ?? 1} />
      </Field>
    </div>
  );
}
