import Link from "next/link";
import { AuthForm } from "../auth-form";

export const metadata = { title: "Criar conta" };

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Criar conta</h1>
      <p className="mb-5 text-sm text-stone-500">Se você foi convidado por uma floricultura, use o mesmo e-mail do convite.</p>
      <AuthForm mode="signup" />
      <p className="mt-5 text-center text-sm text-stone-500">
        Já tem conta? <Link href="/login" className="font-medium text-brand-600 hover:underline">Entrar</Link>
      </p>
    </>
  );
}
