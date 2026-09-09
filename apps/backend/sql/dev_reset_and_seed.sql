-- Development-only database reset and seed script.
-- WARNING: This deletes all data in the application tables below.
-- Run the entire file once in the Supabase SQL Editor.

begin;

create extension if not exists pgcrypto;

-- Remove the storage policy first so this script can be rerun safely.
drop policy if exists "Anyone can upload payment proofs"
  on storage.objects;

-- Drop application tables in reverse dependency order.
drop table if exists public.reservation_addons;
drop table if exists public.reservations;
drop table if exists public.business_service_areas;
drop table if exists public.service_areas;
drop table if exists public.business_package_pricing;
drop table if exists public.business_addons;
drop table if exists public.payment_methods;
drop table if exists public.business_packages;
drop table if exists public.users;
drop table if exists public.businesses;

-- Shared updated_at trigger function.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Businesses.
create table public.businesses (
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

create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

create index businesses_slug_idx on public.businesses (slug);

insert into public.businesses (
  name, slug, description, phone, email,
  facebook_url, instagram_url, logo_url
)
values (
  'Tipsy Tap Mobile Bar',
  'tipsy-tap',
  'Mobile bar service for weddings, birthdays, and private events.',
  '09171234567',
  'hello@tipsytap.com',
  'https://facebook.com/tipsytap',
  'https://instagram.com/tipsytap',
  'https://api.dicebear.com/10.x/initials/svg?seed=Felix'
);

-- Business users.
create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique
    references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id),
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create index users_auth_user_id_idx on public.users (auth_user_id);
create index users_business_id_idx on public.users (business_id);
create index users_email_idx on public.users (email);

-- Payment methods.
create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id),
  category text not null check (
    category in ('bank_transfer', 'e_wallet', 'pay_on_event')
  ),
  provider_name text not null,
  account_name text not null,
  account_number text not null,
  instructions text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger payment_methods_set_updated_at
before update on public.payment_methods
for each row execute function public.set_updated_at();

create index payment_methods_business_id_idx
  on public.payment_methods (business_id);

insert into public.payment_methods (
  business_id, category, provider_name, account_name,
  account_number, instructions
)
select
  business.id,
  seed.category,
  seed.provider_name,
  seed.account_name,
  seed.account_number,
  seed.instructions
from public.businesses business
cross join (
  values
    ('bank_transfer', 'BDO', 'Tipsy Tap Mobile Bar', '1234-5678-9012',
      'Transfer to this BDO account and use your reservation reference as the transaction note.'),
    ('bank_transfer', 'BPI', 'Tipsy Tap Mobile Bar', '9876-5432-1098',
      'Transfer to this BPI account and use your reservation reference as the transaction note.'),
    ('e_wallet', 'GCash', 'Tipsy Tap Mobile Bar', '0917 123 4567',
      'Send the payment to this GCash number and use your reservation reference as the note.'),
    ('e_wallet', 'Maya', 'Tipsy Tap Mobile Bar', '0918 765 4321',
      'Send the payment to this Maya number and use your reservation reference as the note.'),
    ('pay_on_event', 'Pay on the Day', 'Tipsy Tap Mobile Bar', 'N/A',
      'You may pay on the event day.')
) as seed(category, provider_name, account_name, account_number, instructions)
where business.slug = 'tipsy-tap';

-- Packages.
create table public.business_packages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references public.businesses(id) on delete cascade,
  name text not null,
  badge_text text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_packages_business_id_name_unique
    unique (business_id, name)
);

create trigger business_packages_set_updated_at
before update on public.business_packages
for each row execute function public.set_updated_at();

create index business_packages_business_id_idx
  on public.business_packages (business_id);

insert into public.business_packages (
  business_id, name, badge_text, description
)
select business.id, seed.name, seed.badge_text, seed.description
from public.businesses business
cross join (
  values
    ('Cocktail Package', '2 cocktails per guest',
      'Perfect for wedding and corporate events.'),
    ('Shooter Package', '5 shooters per guest',
      'Best for debuts, birthdays, and college parties.')
) as seed(name, badge_text, description)
where business.slug = 'tipsy-tap';

