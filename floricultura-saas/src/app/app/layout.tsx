import Link from "next/link";
import { getOrgContext } from "@/lib/org";
import { Logo } from "@/components/logo";
import { Nav } from "@/components/nav";
import { OrgSwitcher } from "@/components/org-switcher";
import { signOut } from "@/app/(auth)/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getOrgContext();
  return (
    <div className="min-h-screen md:flex">
      <aside className="no-print border-b border-stone-200 bg-white p-4 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-2 md:block">
          <Link href="/app"><Logo /></Link>
          <div className="md:mt-5"><OrgSwitcher current={ctx.org.id} orgs={ctx.orgs} /></div>
        </div>
        <Nav />
        <div className="mt-6 hidden border-t border-stone-100 pt-4 text-xs text-stone-500 md:block">
          <p className="truncate">{ctx.userEmail}</p>
          <form action={signOut}>
            <button className="mt-1 font-medium text-stone-700 hover:text-brand-700">Sair</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
