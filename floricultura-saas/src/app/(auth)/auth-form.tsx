"use client";
import { useActionState } from "react";
import { Alert, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { signIn, signUp, type AuthState } from "./actions";

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(mode === "login" ? signIn : signUp, {});
  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert>{state.error}</Alert>}
      {state.message && <Alert kind="success">{state.message}</Alert>}
      {next && <input type="hidden" name="next" value={next} />}
      {mode === "signup" && (
        <Field label="Seu nome">
          <Input name="full_name" required autoComplete="name" />
        </Field>
      )}
      <Field label="E-mail">
        <Input name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Senha">
        <Input name="password" type="password" required minLength={mode === "signup" ? 8 : undefined} autoComplete={mode === "login" ? "current-password" : "new-password"} />
      </Field>
      <SubmitButton className="w-full" pendingText="Aguarde…">{mode === "login" ? "Entrar" : "Criar conta"}</SubmitButton>
    </form>
  );
}
