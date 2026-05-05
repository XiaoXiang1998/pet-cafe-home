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

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.reservations enable row level security;
alter table public.feedbacks enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can create own reservations" on public.reservations;
drop policy if exists "Users can read own reservations" on public.reservations;
drop policy if exists "Users can create own feedback" on public.feedbacks;
drop policy if exists "Anyone can read reviews" on public.feedbacks;
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

create policy "Anyone can read reviews"
on public.feedbacks
for select
to anon, authenticated
using (type = 'review');

create policy "Users can read own complaints"
on public.feedbacks
for select
to authenticated
using (type = 'complaint' and auth.uid() = user_id);

grant usage on schema public to anon, authenticated;

grant select on public.feedbacks to anon;
grant select on public.feedbacks to authenticated;
grant insert on public.feedbacks to authenticated;

grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;

grant select on public.reservations to authenticated;
grant insert on public.reservations to authenticated;

grant usage, select on all sequences in schema public to anon, authenticated;
