-- Drop tables in reverse dependency order.
-- Run this in the Supabase SQL Editor.

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