-- BMW/ISM Culinary Program Planner — submissions table
--
-- Run this once in the Supabase project's SQL Editor (Database > SQL Editor > New query).
--
-- SECURITY NOTE: this is a small internal tool with no login system, so both policies
-- below use the public "anon" key — the same key the planner and admin page embed in
-- their own source. That means anyone who has the anon key (visible in the page source)
-- can read every row in this table, not just insert new ones. That's an acceptable
-- tradeoff for low-sensitivity catering menu/pricing data shared between a client and
-- caterer, but do not put anything more sensitive in the "notes" field, and don't
-- publicize the admin.html link. If real access control is ever needed, add Supabase
-- Auth (e.g. magic-link email login) and swap these policies for ones scoped to
-- `auth.uid()` — that's a separate follow-up, not included here.

create table if not exists public.submissions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  client_name text,
  notes text,
  program_total numeric not null,
  program_food_total numeric not null,
  program_bar_total numeric not null,
  guest_days integer not null,
  state jsonb not null
);

alter table public.submissions enable row level security;

create policy "Public can insert submissions"
  on public.submissions
  for insert
  to anon
  with check (true);

create policy "Public can read submissions"
  on public.submissions
  for select
  to anon
  using (true);
