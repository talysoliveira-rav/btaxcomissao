"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

export async function signIn(_: AuthState, fd: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(fd.get("email") ?? ""),
    password: String(fd.get("password") ?? ""),
  });
  if (error) return { error: "E-mail ou senha inválidos." };
  const next = String(fd.get("next") ?? "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/app");
}

export async function signUp(_: AuthState, fd: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  const { data, error } = await supabase.auth.signUp({
    email: String(fd.get("email") ?? ""),
    password,
    options: {
      data: { full_name: String(fd.get("full_name") ?? "") },
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
    },
  });
  if (error) return { error: error.message };
  if (!data.session) return { message: "Enviamos um link de confirmação para o seu e-mail." };
  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Envia o link de redefinição. Sempre responde igual, para não revelar quais e-mails têm conta. */
export async function requestPasswordReset(_: AuthState, fd: FormData): Promise<AuthState> {
  const email = String(fd.get("email") ?? "").trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Informe um e-mail válido." };
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/redefinir-senha` });
  if (error && /rate|limit|seconds/i.test(error.message)) return { error: "Muitas tentativas seguidas. Aguarde um minuto e tente de novo." };
  return { message: "Se houver uma conta com esse e-mail, enviamos um link para criar uma nova senha. Confira também a caixa de spam." };
}

export async function updatePassword(_: AuthState, fd: FormData): Promise<AuthState> {
  const password = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  if (password !== confirm) return { error: "As duas senhas não são iguais." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "O link expirou. Peça um novo em “Esqueci minha senha”." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (/same|different/i.test(error.message)) return { error: "A nova senha precisa ser diferente da anterior." };
    if (/weak|pwned|leaked|compromised/i.test(error.message)) return { error: "Essa senha é fraca ou já apareceu em vazamentos. Escolha outra." };
    return { error: "Não foi possível salvar a nova senha. Tente de novo." };
  }
  redirect("/app?senha=ok");
}
