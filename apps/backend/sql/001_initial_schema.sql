-- Development-only database reset and seed script.
-- WARNING: This deletes all data in the application tables below.
-- Run the entire file once in the Supabase SQL Editor.

begin;

create extension if not exists pgcrypto;

-- Remove the storage policy first so this script can be rerun safely.
drop policy if exists "Anyone can upload payment proofs"
  on storage.objects;

-- Drop application tables in reverse dependency order.
drop table if exists public.quotation_items;
drop table if exists public.quotation_inclusions;
drop table if exists public.quotation_packages;
drop table if exists public.quotation_addons;
drop table if exists public.reservation_addons;
drop table if exists public.quotations;
drop table if exists public.reservations;
drop table if exists public.business_package_tier_items;
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

create or replace function public.normalize_area_name(value text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    translate(lower(trim(coalesce(value, ''))), 'ñáéíóúü', 'naeiouu'),
    '\\s+',
    ' ',
    'g'
  );
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
    unique (business_id, name),
  constraint business_packages_id_business_unique
    unique (id, business_id)
);

create trigger business_packages_set_updated_at
before update on public.business_packages
for each row execute function public.set_updated_at();

create index business_packages_business_id_idx
  on public.business_packages (business_id);

insert into public.business_packages (
  business_id, name, badge_text, description
)
select
  business.id,
  seed.name,
  seed.badge_text,
  seed.description
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

