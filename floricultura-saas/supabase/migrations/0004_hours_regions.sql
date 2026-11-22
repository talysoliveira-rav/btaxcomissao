-- Horário de funcionamento por dia e área de entrega estruturada (estado/cidades/regiões/bairros).
-- opening_hours e delivery_area continuam como texto-resumo (gerado pelo app ao salvar).
alter table organizations
  add column business_hours jsonb,
  add column delivery_regions jsonb not null default '[]'::jsonb;

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
