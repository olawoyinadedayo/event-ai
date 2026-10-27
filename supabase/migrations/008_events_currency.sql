-- 008: Add currency to events for budget formatting
alter table public.events
  add column if not exists currency text not null default 'USD';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_currency_check'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_currency_check
      check (currency in ('USD', 'NGN', 'EUR', 'GBP'));
  end if;
end $$;
