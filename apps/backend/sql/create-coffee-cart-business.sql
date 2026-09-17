-- Development seed: The Brew Cart
-- Run after 001_initial_schema.sql (or dev_reset_and_seed.sql).
-- Re-running this file replaces this business's catalog but keeps historical
-- quotation snapshots intact.

begin;

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
  'The Brew Cart',
  'the-brew-cart',
  'Coffee, croffles, tiramisu, and photobooth packages for celebrations and events.',
  null,
  null,
  null,
  null,
  null
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  updated_at = now();

-- This is a development catalog seed. Rebuild only this business's live
-- offerings so removed or renamed packages do not remain after a rerun.
delete from public.business_packages package
using public.businesses business
where package.business_id = business.id
  and business.slug = 'the-brew-cart';

insert into public.business_packages (
  business_id,
  name,
  badge_text,
  description
)
select
  business.id,
  seed.name,
  seed.badge_text,
  seed.description
from public.businesses business
cross join (
  values
    (
      'Premium Coffee Cart',
      'Coffee cart service',
      'Premium hot or iced coffee for weddings, parties, and celebrations.'
    ),
    (
      'Croffles or Tiramisu Package',
      'Dessert package',
      'Choose croffles or tiramisu with two flavors for your event.'
    ),
    (
      'Photobooth Package',
      'Unlimited photo sessions',
      'Unlimited photobooth sessions with customized layouts and printed photos.'
    )
) as seed(name, badge_text, description)
where business.slug = 'the-brew-cart';

-- Details included with every tier of the corresponding package.
insert into public.business_package_inclusions (
  package_id,
  name,
  quantity,
  unit,
  description,
  sort_order
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
    (
      'Premium Coffee Cart',
      'Coffee Flavors',
      3,
      'flavors',
      'Choose from Latte, Spanish Latte, Caramel Macchiato, and Hazelnut Macchiato.',
      1
    ),
    (
      'Premium Coffee Cart',
      'Hot or Iced Drinks',
      1,
      'drink option',
      'Coffee can be served hot or iced.',
      2
    ),
    (
      'Croffles or Tiramisu Package',
      'Dessert Flavors',
      2,
      'flavors',
      'Choose two flavors. Classic croffles: Chocolate, White Choco Oreo, Nutella, or Biscoff. Premium croffles: Oreo & Cream, Biscoff & Cream, or Strawberry Graham. Tiramisu: Classic, Biscoff, Oreo, Blueberry, or Strawberry.',
      1
    ),
    (
      'Photobooth Package',
      'Customized Layout',
      1,
      'layout',
      'Includes a free customized photo layout.',
      1
    ),
    (
      'Photobooth Package',
      'Photo Standee Frame',
      1,
      'frame',
      'Comes with a photo standee frame.',
      2
    ),
    (
      'Photobooth Package',
      'Photo Props',
      1,
      'set',
      'Includes free use of photobooth props.',
      3
    ),
    (
      'Photobooth Package',
      'High-Quality Prints',
      1,
      'service',
      'Non-fading and smudge-proof printed photos.',
      4
    ),
    (
      'Photobooth Package',
      'Onsite Staff',
      1,
      'staff service',
      'Friendly staff will assist guests onsite.',
      5
    )
) as seed(package_name, name, quantity, unit, description, sort_order)
  on seed.package_name = package.name
where business.slug = 'the-brew-cart';

-- Fixed-price merchant-defined tiers.
insert into public.business_package_tiers (
  package_id,
  name,
  price,
  sort_order
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
    ('Premium Coffee Cart', '50 Cups', 9500.00::numeric, 1),
    ('Premium Coffee Cart', '100 Cups', 18500.00::numeric, 2),
    ('Premium Coffee Cart', '150 Cups', 28000.00::numeric, 3),
    ('Croffles or Tiramisu Package', '50 Servings', 11500.00::numeric, 1),
    ('Croffles or Tiramisu Package', '100 Servings', 22000.00::numeric, 2),
    ('Croffles or Tiramisu Package', '180 Servings', 36000.00::numeric, 3),
    ('Photobooth Package', '2 Hours', 3800.00::numeric, 1),
    ('Photobooth Package', '3 Hours', 4500.00::numeric, 2)
) as seed(package_name, name, price, sort_order)
  on seed.package_name = package.name
where business.slug = 'the-brew-cart';

