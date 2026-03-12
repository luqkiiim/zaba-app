-- Zaba / CourtSide schema for a single-coach deployment.
-- This script is intentionally idempotent so you can run it in Supabase SQL Editor.
-- It includes open MVP policies for anon access. Add auth and tighten policies before any multi-user launch.

create extension if not exists "pgcrypto";

create table if not exists public.students (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  level text check (level in ('Beginner', 'Intermediate', 'Advanced', 'Pro')) default 'Beginner',
  session_quota integer default 0,
  notes text,
  contact_info text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.sessions (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  date date not null,
  time time not null,
  location text,
  max_capacity integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.attendance (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.sessions(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  status text check (status in ('Attended', 'Cancelled', 'No Show')) default 'Attended',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (session_id, student_id)
);

create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade,
  amount numeric(10, 2) not null,
  date date not null default current_date,
  type text check (type in ('Quota Top-up', 'Monthly Fee', 'Other')) default 'Quota Top-up',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.students enable row level security;
alter table public.sessions enable row level security;
alter table public.attendance enable row level security;
alter table public.payments enable row level security;

drop policy if exists "Public read students" on public.students;
create policy "Public read students" on public.students
  for select to anon, authenticated using (true);

drop policy if exists "Public insert students" on public.students;
create policy "Public insert students" on public.students
  for insert to anon, authenticated with check (true);

drop policy if exists "Public update students" on public.students;
create policy "Public update students" on public.students
  for update to anon, authenticated using (true) with check (true);

drop policy if exists "Public delete students" on public.students;
create policy "Public delete students" on public.students
  for delete to anon, authenticated using (true);

drop policy if exists "Public read sessions" on public.sessions;
create policy "Public read sessions" on public.sessions
  for select to anon, authenticated using (true);

drop policy if exists "Public insert sessions" on public.sessions;
create policy "Public insert sessions" on public.sessions
  for insert to anon, authenticated with check (true);

drop policy if exists "Public update sessions" on public.sessions;
create policy "Public update sessions" on public.sessions
  for update to anon, authenticated using (true) with check (true);

drop policy if exists "Public delete sessions" on public.sessions;
create policy "Public delete sessions" on public.sessions
  for delete to anon, authenticated using (true);

drop policy if exists "Public read attendance" on public.attendance;
create policy "Public read attendance" on public.attendance
  for select to anon, authenticated using (true);

drop policy if exists "Public insert attendance" on public.attendance;
create policy "Public insert attendance" on public.attendance
  for insert to anon, authenticated with check (true);

drop policy if exists "Public update attendance" on public.attendance;
create policy "Public update attendance" on public.attendance
  for update to anon, authenticated using (true) with check (true);

drop policy if exists "Public delete attendance" on public.attendance;
create policy "Public delete attendance" on public.attendance
  for delete to anon, authenticated using (true);

drop policy if exists "Public read payments" on public.payments;
create policy "Public read payments" on public.payments
  for select to anon, authenticated using (true);

drop policy if exists "Public insert payments" on public.payments;
create policy "Public insert payments" on public.payments
  for insert to anon, authenticated with check (true);

drop policy if exists "Public update payments" on public.payments;
create policy "Public update payments" on public.payments
  for update to anon, authenticated using (true) with check (true);

drop policy if exists "Public delete payments" on public.payments;
create policy "Public delete payments" on public.payments
  for delete to anon, authenticated using (true);

create or replace function public.apply_payment(
  p_student_id uuid,
  p_amount numeric,
  p_date date,
  p_type text,
  p_notes text default '',
  p_added_quota integer default 0
)
returns public.payments
language plpgsql
security invoker
set search_path = public
as $$
declare
  inserted_payment public.payments;
  quota_delta integer := greatest(coalesce(p_added_quota, 0), 0);
begin
  insert into public.payments (student_id, amount, date, type, notes)
  values (
    p_student_id,
    p_amount,
    coalesce(p_date, current_date),
    p_type,
    nullif(trim(coalesce(p_notes, '')), '')
  )
  returning * into inserted_payment;

  if p_type = 'Quota Top-up' and quota_delta > 0 then
    update public.students
    set session_quota = session_quota + quota_delta
    where id = p_student_id;
  end if;

  return inserted_payment;
end;
$$;

create or replace function public.sync_session_attendance(
  p_session_id uuid,
  p_student_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  desired_ids uuid[] := coalesce(p_student_ids, array[]::uuid[]);
  added_ids uuid[] := array[]::uuid[];
  removed_ids uuid[] := array[]::uuid[];
begin
  select coalesce(array_agg(student_id), array[]::uuid[])
  into added_ids
  from (
    select distinct unnest(desired_ids) as student_id
    except
    select student_id from public.attendance where session_id = p_session_id
  ) added;

  select coalesce(array_agg(student_id), array[]::uuid[])
  into removed_ids
  from (
    select student_id from public.attendance where session_id = p_session_id
    except
    select distinct unnest(desired_ids) as student_id
  ) removed;

  insert into public.attendance (session_id, student_id, status)
  select p_session_id, student_id, 'Attended'
  from unnest(added_ids) as student_id
  on conflict (session_id, student_id)
  do update set status = excluded.status;

  delete from public.attendance
  where session_id = p_session_id
    and student_id = any(removed_ids);

  update public.students
  set session_quota = greatest(session_quota - 1, 0)
  where id = any(added_ids);

  update public.students
  set session_quota = session_quota + 1
  where id = any(removed_ids);
end;
$$;

grant execute on function public.apply_payment(uuid, numeric, date, text, text, integer) to anon, authenticated;
grant execute on function public.sync_session_attendance(uuid, uuid[]) to anon, authenticated;
