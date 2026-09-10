-- 004: Guests table
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  email text,
  rsvp_status text not null default 'pending' check (rsvp_status in ('pending', 'confirmed', 'declined')),
  dietary_notes text,
  tags text[] not null default '{}',
  table_id uuid references public.tables (id) on delete set null,
  seat_number integer
);

create index if not exists guests_event_id_idx on public.guests (event_id);
create index if not exists guests_table_id_idx on public.guests (table_id);

-- Prevent duplicate seat assignments at a table
create unique index if not exists guests_table_seat_unique
  on public.guests (table_id, seat_number)
  where table_id is not null and seat_number is not null;

alter table public.guests enable row level security;

create policy "Users can manage guests for own events"
  on public.guests for all
  using (
    exists (
      select 1 from public.events
      where events.id = guests.event_id and events.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events
      where events.id = guests.event_id and events.user_id = auth.uid()
    )
  );

-- Realtime: broadcast changes to guests and tables for live collaboration
alter publication supabase_realtime add table public.guests;
alter publication supabase_realtime add table public.tables;