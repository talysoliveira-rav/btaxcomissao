import Link from "next/link";
import { AuthForm } from "../auth-form";

export const metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; erro?: string }> }) {
  const { next, erro } = await searchParams;
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Entrar</h1>
      <p className="mb-5 text-sm text-stone-500">Acesse o painel da sua floricultura.</p>
      {erro === "link" && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">O link do e-mail expirou ou já foi usado. Entre com sua senha ou peça um novo link.</p>
      )}
      <AuthForm mode="login" next={next} />
      <p className="mt-3 text-center text-sm">
        <Link href="/esqueci-senha" className="text-stone-500 hover:text-brand-700 hover:underline">Esqueci minha senha</Link>
      </p>
      <p className="mt-5 text-center text-sm text-stone-500">
        Ainda não tem conta? <Link href="/signup" className="font-medium text-brand-600 hover:underline">Criar conta</Link>
      </p>
    </>
  );
}
