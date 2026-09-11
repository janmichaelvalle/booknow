-- Development-only database reset and seed script.
-- WARNING: This deletes all data in the application tables below.
-- Run the entire file once in the Supabase SQL Editor.

begin;

create extension if not exists pgcrypto;

-- Remove the storage policy first so this script can be rerun safely.
drop policy if exists "Anyone can upload payment proofs"
  on storage.objects;

-- Drop application tables in reverse dependency order.
drop table if exists public.quotation_inclusions;
drop table if exists public.quotation_addons;
drop table if exists public.reservation_addons;
drop table if exists public.quotations;
drop table if exists public.reservations;
drop table if exists public.business_package_tier_inclusions;
drop table if exists public.business_package_inclusions;
drop table if exists public.business_package_tiers;
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

-- Generates a random 6-character quotation reference.
-- The alphabet excludes O, 0, I, and 1 to avoid confusing references.
create or replace function public.generate_quotation_reference()
returns text
language plpgsql
volatile
as $$
declare
  allowed_characters constant text :=
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  generated_reference text := '';
  character_index integer;
begin
  for character_position in 1..6 loop
    character_index :=
      (get_byte(gen_random_bytes(1), 0) % length(allowed_characters)) + 1;

    generated_reference :=
      generated_reference ||
      substr(allowed_characters, character_index, 1);
  end loop;

  return generated_reference;
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

-- Inclusions shared by every tier of a package.
create table public.business_package_inclusions (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null
    references public.business_packages(id) on delete cascade,
  name text not null,
  quantity integer not null check (quantity > 0),
  unit text not null,
  description text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_package_inclusions_package_name_unique
    unique (package_id, name)
);

create trigger business_package_inclusions_set_updated_at
before update on public.business_package_inclusions
for each row execute function public.set_updated_at();

create index business_package_inclusions_package_id_idx
  on public.business_package_inclusions (package_id);

insert into public.business_package_inclusions (
  package_id, name, quantity, unit, description, sort_order
)
select
  package.id,
  seed.name,
  seed.quantity,
  seed.unit,
  seed.description,
  seed.sort_order
from public.business_packages package
join public.businesses business on business.id = package.business_id
join (
  values
    ('Cocktail Package', 'Bartenders', 2, 'people',
      'Professional bartenders for the event.', 1),
    ('Cocktail Package', 'Mobile bar counter', 1, 'setup',
      'Mobile counter setup for the event.', 2),
    ('Cocktail Package', 'Service duration', 4, 'hours',
      'Four hours of mobile bar service.', 3),
    ('Shooter Package', 'Bartenders', 2, 'people',
      'Professional bartenders for the event.', 1),
    ('Shooter Package', 'Mobile bar counter', 1, 'setup',
      'Mobile counter setup for the event.', 2),
    ('Shooter Package', 'Service duration', 4, 'hours',
      'Four hours of mobile bar service.', 3)
) as seed(package_name, name, quantity, unit, description, sort_order)
  on seed.package_name = package.name
where business.slug = 'tipsy-tap';