-- Tier-specific inclusions, freebies, extras, and upgrades.
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
    -- Premium Coffee Cart tiers.
    ('Premium Coffee Cart', '50 Cups', 'inclusion', 'Coffee Cups', 50, 'cups',
      'Fifty cups of premium coffee.', 0.00::numeric, 1),
    ('Premium Coffee Cart', '50 Cups', 'inclusion', 'Service Duration', 2, 'hours',
      'Two hours of coffee cart service.', 0.00::numeric, 2),
    ('Premium Coffee Cart', '100 Cups', 'inclusion', 'Coffee Cups', 100, 'cups',
      'One hundred cups of premium coffee.', 0.00::numeric, 1),
    ('Premium Coffee Cart', '100 Cups', 'inclusion', 'Service Duration', 4, 'hours',
      'Four hours of coffee cart service.', 0.00::numeric, 2),
    ('Premium Coffee Cart', '150 Cups', 'inclusion', 'Coffee Cups', 150, 'cups',
      'One hundred fifty cups of premium coffee.', 0.00::numeric, 1),
    ('Premium Coffee Cart', '150 Cups', 'inclusion', 'Service Duration', 5, 'hours',
      'Five hours of coffee cart service.', 0.00::numeric, 2),

    -- Croffles or Tiramisu tiers.
    ('Croffles or Tiramisu Package', '50 Servings', 'inclusion', 'Croffles or Tiramisu', 50, 'servings',
      'Fifty servings of the selected dessert.', 0.00::numeric, 1),
    ('Croffles or Tiramisu Package', '100 Servings', 'inclusion', 'Croffles or Tiramisu', 100, 'servings',
      'One hundred servings of the selected dessert.', 0.00::numeric, 1),
    ('Croffles or Tiramisu Package', '180 Servings', 'inclusion', 'Croffles or Tiramisu', 180, 'servings',
      'One hundred eighty servings of the selected dessert.', 0.00::numeric, 1),

    -- Photobooth tier names describe the service duration.
    ('Photobooth Package', '2 Hours', 'inclusion', 'Unlimited Photo Sessions', 1, 'service',
      'Unlimited photobooth sessions during the two-hour service.', 0.00::numeric, 1),
    ('Photobooth Package', '2 Hours', 'inclusion', 'Photo Templates', 2, 'templates',
      'Choose two photo templates.', 0.00::numeric, 2),
    ('Photobooth Package', '3 Hours', 'inclusion', 'Unlimited Photo Sessions', 1, 'service',
      'Unlimited photobooth sessions during the three-hour service.', 0.00::numeric, 1),
    ('Photobooth Package', '3 Hours', 'inclusion', 'Photo Templates', 3, 'templates',
      'Choose three photo templates.', 0.00::numeric, 2),

    -- Photobooth paid upgrades and extras.
    ('Photobooth Package', '2 Hours', 'upgrade', 'Magnetic Photos', 1, 'upgrade',
      'Upgrade the package prints to magnetic photos.', 500.00::numeric, 10),
    ('Photobooth Package', '2 Hours', 'extra', 'One-Hour Extension', 1, 'hour',
      'Add one hour to the photobooth service.', 1000.00::numeric, 11),
    ('Photobooth Package', '3 Hours', 'upgrade', 'Magnetic Photos', 1, 'upgrade',
      'Upgrade the package prints to magnetic photos.', 800.00::numeric, 10),
    ('Photobooth Package', '3 Hours', 'extra', 'One-Hour Extension', 1, 'hour',
      'Add one hour to the photobooth service.', 1500.00::numeric, 11)
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
where business.slug = 'the-brew-cart';

-- Development coverage rules. Metro Manila is covered, with a PHP 500
-- transportation fee for Pasay and Paranaque.
with seed_rules (
  area_type, normalized_name, parent_normalized_name, transportation_fee
) as (
  values
    ('region', 'metro manila', null, 0.00::numeric),
    ('locality', 'pasay', 'metro manila', 500.00::numeric),
    ('locality', 'paranaque', 'metro manila', 500.00::numeric)
)
insert into public.business_service_areas (
  business_id,
  service_area_id,
  is_covered,
  transportation_fee,
  is_active
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
where business.slug = 'the-brew-cart'
  and (
    seed_rules.parent_normalized_name is null
    or parent_area.normalized_name = seed_rules.parent_normalized_name
  )
on conflict (business_id, service_area_id) do update
set
  is_covered = excluded.is_covered,
  transportation_fee = excluded.transportation_fee,
  is_active = excluded.is_active,
  updated_at = now();

commit;
