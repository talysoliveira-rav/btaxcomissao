-- =====================================================================
-- Floricultura SaaS — schema inicial (multi-tenant com RLS)
-- Cada floricultura é uma "organization". Usuários entram por "memberships".
-- Todas as tabelas de negócio têm org_id e são protegidas por RLS.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type member_role as enum ('owner', 'admin', 'staff');
create type order_status as enum (
  'novo', 'confirmado', 'em_producao', 'pronto', 'em_rota', 'entregue', 'cancelado'
);
create type delivery_period as enum ('manha', 'tarde', 'noite', 'horario');
create type fulfillment_type as enum ('entrega', 'retirada');
create type payment_status as enum ('pendente', 'pago', 'estornado');
create type stock_movement_type as enum ('entrada', 'saida', 'perda', 'ajuste', 'consumo_pedido', 'estorno_pedido');

-- ---------------------------------------------------------------------
-- Organizações e membros
-- ---------------------------------------------------------------------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  phone text,
  document text,           -- CNPJ/CPF
  address text,
  delivery_fee_default numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table memberships (
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role member_role not null default 'staff',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index on memberships (user_id);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

-- Convites pendentes por e-mail: ao se cadastrar com esse e-mail, a pessoa entra na floricultura.
create table invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  role member_role not null default 'staff',
  created_at timestamptz not null default now(),
  unique (org_id, email)
);

-- ---------------------------------------------------------------------
-- Funções auxiliares de acesso (security definer para evitar recursão de RLS)
-- ---------------------------------------------------------------------
create or replace function is_member(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships where org_id = p_org and user_id = auth.uid());
$$;

create or replace function is_admin(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships
    where org_id = p_org and user_id = auth.uid() and role in ('owner', 'admin')
  );
$$;

-- ---------------------------------------------------------------------
-- Clientes e datas comemorativas
-- ---------------------------------------------------------------------
create table customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  document text,
  notes text,
  created_at timestamptz not null default now()
);
create index on customers (org_id, name);

create table customer_addresses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  label text,               -- "Casa", "Trabalho", "Mãe"...
  street text not null,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  zip text,
  reference text,
  created_at timestamptz not null default now()
);
create index on customer_addresses (customer_id);

-- Datas importantes do cliente (aniversário da esposa, casamento...), recorrentes por ano.
create table special_dates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  title text not null,       -- "Aniversário da Ana"
  person_name text,
  month smallint not null check (month between 1 and 12),
  day smallint not null check (day between 1 and 31),
  remind_days_before smallint not null default 7,
  notes text,
  created_at timestamptz not null default now()
);
create index on special_dates (org_id, month, day);

-- ---------------------------------------------------------------------
-- Catálogo e estoque
-- ---------------------------------------------------------------------
create table supply_categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  unique (org_id, name)
);

-- Insumos: flores, folhagens, vasos, fitas, embalagens...
create table supplies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  category_id uuid references supply_categories(id) on delete set null,
  name text not null,
  unit text not null default 'un',      -- un, haste, maço, m
  quantity numeric(12,2) not null default 0,
  min_quantity numeric(12,2) not null default 0,
  cost numeric(10,2) not null default 0,
  shelf_life_days integer,              -- validade média (flores frescas)
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on supplies (org_id, name);

-- Lotes de entrada (para controlar validade de flores frescas)
create table supply_batches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  supply_id uuid not null references supplies(id) on delete cascade,
  quantity numeric(12,2) not null check (quantity > 0),
  remaining numeric(12,2) not null,
  unit_cost numeric(10,2) not null default 0,
  supplier text,
  received_at date not null default current_date,
  expires_at date,
  created_at timestamptz not null default now()
);
create index on supply_batches (org_id, expires_at);

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  supply_id uuid not null references supplies(id) on delete cascade,
  type stock_movement_type not null,
  quantity numeric(12,2) not null,      -- positivo entra, negativo sai
  order_id uuid,
  batch_id uuid references supply_batches(id) on delete set null,
  reason text,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index on stock_movements (org_id, created_at desc);
create index on stock_movements (supply_id);

-- Produtos vendidos (arranjos, buquês, cestas, vasos prontos)
create table products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  category text,
  price numeric(10,2) not null default 0,
  image_url text,
  sku text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on products (org_id, name);

