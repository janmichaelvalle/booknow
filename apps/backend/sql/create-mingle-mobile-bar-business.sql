-- Development seed: Mingle Mobile Bar.
-- Run after 001_initial_schema.sql or dev_reset_and_seed.sql.
-- Rerunning replaces only Mingle's live catalog and coverage; quotation
-- package, inclusion, item, price, and transportation snapshots remain.

begin;

insert into public.businesses (
  name, slug, description, phone, email,
  facebook_url, instagram_url, logo_url, default_daily_capacity
) values (
  'Mingle Mobile Bar', 'mingle-mobile-bar',
  'A portable, self-contained mobile bar serving cocktails, mocktails, and shooters at events, with setup and professional bartending service.',
  null, 'minglemobilebar@gmail.com', null,
  'https://www.instagram.com/minglemobilebar/', null, null
)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    email = excluded.email,
    instagram_url = excluded.instagram_url,
    default_daily_capacity = excluded.default_daily_capacity,
    updated_at = now();

-- Development-only catalog replacement. Historical quotations keep snapshots.
delete from public.business_packages package
using public.businesses business
where package.business_id = business.id
  and business.slug = 'mingle-mobile-bar';

insert into public.business_packages (
  business_id, name, badge_text, description, sort_order
)
select business.id, 'Cocktails & Mocktails',
       'Consumable or unlimited mobile bar',
       'Choose one consumable or unlimited fixed-price option for your event.',
       1
from public.businesses business
where business.slug = 'mingle-mobile-bar';

-- Shared across every tier. Variable counts and duration belong to tiers.
insert into public.business_package_inclusions (
  package_id, name, quantity, unit, description, sort_order
)
select package.id, seed.name, seed.quantity, seed.unit,
       seed.description, seed.sort_order
from public.business_packages package
join public.businesses business on business.id = package.business_id
cross join (
  values
    ('Elegant Bar Setup', null::integer, null::text, 'Mobile bar setup for the event.', 1),
    ('Roaming Bar Service', null::integer, null::text, 'Roaming bar service for guests.', 2),
    ('Wide Cocktail Selection', null::integer, null::text, 'A selection of cocktails and mocktails; the included option count depends on the tier.', 3),
    ('Bottle Service', null::integer, null::text, 'Bottle service is included.', 4),
    ('FREE Receipt Photobooth', null::integer, null::text, 'Complimentary receipt photobooth.', 5),
    ('FREE Shots', null::integer, null::text, 'Complimentary shots, bartender''s choice.', 6)
) as seed(name, quantity, unit, description, sort_order)
where business.slug = 'mingle-mobile-bar'
  and package.name = 'Cocktails & Mocktails';

-- Names are display text only: no guest-count-derived selection or pricing.
insert into public.business_package_tiers (package_id, name, price, sort_order)
select package.id, seed.name, seed.price, seed.sort_order
from public.business_packages package
join public.businesses business on business.id = package.business_id
cross join (
  values
    ('Consumable — Intimate', 16000.00::numeric, 1),
    ('Consumable — Social', 20000.00::numeric, 2),
    ('Consumable — Grand', 26000.00::numeric, 3),
    ('Unlimited — 40–60 Guests', 20000.00::numeric, 4),
    ('Unlimited — 61–80 Guests', 23000.00::numeric, 5),
    ('Unlimited — 81–100 Guests', 26000.00::numeric, 6),
    ('Unlimited — 101–120 Guests', 29000.00::numeric, 7),
    ('Unlimited — 121–150 Guests', 32000.00::numeric, 8),
    ('Unlimited — 151–180 Guests', 35000.00::numeric, 9),
    ('Unlimited — 181–200 Guests', 38000.00::numeric, 10),
    ('Unlimited — 201–250 Guests', 45000.00::numeric, 11),
    ('Unlimited — 251–300 Guests', 50000.00::numeric, 12)
) as seed(name, price, sort_order)
where business.slug = 'mingle-mobile-bar'
  and package.name = 'Cocktails & Mocktails';

