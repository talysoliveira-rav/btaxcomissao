import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { OnboardingForm } from "./form";

export const metadata = { title: "Sua floricultura" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ nova?: string }> }) {
  const { nova } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { count } = await supabase.from("memberships").select("*", { count: "exact", head: true }).eq("user_id", user.id);
  if ((count ?? 0) > 0 && !nova) redirect("/app");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-[#faf9f7] px-4">
      <Logo className="mb-8 text-xl" />
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Vamos configurar sua floricultura</h1>
        <p className="mb-5 mt-1 text-sm text-stone-500">Leva menos de um minuto. Você pode mudar tudo depois em Configurações.</p>
        <OnboardingForm />
      </div>
    </div>
  );
}
