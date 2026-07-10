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
  admin_notes text,
  handled_at timestamptz,
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

create table if not exists public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  content text not null,
  keywords text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint knowledge_items_category_check check (
    category in (
      'store_info',
      'business_hours',
      'address',
      'pet_rules',
      'reservation_rules',
      'cancellation_rules',
      'faq',
      'policy'
    )
  )
);

alter table public.profiles
  add column if not exists role text not null default 'user';

alter table public.feedbacks
  add column if not exists status text not null default 'new',
  add column if not exists is_visible boolean not null default true,
  add column if not exists admin_notes text,
  add column if not exists handled_at timestamptz;

alter table public.knowledge_items
  add column if not exists category text not null default 'faq',
  add column if not exists title text not null default '',
  add column if not exists content text not null default '',
  add column if not exists keywords text[] not null default '{}',
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

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

  if not exists (
    select 1
    from pg_constraint
    where conname = 'knowledge_items_category_check'
      and conrelid = 'public.knowledge_items'::regclass
  ) then
    alter table public.knowledge_items
      add constraint knowledge_items_category_check check (
        category in (
          'store_info',
          'business_hours',
          'address',
          'pet_rules',
          'reservation_rules',
          'cancellation_rules',
          'faq',
          'policy'
        )
      );
  end if;
end;
$$;

insert into public.knowledge_items (category, title, content, keywords, is_active)
select category, title, content, keywords, true
from (
  values
    (
      'store_info',
      '餐廳特色',
      '小翔動物友善餐廳提供寬敞座位、寵物推車停放區、低刺激清潔流程與毛孩友善用餐動線。',
      array['餐廳特色', '店家介紹', '寵物友善', '小翔餐廳']
    ),
    (
      'business_hours',
      '營業時間',
      '營業時間目前以網站與 Google 商家頁最新公告為準。若需要確認特定日期，建議先透過店家聯絡方式確認。',
      array['營業時間', '幾點', '開門', '開到', '公休']
    ),
    (
      'address',
      '地址與交通',
      '地址目前尚未在資料庫設定正式門市地址；小幫手不會自行猜測。請以網站或店家正式公告為準。',
      array['地址', '在哪', '位置', '交通', '停車']
    ),
    (
      'pet_rules',
      '可以帶哪些寵物',
      '目前店家資料設定為歡迎貓狗同行。其他類型寵物建議先向店家確認，避免到場後無法入內。',
      array['可以帶', '可帶寵物', '寵物同行', '貓', '狗', '其他寵物']
    ),
    (
      'pet_rules',
      '大型犬入內規則',
      '大型犬可以同行，但請飼主全程看顧，並依現場狀況使用牽繩、推車或安排較不影響動線的位置。',
      array['大型犬', '大狗', '牽繩', '推車', '寵物規則']
    ),
    (
      'pet_rules',
      '狗狗飲食安全',
      '店內不建議也不提供狗狗食用巧克力。巧克力可能造成犬隻中毒，若狗狗誤食，請盡快聯絡獸醫。',
      array['狗狗', '巧克力', '不能吃', '中毒', '獸醫', '狗狗飲食']
    ),
    (
      'pet_rules',
      '寵物友善規則',
      '請飼主全程看顧毛孩，必要時使用牽繩、推車或外出籠，並避免影響其他客人。',
      array['寵物', '毛孩', '規則', '牽繩', '外出籠']
    ),
    (
      'reservation_rules',
      '預約方式',
      '可透過網站預約表單送出訂位需求。小幫手可以查詢可預約時段，但不會直接建立、修改或取消預約。',
      array['預約', '訂位', '時段', '表單', '候位']
    ),
    (
      'cancellation_rules',
      '取消與改期',
      '會員可在會員中心查看自己的預約；若預約狀態仍可取消，請使用會員中心的取消預約功能或聯絡店家協助。',
      array['取消', '改期', '退訂', '會員中心', '預約紀錄']
    ),
    (
      'policy',
      '低消與用餐提醒',
      '低消、用餐時間與現場座位規則以店家最新公告為準。若資料庫沒有明確設定，小幫手不會自行猜測金額或限制。',
      array['低消', '用餐時間', '政策', '規定', '限制']
    ),
    (
      'faq',
      '小幫手可回答的問題',
      '小幫手可以查詢預約可用時段、啟用中菜單品項，以及店家 FAQ、規則、地址與營業時間等資料庫已設定內容。',
      array['FAQ', '小幫手', '可以問什麼', 'AI', '聊天']
    )
) as seed(category, title, content, keywords)
where not exists (
  select 1
  from public.knowledge_items existing
  where existing.category = seed.category
    and existing.title = seed.title
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
alter table public.knowledge_items enable row level security;

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
drop policy if exists "Anyone can read active knowledge items" on public.knowledge_items;
drop policy if exists "Admins can manage knowledge items" on public.knowledge_items;

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

create policy "Anyone can read active knowledge items"
on public.knowledge_items
for select
to anon, authenticated
using (is_active = true);

create policy "Admins can manage knowledge items"
on public.knowledge_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant usage on schema public to anon, authenticated;

grant select on public.feedbacks to anon;
grant select on public.feedbacks to authenticated;
grant insert on public.feedbacks to authenticated;
grant update(status, is_visible, admin_notes, handled_at) on public.feedbacks to authenticated;

grant select on public.profiles to authenticated;
grant update(nickname) on public.profiles to authenticated;

grant select on public.reservations to authenticated;
grant insert on public.reservations to authenticated;
grant update(status) on public.reservations to authenticated;

grant select on public.menu_items to anon;
grant select, insert, update on public.menu_items to authenticated;

grant select on public.knowledge_items to anon;
grant select, insert, update on public.knowledge_items to authenticated;

revoke all on function public.is_email_registered(text) from public;
grant execute on function public.is_email_registered(text) to anon, authenticated;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

revoke all on function public.cancel_own_reservation(uuid) from public;
grant execute on function public.cancel_own_reservation(uuid) to authenticated;

revoke all on function public.get_reservation_availability(date) from public;
grant execute on function public.get_reservation_availability(date) to anon, authenticated;

grant usage, select on all sequences in schema public to anon, authenticated;
