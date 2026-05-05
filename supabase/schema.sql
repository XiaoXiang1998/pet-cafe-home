create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nickname text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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
  created_at timestamptz default now()
);

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

alter table public.profiles enable row level security;
alter table public.reservations enable row level security;
alter table public.feedbacks enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can create own reservations" on public.reservations;
drop policy if exists "Users can read own reservations" on public.reservations;
drop policy if exists "Users can create own feedback" on public.feedbacks;
drop policy if exists "Anyone can read reviews" on public.feedbacks;
drop policy if exists "Anyone can read feedback" on public.feedbacks;
drop policy if exists "Users can read own complaints" on public.feedbacks;

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

create policy "Users can create own feedback"
on public.feedbacks
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Anyone can read feedback"
on public.feedbacks
for select
to anon, authenticated
using (true);

grant usage on schema public to anon, authenticated;

grant select on public.feedbacks to anon;
grant select on public.feedbacks to authenticated;
grant insert on public.feedbacks to authenticated;

grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;

grant select on public.reservations to authenticated;
grant insert on public.reservations to authenticated;

revoke all on function public.is_email_registered(text) from public;
grant execute on function public.is_email_registered(text) to anon, authenticated;

revoke all on function public.cancel_own_reservation(uuid) from public;
grant execute on function public.cancel_own_reservation(uuid) to authenticated;

grant usage, select on all sequences in schema public to anon, authenticated;
