# Calculadora de Comissão — Btax

Site da calculadora de comissão do time (closers e SDRs, inbound e outbound), com login por e-mail e senha, dados de cada pessoa separados e visão geral para gestor/admin.

- **Front-end:** `public/` (HTML estático, sem build) → hospedado na **Vercel**
- **Login e banco:** **Supabase** (Postgres com regras de acesso por linha)
- **Código:** **GitHub** (a Vercel publica sozinha a cada push)

## Papéis

| Papel | O que faz |
|---|---|
| **Membro** | Usa a calculadora, vê e salva só os próprios números |
| **Gestor** | Tudo do membro + aba **Equipe** (todos os números) + define canal/cargo de cada pessoa |
| **Admin** | Tudo do gestor + muda papéis + edita as **regras de comissão** |

Quem tem cargo definido pelo gestor fica com o perfil travado (🔒). Cargo "livre" = a pessoa escolhe.

---

## Passo a passo (uns 20 minutos)

### 1. Supabase — criar o banco
1. Em [supabase.com](https://supabase.com), crie um projeto (região **São Paulo**).
2. Abra **SQL Editor → New query**, cole o conteúdo de `supabase/01_schema.sql`.
3. **Antes de rodar**, troque o domínio no fim do arquivo:
   `'["btax.com.br"]'` → o(s) domínio(s) de e-mail da empresa (ex.: `'["btax.com.br","ravithub.com"]'`).
4. Clique em **Run**.
5. Em **Authentication → Sign In / Providers → Email**: deixe **Confirm email** LIGADO (isso garante que só quem tem acesso ao e-mail da empresa cria conta).
6. Em **Authentication → URL Configuration**: em **Site URL**, coloque o endereço do site da Vercel (passo 3). Volte aqui depois de publicar.
7. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public**.

### 2. GitHub — subir o código
1. Crie um repositório (pode ser privado), ex.: `btax-comissao`.
2. Suba esta pasta inteira.
3. Edite `public/config.js` com a URL e a chave **anon** do passo 1.7.
   > A chave *anon* pode ficar no código: quem protege os dados são as regras do banco. **Nunca** coloque a chave *service_role*.

### 3. Vercel — publicar o site
1. Em [vercel.com](https://vercel.com) → **Add New → Project** → importe o repositório.
2. Framework: **Other**. Não precisa de build (o `vercel.json` já aponta para `public/`).
3. **Deploy**. Copie o endereço (ex.: `btax-comissao.vercel.app`) e volte no passo 1.6.
4. (Opcional) **Settings → Domains** para usar um domínio da empresa, ex.: `comissao.btax.com.br`.

### 4. Virar admin e importar seus dados
1. Abra o site e **crie sua conta** com seu e-mail da empresa. Confirme pelo e-mail.
2. No Supabase → **SQL Editor**, rode `supabase/02_virar_admin.sql` trocando `SEU_EMAIL` pelo e-mail do cadastro. Isso te deixa **admin**.
   - Para importar contratos antigos, rode o script de importação que fica **fora** do repositório (este repo é público; não suba dados de clientes).
   - Para o gestor: depois que ele criar conta, você pode mudar o papel dele direto na aba **Equipe** (ou descomentar a linha no SQL).
3. Recarregue o site.

### 5. Chamar o time
Mande o link. Cada pessoa clica em **Criar conta**, confirma o e-mail e entra. Na aba **Equipe** você define o cargo de cada um.

---

## Manutenção
- **Mudar regras de comissão:** no site, como admin, em "Regras" (fim da página). Vale para todos na hora.
- **Liberar outro domínio de e-mail:** SQL Editor → `update config set valor = '["btax.com.br","outro.com"]' where chave = 'dominios';`
- **Tirar alguém:** Supabase → Authentication → Users → apagar o usuário (os dados dele somem junto).
- **Backup:** de vez em quando, exporte a tabela `calculadoras` em CSV (Supabase → Table Editor → `calculadoras` → Export).

> Os nomes dos menus do Supabase e da Vercel às vezes mudam um pouco; se não achar um item, procure pelo nome parecido.
