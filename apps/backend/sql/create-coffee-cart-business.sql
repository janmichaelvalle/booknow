-- Development seed: The Brew Cart coffee cart packages.
-- Requires the tables from 001_initial_schema.sql.

begin;

-- Business information visible on the public quotation page.
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
  'Coffee cart service for weddings, celebrations, and private events.',
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


-- The offer is sold by number of cups.
insert into public.business_packages (
  business_id,
  name,
  badge_text,
  description,
  tier_unit
)
select
  business.id,
  'Coffee Cart Package',
  'Hot and iced coffee service',
  'Choose a package based on the number of cups needed for your event.',
  'cups'
from public.businesses business
where business.slug = 'the-brew-cart'
on conflict (business_id, name) do update
set
  badge_text = excluded.badge_text,
  description = excluded.description,
  tier_unit = excluded.tier_unit,
  is_active = true,
  updated_at = now();


-- Inclusions shared by every package size.
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
join public.businesses business
  on business.id = package.business_id
cross join (
  values
    (
      'Hot (8 oz) and Iced (12 oz) Drinks',
      1,
      'service',
      'Hot drinks are served in 8 oz cups and iced drinks in 12 oz cups.',
      1
    ),
    (
      'Vietnam Coffee Beans',
      1,
      'selection',
      'Coffee drinks use Vietnam coffee beans.',
      2
    ),
    (
      'Oatside Milk',
      1,
      'milk option',
      'Oatside oat milk is included.',
      3
    ),
    (
      'Emborg Full Cream Milk',
      1,
      'milk option',
      'Emborg full cream milk is included.',
      4
    )
) as seed(name, quantity, unit, description, sort_order)
where business.slug = 'the-brew-cart'
  and package.name = 'Coffee Cart Package'
on conflict (package_id, name) do update
set
  quantity = excluded.quantity,
  unit = excluded.unit,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();


-- Fixed-price package sizes shown in the offer.
insert into public.business_package_tiers (
  package_id,
  tier_value,
  pricing_type,
  price
)
select
  package.id,
  seed.tier_value,
  'fixed',
  seed.price
from public.business_packages package
join public.businesses business
  on business.id = package.business_id
cross join (
  values
    (50::numeric, 7000.00::numeric),
    (100::numeric, 13000.00::numeric),
    (150::numeric, 19000.00::numeric)
) as seed(tier_value, price)
where business.slug = 'the-brew-cart'
  and package.name = 'Coffee Cart Package'
on conflict (package_id, tier_value) do update
set
  pricing_type = excluded.pricing_type,
  price = excluded.price,
  is_active = true,
  updated_at = now();


-- Items that vary by package size, promotional freebies, and paid extras.
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
join public.business_packages package
  on package.id = tier.package_id
join public.businesses business
  on business.id = package.business_id
