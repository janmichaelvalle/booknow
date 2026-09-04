-- Supabase/Postgres migration: business_packages table
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.business_packages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  badge_text text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint business_packages_business_id_name_unique
    unique (business_id, name)
);

drop trigger if exists business_packages_set_updated_at on public.business_packages;
create trigger business_packages_set_updated_at
before update on public.business_packages
for each row
execute function public.set_updated_at();

create index if not exists business_packages_business_id_idx
  on public.business_packages (business_id);

insert into public.business_packages (
  business_id,
  name,
  badge_text,
  description
)
select
  b.id,
  seed.name,
  seed.badge_text,
  seed.description
from public.businesses b
cross join (
  values
    (
      'Cocktail Package',
      '2 cocktails per guest',
      'Perfect for wedding and corporate events.'
    ),
    (
      'Shooter Package',
      '5 shooters per guest',
      'Best for debuts, birthdays, and college parties.'
    )
) as seed(name, badge_text, description)
where b.slug = 'tipsy-tap'
and not exists (
  select 1
  from public.business_packages bp
  where bp.business_id = b.id
    and bp.name = seed.name
);