-- Fixed-price guest-capacity variations belonging to a package.
create table public.business_package_tiers (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null
    references public.business_packages(id) on delete cascade,
  guest_capacity integer not null check (guest_capacity > 0),
  fixed_price numeric(10,2) not null check (fixed_price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_package_tiers_package_capacity_unique
    unique (package_id, guest_capacity),
  constraint business_package_tiers_id_package_unique
    unique (id, package_id)
);

create trigger business_package_tiers_set_updated_at
before update on public.business_package_tiers
for each row execute function public.set_updated_at();

create index business_package_tiers_package_capacity_idx
  on public.business_package_tiers (package_id, guest_capacity);

insert into public.business_package_tiers (
  package_id, guest_capacity, fixed_price
)
select package.id, seed.guest_capacity, seed.fixed_price
from public.business_packages package
join public.businesses business on business.id = package.business_id
join (
  values
    ('Cocktail Package', 30, 3500.00),
    ('Cocktail Package', 50, 4500.00),
    ('Cocktail Package', 75, 6000.00),
    ('Cocktail Package', 100, 7500.00),
    ('Shooter Package', 30, 3500.00),
    ('Shooter Package', 50, 4500.00),
    ('Shooter Package', 75, 6000.00),
    ('Shooter Package', 100, 7500.00)
) as seed(package_name, guest_capacity, fixed_price)
  on seed.package_name = package.name
where business.slug = 'tipsy-tap';

-- Items and benefits that vary by package tier.
create table public.business_package_tier_inclusions (
  id uuid primary key default gen_random_uuid(),
  package_tier_id uuid not null
    references public.business_package_tiers(id) on delete cascade,
  name text not null,
  quantity integer not null check (quantity > 0),
  unit text not null,
  description text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_package_tier_inclusions_tier_name_unique
    unique (package_tier_id, name)
);

create trigger business_package_tier_inclusions_set_updated_at
before update on public.business_package_tier_inclusions
for each row execute function public.set_updated_at();

create index business_package_tier_inclusions_tier_id_idx
  on public.business_package_tier_inclusions (package_tier_id);

insert into public.business_package_tier_inclusions (
  package_tier_id, name, quantity, unit, description, sort_order
)
select
  tier.id,
  seed.name,
  seed.quantity,
  seed.unit,
  seed.description,
  seed.sort_order
from public.business_package_tiers tier
join public.business_packages package on package.id = tier.package_id
join public.businesses business on business.id = package.business_id
join (
  values
    ('Cocktail Package', 30, 'Cocktails', 60, 'servings',
      'Two cocktails per guest.', 1),
    ('Cocktail Package', 50, 'Cocktails', 100, 'servings',
      'Two cocktails per guest.', 1),
    ('Cocktail Package', 75, 'Cocktails', 150, 'servings',
      'Two cocktails per guest.', 1),
    ('Cocktail Package', 100, 'Cocktails', 200, 'servings',
      'Two cocktails per guest.', 1),
    ('Shooter Package', 30, 'Shooters', 150, 'servings',
      'Five shooters per guest.', 1),
    ('Shooter Package', 50, 'Shooters', 250, 'servings',
      'Five shooters per guest.', 1),
    ('Shooter Package', 75, 'Shooters', 375, 'servings',
      'Five shooters per guest.', 1),
    ('Shooter Package', 100, 'Shooters', 500, 'servings',
      'Five shooters per guest.', 1)
) as seed(
  package_name,
  guest_capacity,
  name,
  quantity,
  unit,
  description,
  sort_order
)
  on seed.package_name = package.name
  and seed.guest_capacity = tier.guest_capacity
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

-- Quotations.
create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  quotation_reference text not null
    default public.generate_quotation_reference(),
  business_id uuid not null
    references public.businesses(id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  event_date timestamptz not null,
  start_time text not null,
  end_time text not null,
  venue text not null,
  occasion text not null,
  guest_count integer not null check (guest_count > 0),
  selected_package_id uuid not null references public.business_packages(id),
  selected_package_tier_id uuid not null,
  package_name text not null,
  package_guest_capacity integer not null check (package_guest_capacity > 0),
  package_total numeric(10,2) not null default 0 check (package_total >= 0),
  addons_total numeric(10,2) not null default 0 check (addons_total >= 0),
  transportation_fee numeric(10,2) not null default 0
    check (transportation_fee >= 0),
  grand_total numeric(10,2) not null default 0 check (grand_total >= 0),
  quotation_status text not null default 'open' check (
    quotation_status in (
      'open',
      'accepted',
      'booked',
      'closed'
    )
  ),
  close_reason text check (
    close_reason is null
    or close_reason in (
      'customer_chose_another_supplier',
      'no_response',
      'event_cancelled',
      'unavailable_on_event_date',
      'event_date_passed',
      'other'
    )
  ),
  close_reason_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotations_quotation_reference_format_check
    check (quotation_reference ~ '^[A-HJ-NP-Z2-9]{6}$'),
  constraint quotations_quotation_reference_unique
    unique (quotation_reference),
  constraint quotations_selected_tier_matches_package_fk
    foreign key (selected_package_tier_id, selected_package_id)
    references public.business_package_tiers(id, package_id),
  constraint quotations_close_reason_matches_status_check
    check (
      (
        quotation_status = 'closed'
        and close_reason is not null
      )
      or (
        quotation_status <> 'closed'
        and close_reason is null
        and close_reason_notes is null
      )
    ),
  constraint quotations_other_close_reason_notes_check
    check (
      close_reason <> 'other'
      or nullif(btrim(close_reason_notes), '') is not null
    )
);

create trigger quotations_set_updated_at
before update on public.quotations
for each row execute function public.set_updated_at();

create index quotations_event_date_idx
  on public.quotations (event_date);
create index quotations_business_id_idx
  on public.quotations (business_id);
create index quotations_selected_package_id_idx
  on public.quotations (selected_package_id);
create index quotations_selected_package_tier_id_idx
  on public.quotations (selected_package_tier_id);

-- Package and tier inclusion snapshots captured when a quotation is created.
create table public.quotation_inclusions (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null
    references public.quotations(id) on delete cascade,
  name text not null,
  quantity integer not null check (quantity > 0),
  unit text not null,
  description text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create index quotation_inclusions_quotation_id_idx
  on public.quotation_inclusions (quotation_id);

-- Quotation add-on snapshots.
create table public.quotation_addons (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null
    references public.quotations(id) on delete cascade,
  addon_id uuid
    references public.business_addons(id) on delete set null,
  addon_name text not null,
  addon_price numeric(10,2) not null check (addon_price >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  constraint quotation_addons_quotation_id_addon_id_unique
    unique (quotation_id, addon_id)
);

create index quotation_addons_quotation_id_idx
  on public.quotation_addons (quotation_id);
create index quotation_addons_addon_id_idx
  on public.quotation_addons (addon_id);

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

commit;