join (
  values
    -- 50-cup package: PHP 7,000.
    (50::numeric, 'inclusion', 'Coffee Flavors', 3, 'flavors',
      'Choose from three coffee flavors.', 0.00::numeric, 1),
    (50::numeric, 'inclusion', 'Non-Coffee Flavors', 2, 'flavors',
      'Choose from two non-coffee flavors.', 0.00::numeric, 2),
    (50::numeric, 'inclusion', 'Soda Flavors', 2, 'flavors',
      'Choose from two soda flavors.', 0.00::numeric, 3),
    (50::numeric, 'inclusion', '2-3 Hours Service', 1, 'service',
      'Coffee cart service for two to three hours.', 0.00::numeric, 4),

    -- 100-cup package: PHP 13,000.
    (100::numeric, 'inclusion', 'Coffee Flavors', 4, 'flavors',
      'Choose from four coffee flavors.', 0.00::numeric, 1),
    (100::numeric, 'inclusion', 'Non-Coffee Flavors', 3, 'flavors',
      'Choose from three non-coffee flavors.', 0.00::numeric, 2),
    (100::numeric, 'inclusion', 'Soda Flavors', 3, 'flavors',
      'Choose from three soda flavors.', 0.00::numeric, 3),
    (100::numeric, 'inclusion', '3-4 Hours Service', 1, 'service',
      'Coffee cart service for three to four hours.', 0.00::numeric, 4),

    -- 150-cup package: PHP 19,000.
    (150::numeric, 'inclusion', 'Coffee Flavors', 5, 'flavors',
      'Choose from five coffee flavors.', 0.00::numeric, 1),
    (150::numeric, 'inclusion', 'Non-Coffee Flavors', 3, 'flavors',
      'Choose from three non-coffee flavors.', 0.00::numeric, 2),
    (150::numeric, 'inclusion', 'Soda Flavors', 3, 'flavors',
      'Choose from three soda flavors.', 0.00::numeric, 3),
    (150::numeric, 'inclusion', '4-5 Hours Service', 1, 'service',
      'Coffee cart service for four to five hours.', 0.00::numeric, 4),

    -- Special-offer freebies included with every package size.
    (50::numeric, 'freebie', 'Receipt Photobooth', 1, 'setup',
      'Receipt-style photobooth setup.', 0.00::numeric, 10),
    (50::numeric, 'freebie', 'Unlimited Sessions and Prints', 1, 'offer',
      'Unlimited photobooth sessions and prints.', 0.00::numeric, 11),
    (50::numeric, 'freebie', 'QR Code / Online Download', 1, 'feature',
      'Guests can download their photos online using a QR code.', 0.00::numeric, 12),
    (50::numeric, 'freebie', 'Online Gallery', 1, 'gallery',
      'Online gallery for the event photos.', 0.00::numeric, 13),

    (100::numeric, 'freebie', 'Receipt Photobooth', 1, 'setup',
      'Receipt-style photobooth setup.', 0.00::numeric, 10),
    (100::numeric, 'freebie', 'Unlimited Sessions and Prints', 1, 'offer',
      'Unlimited photobooth sessions and prints.', 0.00::numeric, 11),
    (100::numeric, 'freebie', 'QR Code / Online Download', 1, 'feature',
      'Guests can download their photos online using a QR code.', 0.00::numeric, 12),
    (100::numeric, 'freebie', 'Online Gallery', 1, 'gallery',
      'Online gallery for the event photos.', 0.00::numeric, 13),

    (150::numeric, 'freebie', 'Receipt Photobooth', 1, 'setup',
      'Receipt-style photobooth setup.', 0.00::numeric, 10),
    (150::numeric, 'freebie', 'Unlimited Sessions and Prints', 1, 'offer',
      'Unlimited photobooth sessions and prints.', 0.00::numeric, 11),
    (150::numeric, 'freebie', 'QR Code / Online Download', 1, 'feature',
      'Guests can download their photos online using a QR code.', 0.00::numeric, 12),
    (150::numeric, 'freebie', 'Online Gallery', 1, 'gallery',
      'Online gallery for the event photos.', 0.00::numeric, 13),

    -- Paid add-on shown in the offer.
    (50::numeric, 'extra', 'Additional Cups', 1, 'cup',
      'Add more cups to the selected package.', 120.00::numeric, 20),
    (100::numeric, 'extra', 'Additional Cups', 1, 'cup',
      'Add more cups to the selected package.', 120.00::numeric, 20),
    (150::numeric, 'extra', 'Additional Cups', 1, 'cup',
      'Add more cups to the selected package.', 120.00::numeric, 20)
) as seed(
  tier_value,
  item_type,
  name,
  quantity,
  unit,
  description,
  price,
  sort_order
)
  on seed.tier_value = tier.tier_value
where business.slug = 'the-brew-cart'
  and package.name = 'Coffee Cart Package'
on conflict (package_tier_id, item_type, name) do update
set
  quantity = excluded.quantity,
  unit = excluded.unit,
  description = excluded.description,
  price = excluded.price,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

commit;