-- Merchant-named, fixed-price variations belonging to a package.
create table public.business_package_tiers (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null
    references public.business_packages(id) on delete cascade,
  name text not null check (nullif(btrim(name), '') is not null),
  price numeric(10,2) not null check (price >= 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_package_tiers_package_name_unique
    unique (package_id, name),
  constraint business_package_tiers_id_package_unique
    unique (id, package_id)
);

create trigger business_package_tiers_set_updated_at
before update on public.business_package_tiers
for each row execute function public.set_updated_at();

create index business_package_tiers_package_sort_idx
  on public.business_package_tiers (package_id, sort_order);

insert into public.business_package_tiers (
  package_id, name, price, sort_order
)
select
  package.id,
  seed.name,
  seed.price,
  seed.sort_order
from public.business_packages package
join public.businesses business on business.id = package.business_id
join (
  values
    ('Cocktail Package', '30 Guests', 3500.00, 1),
    ('Cocktail Package', '50 Guests', 4500.00, 2),
    ('Cocktail Package', '75 Guests', 6000.00, 3),
    ('Cocktail Package', '100 Guests', 7500.00, 4),
    ('Shooter Package', '30 Guests', 3500.00, 1),
    ('Shooter Package', '50 Guests', 4500.00, 2),
    ('Shooter Package', '75 Guests', 6000.00, 3),
    ('Shooter Package', '100 Guests', 7500.00, 4)
) as seed(package_name, name, price, sort_order)
  on seed.package_name = package.name
where business.slug = 'tipsy-tap';

-- Included benefits and optional paid choices that vary by package tier.
create table public.business_package_tier_items (
  id uuid primary key default gen_random_uuid(),
  package_tier_id uuid not null
    references public.business_package_tiers(id) on delete cascade,
  item_type text not null check (
    item_type in ('inclusion', 'extra', 'upgrade', 'freebie')
  ),
  name text not null,
  quantity integer not null check (quantity > 0),
  unit text not null,
  description text,
  price numeric(10,2) not null default 0 check (price >= 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_package_tier_items_item_type_name_unique
    unique (package_tier_id, item_type, name),
  constraint business_package_tier_items_price_matches_type_check
    check (
      (item_type in ('inclusion', 'freebie') and price = 0)
      or item_type in ('extra', 'upgrade')
    )
);

create trigger business_package_tier_items_set_updated_at
before update on public.business_package_tier_items
for each row execute function public.set_updated_at();

create index business_package_tier_items_tier_id_idx
  on public.business_package_tier_items (package_tier_id);

insert into public.business_package_tier_items (
  package_tier_id,
  item_type,
  name,
  quantity,
  unit,
  description,
  price,
  sort_order
)
select
  tier.id,
  seed.item_type,
  seed.name,
  seed.quantity,
  seed.unit,
  seed.description,
  seed.price,
  seed.sort_order
from public.business_package_tiers tier
join public.business_packages package on package.id = tier.package_id
join public.businesses business on business.id = package.business_id
join (
  values
    ('Cocktail Package', '30 Guests', 'inclusion', 'Cocktails', 60, 'servings',
      'Two cocktails per guest.', 0.00, 1),
    ('Cocktail Package', '50 Guests', 'inclusion', 'Cocktails', 100, 'servings',
      'Two cocktails per guest.', 0.00, 1),
    ('Cocktail Package', '75 Guests', 'inclusion', 'Cocktails', 150, 'servings',
      'Two cocktails per guest.', 0.00, 1),
    ('Cocktail Package', '100 Guests', 'inclusion', 'Cocktails', 200, 'servings',
      'Two cocktails per guest.', 0.00, 1),
    ('Shooter Package', '30 Guests', 'inclusion', 'Shooters', 150, 'servings',
      'Five shooters per guest.', 0.00, 1),
    ('Shooter Package', '50 Guests', 'inclusion', 'Shooters', 250, 'servings',
      'Five shooters per guest.', 0.00, 1),
    ('Shooter Package', '75 Guests', 'inclusion', 'Shooters', 375, 'servings',
      'Five shooters per guest.', 0.00, 1),
    ('Shooter Package', '100 Guests', 'inclusion', 'Shooters', 500, 'servings',
      'Five shooters per guest.', 0.00, 1),
    ('Cocktail Package', '30 Guests', 'extra', 'San Miguel Flavored Beer', 1, 'case',
      'Lychee 330 mL Can, case of 24.', 1629.00, 10),
    ('Cocktail Package', '50 Guests', 'extra', 'San Miguel Flavored Beer', 1, 'case',
      'Lychee 330 mL Can, case of 24.', 1629.00, 10),
    ('Cocktail Package', '75 Guests', 'extra', 'San Miguel Flavored Beer', 1, 'case',
      'Lychee 330 mL Can, case of 24.', 1629.00, 10),
    ('Cocktail Package', '100 Guests', 'extra', 'San Miguel Flavored Beer', 1, 'case',
      'Lychee 330 mL Can, case of 24.', 1629.00, 10),
    ('Cocktail Package', '30 Guests', 'extra', 'Jack Daniel''s Old No. 7', 1, 'bottle',
      'Tennessee Whiskey 1L.', 1680.00, 11),
    ('Cocktail Package', '50 Guests', 'extra', 'Jack Daniel''s Old No. 7', 1, 'bottle',
      'Tennessee Whiskey 1L.', 1680.00, 11),
    ('Cocktail Package', '75 Guests', 'extra', 'Jack Daniel''s Old No. 7', 1, 'bottle',
      'Tennessee Whiskey 1L.', 1680.00, 11),
    ('Cocktail Package', '100 Guests', 'extra', 'Jack Daniel''s Old No. 7', 1, 'bottle',
      'Tennessee Whiskey 1L.', 1680.00, 11),
    ('Shooter Package', '30 Guests', 'extra', 'San Miguel Flavored Beer', 1, 'case',
      'Lychee 330 mL Can, case of 24.', 1629.00, 10),
    ('Shooter Package', '50 Guests', 'extra', 'San Miguel Flavored Beer', 1, 'case',
      'Lychee 330 mL Can, case of 24.', 1629.00, 10),
    ('Shooter Package', '75 Guests', 'extra', 'San Miguel Flavored Beer', 1, 'case',
      'Lychee 330 mL Can, case of 24.', 1629.00, 10),
    ('Shooter Package', '100 Guests', 'extra', 'San Miguel Flavored Beer', 1, 'case',
      'Lychee 330 mL Can, case of 24.', 1629.00, 10),
    ('Shooter Package', '30 Guests', 'extra', 'Jack Daniel''s Old No. 7', 1, 'bottle',
      'Tennessee Whiskey 1L.', 1680.00, 11),
    ('Shooter Package', '50 Guests', 'extra', 'Jack Daniel''s Old No. 7', 1, 'bottle',
      'Tennessee Whiskey 1L.', 1680.00, 11),
    ('Shooter Package', '75 Guests', 'extra', 'Jack Daniel''s Old No. 7', 1, 'bottle',
      'Tennessee Whiskey 1L.', 1680.00, 11),
    ('Shooter Package', '100 Guests', 'extra', 'Jack Daniel''s Old No. 7', 1, 'bottle',
      'Tennessee Whiskey 1L.', 1680.00, 11)
) as seed(
  package_name,
  tier_name,
  item_type,
  name,
  quantity,
  unit,
  description,
  price,
  sort_order
)
  on seed.package_name = package.name
  and seed.tier_name = tier.name
where business.slug = 'tipsy-tap';

-- Quotations.
create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  quotation_reference text not null
    default public.generate_quotation_reference(),
  business_id uuid not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  event_date timestamptz not null,
  start_time text not null,
  end_time text not null,
  venue text not null,
  venue_place_id text,
  venue_locality text not null,
  venue_region text not null,
  occasion text not null,
  guest_count integer not null check (guest_count > 0),
  packages_total numeric(10,2) not null default 0 check (packages_total >= 0),
  selected_items_total numeric(10,2) not null default 0
    check (selected_items_total >= 0),
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
  constraint quotations_business_fk
    foreign key (business_id)
    references public.businesses(id)
    on delete cascade,
  constraint quotations_grand_total_matches_breakdown_check
    check (
      grand_total = packages_total + selected_items_total + transportation_fee
    ),
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

-- Selected package/tier snapshots. A catalog package can appear only once in a quotation.
create table public.quotation_packages (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null
    references public.quotations(id) on delete cascade,
  package_id uuid,
  package_tier_id uuid,
  package_name text not null,
  tier_name text not null check (nullif(btrim(tier_name), '') is not null),
  price numeric(10,2) not null check (price >= 0),
  package_total numeric(10,2) not null check (package_total >= 0),
  selected_items_total numeric(10,2) not null default 0
    check (selected_items_total >= 0),
  total numeric(10,2) not null check (total >= 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  constraint quotation_packages_package_fk
    foreign key (package_id)
    references public.business_packages(id)
    on delete set null,
  constraint quotation_packages_tier_package_fk
    foreign key (package_tier_id, package_id)
    references public.business_package_tiers(id, package_id)
    on delete set null,
  constraint quotation_packages_total_matches_breakdown_check
    check (total = package_total + selected_items_total)
);

create unique index quotation_packages_quotation_package_unique_idx
  on public.quotation_packages (quotation_id, package_id)
  where package_id is not null;
create index quotation_packages_quotation_id_idx
  on public.quotation_packages (quotation_id);
create index quotation_packages_package_id_idx
  on public.quotation_packages (package_id);
create index quotation_packages_package_tier_id_idx
  on public.quotation_packages (package_tier_id);

-- Package and tier inclusion snapshots captured when a quotation is created.
create table public.quotation_inclusions (
  id uuid primary key default gen_random_uuid(),
  quotation_package_id uuid not null
    references public.quotation_packages(id) on delete cascade,
  package_inclusion_id uuid
    references public.business_package_inclusions(id) on delete set null,
  tier_item_id uuid
    references public.business_package_tier_items(id) on delete set null,
  item_type text not null check (
    item_type in ('inclusion', 'freebie')
  ),
  name text not null,
  quantity integer not null check (quantity > 0),
  unit text not null,
  description text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  constraint quotation_inclusions_one_source_check
    check (num_nonnulls(package_inclusion_id, tier_item_id) <= 1)
);

create index quotation_inclusions_quotation_package_id_idx
  on public.quotation_inclusions (quotation_package_id);

-- Selected extra and upgrade snapshots captured with their quoted prices.
create table public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_package_id uuid not null
    references public.quotation_packages(id) on delete cascade,
  tier_item_id uuid
    references public.business_package_tier_items(id) on delete set null,
  item_type text not null check (
    item_type in ('extra', 'upgrade')
  ),
  item_name text not null,
  item_description text,
  unit text not null,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(10,2) not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  constraint quotation_items_package_id_tier_item_id_unique
    unique (quotation_package_id, tier_item_id),
  constraint quotation_items_line_total_matches_quantity_check
    check (line_total = unit_price * quantity)
);

create index quotation_items_quotation_package_id_idx
  on public.quotation_items (quotation_package_id);
create index quotation_items_tier_item_id_idx
  on public.quotation_items (tier_item_id);

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

-- Creates or replaces an open quotation and all of its snapshots atomically.
-- Catalog prices and transportation rules are resolved in the database so
-- client-provided totals are never trusted.
create or replace function public.save_quotation(
  p_business_id uuid,
  p_payload jsonb,
  p_quotation_id uuid default null
)
returns table (quotation_id uuid, quotation_reference text)
language plpgsql
as $$
declare
  v_packages jsonb := p_payload -> 'packages';
  v_package jsonb;
  v_selected_items jsonb;
  v_selected_item jsonb;
  v_package_id uuid;
  v_tier_id uuid;
  v_tier_item_id uuid;
  v_package_name text;
  v_tier_name text;
  v_price numeric(10,2);
  v_package_total numeric(10,2);
  v_package_items_total numeric(10,2);
  v_packages_total numeric(10,2) := 0;
  v_selected_items_total numeric(10,2) := 0;
  v_transportation_fee numeric(10,2);
  v_item_type text;
  v_item_name text;
  v_item_description text;
  v_item_unit text;
  v_item_price numeric(10,2);
  v_item_quantity integer;
  v_quotation_id uuid;
  v_quotation_reference text;
  v_quotation_package_id uuid;
  v_status text;
  v_sort_order integer := 0;
begin
  if jsonb_typeof(v_packages) <> 'array'
     or jsonb_array_length(v_packages) = 0 then
    raise exception 'At least one package is required';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_packages) package_input
    group by package_input ->> 'packageId'
    having count(*) > 1
  ) then
    raise exception 'A package can appear only once per quotation';
  end if;

  select rule.transportation_fee
  into v_transportation_fee
  from (
    select
      business_area.transportation_fee,
      case when area.area_type = 'locality' then 0 else 1 end as priority
    from public.business_service_areas business_area
    join public.service_areas area on area.id = business_area.service_area_id
    left join public.service_areas parent_area on parent_area.id = area.parent_id
    where business_area.business_id = p_business_id
      and business_area.is_active
      and business_area.is_covered
      and area.is_active
      and (
        (
          area.area_type = 'locality'
          and (
            public.normalize_area_name(area.name) =
              public.normalize_area_name(p_payload ->> 'venueLocality')
            or exists (
              select 1
              from unnest(area.aliases) alias
              where public.normalize_area_name(alias) =
                public.normalize_area_name(p_payload ->> 'venueLocality')
            )
          )
          and parent_area.area_type = 'region'
          and (
            public.normalize_area_name(parent_area.name) =
              public.normalize_area_name(p_payload ->> 'venueRegion')
            or exists (
              select 1
              from unnest(parent_area.aliases) alias
              where public.normalize_area_name(alias) =
                public.normalize_area_name(p_payload ->> 'venueRegion')
            )
          )
        )
        or (
          area.area_type = 'region'
          and (
            public.normalize_area_name(area.name) =
              public.normalize_area_name(p_payload ->> 'venueRegion')
            or exists (
              select 1
              from unnest(area.aliases) alias
              where public.normalize_area_name(alias) =
                public.normalize_area_name(p_payload ->> 'venueRegion')
            )
          )
        )
      )
    order by priority
    limit 1
  ) rule;

  if v_transportation_fee is null then
    raise exception 'The selected venue is outside this business service area';
  end if;

  -- Validate every selection and calculate authoritative totals first.
  for v_package in select value from jsonb_array_elements(v_packages)
  loop
    v_package_id := (v_package ->> 'packageId')::uuid;
    v_tier_id := (v_package ->> 'tierId')::uuid;

    select
      package.name,
      tier.name,
      tier.price
    into
      v_package_name,
      v_tier_name,
      v_price
    from public.business_packages package
    join public.business_package_tiers tier
      on tier.package_id = package.id
    where package.id = v_package_id
      and package.business_id = p_business_id
      and package.is_active
      and tier.id = v_tier_id
      and tier.is_active;

    if not found then
      raise exception 'Invalid or inactive package/tier selection';
    end if;

    v_package_total := v_price;
    v_package_items_total := 0;
    v_selected_items := coalesce(v_package -> 'selectedItems', '[]'::jsonb);

    if jsonb_typeof(v_selected_items) <> 'array' then
      raise exception 'Selected items must be an array';
    end if;

    if exists (
      select 1
      from jsonb_array_elements(v_selected_items) item_input
      group by item_input ->> 'tierItemId'
      having count(*) > 1
    ) then
      raise exception 'A package item can be selected only once';
    end if;

    for v_selected_item in
      select value from jsonb_array_elements(v_selected_items)
    loop
      v_tier_item_id := (v_selected_item ->> 'tierItemId')::uuid;
      v_item_quantity := (v_selected_item ->> 'quantity')::integer;

      if v_item_quantity <= 0 then
        raise exception 'Selected item quantity must be greater than zero';
      end if;

      select item.price
      into v_item_price
      from public.business_package_tier_items item
      where item.id = v_tier_item_id
        and item.package_tier_id = v_tier_id
        and item.item_type in ('extra', 'upgrade')
        and item.is_active;

      if not found then
        raise exception 'Invalid or inactive extra/upgrade selection';
      end if;

      v_package_items_total :=
        v_package_items_total + (v_item_price * v_item_quantity);
    end loop;

    v_packages_total := v_packages_total + v_package_total;
    v_selected_items_total :=
      v_selected_items_total + v_package_items_total;
  end loop;

  if p_quotation_id is null then
    insert into public.quotations (
      business_id,
      customer_name,
      customer_email,
      customer_phone,
      event_date,
      start_time,
      end_time,
      venue,
      venue_place_id,
      venue_locality,
      venue_region,
      occasion,
      guest_count,
      packages_total,
      selected_items_total,
      transportation_fee,
      grand_total
    ) values (
      p_business_id,
      p_payload ->> 'customerName',
      p_payload ->> 'customerEmail',
      p_payload ->> 'customerPhone',
      (p_payload ->> 'eventDate')::timestamptz,
      p_payload ->> 'startTime',
      p_payload ->> 'endTime',
      p_payload ->> 'venue',
      nullif(p_payload ->> 'venuePlaceId', ''),
      p_payload ->> 'venueLocality',
      p_payload ->> 'venueRegion',
      p_payload ->> 'occasion',
      (p_payload ->> 'guestCount')::integer,
      v_packages_total,
      v_selected_items_total,
      v_transportation_fee,
      v_packages_total + v_selected_items_total + v_transportation_fee
    )
    returning quotations.id, quotations.quotation_reference
      into v_quotation_id, v_quotation_reference;
  else
    select quotation.quotation_status, quotation.quotation_reference
    into v_status, v_quotation_reference
    from public.quotations quotation
    where quotation.id = p_quotation_id
      and quotation.business_id = p_business_id
    for update;

    if not found then
      raise exception 'Quotation not found';
    end if;

    if v_status <> 'open' then
      raise exception 'Only open quotations can be edited';
    end if;

    update public.quotations quotation
    set
      customer_name = p_payload ->> 'customerName',
      customer_email = p_payload ->> 'customerEmail',
      customer_phone = p_payload ->> 'customerPhone',
      event_date = (p_payload ->> 'eventDate')::timestamptz,
      start_time = p_payload ->> 'startTime',
      end_time = p_payload ->> 'endTime',
      venue = p_payload ->> 'venue',
      venue_place_id = nullif(p_payload ->> 'venuePlaceId', ''),
      venue_locality = p_payload ->> 'venueLocality',
      venue_region = p_payload ->> 'venueRegion',
      occasion = p_payload ->> 'occasion',
      guest_count = (p_payload ->> 'guestCount')::integer,
      packages_total = v_packages_total,
      selected_items_total = v_selected_items_total,
      transportation_fee = v_transportation_fee,
      grand_total = v_packages_total + v_selected_items_total + v_transportation_fee
    where quotation.id = p_quotation_id;

    v_quotation_id := p_quotation_id;
    delete from public.quotation_packages
    where quotation_packages.quotation_id = v_quotation_id;
  end if;

  -- Insert immutable package, inclusion, and selected-item snapshots.
  v_sort_order := 0;
  for v_package in select value from jsonb_array_elements(v_packages)
  loop
    v_sort_order := v_sort_order + 1;
    v_package_id := (v_package ->> 'packageId')::uuid;
    v_tier_id := (v_package ->> 'tierId')::uuid;

    select
      package.name,
      tier.name,
      tier.price
    into
      v_package_name,
      v_tier_name,
      v_price
    from public.business_packages package
    join public.business_package_tiers tier
      on tier.package_id = package.id
    where package.id = v_package_id
      and tier.id = v_tier_id;

    v_package_total := v_price;
    v_package_items_total := 0;
    v_selected_items := coalesce(v_package -> 'selectedItems', '[]'::jsonb);

    for v_selected_item in
      select value from jsonb_array_elements(v_selected_items)
    loop
      v_tier_item_id := (v_selected_item ->> 'tierItemId')::uuid;
      v_item_quantity := (v_selected_item ->> 'quantity')::integer;
      select item.price into v_item_price
      from public.business_package_tier_items item
      where item.id = v_tier_item_id;
      v_package_items_total :=
        v_package_items_total + (v_item_price * v_item_quantity);
    end loop;

    insert into public.quotation_packages (
      quotation_id,
      package_id,
      package_tier_id,
      package_name,
      tier_name,
      price,
      package_total,
      selected_items_total,
      total,
      sort_order
    ) values (
      v_quotation_id,
      v_package_id,
      v_tier_id,
      v_package_name,
      v_tier_name,
      v_price,
      v_package_total,
      v_package_items_total,
      v_package_total + v_package_items_total,
      v_sort_order
    ) returning id into v_quotation_package_id;

    insert into public.quotation_inclusions (
      quotation_package_id,
      package_inclusion_id,
      item_type,
      name,
      quantity,
      unit,
      description,
      sort_order
    )
    select
      v_quotation_package_id,
      inclusion.id,
      'inclusion',
      inclusion.name,
      inclusion.quantity,
      inclusion.unit,
      inclusion.description,
      inclusion.sort_order
    from public.business_package_inclusions inclusion
    where inclusion.package_id = v_package_id
      and inclusion.is_active;

    insert into public.quotation_inclusions (
      quotation_package_id,
      tier_item_id,
      item_type,
      name,
      quantity,
      unit,
      description,
      sort_order
    )
    select
      v_quotation_package_id,
      item.id,
      item.item_type,
      item.name,
      item.quantity,
      item.unit,
      item.description,
      item.sort_order
    from public.business_package_tier_items item
    where item.package_tier_id = v_tier_id
      and item.item_type in ('inclusion', 'freebie')
      and item.is_active;

    for v_selected_item in
      select value from jsonb_array_elements(v_selected_items)
    loop
      v_tier_item_id := (v_selected_item ->> 'tierItemId')::uuid;
      v_item_quantity := (v_selected_item ->> 'quantity')::integer;

      select
        item.item_type,
        item.name,
        item.description,
        item.unit,
        item.price
      into
        v_item_type,
        v_item_name,
        v_item_description,
        v_item_unit,
        v_item_price
      from public.business_package_tier_items item
      where item.id = v_tier_item_id;

      insert into public.quotation_items (
        quotation_package_id,
        tier_item_id,
        item_type,
        item_name,
        item_description,
        unit,
        unit_price,
        quantity,
        line_total
      ) values (
        v_quotation_package_id,
        v_tier_item_id,
        v_item_type,
        v_item_name,
        v_item_description,
        v_item_unit,
        v_item_price,
        v_item_quantity,
        v_item_price * v_item_quantity
      );
    end loop;
  end loop;

  return query
  select v_quotation_id, v_quotation_reference;
end;
$$;

commit;
