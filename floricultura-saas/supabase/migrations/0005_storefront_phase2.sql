-- =====================================================================
-- Vitrine — Fase 2: seleções personalizadas, ofertas do dia e métricas.
-- =====================================================================

create or replace function sp_today() returns date
language sql stable set search_path = public as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;

-- ---------------------------------------------------------------------
-- Ofertas do dia (preço promocional com validade)
-- ---------------------------------------------------------------------
alter table products
  add column offer_price numeric(10,2) check (offer_price is null or offer_price >= 0),
  add column offer_until date;

-- ---------------------------------------------------------------------
-- Seleções personalizadas: link curto com algumas opções para um cliente
-- ---------------------------------------------------------------------
create table selections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  code text not null unique check (code ~ '^[a-z0-9]{6,12}$'),
  title text not null,
  customer_id uuid references customers(id) on delete set null,
  customer_name text,
  note text,
  expires_at date not null default (sp_today() + 14),
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index on selections (org_id, created_at desc);

create table selection_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  selection_id uuid not null references selections(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  position integer not null default 0,
  custom_price numeric(10,2) check (custom_price is null or custom_price >= 0),
  note text,
  unique (selection_id, product_id)
);
create index on selection_items (selection_id, position);

alter table selections enable row level security;
alter table selection_items enable row level security;
do $$
declare t text;
begin
  foreach t in array array['selections', 'selection_items'] loop
    execute format('create policy %I on %I for select using (is_member(org_id))', t || '_select', t);
    execute format('create policy %I on %I for insert with check (is_member(org_id))', t || '_insert', t);
    execute format('create policy %I on %I for update using (is_member(org_id)) with check (is_member(org_id))', t || '_update', t);
    execute format('create policy %I on %I for delete using (is_member(org_id))', t || '_delete', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Métricas da vitrine (visitas, produtos vistos, cliques no WhatsApp)
-- ---------------------------------------------------------------------
create table storefront_events (
  id bigint generated always as identity primary key,
  org_id uuid not null references organizations(id) on delete cascade,
  kind text not null check (kind in ('view_store', 'view_product', 'view_selection', 'click_whatsapp')),
  product_id uuid references products(id) on delete set null,
  selection_id uuid references selections(id) on delete set null,
  day date not null default sp_today(),
  created_at timestamptz not null default now()
);
create index on storefront_events (org_id, day);
create index on storefront_events (selection_id) where selection_id is not null;

alter table storefront_events enable row level security;
create policy storefront_events_select on storefront_events for select using (is_member(org_id));
-- inserção só pela função track_event (abaixo)

-- Registro público de evento: valida a loja, o produto e a seleção antes de gravar.
create or replace function track_event(p_slug text, p_kind text, p_product uuid default null, p_selection text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_sel uuid; v_prod uuid;
begin
  if p_kind not in ('view_store', 'view_product', 'view_selection', 'click_whatsapp') then return; end if;
  select id into v_org from organizations where slug = p_slug and storefront_enabled;
  if v_org is null then return; end if;
  if p_product is not null then
    select id into v_prod from products where id = p_product and org_id = v_org;
  end if;
  if p_selection is not null then
    select id into v_sel from selections where code = p_selection and org_id = v_org;
  end if;
  insert into storefront_events (org_id, kind, product_id, selection_id) values (v_org, p_kind, v_prod, v_sel);
end $$;

-- ---------------------------------------------------------------------
-- Leitura pública
-- ---------------------------------------------------------------------
create or replace function product_public_json(p products)
returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object(
    'id', p.id, 'name', p.name, 'description', p.description, 'category', p.category,
    'price', p.price, 'price_mode', p.price_mode, 'sku', p.sku, 'featured', p.featured,
    'offer_price', case when p.offer_until >= sp_today() then p.offer_price end,
    'offer_until', case when p.offer_until >= sp_today() then p.offer_until end,
    'images', coalesce((
      select jsonb_agg(jsonb_build_object('url', i.url, 'thumb_url', coalesce(i.thumb_url, i.url)) order by i.position, i.created_at)
      from product_images i where i.product_id = p.id
    ), '[]'::jsonb)
  );
$$;

create or replace function public_store(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'store', jsonb_build_object(
      'id', o.id, 'name', o.name, 'slug', o.slug, 'tagline', o.tagline,
      'description', o.store_description, 'whatsapp', coalesce(o.whatsapp, o.phone),
      'instagram', o.instagram, 'opening_hours', o.opening_hours, 'delivery_area', o.delivery_area,
      'business_hours', o.business_hours, 'delivery_regions', o.delivery_regions,
      'address', o.address, 'logo_url', o.logo_url, 'cover_url', o.cover_url
    ),
    'products', coalesce((
      select jsonb_agg(product_public_json(p) order by p.featured desc, p.sort_order, p.name)
      from products p
      where p.org_id = o.id and p.active and p.show_in_store
    ), '[]'::jsonb)
  )
  from organizations o
  where o.slug = p_slug and o.storefront_enabled;
$$;

create or replace function public_selection(p_code text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'store', jsonb_build_object(
      'id', o.id, 'name', o.name, 'slug', o.slug, 'tagline', o.tagline,
      'whatsapp', coalesce(o.whatsapp, o.phone), 'logo_url', o.logo_url, 'cover_url', o.cover_url,
      'business_hours', o.business_hours, 'delivery_area', o.delivery_area
    ),
    'selection', jsonb_build_object(
      'code', s.code, 'title', s.title, 'customer_name', s.customer_name, 'note', s.note,
      'expires_at', s.expires_at, 'expired', s.expires_at < sp_today()
    ),
    'items', case when s.expires_at < sp_today() then '[]'::jsonb else coalesce((
      select jsonb_agg(product_public_json(p) || jsonb_build_object('custom_price', si.custom_price, 'item_note', si.note) order by si.position)
      from selection_items si join products p on p.id = si.product_id
      where si.selection_id = s.id and p.active
    ), '[]'::jsonb) end
  )
  from selections s join organizations o on o.id = s.org_id
  where s.code = p_code and o.storefront_enabled;
$$;

revoke execute on function product_public_json(products) from public, anon, authenticated;
grant execute on function sp_today() to anon, authenticated;
grant execute on function public_store(text), public_selection(text), track_event(text, text, uuid, text) to anon, authenticated;
