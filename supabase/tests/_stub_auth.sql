-- Imitation minimale de ce que Supabase fournit, pour tester hors Supabase.
-- Jamais appliqué en production.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users (
  id uuid primary key,
  email text not null,
  raw_user_meta_data jsonb not null default '{}'
);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth, public to anon, authenticated, service_role;
-- Supabase accorde par défaut tous les droits sur public ; la RLS fait le tri.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;

-- Compte admin créé à la main avant la migration (phase 0).
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@test.ch');
