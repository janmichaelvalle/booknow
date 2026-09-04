-- Supabase/Postgres migration: reservations table
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  event_date timestamptz not null,
  start_time text not null,
  end_time text not null,
  venue text not null,
  guest_count integer not null check (guest_count > 0),
  selected_package_id uuid not null references public.business_packages(id),
  package_total numeric(10,2) not null default 0,
  addons_total numeric(10,2) not null default 0,
  grand_total numeric(10,2) not null default 0,
  status text not null default 'pending_acceptance' check (
    status in (
      'pending_acceptance',
      'booking_rejected',
      'pending_payment',
      'pending_verification',
      'payment_rejected',
      'confirmed'
    )
  ),
  rejection_reason text,
  payment_method_id uuid references public.payment_methods(id),
  payment_proof_path text,
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

create index if not exists reservations_business_id_idx
  on public.reservations (business_id);

create index if not exists reservations_selected_package_id_idx
  on public.reservations (selected_package_id);
