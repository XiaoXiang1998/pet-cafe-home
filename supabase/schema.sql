create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nickname text,
  role text not null default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint profiles_role_check check (role in ('user', 'admin'))
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null,
  reserve_date date not null,
  reserve_time time not null,
  phone text not null default '',
  people text not null,
  pet text not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz default now()
);

create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null,
  type text not null check (type in ('review', 'complaint')),
  rating int not null check (rating between 1 and 5),
  message text not null,
  status text not null default 'new',
  is_visible boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  labels jsonb not null,
  price int not null check (price >= 0),
  image text not null default '',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles
  add column if not exists role text not null default 'user';

alter table public.feedbacks
  add column if not exists status text not null default 'new',
  add column if not exists is_visible boolean not null default true;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('user', 'admin'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'feedbacks_status_check'
      and conrelid = 'public.feedbacks'::regclass
  ) then
    alter table public.feedbacks
      add constraint feedbacks_status_check check (status in ('new', 'reviewing', 'resolved', 'hidden'));
  end if;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nickname)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.cancel_own_reservation(reservation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reservations
  set status = 'cancelled'
  where id = reservation_id
    and user_id = auth.uid()
    and status in ('pending', 'confirmed');

  return found;
end;
$$;

create or replace function public.get_reservation_availability(check_date date)
returns table (
  slot_time time,
  booked_count int,
  remaining_count int,
  is_available boolean
)
language sql
security definer
set search_path = public
as $$
  with slots as (
    select generate_series(
      timestamp '2000-01-01 10:00',
      timestamp '2000-01-01 21:00',
      interval '30 minutes'
    )::time as slot_time
  ),
  booked as (
    select
      reserve_time as slot_time,
      count(*)::int as booked_count
    from public.reservations
    where reserve_date = check_date
      and status in ('pending', 'confirmed')
    group by reserve_time
  )
  select
    slots.slot_time,
    coalesce(booked.booked_count, 0)::int as booked_count,
    greatest(6 - coalesce(booked.booked_count, 0), 0)::int as remaining_count,
    (
      check_date >= ((now() at time zone 'Asia/Taipei')::date)
      and coalesce(booked.booked_count, 0) < 6
    ) as is_available
  from slots
  left join booked using (slot_time)
  order by slots.slot_time;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_email_registered(check_email text)
returns boolean
language sql
security definer
set search_path = auth, public
as $$
  select exists (
    select 1
    from auth.users
    where lower(email) = lower(trim(check_email))
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.reservations enable row level security;
alter table public.feedbacks enable row level security;
alter table public.menu_items enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can create own reservations" on public.reservations;
drop policy if exists "Users can read own reservations" on public.reservations;
drop policy if exists "Users can create own feedback" on public.feedbacks;
drop policy if exists "Anyone can read reviews" on public.feedbacks;
drop policy if exists "Anyone can read feedback" on public.feedbacks;
drop policy if exists "Users can read own complaints" on public.feedbacks;
drop policy if exists "Admins can read profiles" on public.profiles;
drop policy if exists "Admins can read reservations" on public.reservations;
drop policy if exists "Admins can update reservations" on public.reservations;
drop policy if exists "Admins can read feedback" on public.feedbacks;
drop policy if exists "Admins can update feedback" on public.feedbacks;
drop policy if exists "Anyone can read active menu items" on public.menu_items;
drop policy if exists "Admins can manage menu items" on public.menu_items;

create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Admins can read profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

create policy "Users can create own reservations"
on public.reservations
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can read own reservations"
on public.reservations
for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can read reservations"
on public.reservations
for select
to authenticated
using (public.is_admin());

create policy "Admins can update reservations"
on public.reservations
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Users can create own feedback"
on public.feedbacks
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Anyone can read feedback"
on public.feedbacks
for select
to anon, authenticated
using (is_visible = true);

create policy "Admins can read feedback"
on public.feedbacks
for select
to authenticated
using (public.is_admin());

create policy "Admins can update feedback"
on public.feedbacks
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Anyone can read active menu items"
on public.menu_items
for select
to anon, authenticated
using (is_active = true);

create policy "Admins can manage menu items"
on public.menu_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant usage on schema public to anon, authenticated;

grant select on public.feedbacks to anon;
grant select on public.feedbacks to authenticated;
grant insert on public.feedbacks to authenticated;
grant update(status, is_visible) on public.feedbacks to authenticated;

grant select on public.profiles to authenticated;
grant update(nickname) on public.profiles to authenticated;

grant select on public.reservations to authenticated;
grant insert on public.reservations to authenticated;
grant update(status) on public.reservations to authenticated;

grant select on public.menu_items to anon;
grant select, insert, update on public.menu_items to authenticated;

revoke all on function public.is_email_registered(text) from public;
grant execute on function public.is_email_registered(text) to anon, authenticated;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

revoke all on function public.cancel_own_reservation(uuid) from public;
grant execute on function public.cancel_own_reservation(uuid) to authenticated;

revoke all on function public.get_reservation_availability(date) from public;
grant execute on function public.get_reservation_availability(date) to anon, authenticated;

grant usage, select on all sequences in schema public to anon, authenticated;
