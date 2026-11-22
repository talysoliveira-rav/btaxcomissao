-- =====================================================================
-- Vitrine online: catálogo público por floricultura, com fotos.
-- O público (sem login) só lê pelas funções public_store / public_product,
-- que devolvem apenas o que a floricultura marcou para mostrar.
-- =====================================================================

create type price_mode as enum ('exato', 'a_partir_de', 'sob_consulta');

-- Dados da vitrine na floricultura
alter table organizations
  add column storefront_enabled boolean not null default false,
  add column tagline text,
  add column store_description text,
  add column whatsapp text,
  add column instagram text,
  add column opening_hours text,
  add column delivery_area text,
  add column logo_url text,
  add column cover_url text;

-- Produtos na vitrine
alter table products
  add column price_mode price_mode not null default 'exato',
  add column show_in_store boolean not null default true,
  add column featured boolean not null default false,
  add column sort_order integer not null default 0;

-- Fotos dos produtos (a de menor posição é a capa)
create table product_images (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  path text not null,          -- caminho no storage (imagem grande)
  thumb_path text,             -- miniatura para listas
  url text not null,           -- URL pública da imagem grande
  thumb_url text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index on product_images (product_id, position);

alter table product_images enable row level security;
create policy product_images_select on product_images for select using (is_member(org_id));
create policy product_images_insert on product_images for insert with check (is_member(org_id));
create policy product_images_update on product_images for update using (is_member(org_id)) with check (is_member(org_id));
create policy product_images_delete on product_images for delete using (is_member(org_id));

-- ---------------------------------------------------------------------
-- Storage: bucket público para leitura; escrita só por membros da loja,
-- dentro da pasta com o id da floricultura: <org_id>/...
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store', 'store', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "store: membros enviam" on storage.objects for insert to authenticated
  with check (bucket_id = 'store' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy "store: membros atualizam" on storage.objects for update to authenticated
  using (bucket_id = 'store' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy "store: membros apagam" on storage.objects for delete to authenticated
  using (bucket_id = 'store' and public.is_member(((storage.foldername(name))[1])::uuid));

-- ---------------------------------------------------------------------
-- Leitura pública da vitrine
-- ---------------------------------------------------------------------
create or replace function public_store(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'store', jsonb_build_object(
      'id', o.id, 'name', o.name, 'slug', o.slug, 'tagline', o.tagline,
      'description', o.store_description, 'whatsapp', coalesce(o.whatsapp, o.phone),
      'instagram', o.instagram, 'opening_hours', o.opening_hours, 'delivery_area', o.delivery_area,
      'address', o.address, 'logo_url', o.logo_url, 'cover_url', o.cover_url
    ),
    'products', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'name', p.name, 'description', p.description, 'category', p.category,
        'price', p.price, 'price_mode', p.price_mode, 'sku', p.sku, 'featured', p.featured,
        'images', coalesce((
          select jsonb_agg(jsonb_build_object('url', i.url, 'thumb_url', coalesce(i.thumb_url, i.url)) order by i.position, i.created_at)
          from product_images i where i.product_id = p.id
        ), '[]'::jsonb)
      ) order by p.featured desc, p.sort_order, p.name)
      from products p
      where p.org_id = o.id and p.active and p.show_in_store
    ), '[]'::jsonb)
  )
  from organizations o
  where o.slug = p_slug and o.storefront_enabled;
$$;

create or replace function public_product(p_slug text, p_product uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'store', jsonb_build_object(
      'name', o.name, 'slug', o.slug, 'whatsapp', coalesce(o.whatsapp, o.phone), 'logo_url', o.logo_url
    ),
    'product', jsonb_build_object(
      'id', p.id, 'name', p.name, 'description', p.description, 'category', p.category,
      'price', p.price, 'price_mode', p.price_mode, 'sku', p.sku,
      'images', coalesce((
        select jsonb_agg(jsonb_build_object('url', i.url, 'thumb_url', coalesce(i.thumb_url, i.url)) order by i.position, i.created_at)
        from product_images i where i.product_id = p.id
      ), '[]'::jsonb)
    )
  )
  from organizations o
  join products p on p.org_id = o.id
  where o.slug = p_slug and o.storefront_enabled and p.id = p_product and p.active and p.show_in_store;
$$;

grant execute on function public_store(text), public_product(text, uuid) to anon, authenticated;