-- Composição (ficha técnica): quanto de cada insumo vai em um produto
create table product_components (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  supply_id uuid not null references supplies(id) on delete restrict,
  quantity numeric(12,2) not null check (quantity > 0),
  unique (product_id, supply_id)
);

-- ---------------------------------------------------------------------
-- Entregadores, pedidos e entregas
-- ---------------------------------------------------------------------
create table drivers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  phone text,
  vehicle text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  number integer not null,
  customer_id uuid references customers(id) on delete set null,
  status order_status not null default 'novo',
  fulfillment fulfillment_type not null default 'entrega',
  channel text,                         -- balcão, whatsapp, instagram, telefone, site
  -- entrega
  delivery_date date,
  delivery_period delivery_period,
  delivery_time time,
  recipient_name text,
  recipient_phone text,
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_reference text,
  driver_id uuid references drivers(id) on delete set null,
  card_message text,
  card_signature text,
  anonymous boolean not null default false,
  internal_notes text,
  -- valores
  subtotal numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  total numeric(10,2) generated always as (subtotal + delivery_fee - discount) stored,
  payment_method text,
  payment_status payment_status not null default 'pendente',
  -- controle
  stock_consumed boolean not null default false,
  delivered_at timestamptz,
  delivery_proof text,                  -- quem recebeu / observação
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, number)
);
create index on orders (org_id, delivery_date);
create index on orders (org_id, status);
create index on orders (customer_id);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  description text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(10,2) not null default 0,
  notes text
);
create index on order_items (order_id);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  from_status order_status,
  to_status order_status not null,
  changed_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index on order_status_history (order_id);

-- ---------------------------------------------------------------------
-- Triggers de negócio
-- ---------------------------------------------------------------------

-- Número sequencial de pedido por floricultura
create or replace function set_order_number()
returns trigger language plpgsql as $$
begin
  if new.number is null then
    perform pg_advisory_xact_lock(hashtext(new.org_id::text));
    select coalesce(max(number), 0) + 1 into new.number from orders where org_id = new.org_id;
  end if;
  return new;
end $$;
create trigger trg_order_number before insert on orders
  for each row execute function set_order_number();

-- Saldo de estoque segue as movimentações
-- Saídas consomem os lotes: o lote indicado, ou FIFO pela validade mais próxima.
create or replace function apply_stock_movement()
returns trigger language plpgsql as $$
declare
  v_left numeric := -new.quantity;
  b record;
begin
  update supplies set quantity = quantity + new.quantity where id = new.supply_id;

  if new.quantity < 0 and new.type <> 'entrada' then
    if new.batch_id is not null then
      update supply_batches set remaining = greatest(remaining - v_left, 0) where id = new.batch_id;
    else
      for b in
        select id, remaining from supply_batches
        where supply_id = new.supply_id and remaining > 0
        order by expires_at nulls last, received_at, created_at
      loop
        exit when v_left <= 0;
        update supply_batches set remaining = remaining - least(b.remaining, v_left) where id = b.id;
        v_left := v_left - least(b.remaining, v_left);
      end loop;
    end if;
  elsif new.quantity > 0 and new.type <> 'entrada' then
    -- Estornos/ajustes positivos voltam para o lote mais recente
    update supply_batches set remaining = remaining + new.quantity
    where id = (select id from supply_batches where supply_id = new.supply_id
                order by received_at desc, created_at desc limit 1);
  end if;
  return new;
end $$;
create trigger trg_stock_movement after insert on stock_movements
  for each row execute function apply_stock_movement();

-- Recalcula subtotal do pedido quando itens mudam
create or replace function recalc_order_subtotal()
returns trigger language plpgsql as $$
declare v_order uuid := coalesce(new.order_id, old.order_id);
begin
  update orders set subtotal = coalesce(
    (select sum(quantity * unit_price) from order_items where order_id = v_order), 0)
  where id = v_order;
  return null;
end $$;
create trigger trg_order_items_subtotal after insert or update or delete on order_items
  for each row execute function recalc_order_subtotal();

