-- 006: Expenses table for budget tracking
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  title text not null,
  category text not null check (category in ('Venue', 'Catering', 'Entertainment', 'Decor', 'Photography', 'Transport', 'Other')),
  estimated_cost numeric(12,2) not null default 0,
  actual_cost numeric(12,2) not null default 0,
  paid_status boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_event_id_idx on public.expenses (event_id);

alter table public.expenses enable row level security;

create policy "Users can manage expenses for own events"
  on public.expenses for all
  using (
    exists (
      select 1 from public.events
      where events.id = expenses.event_id and events.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events
      where events.id = expenses.event_id and events.user_id = auth.uid()
    )
  );

-- Trigger to auto-update updated_at
create or replace function public.handle_expenses_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_expenses_updated
  before update on public.expenses
  for each row execute function public.handle_expenses_updated_at();