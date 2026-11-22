"use client";
import { useActionState } from "react";
import { Alert, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { requestPasswordReset, updatePassword, type AuthState } from "./actions";

export function ForgotForm() {
  const [state, action] = useActionState<AuthState, FormData>(requestPasswordReset, {});
  if (state.message) return <Alert kind="success">{state.message}</Alert>;
  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert>{state.error}</Alert>}
      <Field label="E-mail da sua conta">
        <Input name="email" type="email" required autoComplete="email" autoFocus />
      </Field>
      <SubmitButton className="w-full" pendingText="Enviando…">Enviar link</SubmitButton>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action] = useActionState<AuthState, FormData>(updatePassword, {});
  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert>{state.error}</Alert>}
      <Field label="Nova senha" hint="Pelo menos 8 caracteres.">
        <Input name="password" type="password" required minLength={8} autoComplete="new-password" autoFocus />
      </Field>
      <Field label="Repita a nova senha">
        <Input name="confirm" type="password" required minLength={8} autoComplete="new-password" />
      </Field>
      <SubmitButton className="w-full" pendingText="Salvando…">Salvar nova senha</SubmitButton>
    </form>
  );
}
