"use client";
import { useActionState } from "react";
import { Alert, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { createOrganization, type OnboardingState } from "./actions";

export function OnboardingForm() {
  const [state, action] = useActionState<OnboardingState, FormData>(createOrganization, {});
  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert>{state.error}</Alert>}
      <Field label="Nome da floricultura">
        <Input name="name" required placeholder="Ex.: Flor de Lis" />
      </Field>
      <Field label="WhatsApp / telefone (opcional)">
        <Input name="phone" placeholder="(11) 99999-9999" />
      </Field>
      <SubmitButton className="w-full" pendingText="Criando…">Criar minha floricultura</SubmitButton>
    </form>
  );
}
