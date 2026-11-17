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
      <Field label="Validade média (dias)" hint="Flores frescas: usado para calcular o vencimento dos lotes." className="col-span-2">
        <Input name="shelf_life_days" type="number" min={1} defaultValue={s?.shelf_life_days ?? ""} />
      </Field>
    </div>
  );
}
