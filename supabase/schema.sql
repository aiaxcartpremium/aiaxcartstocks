-- =========================================================
-- ✅ AiaxCart Stocks — Complete Supabase Schema
-- =========================================================

-- 1️⃣ PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key default auth.uid(),
  full_name text,
  email text unique,
  role text check (role in ('owner','admin')) default 'admin',
  created_at timestamptz default now()
);

-- 2️⃣ ACCOUNTS TABLE
create table if not exists public.accounts (
  id bigserial primary key,
  product text not null,
  plan_type text,  -- shared / solo / etc.
  duration_months int default 1,
  price numeric(10,2),
  status text check (status in ('available','sold')) default 'available',
  created_at timestamptz default now()
);

-- 3️⃣ ACCOUNT RECORDS TABLE
create table if not exists public.account_records (
  id bigserial primary key,
  account_id bigint references public.accounts(id) on delete set null,
  product text not null,
  buyer_username text not null,
  admin_id uuid not null references public.profiles(id),
  availed_at timestamptz not null default now(),
  duration_days int not null default 30,
  extra_days int not null default 0,
  expires_at timestamptz
);

-- =========================================================
-- ✅ FUNCTION: Auto-compute expiration date
-- =========================================================
create or replace function public.set_expires_at()
returns trigger language plpgsql as $$
begin
  if new.availed_at is null then
    new.availed_at := now();
  end if;
  new.expires_at := new.availed_at + ((coalesce(new.duration_days,0) + coalesce(new.extra_days,0)) * interval '1 day');
  return new;
end $$;

-- =========================================================
-- ✅ TRIGGER: Apply function on insert/update
-- =========================================================
drop trigger if exists trg_set_expires_at on public.account_records;
create trigger trg_set_expires_at
before insert or update on public.account_records
for each row execute function public.set_expires_at();

-- =========================================================
-- ✅ ENABLE ROW LEVEL SECURITY
-- =========================================================
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.account_records enable row level security;

-- =========================================================
-- ✅ RLS POLICIES
-- =========================================================

-- PROFILES
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "owner manage profiles" on public.profiles;
create policy "owner manage profiles"
on public.profiles for all
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner'));

-- ACCOUNTS
drop policy if exists "view accounts" on public.accounts;
create policy "view accounts"
on public.accounts for select
using (true);

drop policy if exists "modify accounts" on public.accounts;
create policy "modify accounts"
on public.accounts for insert, update
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('owner','admin')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('owner','admin')));

drop policy if exists "delete accounts" on public.accounts;
create policy "delete accounts"
on public.accounts for delete
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner'));

-- ACCOUNT RECORDS
drop policy if exists "admin manage own records" on public.account_records;
create policy "admin manage own records"
on public.account_records for all
using (admin_id = auth.uid())
with check (admin_id = auth.uid());

drop policy if exists "owner read all records" on public.account_records;
create policy "owner read all records"
on public.account_records for select
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner'));