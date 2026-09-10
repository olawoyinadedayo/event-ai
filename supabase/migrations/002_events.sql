-- 002: Events table
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  event_type text,
  date timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists events_user_id_idx on public.events (user_id);

alter table public.events enable row level security;

create policy "Users can manage own events"
  on public.events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);