-- Materialize the PDF's tier-specific entitlements for each named tier.
with tier_details (
  tier_name, cups, bartenders, cocktail_options, mocktail_options,
  combined_options, suggested_guests
) as (
  values
    ('Consumable — Intimate', 100, 2, null::integer, null::integer, 3, '50–70 guests'),
    ('Consumable — Social', 150, 3, null::integer, null::integer, 5, '71–90 guests'),
    ('Consumable — Grand', 220, 4, null::integer, null::integer, 6, '91–150 guests'),
    ('Unlimited — 40–60 Guests', null::integer, 3, 4, 2, null::integer, null::text),
    ('Unlimited — 61–80 Guests', null::integer, 3, 4, 2, null::integer, null::text),
    ('Unlimited — 81–100 Guests', null::integer, 3, 4, 2, null::integer, null::text),
    ('Unlimited — 101–120 Guests', null::integer, 4, 5, 3, null::integer, null::text),
    ('Unlimited — 121–150 Guests', null::integer, 4, 5, 3, null::integer, null::text),
    ('Unlimited — 151–180 Guests', null::integer, 4, null::integer, 4, null::integer, null::text),
    ('Unlimited — 181–200 Guests', null::integer, 4, null::integer, 4, null::integer, null::text),
    ('Unlimited — 201–250 Guests', null::integer, 5, null::integer, 5, null::integer, null::text),
    ('Unlimited — 251–300 Guests', null::integer, 5, null::integer, 5, null::integer, null::text)
)
insert into public.business_package_tier_items (
  package_tier_id, item_type, name, quantity, unit,
  description, price, sort_order
)
select tier.id, 'inclusion', item.name, item.quantity, item.unit,
       item.description, 0.00, item.sort_order
from public.business_package_tiers tier
join public.business_packages package on package.id = tier.package_id
join public.businesses business on business.id = package.business_id
join tier_details details on details.tier_name = tier.name
cross join lateral (
  values
    ('Cups', details.cups, 'cups',
      case when details.suggested_guests is not null
        then 'Consumable drinks; suggested for ' || details.suggested_guests || '.'
        else null end, 1),
    ('Service Duration', 4, 'hours',
      'Four hours of professional bartending service.', 2),
    ('Bartenders', details.bartenders, 'bartenders',
      'Professional bartenders.', 3),
    ('Cocktail/Mocktail Options', details.combined_options, 'options',
      'Choose this many cocktail or mocktail options.', 4),
    ('Cocktail Options', details.cocktail_options, 'options',
      'Choose this many cocktail options.', 4),
    ('All Cocktails', null::integer, null::text,
      'All cocktails are included.', 4),
    ('Mocktail Options', details.mocktail_options, 'options',
      'Choose this many mocktail options.', 5)
) as item(name, quantity, unit, description, sort_order)
where business.slug = 'mingle-mobile-bar'
  and package.name = 'Cocktails & Mocktails'
  and (
    item.quantity is not null
    or (
      item.name = 'All Cocktails'
      and details.cocktail_options is null
      and details.cups is null
    )
  );

-- Paid choices are scoped to individual tiers. Unlimited extra-hour prices
-- are stored as fixed amounts equal to 25% of each tier's price.
insert into public.business_package_tier_items (
  package_tier_id, item_type, name, quantity, unit,
  description, price, sort_order
)
select tier.id, 'extra', item.name, null, item.unit,
       item.description, item.price, item.sort_order
from public.business_package_tiers tier
join public.business_packages package on package.id = tier.package_id
join public.businesses business on business.id = package.business_id
cross join lateral (
  values
    ('Beer', 'case',
      'Per case: 24 bottles of 330mL. Choose San Miguel Light or San Miguel Pale Pilsen.',
      2000.00::numeric, 10),
    ('Personalized Logo on Cups', '100 cups',
      'Per 100 cups. A minimum of 10 days'' notice is required.',
      1500.00::numeric, 11),
    ('Additional Bartending Hour', 'hour', 'Price per additional hour.',
      case when tier.name like 'Consumable — %'
        then 4000.00::numeric else tier.price * 0.25 end, 12)
) as item(name, unit, description, price, sort_order)
where business.slug = 'mingle-mobile-bar'
  and package.name = 'Cocktails & Mocktails';

