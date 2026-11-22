import Link from "next/link";
import { Alert } from "@/components/ui";
import { ForgotForm } from "../password-forms";

export const metadata = { title: "Esqueci minha senha" };

export default async function ForgotPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Esqueci minha senha</h1>
      <p className="mb-5 text-sm text-stone-500">Informe seu e-mail e enviaremos um link para criar uma nova senha.</p>
      {erro === "link" && (
        <div className="mb-4">
          <Alert>O link expirou ou já foi usado. Peça um novo abaixo. Dica: abra o link no mesmo navegador em que fez o pedido.</Alert>
        </div>
      )}
      <ForgotForm />
      <p className="mt-5 text-center text-sm text-stone-500">
        Lembrou? <Link href="/login" className="font-medium text-brand-600 hover:underline">Voltar para o login</Link>
      </p>
    </>
  );
}
