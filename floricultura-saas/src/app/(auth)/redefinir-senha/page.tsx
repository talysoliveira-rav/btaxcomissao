import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewPasswordForm } from "../password-forms";

export const metadata = { title: "Nova senha" };

export default async function ResetPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <>
        <h1 className="mb-1 text-xl font-semibold">Link expirado</h1>
        <p className="mb-5 text-sm text-stone-500">Para criar uma nova senha, peça um novo link.</p>
        <Link href="/esqueci-senha" className="btn-primary flex w-full items-center justify-center rounded-lg px-3.5 py-2 text-sm font-medium">Pedir novo link</Link>
      </>
    );
  }
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Criar nova senha</h1>
      <p className="mb-5 text-sm text-stone-500">Para a conta <b className="text-stone-700">{user.email}</b>.</p>
      <NewPasswordForm />
    </>
  );
}
