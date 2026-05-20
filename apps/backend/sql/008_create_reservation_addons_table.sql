-- Supabase/Postgres migration: reservation_addons table
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.reservation_addons (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  addon_id uuid not null references public.business_addons(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),

  constraint reservation_addons_reservation_id_addon_id_unique
    unique (reservation_id, addon_id)
);

create index if not exists reservation_addons_reservation_id_idx
  on public.reservation_addons (reservation_id);

create index if not exists reservation_addons_addon_id_idx
  on public.reservation_addons (addon_id);