-- Package pricing tiers.
create table public.business_package_pricing (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null
    references public.business_packages(id) on delete cascade,
  min_guests integer not null check (min_guests > 0),
  max_guests integer check (
    max_guests is null or max_guests >= min_guests
  ),
  price_per_guest numeric(10,2) not null check (price_per_guest >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_package_pricing_package_id_guest_range_unique
    unique (package_id, min_guests, max_guests)
);

create trigger business_package_pricing_set_updated_at
before update on public.business_package_pricing
for each row execute function public.set_updated_at();

create index business_package_pricing_package_id_idx
  on public.business_package_pricing (package_id);

insert into public.business_package_pricing (
  package_id, min_guests, max_guests, price_per_guest
)
select package.id, seed.min_guests, seed.max_guests, seed.price_per_guest
from public.business_packages package
join public.businesses business on business.id = package.business_id
join (
  values
    ('Cocktail Package', 30, 49, 130.00),
    ('Cocktail Package', 50, 79, 100.00),
    ('Cocktail Package', 80, 99, 80.00),
    ('Cocktail Package', 100, 199, 70.00),
    ('Cocktail Package', 200, null, 60.00),
    ('Shooter Package', 30, 49, 120.00),
    ('Shooter Package', 50, 79, 90.00),
    ('Shooter Package', 80, 99, 70.00),
    ('Shooter Package', 100, 199, 60.00),
    ('Shooter Package', 200, null, 50.00)
) as seed(package_name, min_guests, max_guests, price_per_guest)
  on seed.package_name = package.name
where business.slug = 'tipsy-tap';

-- Add-ons.
create table public.business_addons (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_addons_business_id_name_unique
    unique (business_id, name)
);

create trigger business_addons_set_updated_at
before update on public.business_addons
for each row execute function public.set_updated_at();

create index business_addons_business_id_idx
  on public.business_addons (business_id);

insert into public.business_addons (
  business_id, name, description, price
)
select business.id, seed.name, seed.description, seed.price
from public.businesses business
cross join (
  values
    ('San Miguel Flavored Beer', 'Lychee 330 mL Can, Case of 24', 1629.00),
    ('Jack Daniel''s Old No. 7', 'Tennessee Whiskey 1L', 1680.00)
) as seed(name, description, price)
where business.slug = 'tipsy-tap';

-- Reservations.
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references public.businesses(id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  event_date timestamptz not null,
  start_time text not null,
  end_time text not null,
  venue text not null,
  guest_count integer not null check (guest_count > 0),
  selected_package_id uuid not null references public.business_packages(id),
  package_total numeric(10,2) not null default 0 check (package_total >= 0),
  addons_total numeric(10,2) not null default 0 check (addons_total >= 0),
  transportation_fee numeric(10,2) not null default 0
    check (transportation_fee >= 0),
  grand_total numeric(10,2) not null default 0 check (grand_total >= 0),
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

create trigger reservations_set_updated_at
before update on public.reservations
for each row execute function public.set_updated_at();

create index reservations_event_date_idx
  on public.reservations (event_date);
create index reservations_business_id_idx
  on public.reservations (business_id);
create index reservations_selected_package_id_idx
  on public.reservations (selected_package_id);

-- Reservation add-on snapshots.
create table public.reservation_addons (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null
    references public.reservations(id) on delete cascade,
  addon_id uuid not null
    references public.business_addons(id) on delete cascade,
  addon_name text not null,
  addon_price numeric(10,2) not null check (addon_price >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  constraint reservation_addons_reservation_id_addon_id_unique
    unique (reservation_id, addon_id)
);

create index reservation_addons_reservation_id_idx
  on public.reservation_addons (reservation_id);
create index reservation_addons_addon_id_idx
  on public.reservation_addons (addon_id);

-- Shared service-area hierarchy.
create table public.service_areas (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.service_areas(id),
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

create unique index service_areas_unique_idx
  on public.service_areas (
    country_code,
    area_type,
    normalized_name,
    coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );
create index service_areas_parent_id_idx
  on public.service_areas (parent_id);
create index service_areas_lookup_idx
  on public.service_areas (country_code, area_type, normalized_name);

create trigger service_areas_set_updated_at
before update on public.service_areas
for each row execute function public.set_updated_at();

insert into public.service_areas (
  country_code, area_type, name, normalized_name, aliases
)
values (
  'PH',
  'region',
  'Metro Manila',
  'metro manila',
  array['national capital region', 'ncr']
);

insert into public.service_areas (
  parent_id, country_code, area_type, name, normalized_name, aliases
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
    ('Caloocan', 'caloocan', array['caloocan city', 'city of caloocan']::text[]),
    ('Las Piñas', 'las pinas', array['las pinas city', 'city of las pinas']::text[]),
    ('Makati', 'makati', array['makati city', 'city of makati']::text[]),
    ('Malabon', 'malabon', array['malabon city', 'city of malabon']::text[]),
    ('Mandaluyong', 'mandaluyong', array['mandaluyong city', 'city of mandaluyong']::text[]),
    ('Manila', 'manila', array['manila city', 'city of manila']::text[]),
    ('Marikina', 'marikina', array['marikina city', 'city of marikina']::text[]),
    ('Muntinlupa', 'muntinlupa', array['muntinlupa city', 'city of muntinlupa']::text[]),
    ('Navotas', 'navotas', array['navotas city', 'city of navotas']::text[]),
    ('Parañaque', 'paranaque', array['paranaque city', 'city of paranaque']::text[]),
    ('Pasay', 'pasay', array['pasay city', 'city of pasay']::text[]),
    ('Pasig', 'pasig', array['pasig city', 'city of pasig']::text[]),
    ('Quezon City', 'quezon city', array['city of quezon']::text[]),
    ('San Juan', 'san juan', array['san juan city', 'city of san juan']::text[]),
    ('Taguig', 'taguig', array['taguig city', 'city of taguig']::text[]),
    ('Valenzuela', 'valenzuela', array['valenzuela city', 'city of valenzuela']::text[]),
    ('Pateros', 'pateros', array['municipality of pateros']::text[])
) as seed(name, normalized_name, aliases)
where metro_manila.country_code = 'PH'
  and metro_manila.area_type = 'region'
  and metro_manila.normalized_name = 'metro manila';

-- Per-business coverage and transportation fees.
create table public.business_service_areas (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references public.businesses(id) on delete cascade,
  service_area_id uuid not null references public.service_areas(id),
  is_covered boolean not null default true,
  transportation_fee numeric(10,2) not null default 0
    check (transportation_fee >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_service_areas_unique
    unique (business_id, service_area_id)
);

create index business_service_areas_business_id_idx
  on public.business_service_areas (business_id);
create index business_service_areas_service_area_id_idx
  on public.business_service_areas (service_area_id);

create trigger business_service_areas_set_updated_at
before update on public.business_service_areas
for each row execute function public.set_updated_at();

with seed_rules (
  area_type, normalized_name, parent_normalized_name, transportation_fee
) as (
  values
    ('region', 'metro manila', null, 0.00::numeric),
    ('locality', 'pasay', 'metro manila', 500.00::numeric),
    ('locality', 'paranaque', 'metro manila', 500.00::numeric)
)
insert into public.business_service_areas (
  business_id, service_area_id, is_covered, transportation_fee, is_active
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
  );

-- Ensure the payment-proof bucket exists, then recreate its upload policy.
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

create policy "Anyone can upload payment proofs"
on storage.objects
for insert
to public
with check (bucket_id = 'payment-proofs');

commit;
