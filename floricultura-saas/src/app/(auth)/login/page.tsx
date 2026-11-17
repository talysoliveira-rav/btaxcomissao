import Link from "next/link";
import { AuthForm } from "../auth-form";

export const metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Entrar</h1>
      <p className="mb-5 text-sm text-stone-500">Acesse o painel da sua floricultura.</p>
      <AuthForm mode="login" next={next} />
      <p className="mt-5 text-center text-sm text-stone-500">
        Ainda não tem conta? <Link href="/signup" className="font-medium text-brand-600 hover:underline">Criar conta</Link>
      </p>
    </>
  );
}