-- Mudança de status: histórico + baixa/estorno automático de estoque
create or replace function on_order_status_change()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into order_status_history (org_id, order_id, from_status, to_status)
      values (new.org_id, new.id, old.status, new.status);

    -- Ao entrar em produção (ou além), consome os insumos da ficha técnica
    if new.status in ('em_producao', 'pronto', 'em_rota', 'entregue') and not old.stock_consumed then
      insert into stock_movements (org_id, supply_id, type, quantity, order_id, reason)
      select new.org_id, pc.supply_id, 'consumo_pedido',
             -sum(pc.quantity * oi.quantity), new.id, 'Pedido #' || new.number
      from order_items oi
      join product_components pc on pc.product_id = oi.product_id
      where oi.order_id = new.id
      group by pc.supply_id;
      new.stock_consumed := true;
    end if;

    -- Cancelado depois de consumir: devolve ao estoque
    if new.status = 'cancelado' and old.stock_consumed then
      insert into stock_movements (org_id, supply_id, type, quantity, order_id, reason)
      select new.org_id, supply_id, 'estorno_pedido', -sum(quantity), new.id,
             'Cancelamento do pedido #' || new.number
      from stock_movements
      where order_id = new.id and type = 'consumo_pedido'
      group by supply_id;
      new.stock_consumed := false;
    end if;

    if new.status = 'entregue' and new.delivered_at is null then
      new.delivered_at := now();
    end if;
  end if;
  return new;
end $$;
create trigger trg_order_status before update on orders
  for each row execute function on_order_status_change();

create or replace function on_order_created()
returns trigger language plpgsql as $$
begin
  insert into order_status_history (org_id, order_id, from_status, to_status)
    values (new.org_id, new.id, null, new.status);
  return null;
end $$;
create trigger trg_order_created after insert on orders
  for each row execute function on_order_created();

-- Perfil automático + aceitar convites pendentes ao se cadastrar
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, email)
    values (new.id, new.raw_user_meta_data->>'full_name', new.email)
    on conflict (id) do nothing;

  insert into memberships (org_id, user_id, role)
    select org_id, new.id, role from invitations where lower(email) = lower(new.email)
    on conflict do nothing;
  delete from invitations where lower(email) = lower(new.email);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------

