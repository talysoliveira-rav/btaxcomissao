"use client";
import { switchOrg } from "@/app/app/actions";

export function OrgSwitcher({ current, orgs }: { current: string; orgs: { id: string; name: string }[] }) {
  return (
    <form action={switchOrg}>
      <select
        name="org_id"
        defaultValue={current}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="w-full truncate rounded-xl border border-white/80 bg-white/70 px-2.5 py-2 text-sm font-medium text-stone-800 shadow-sm transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
      >
        {orgs.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
        <option value="__new">+ Nova floricultura</option>
      </select>
    </form>
  );
}
