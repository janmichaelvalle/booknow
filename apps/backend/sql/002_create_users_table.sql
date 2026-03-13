-- Supabase/Postgres migration: users table
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
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

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

create index if not exists users_email_idx
  on public.users (email);

insert into public.users (email, password_hash)
values (
  'test@example.com',
  crypt('password123', gen_salt('bf'))
)
on conflict (email) do nothing;
