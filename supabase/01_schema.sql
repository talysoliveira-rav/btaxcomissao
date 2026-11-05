-- =====================================================================
-- Calculadora de Comissão Btax — banco de dados (Supabase / Postgres)
-- Rode este arquivo inteiro no Supabase: SQL Editor > New query > Run.
-- =====================================================================

-- ---------- Tabelas ----------
create table if not exists public.profiles (
  id             uuid primary key references auth.users on delete cascade,
  email          text not null,
  nome           text,
  canal          text check (canal in ('inbound','outbound')),
  cargo          text check (cargo in ('closer','sdr')),
  cargo_travado  boolean not null default false,
  papel          text not null default 'membro' check (papel in ('membro','gestor','admin')),
  created_at     timestamptz not null default now()
);

create table if not exists public.calculadoras (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  doc         jsonb not null default '{}'::jsonb,   -- contratos, reuniões, campanhas, metas por mês
  resumo      jsonb not null default '{}'::jsonb,   -- totais por mês (o que o gestor vê)
  updated_at  timestamptz not null default now()
);

create table if not exists public.config (
  chave       text primary key,                     -- 'regras' | 'dominios'
  valor       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- ---------- Funções de papel ----------
create or replace function public.meu_papel() returns text
language sql stable security definer set search_path = public as $$
  select papel from public.profiles where id = auth.uid()
$$;

create or replace function public.is_gestor() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.meu_papel() in ('gestor','admin'), false)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.meu_papel() = 'admin', false)
$$;

-- ---------- Cadastro: só e-mails do domínio da empresa ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  dominios jsonb;
  dom text := lower(split_part(new.email, '@', 2));
begin
  select valor into dominios from public.config where chave = 'dominios';
  if dominios is not null and jsonb_array_length(dominios) > 0
     and not exists (select 1 from jsonb_array_elements_text(dominios) d where lower(d) = dom) then
    raise exception 'DOMINIO_NAO_PERMITIDO';
  end if;

  insert into public.profiles (id, email, nome)
  values (new.id, new.email, coalesce(nullif(new.raw_user_meta_data->>'nome',''), split_part(new.email, '@', 1)));
  insert into public.calculadoras (user_id) values (new.id);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Proteção: só gestor define cargo, só admin define papel ----------
create or replace function public.protege_profile() returns trigger
language plpgsql set search_path = public as $$
begin
  -- SQL Editor / service role passam direto; usuários do site (authenticated/anon) são checados
  if current_user not in ('authenticated','anon') then return new; end if;
  new.id := old.id; new.email := old.email;
  if not public.is_admin() and new.papel is distinct from old.papel then
    raise exception 'Só o admin muda o papel de alguém';
  end if;
  if not public.is_gestor() and (new.canal is distinct from old.canal
       or new.cargo is distinct from old.cargo
       or new.cargo_travado is distinct from old.cargo_travado) then
    raise exception 'Só o gestor define o cargo';
  end if;
  return new;
end $$;

drop trigger if exists protege_profile on public.profiles;
create trigger protege_profile
  before update on public.profiles
  for each row execute function public.protege_profile();

-- ---------- Regras de acesso (RLS) ----------
alter table public.profiles     enable row level security;
alter table public.calculadoras enable row level security;
alter table public.config       enable row level security;

drop policy if exists "perfil: ver o próprio ou gestor vê todos" on public.profiles;
create policy "perfil: ver o próprio ou gestor vê todos" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_gestor());

drop policy if exists "perfil: editar o próprio ou gestor edita" on public.profiles;
create policy "perfil: editar o próprio ou gestor edita" on public.profiles
  for update to authenticated using (id = auth.uid() or public.is_gestor())
  with check (id = auth.uid() or public.is_gestor());

drop policy if exists "calc: ver a própria ou gestor vê todas" on public.calculadoras;
create policy "calc: ver a própria ou gestor vê todas" on public.calculadoras
  for select to authenticated using (user_id = auth.uid() or public.is_gestor());

drop policy if exists "calc: criar a própria" on public.calculadoras;
create policy "calc: criar a própria" on public.calculadoras
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "calc: editar só a própria" on public.calculadoras;
create policy "calc: editar só a própria" on public.calculadoras
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "config: todos leem" on public.config;
create policy "config: todos leem" on public.config
  for select to authenticated using (true);

drop policy if exists "config: admin grava" on public.config;
create policy "config: admin grava" on public.config
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Configuração inicial ----------
-- TROQUE pelo(s) domínio(s) de e-mail da empresa. Ex.: '["btax.com.br"]' ou '["btax.com.br","ravithub.com"]'.
-- Deixe '[]' para liberar qualquer e-mail.
insert into public.config (chave, valor) values ('dominios', '["btax.com.br"]'::jsonb)
  on conflict (chave) do nothing;
insert into public.config (chave, valor) values ('regras', '{}'::jsonb)
  on conflict (chave) do nothing;
