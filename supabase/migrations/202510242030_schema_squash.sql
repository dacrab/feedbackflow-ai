-- Squashed schema: single authoritative migration for clean setups
-- Safe/idempotent: uses IF NOT EXISTS and guards; keeps existing installs intact

create extension if not exists pgcrypto;
create schema if not exists extensions;
do $$ begin
  if exists (
    select 1 from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'citext' and n.nspname <> 'extensions'
  ) then
    execute 'alter extension citext set schema extensions';
  end if;
end $$;
create extension if not exists citext with schema extensions;

-- Helper function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'sentiment_type') then
    execute $et$ create type public.sentiment_type as enum ('positive','neutral','negative') $et$;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_type where typname = 'analysis_status') then
    execute $et$ create type public.analysis_status as enum ('New','Acknowledged','Actioned') $et$;
  end if;
end $$;

-- App users table
create table if not exists public.app_users (
  id uuid primary key,
  email citext,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists app_users_email_unique on public.app_users (email) where email is not null;

create trigger app_users_set_updated before update on public.app_users
  for each row execute function public.set_updated_at();

-- Auth sync functions
create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.app_users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

create or replace function public.handle_auth_user_deleted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.app_users where id = old.id;
  return old;
end $$;

create or replace function public.handle_auth_user_updated_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.app_users set email = new.email where id = new.id;
  end if;
  return new;
end $$;

create trigger auth_user_created_to_app_users after insert on auth.users
  for each row execute function public.handle_auth_user_created();
create trigger auth_user_deleted_to_app_users after delete on auth.users
  for each row execute function public.handle_auth_user_deleted();
create trigger auth_user_updated_email_to_app_users after update of email on auth.users
  for each row execute function public.handle_auth_user_updated_email();

-- Backfill app_users
insert into public.app_users (id, email)
select u.id, u.email from auth.users u
on conflict (id) do nothing;

-- Core tables
create table if not exists public.feedback_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  source text not null,
  external_id text not null check (char_length(trim(external_id)) > 0),
  raw_content text not null,
  original_timestamp timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create unique index if not exists feedback_items_user_source_external_unique
  on public.feedback_items (user_id, source, external_id);
create index if not exists feedback_items_user_created_idx on public.feedback_items (user_id, created_at desc);

create trigger feedback_items_set_updated before update on public.feedback_items
  for each row execute function public.set_updated_at();

create table if not exists public.feedback_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  feedback_item_id uuid not null references public.feedback_items(id) on delete cascade,
  sentiment public.sentiment_type not null,
  topics jsonb not null,
  severity_score int not null check (severity_score between 1 and 5),
  summary text not null,
  status public.analysis_status not null default 'New',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create unique index if not exists feedback_analyses_item_unique on public.feedback_analyses (feedback_item_id);
create index if not exists feedback_analyses_user_created_idx on public.feedback_analyses (user_id, created_at desc);

create trigger feedback_analyses_set_updated before update on public.feedback_analyses
  for each row execute function public.set_updated_at();

create or replace function public.sync_analysis_user_id()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_user uuid;
begin
  select user_id into v_user from public.feedback_items where id = new.feedback_item_id;
  new.user_id := v_user;
  return new;
end $$;

create trigger feedback_analyses_sync_user before insert or update of feedback_item_id on public.feedback_analyses
  for each row execute function public.sync_analysis_user_id();

create table if not exists public.analysis_topics (
  id uuid primary key default gen_random_uuid(),
  feedback_analysis_id uuid not null references public.feedback_analyses(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  topic text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists analysis_topics_unique_per_analysis on public.analysis_topics (feedback_analysis_id, topic);
create index if not exists analysis_topics_user_topic_idx on public.analysis_topics (user_id, topic);

create or replace function public.sync_analysis_topics()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.analysis_topics where feedback_analysis_id = new.id;
  insert into public.analysis_topics (feedback_analysis_id, user_id, topic)
  select new.id, new.user_id, trim(t)
  from jsonb_array_elements_text(new.topics) as t
  where trim(t) <> '';
  return new;
end $$;

create trigger feedback_analyses_sync_topics after insert or update of topics on public.feedback_analyses
  for each row execute function public.sync_analysis_topics();

create table if not exists public.ingest_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  ok boolean,
  error text,
  fetched int,
  inserted int,
  analyzed int
);

create index if not exists ingest_runs_user_started_idx on public.ingest_runs (user_id, started_at desc);

-- User config tables
create table if not exists public.user_settings (
  user_id uuid primary key references public.app_users(id) on delete cascade,
  provider text not null check (provider in ('google','openai','anthropic')),
  model text not null check (char_length(trim(model)) > 0),
  api_key_cipher text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_settings_set_updated before update on public.user_settings
  for each row execute function public.set_updated_at();

create table if not exists public.user_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  type text not null check (type in ('github')),
  config jsonb not null default '{}'::jsonb,
  secret_cipher text,
  enabled boolean not null default true,
  last_checked timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_sources_user_idx on public.user_sources (user_id, enabled);

create trigger user_sources_set_updated before update on public.user_sources
  for each row execute function public.set_updated_at();

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  type text not null check (type in ('slack')),
  config jsonb not null default '{}'::jsonb,
  secret_cipher text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_notifications_user_idx on public.user_notifications (user_id, enabled);

create trigger user_notifications_set_updated before update on public.user_notifications
  for each row execute function public.set_updated_at();

-- RLS
alter table public.app_users enable row level security;
alter table public.feedback_items enable row level security;
alter table public.feedback_analyses enable row level security;
alter table public.ingest_runs enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_sources enable row level security;
alter table public.user_notifications enable row level security;
alter table public.analysis_topics enable row level security;

-- app_users
do $$ begin
  create policy app_users_self_select on public.app_users
    for select to authenticated using ((select auth.uid()) = id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy app_users_self_update on public.app_users
    for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
exception when duplicate_object then null; end $$;

-- feedback_items
do $$ begin
  create policy feedback_items_select_owner on public.feedback_items
    for select to authenticated using ((select auth.uid()) = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy feedback_items_insert_none on public.feedback_items
    for insert to authenticated with check (false);
exception when duplicate_object then null; end $$;

-- feedback_analyses
do $$ begin
  create policy feedback_analyses_select_owner on public.feedback_analyses
    for select to authenticated using ((select auth.uid()) = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy feedback_analyses_insert_none on public.feedback_analyses
    for insert to authenticated with check (false);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy feedback_analyses_update_status on public.feedback_analyses
    for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
exception when duplicate_object then null; end $$;

-- ingest_runs
do $$ begin
  create policy ingest_runs_select_owner on public.ingest_runs
    for select to authenticated using ((select auth.uid()) = user_id);
exception when duplicate_object then null; end $$;

-- user_settings
do $$ begin
  create policy user_settings_self_select on public.user_settings
    for select to authenticated using ((select auth.uid()) = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy user_settings_self_upsert on public.user_settings
    for insert to authenticated with check ((select auth.uid()) = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy user_settings_self_update on public.user_settings
    for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
exception when duplicate_object then null; end $$;

-- user_sources
do $$ begin
  create policy user_sources_owner_select on public.user_sources
    for select to authenticated using ((select auth.uid()) = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy user_sources_owner_insert on public.user_sources
    for insert to authenticated with check ((select auth.uid()) = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy user_sources_owner_update on public.user_sources
    for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy user_sources_owner_delete on public.user_sources
    for delete to authenticated using ((select auth.uid()) = user_id);
exception when duplicate_object then null; end $$;

-- user_notifications
do $$ begin
  create policy user_notifications_owner_select on public.user_notifications
    for select to authenticated using ((select auth.uid()) = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy user_notifications_owner_insert on public.user_notifications
    for insert to authenticated with check ((select auth.uid()) = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy user_notifications_owner_update on public.user_notifications
    for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy user_notifications_owner_delete on public.user_notifications
    for delete to authenticated using ((select auth.uid()) = user_id);
exception when duplicate_object then null; end $$;

-- analysis_topics
do $$ begin
  create policy analysis_topics_select_owner on public.analysis_topics
    for select to authenticated using ((select auth.uid()) = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy analysis_topics_insert_none on public.analysis_topics
    for insert to authenticated with check (false);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy analysis_topics_update_none on public.analysis_topics
    for update to authenticated using (false) with check (false);
exception when duplicate_object then null; end $$;
