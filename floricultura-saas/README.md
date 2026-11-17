# Florescer — SaaS para floriculturas

Sistema multi-loja (multi-tenant) para floriculturas: **pedidos e entregas**, **catálogo e estoque** e **clientes e datas especiais**.

**Stack:** Next.js 15 (App Router, Server Actions, TypeScript, Tailwind v4) · Supabase (Postgres + Auth + RLS) · deploy na Vercel.

## Módulos

| Módulo | O que faz |
|---|---|
| **Início** | Entregas do dia, pedidos aguardando produção, estoque baixo, lotes vencendo, datas especiais próximas, vendas do mês |
| **Pedidos** | Cadastro com cliente (existente/novo/sem cadastro), itens do catálogo ou avulsos, entrega/retirada, data + turno/horário, destinatário, cartão de mensagem (com sugestões), entrega anônima, pagamento, taxa e desconto. Fluxo de status `Novo → Confirmado → Em produção → Pronto → Em rota → Entregue` (ou Cancelado), histórico, duplicar pedido, aviso por WhatsApp, impressão da ficha de produção + cartão |
| **Entregas** | Agenda por dia agrupada por turno, filtro por entregador, atribuição rápida, “Saiu p/ entrega” / “Entregue”, valor a cobrar, folha de rota imprimível |
| **Catálogo** | Produtos com **ficha técnica** (insumos por unidade), custo, margem e quantas unidades dá para montar com o estoque atual |
| **Estoque** | Insumos (flores, folhagens, vasos, fitas…), **entrada por lote com validade**, perdas, saídas, inventário, descarte de lote vencido, histórico de movimentações. **Baixa automática** quando o pedido entra em produção e **estorno** se for cancelado (consumo FIFO pela validade) |
| **Clientes** | Cadastro, vários endereços (reaproveitados no pedido), datas especiais, histórico e ticket médio |
| **Datas especiais** | Próximas datas dos clientes (7/30/60/90 dias) com mensagem pronta no WhatsApp + datas comerciais (Dia das Mães, Namorados…) |
| **Relatórios** | Faturamento, recebido × a receber, ticket médio, por canal, por forma de pagamento, top produtos, entregas por entregador, perdas |
| **Configurações** | Dados da loja e taxa de entrega padrão, entregadores, equipe (convite por e-mail, papéis Dono/Admin/Equipe), categorias de insumos |

Um usuário pode participar de várias floriculturas (seletor no menu lateral). Todo dado é isolado por floricultura via **Row Level Security** no Postgres.

## Como rodar

### 1. Supabase
1. Crie um projeto em [supabase.com](https://supabase.com) (região São Paulo).
2. **SQL Editor → New query** → cole e rode `supabase/migrations/0001_schema.sql`.
   (Ou, com a CLI: `supabase link` + `supabase db push`.)
3. Em **Authentication → URL Configuration**, defina o *Site URL* (ex.: `http://localhost:3000` e depois o domínio da Vercel) e adicione `<site>/auth/callback` em *Redirect URLs*.
4. Pegue a URL e a *anon key* em **Project Settings → API**.

### 2. Local
```bash
cd floricultura-saas
cp .env.example .env.local   # preencha URL e anon key
npm install
npm run dev                  # http://localhost:3000
```
Crie uma conta, dê nome à floricultura e pronto.

### 3. Vercel
Importe o repositório, defina **Root Directory = `floricultura-saas`** e as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Estrutura

```
supabase/migrations/0001_schema.sql   tabelas, triggers (estoque, numeração, histórico), RPCs e RLS
src/middleware.ts                     sessão Supabase + proteção de /app
src/lib/org.ts                        floricultura ativa do usuário (cookie + memberships)
src/app/(auth)                        login / cadastro
src/app/onboarding                    criação da floricultura
src/app/app/*                         painel: pedidos, entregas, catálogo, estoque, clientes, datas, relatórios, configurações
```

### Regras de negócio no banco
- `orders.number` sequencial por floricultura; `subtotal` recalculado pelos itens; `total` é coluna gerada.
- Mudança de status grava `order_status_history`; ao entrar em produção (ou além) consome os insumos da ficha técnica; ao cancelar, estorna.
- `stock_movements` é a fonte da verdade do saldo (trigger atualiza `supplies.quantity` e os lotes).
- Convites: ao se cadastrar com o e-mail convidado, a pessoa entra automaticamente na floricultura.

## Próximos passos sugeridos
- Loja online pública por floricultura (`/loja/[slug]`) com checkout Pix/cartão
- Caixa e contas a pagar/receber; NFC-e
- Lembretes automáticos de datas especiais (WhatsApp API / e-mail via Edge Function agendada)
- Assinatura do SaaS (planos) com Stripe/Asaas