-- Cria a floricultura e torna o usuário atual dono, com dados iniciais
create or replace function create_organization(p_name text, p_slug text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into organizations (name, slug) values (p_name, p_slug) returning id into v_org;
  insert into memberships (org_id, user_id, role) values (v_org, auth.uid(), 'owner');
  insert into supply_categories (org_id, name) values
    (v_org, 'Flores'), (v_org, 'Folhagens'), (v_org, 'Vasos e recipientes'),
    (v_org, 'Embalagens e fitas'), (v_org, 'Complementos');
  return v_org;
end $$;

-- Entrada de estoque com lote (validade)
create or replace function receive_supply(
  p_supply uuid, p_quantity numeric, p_unit_cost numeric default 0,
  p_supplier text default null, p_expires_at date default null
) returns void language plpgsql security invoker set search_path = public as $$
declare v_org uuid; v_shelf int;
begin
  select org_id, shelf_life_days into v_org, v_shelf from supplies where id = p_supply;
  if v_org is null or not is_member(v_org) then raise exception 'forbidden'; end if;
  insert into supply_batches (org_id, supply_id, quantity, remaining, unit_cost, supplier, expires_at)
    values (v_org, p_supply, p_quantity, p_quantity, p_unit_cost, p_supplier,
            coalesce(p_expires_at, case when v_shelf is not null then current_date + v_shelf end));
  insert into stock_movements (org_id, supply_id, type, quantity, reason)
    values (v_org, p_supply, 'entrada', p_quantity, coalesce('Fornecedor: ' || p_supplier, 'Entrada'));
  if p_unit_cost > 0 then
    update supplies set cost = p_unit_cost where id = p_supply;
  end if;
end $$;

-- Descarta o saldo de um lote (flores vencidas/danificadas) como perda
create or replace function discard_batch(p_batch uuid, p_reason text default 'Lote descartado')
returns void language plpgsql security invoker set search_path = public as $$
declare v record;
begin
  select * into v from supply_batches where id = p_batch;
  if v.id is null or not is_member(v.org_id) then raise exception 'forbidden'; end if;
  if v.remaining <= 0 then return; end if;
  insert into stock_movements (org_id, supply_id, type, quantity, batch_id, reason)
    values (v.org_id, v.supply_id, 'perda', -v.remaining, v.id, p_reason);
end $$;

-- Equipe: localizar usuário existente por e-mail e adicioná-lo (somente admins)
create or replace function find_user_by_email(p_org uuid, p_email text)
returns uuid language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin(p_org) then raise exception 'forbidden'; end if;
  return (select id from auth.users where lower(email) = lower(p_email) limit 1);
end $$;

create or replace function add_member(p_org uuid, p_user uuid, p_role member_role default 'staff')
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin(p_org) then raise exception 'forbidden'; end if;
  if p_role = 'owner' then raise exception 'invalid role'; end if;
  insert into memberships (org_id, user_id, role) values (p_org, p_user, p_role)
    on conflict (org_id, user_id) do nothing;
end $$;

-- Próximas datas comemorativas (considera virada de ano)
create or replace function upcoming_special_dates(p_org uuid, p_days int default 30)
returns table (
  id uuid, customer_id uuid, customer_name text, customer_phone text,
  title text, person_name text, next_date date, days_until int
) language sql stable security invoker set search_path = public as $$
  with d as (
    select sd.*, c.name as customer_name, c.phone as customer_phone,
      make_date(extract(year from current_date)::int, sd.month,
        least(sd.day, extract(day from (make_date(extract(year from current_date)::int, sd.month, 1)
          + interval '1 month - 1 day'))::int)) as this_year
    from special_dates sd join customers c on c.id = sd.customer_id
    where sd.org_id = p_org
  ), n as (
    select d.*, case when this_year < current_date
      then (this_year + interval '1 year')::date else this_year end as next_date
    from d
  )
  select id, customer_id, customer_name, customer_phone, title, person_name,
         next_date, (next_date - current_date)::int as days_until
  from n
  where next_date - current_date <= p_days
  order by next_date;
$$;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table organizations enable row level security;
alter table memberships enable row level security;
alter table profiles enable row level security;
alter table invitations enable row level security;

create policy org_select on organizations for select using (is_member(id));
create policy org_update on organizations for update using (is_admin(id));

create policy mem_select on memberships for select using (is_member(org_id));
create policy mem_admin_update on memberships for update using (is_admin(org_id) and role <> 'owner');
create policy mem_admin_delete on memberships for delete using (is_admin(org_id) and role <> 'owner');

create policy prof_select on profiles for select using (
  id = auth.uid() or exists (
    select 1 from memberships m1 join memberships m2 on m1.org_id = m2.org_id
    where m1.user_id = auth.uid() and m2.user_id = profiles.id)
);
create policy prof_update on profiles for update using (id = auth.uid());

create policy inv_select on invitations for select using (is_admin(org_id));
create policy inv_insert on invitations for insert with check (is_admin(org_id));
create policy inv_delete on invitations for delete using (is_admin(org_id));

-- Tabelas de negócio: qualquer membro da floricultura lê e escreve
do $$
declare t text;
begin
  foreach t in array array[
    'customers', 'customer_addresses', 'special_dates', 'supply_categories', 'supplies',
    'supply_batches', 'products', 'product_components', 'drivers', 'orders', 'order_items'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (is_member(org_id))', t || '_select', t);
    execute format('create policy %I on %I for insert with check (is_member(org_id))', t || '_insert', t);
    execute format('create policy %I on %I for update using (is_member(org_id)) with check (is_member(org_id))', t || '_update', t);
    execute format('create policy %I on %I for delete using (is_member(org_id))', t || '_delete', t);
  end loop;
end $$;

-- Histórico e movimentações: membros leem e inserem; ninguém edita/apaga (auditoria)
alter table stock_movements enable row level security;
create policy sm_select on stock_movements for select using (is_member(org_id));
create policy sm_insert on stock_movements for insert with check (is_member(org_id));

alter table order_status_history enable row level security;
create policy osh_select on order_status_history for select using (is_member(org_id));
create policy osh_insert on order_status_history for insert with check (is_member(org_id));
