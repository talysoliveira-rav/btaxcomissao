import Link from "next/link";
import { cookies } from "next/headers";
import { LogOut } from "lucide-react";
import { getOrgContext } from "@/lib/org";
import { perishAlertCount } from "@/lib/perishability-server";
import { Logo } from "@/components/logo";
import { BottomTabs, MobileDrawer, Sidebar, ThemeToggle } from "@/components/nav";
import { OrgSwitcher } from "@/components/org-switcher";
import { signOut } from "@/app/(auth)/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getOrgContext();
  const jar = await cookies();
  const collapsed = jar.get("flora_sidebar")?.value === "collapsed";
  const theme = jar.get("flora_theme")?.value === "dark" ? "dark" : "light";
  const badges = { "/app/estoque": await perishAlertCount(ctx.org.id) };

  const account = (
    <div className="flex items-center gap-2 text-xs text-stone-500">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 text-[13px] font-semibold uppercase text-brand-700">
        {(ctx.userEmail ?? "?").slice(0, 1)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate" title={ctx.userEmail}>{ctx.userEmail}</p>
        <form action={signOut}>
          <button className="inline-flex items-center gap-1 font-medium text-stone-700 transition hover:text-brand-700">
            <LogOut className="h-3.5 w-3.5" aria-hidden /> Sair
          </button>
        </form>
      </div>
    </div>
  );
  const accountCompact = (
    <form action={signOut}>
      <button title="Sair" aria-label="Sair" className="mx-auto grid h-9 w-9 place-items-center rounded-xl text-stone-500 transition hover:bg-white/70 hover:text-brand-700">
        <LogOut className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </form>
  );
  const orgSwitcher = <OrgSwitcher current={ctx.org.id} orgs={ctx.orgs} />;

  return (
    <div id="app-shell" className="relative min-h-screen md:flex">

      <Sidebar
        initialCollapsed={collapsed}
        initialTheme={theme}
        logo={<Logo />}
        logoCompact={<Logo compact />}
        orgSwitcher={orgSwitcher}
        account={account}
        accountCompact={accountCompact}
        badges={badges}
      />

      {/* Celular */}
      <header className="glass no-print sticky top-0 z-30 flex items-center gap-2 border-b border-white/70 px-3 py-2 md:hidden">
        <MobileDrawer
          badges={badges}
          header={<Logo />}
          footer={
            <>
              <ThemeToggle initial={theme} />
              {account}
            </>
          }
        />
        <Link href="/app" className="shrink-0"><Logo /></Link>
        <div className="ml-auto min-w-0 max-w-[45vw]">{orgSwitcher}</div>
      </header>

      <main className="relative z-10 min-w-0 flex-1 p-4 pb-28 md:p-8 md:pb-10">{children}</main>
      <BottomTabs />
    </div>
  );
}
