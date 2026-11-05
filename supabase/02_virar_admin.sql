-- =====================================================================
-- Rode DEPOIS de criar a sua conta no site (cadastro com o seu e-mail).
-- Troque SEU_EMAIL pelo e-mail do cadastro e rode no SQL Editor do Supabase.
-- =====================================================================

-- Você vira admin (edita regras, cargos e papéis; vê a equipe)
update public.profiles set papel = 'admin' where email = 'SEU_EMAIL';

-- (Opcional) Seu gestor vira gestor: vê a equipe e define cargos
-- update public.profiles set papel = 'gestor' where email = 'EMAIL_DO_GESTOR';

-- Importar contratos antigos: use o script entregue à parte (não suba dados de clientes neste repositório público).
