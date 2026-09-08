-- A business's selected coverage areas and transportation fees.

create extension if not exists pgcrypto;

create table if not exists public.business_service_areas (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  service_area_id uuid not null
    references public.service_areas(id),

  is_covered boolean not null default true,

  transportation_fee numeric(10,2)
    not null
    default 0
    check (transportation_fee >= 0),

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint business_service_areas_unique
    unique (business_id, service_area_id)
);


-- Indexes

create index if not exists business_service_areas_business_id_idx
  on public.business_service_areas (business_id);

create index if not exists business_service_areas_service_area_id_idx
  on public.business_service_areas (service_area_id);


-- Automatically update updated_at.

drop trigger if exists business_service_areas_set_updated_at
  on public.business_service_areas;

create trigger business_service_areas_set_updated_at
before update on public.business_service_areas
for each row
execute function public.set_updated_at();


-- Initial service-area configuration for Tipsy Tap.
--
-- Metro Manila: covered with no additional fee.
-- Pasay: covered with a ₱500 transportation fee.
-- Parañaque: covered with a ₱500 transportation fee.
--
-- The locality rules override the general Metro Manila rule.

with seed_rules (
  area_type,
  normalized_name,
  parent_normalized_name,
  transportation_fee
) as (
  values
    (
      'region',
      'metro manila',
      null,
      0.00::numeric
    ),
    (
      'locality',
      'pasay',
      'metro manila',
      500.00::numeric
    ),
    (
      'locality',
      'paranaque',
      'metro manila',
      500.00::numeric
    )
)
insert into public.business_service_areas (
  business_id,
  service_area_id,
  is_covered,
  transportation_fee,
  is_active
)
select
  business.id,
  service_area.id,
  true,
  seed_rules.transportation_fee,
  true
from public.businesses business
cross join seed_rules
join public.service_areas service_area
  on service_area.country_code = 'PH'
  and service_area.area_type = seed_rules.area_type
  and service_area.normalized_name = seed_rules.normalized_name
left join public.service_areas parent_area
  on parent_area.id = service_area.parent_id
where business.slug = 'tipsy-tap'
  and (
    seed_rules.parent_normalized_name is null
    or parent_area.normalized_name = seed_rules.parent_normalized_name
  )
on conflict (
  business_id,
  service_area_id
)
do nothing;