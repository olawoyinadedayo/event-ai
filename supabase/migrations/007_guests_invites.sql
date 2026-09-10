-- 007: Add invite tracking columns to guests
alter table public.guests
  add column if not exists invite_sent boolean not null default false,
  add column if not exists invite_sent_at timestamptz,
  add column if not exists invite_token uuid unique default gen_random_uuid();

-- Backfill invite_token for existing guests
update public.guests
set invite_token = gen_random_uuid()
where invite_token is null;

-- Realtime: broadcast changes to guests for live RSVP updates
alter publication supabase_realtime add table public.guests;