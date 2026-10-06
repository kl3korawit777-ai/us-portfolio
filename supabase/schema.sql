-- ตารางเก็บพอร์ตของผู้ใช้แต่ละคน (1 แถวต่อ 1 บัญชี)
-- รันทั้งไฟล์ใน Supabase > SQL Editor ได้หลายครั้งโดยไม่เสียหาย

create table if not exists public.portfolios (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security: anon key อยู่ในโค้ดที่เปิดเผยบน GitHub ใครก็เห็นได้
-- ความปลอดภัยทั้งหมดจึงขึ้นกับส่วนนี้
alter table public.portfolios enable row level security;

-- ตัดสิทธิ์ทั้งหมดก่อน แล้วให้เฉพาะที่จำเป็นกับผู้ที่ล็อกอินแล้ว
-- (anon ไม่มีสิทธิ์อะไรเลย ไม่มี delete เพราะแอปล้างข้อมูลบนเซิร์ฟเวอร์ด้วยการเขียนข้อมูลว่างทับ)
revoke all on public.portfolios from anon, authenticated;
grant select, insert, update on public.portfolios to authenticated;

drop policy if exists "portfolios_select_own" on public.portfolios;
drop policy if exists "portfolios_insert_own" on public.portfolios;
drop policy if exists "portfolios_update_own" on public.portfolios;

create policy "portfolios_select_own" on public.portfolios
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "portfolios_insert_own" on public.portfolios
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "portfolios_update_own" on public.portfolios
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ตั้ง updated_at ที่เซิร์ฟเวอร์ทุกครั้งที่เขียน ไม่เชื่อเวลาจากเครื่องผู้ใช้
create or replace function public.portfolios_touch()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists portfolios_touch on public.portfolios;
create trigger portfolios_touch
  before insert or update on public.portfolios
  for each row execute function public.portfolios_touch();
