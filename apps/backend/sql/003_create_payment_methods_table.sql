-- Supabase/Postgres migration: payment_methods table
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  category text not null check (category in ('bank_transfer', 'e_wallet', 'pay_on_event')),
  provider_name text not null,
  account_name text not null,
  account_number text not null,
  instructions text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists payment_methods_set_updated_at on public.payment_methods;
create trigger payment_methods_set_updated_at
before update on public.payment_methods
for each row
execute function public.set_updated_at();

create index if not exists payment_methods_business_id_idx
  on public.payment_methods (business_id);

insert into public.payment_methods (
  business_id,
  category,
  provider_name,
  account_name,
  account_number,
  instructions
)
select
  b.id,
  seed.category,
  seed.provider_name,
  seed.account_name,
  seed.account_number,
  seed.instructions
from public.businesses b
cross join (
  values
    (
      'bank_transfer',
      'BDO',
      'Tipsy Tap Mobile Bar',
      '1234-5678-9012',
      'Transfer to this BDO account and use your reservation reference as the transaction note.'
    ),
    (
      'bank_transfer',
      'BPI',
      'Tipsy Tap Mobile Bar',
      '9876-5432-1098',
      'Transfer to this BPI account and use your reservation reference as the transaction note.'
    ),
    (
      'e_wallet',
      'GCash',
      'Tipsy Tap Mobile Bar',
      '0917 123 4567',
      'Send the payment to this GCash number and use your reservation reference as the note.'
    ),
    (
      'e_wallet',
      'Maya',
      'Tipsy Tap Mobile Bar',
      '0918 765 4321',
      'Send the payment to this Maya number and use your reservation reference as the note.'
    ),
    (
      'pay_on_event',
      'Pay on the Day',
      'Tipsy Tap Mobile Bar',
      'N/A',
      'You may pay on the event day.'
    )
) as seed(category, provider_name, account_name, account_number, instructions)
where b.slug = 'tipsy-tap'
and not exists (
  select 1
  from public.payment_methods pm
  where pm.business_id = b.id
    and pm.category = seed.category
    and pm.account_number = seed.account_number
);
