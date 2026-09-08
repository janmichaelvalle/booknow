-- Shared geographic areas available to every business.

create extension if not exists pgcrypto;

create table if not exists public.service_areas (
  id uuid primary key default gen_random_uuid(),

  parent_id uuid
    references public.service_areas(id),

  country_code text not null default 'PH',

  area_type text not null check (
    area_type in ('region', 'province', 'locality')
  ),

  name text not null,
  normalized_name text not null,
  aliases text[] not null default '{}',

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint service_areas_parent_not_self_check
    check (parent_id is null or parent_id <> id)
);

create unique index if not exists service_areas_unique_idx
  on public.service_areas (
    country_code,
    area_type,
    normalized_name,
    coalesce(
      parent_id,
      '00000000-0000-0000-0000-000000000000'::uuid
    )
  );

create index if not exists service_areas_parent_id_idx
  on public.service_areas (parent_id);

create index if not exists service_areas_lookup_idx
  on public.service_areas (
    country_code,
    area_type,
    normalized_name
  );

drop trigger if exists service_areas_set_updated_at
  on public.service_areas;

create trigger service_areas_set_updated_at
before update on public.service_areas
for each row
execute function public.set_updated_at();


-- Shared Metro Manila region.

insert into public.service_areas (
  country_code,
  area_type,
  name,
  normalized_name,
  aliases
)
select
  'PH',
  'region',
  'Metro Manila',
  'metro manila',
  array['national capital region', 'ncr']
where not exists (
  select 1
  from public.service_areas
  where country_code = 'PH'
    and area_type = 'region'
    and normalized_name = 'metro manila'
);


-- Shared Metro Manila localities.
-- Pateros is also a locality even though it is officially a municipality.

insert into public.service_areas (
  parent_id,
  country_code,
  area_type,
  name,
  normalized_name,
  aliases
)
select
  metro_manila.id,
  'PH',
  'locality',
  seed.name,
  seed.normalized_name,
  seed.aliases
from public.service_areas metro_manila
cross join (
  values
    (
      'Caloocan',
      'caloocan',
      array['caloocan city', 'city of caloocan']::text[]
    ),
    (
      'Las Piñas',
      'las pinas',
      array['las pinas city', 'city of las pinas']::text[]
    ),
    (
      'Makati',
      'makati',
      array['makati city', 'city of makati']::text[]
    ),
    (
      'Malabon',
      'malabon',
      array['malabon city', 'city of malabon']::text[]
    ),
    (
      'Mandaluyong',
      'mandaluyong',
      array['mandaluyong city', 'city of mandaluyong']::text[]
    ),
    (
      'Manila',
      'manila',
      array['manila city', 'city of manila']::text[]
    ),
    (
      'Marikina',
      'marikina',
      array['marikina city', 'city of marikina']::text[]
    ),
    (
      'Muntinlupa',
      'muntinlupa',
      array['muntinlupa city', 'city of muntinlupa']::text[]
    ),
    (
      'Navotas',
      'navotas',
      array['navotas city', 'city of navotas']::text[]
    ),
    (
      'Parañaque',
      'paranaque',
      array['paranaque city', 'city of paranaque']::text[]
    ),
    (
      'Pasay',
      'pasay',
      array['pasay city', 'city of pasay']::text[]
    ),
    (
      'Pasig',
      'pasig',
      array['pasig city', 'city of pasig']::text[]
    ),
    (
      'Quezon City',
      'quezon city',
      array['city of quezon']::text[]
    ),
    (
      'San Juan',
      'san juan',
      array['san juan city', 'city of san juan']::text[]
    ),
    (
      'Taguig',
      'taguig',
      array['taguig city', 'city of taguig']::text[]
    ),
    (
      'Valenzuela',
      'valenzuela',
      array['valenzuela city', 'city of valenzuela']::text[]
    ),
    (
      'Pateros',
      'pateros',
      array['municipality of pateros']::text[]
    )
) as seed(name, normalized_name, aliases)
where metro_manila.country_code = 'PH'
  and metro_manila.area_type = 'region'
  and metro_manila.normalized_name = 'metro manila'
  and not exists (
    select 1
    from public.service_areas existing
    where existing.parent_id = metro_manila.id
      and existing.area_type = 'locality'
      and existing.normalized_name = seed.normalized_name
  );