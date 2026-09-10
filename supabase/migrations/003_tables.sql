-- 003: Tables (floor plan)
create table if not exists public.tables (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  shape text not null default 'round' check (shape in ('round', 'rectangle')),
  capacity integer not null default 8 check (capacity between 1 and 40),
  pos_x double precision not null default 0,
  pos_y double precision not null default 0
);

create index if not exists tables_event_id_idx on public.tables (event_id);

alter table public.tables enable row level security;

create policy "Users can manage tables for own events"
  on public.tables for all
  using (
    exists (
      select 1 from public.events
      where events.id = tables.event_id and events.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events
      where events.id = tables.event_id and events.user_id = auth.uid()
    )
  );