-- Geographic records are shared. Do not cover all CALABARZON or Central
-- Luzon: the PDF names specific places, not their entire parent regions.
insert into public.service_areas (
  country_code, area_type, name, normalized_name, aliases
)
select 'PH', 'region', seed.name, seed.normalized_name, seed.aliases
from (
  values
    ('Metro Manila', 'metro manila', array['national capital region', 'ncr']::text[]),
    ('CALABARZON', 'calabarzon', array['region iv-a', 'region 4a']::text[]),
    ('Central Luzon', 'central luzon', array['region iii', 'region 3']::text[])
) as seed(name, normalized_name, aliases)
where not exists (
  select 1 from public.service_areas existing
  where existing.country_code = 'PH'
    and existing.area_type = 'region'
    and existing.normalized_name = seed.normalized_name
    and existing.parent_id is null
);

insert into public.service_areas (
  parent_id, country_code, area_type, name, normalized_name, aliases
)
select parent.id, 'PH', seed.area_type, seed.name,
       seed.normalized_name, seed.aliases
from (
  values
    ('calabarzon', 'locality', 'Antipolo', 'antipolo', array['antipolo city']::text[]),
    ('calabarzon', 'locality', 'Tagaytay', 'tagaytay', array['tagaytay city']::text[]),
    ('calabarzon', 'province', 'Cavite', 'cavite', array[]::text[]),
    ('calabarzon', 'province', 'Laguna', 'laguna', array[]::text[]),
    ('calabarzon', 'province', 'Batangas', 'batangas', array[]::text[]),
    ('central luzon', 'province', 'Bulacan', 'bulacan', array[]::text[])
) as seed(parent_name, area_type, name, normalized_name, aliases)
join public.service_areas parent
  on parent.country_code = 'PH'
 and parent.area_type = 'region'
 and parent.normalized_name = seed.parent_name
 and parent.parent_id is null
where not exists (
  select 1 from public.service_areas existing
  where existing.parent_id = parent.id
    and existing.country_code = 'PH'
    and existing.area_type = seed.area_type
    and existing.normalized_name = seed.normalized_name
);

delete from public.business_service_areas business_area
using public.businesses business
where business_area.business_id = business.id
  and business.slug = 'mingle-mobile-bar';

with seed_rules (area_type, normalized_name, parent_name, fee) as (
  values
    ('region', 'metro manila', null::text, 2000.00::numeric),
    ('locality', 'antipolo', 'calabarzon', 3000.00::numeric),
    ('locality', 'tagaytay', 'calabarzon', 3500.00::numeric),
    ('province', 'bulacan', 'central luzon', 3500.00::numeric),
    ('province', 'laguna', 'calabarzon', 3500.00::numeric),
    ('province', 'cavite', 'calabarzon', 3500.00::numeric),
    ('province', 'batangas', 'calabarzon', 4000.00::numeric)
)
insert into public.business_service_areas (
  business_id, service_area_id, is_covered, transportation_fee, is_active
)
select business.id, area.id, true, seed.fee, true
from public.businesses business
cross join seed_rules seed
join public.service_areas area
  on area.country_code = 'PH'
 and area.area_type = seed.area_type
 and area.normalized_name = seed.normalized_name
left join public.service_areas parent on parent.id = area.parent_id
where business.slug = 'mingle-mobile-bar'
  and (
    (seed.parent_name is null and area.parent_id is null)
    or parent.normalized_name = seed.parent_name
  );

-- Current save_quotation() matches region/locality but not province rules.
-- VenueAutoComplete.tsx also hardcodes Metro Manila-only client coverage.
-- Province rules are recorded here but cannot yet be quoted end-to-end.

commit;
