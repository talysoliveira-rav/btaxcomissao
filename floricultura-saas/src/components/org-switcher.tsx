"use client";
import { switchOrg } from "@/app/app/actions";

export function OrgSwitcher({ current, orgs }: { current: string; orgs: { id: string; name: string }[] }) {
  return (
    <form action={switchOrg}>
      <select
        name="org_id"
        defaultValue={current}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="w-full truncate rounded-lg border border-stone-200 bg-stone-50 px-2 py-1.5 text-sm font-medium text-stone-800"
      >
        {orgs.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
        <option value="__new">+ Nova floricultura</option>
      </select>
    </form>
  );
}
