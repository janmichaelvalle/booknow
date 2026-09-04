-- Supabase/Postgres migration: business_addons table
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.business_addons (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint business_addons_business_id_name_unique
    unique (business_id, name)
);

drop trigger if exists business_addons_set_updated_at on public.business_addons;
create trigger business_addons_set_updated_at
before update on public.business_addons
for each row
execute function public.set_updated_at();

create index if not exists business_addons_business_id_idx
  on public.business_addons (business_id);

insert into public.business_addons (
  business_id,
  name,
  description,
  price
)
select
  b.id,
  seed.name,
  seed.description,
  seed.price
from public.businesses b
cross join (
  values
    (
      'San Miguel Flavored Beer',
      'Lychee 330 mL Can, Case of 24',
      1629.00
    ),
    (
      'Jack Daniel''s Old No. 7',
      'Tennessee Whiskey 1L',
      1680.00
    )
) as seed(name, description, price)
where b.slug = 'tipsy-tap'
and not exists (
  select 1
  from public.business_addons ba
  where ba.business_id = b.id
    and ba.name = seed.name
);
