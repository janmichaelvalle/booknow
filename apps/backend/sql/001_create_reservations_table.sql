-- Supabase/Postgres migration: reservations table
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  event_date timestamptz not null,
  guest_count integer not null check (guest_count > 0),
  selected_package text not null check (selected_package in ('classic', 'vintage')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

drop trigger if exists reservations_set_updated_at on public.reservations;
create trigger reservations_set_updated_at
before update on public.reservations
for each row
execute function public.set_updated_at();

create index if not exists reservations_event_date_idx
  on public.reservations (event_date);
