-- Seed script for a demo event with tables and guests.
-- Run after applying migrations and creating a user (the trigger auto-creates the public.users row).

-- Replace the placeholder user id with a real auth user id before running,
-- or run from the Supabase dashboard SQL editor after signing up.
-- UPDATE: set the session variable first, or hardcode your auth user id below.
select 'seed needs a real user id' as note;

-- Example:
-- insert into public.events (user_id, name, event_type, date)
-- values ('REPLACE_WITH_AUTH_USER_ID', 'Sarah & Alex''s Wedding', 'wedding', '2026-06-13 16:00:00+00');

-- Tables (positions relative to canvas center):
-- insert into public.tables (event_id, name, shape, capacity, pos_x, pos_y) values
--   ('REPLACE_WITH_EVENT_ID', 'VIP Head Table', 'rectangle', 10, 0, -320),
--   ('REPLACE_WITH_EVENT_ID', 'Table 1', 'round', 8, -340, -40),
--   ('REPLACE_WITH_EVENT_ID', 'Table 2', 'round', 8, 340, -40),
--   ('REPLACE_WITH_EVENT_ID', 'Table 3', 'round', 8, -340, 260),
--   ('REPLACE_WITH_EVENT_ID', 'Table 4', 'round', 8, 340, 260);

-- Guests:
-- insert into public.guests (event_id, name, email, rsvp_status, dietary_notes, tags) values
--   ('REPLACE_WITH_EVENT_ID', 'Sarah Johnson', 'sarah@gmail.com', 'confirmed', 'Gluten-free', ARRAY['Bride Side','Family']),
--   ('REPLACE_WITH_EVENT_ID', 'Alex Miller', 'alex@proton.me', 'confirmed', null, ARRAY['Groom Side','Family']),
--   ('REPLACE_WITH_EVENT_ID', 'Uncle Bob', 'bob@example.com', 'pending', 'Nut allergy', ARRAY['Family']),
--   ('REPLACE_WITH_EVENT_ID', 'Jessica Lee', 'jess@gmail.com', 'confirmed', 'Vegan', ARRAY['Bride Side','College Friends']),
--   ('REPLACE_WITH_EVENT_ID', 'Marcus Webb', 'marcus@gmail.com', 'confirmed', null, ARRAY['Groom Side','College Friends']),
--   ('REPLACE_WITH_EVENT_ID', 'Priya Patel', 'priya@example.com', 'declined', null, ARRAY['Bride Side','Work']),
--   ('REPLACE_WITH_EVENT_ID', 'Tom Nguyen', 'tom@example.com', 'confirmed', 'Vegetarian', ARRAY['Groom Side','Work']),
--   ('REPLACE_WITH_EVENT_ID', 'Emily Davis', 'emily@gmail.com', 'confirmed', 'Gluten-free', ARRAY['Bride Side','College Friends']);