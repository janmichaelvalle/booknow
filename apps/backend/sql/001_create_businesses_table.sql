-- Supabase/Postgres migration: businesses table
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  phone text,
  email text,
  facebook_url text,
  instagram_url text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint businesses_slug_format_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists businesses_set_updated_at on public.businesses;
create trigger businesses_set_updated_at
before update on public.businesses
for each row
execute function public.set_updated_at();

create index if not exists businesses_slug_idx
  on public.businesses (slug);

insert into public.businesses (
  name,
  slug,
  description,
  phone,
  email,
  facebook_url,
  instagram_url,
  logo_url
)
values (
  'Tipsy Tap Mobile Bar',
  'tipsy-tap',
  'Mobile bar service for weddings, birthdays, and private events.',
  '09171234567',
  'hello@tipsytap.com',
  'https://facebook.com/tipsytap',
  'https://instagram.com/tipsytap',
  null
)
on conflict (slug) do nothing;