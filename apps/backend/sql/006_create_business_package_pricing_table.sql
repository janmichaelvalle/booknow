-- Supabase/Postgres migration: business_package_pricing table
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.business_package_pricing (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.business_packages(id) on delete cascade,
  min_guests integer not null check (min_guests > 0),
  max_guests integer check (max_guests is null or max_guests >= min_guests),
  price_per_guest numeric(10,2) not null check (price_per_guest >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint business_package_pricing_package_id_guest_range_unique
    unique (package_id, min_guests, max_guests)
);

drop trigger if exists business_package_pricing_set_updated_at on public.business_package_pricing;
create trigger business_package_pricing_set_updated_at
before update on public.business_package_pricing
for each row
execute function public.set_updated_at();

create index if not exists business_package_pricing_package_id_idx
  on public.business_package_pricing (package_id);

insert into public.business_package_pricing (
  package_id,
  min_guests,
  max_guests,
  price_per_guest
)
select
  bp.id,
  seed.min_guests,
  seed.max_guests,
  seed.price_per_guest
from public.business_packages bp
join public.businesses b
  on b.id = bp.business_id
join (
  values
    ('Cocktail Package', 30, 49, 120.00),
    ('Cocktail Package', 50, 79, 90.00),
    ('Cocktail Package', 80, 99, 70.00),
    ('Cocktail Package', 100, 199, 60.00),
    ('Cocktail Package', 200, null, 50.00),

    ('Shooter Package', 30, 49, 120.00),
    ('Shooter Package', 50, 79, 90.00),
    ('Shooter Package', 80, 99, 70.00),
    ('Shooter Package', 100, 199, 60.00),
    ('Shooter Package', 200, null, 50.00)
) as seed(package_name, min_guests, max_guests, price_per_guest)
  on seed.package_name = bp.name
where b.slug = 'tipsy-tap'
and not exists (
  select 1
  from public.business_package_pricing bpp
  where bpp.package_id = bp.id
    and bpp.min_guests = seed.min_guests
    and (
      bpp.max_guests = seed.max_guests
      or (bpp.max_guests is null and seed.max_guests is null)
    )
);
