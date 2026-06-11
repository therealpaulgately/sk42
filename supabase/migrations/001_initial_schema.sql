-- SK42 Command Center — initial schema
-- Run via Supabase SQL editor or: supabase db push

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
create type public.user_role as enum ('admin', 'leader', 'officer', 'viewer');
create type public.watchlist_state as enum ('none', 'watch', 'flagged');
create type public.sync_job_type as enum ('ranking', 'player_detail', 'full');
create type public.sync_status as enum ('pending', 'running', 'success', 'failed');

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  discord_id text unique,
  display_name text,
  avatar_url text,
  role public.user_role not null default 'viewer',
  preferred_server integer default 42,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Alliances
create table public.alliances (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  server integer not null,
  is_tracked boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, server)
);

create index alliances_server_idx on public.alliances (server);
create index alliances_tracked_idx on public.alliances (server, is_tracked) where is_tracked = true;

-- Tracked players (local intelligence layer)
create table public.tracked_players (
  id uuid primary key default gen_random_uuid(),
  pid text not null,
  display_name text,
  server integer not null,
  alliance_id uuid references public.alliances (id) on delete set null,
  discord_handle text,
  is_pinned boolean not null default false,
  watchlist_state public.watchlist_state not null default 'none',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pid, server)
);

create index tracked_players_server_idx on public.tracked_players (server);
create index tracked_players_pinned_idx on public.tracked_players (server, is_pinned) where is_pinned = true;

-- Player snapshots (time-series from external sources)
create table public.player_snapshots (
  id uuid primary key default gen_random_uuid(),
  pid text not null,
  server integer not null,
  display_name text,
  captured_at timestamptz not null,
  score bigint,
  kills bigint,
  deaths bigint,
  rank integer,
  alliance_name text,
  raw_payload_hash text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index player_snapshots_pid_server_idx on public.player_snapshots (pid, server, captured_at desc);
create index player_snapshots_captured_idx on public.player_snapshots (server, captured_at desc);

-- Player notes
create table public.player_notes (
  id uuid primary key default gen_random_uuid(),
  tracked_player_id uuid not null references public.tracked_players (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Player tags
create table public.player_tags (
  id uuid primary key default gen_random_uuid(),
  tracked_player_id uuid not null references public.tracked_players (id) on delete cascade,
  tag text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tracked_player_id, tag)
);

-- Player titles
create table public.player_titles (
  id uuid primary key default gen_random_uuid(),
  tracked_player_id uuid not null references public.tracked_players (id) on delete cascade,
  title text not null,
  assigned_by uuid references public.profiles (id) on delete set null,
  effective_from timestamptz not null default now(),
  effective_until timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index player_titles_player_idx on public.player_titles (tracked_player_id, effective_from desc);

-- Conquest reports
create table public.conquest_reports (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  server integer not null,
  start_date date not null,
  end_date date not null,
  created_by uuid references public.profiles (id) on delete set null,
  filters jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.conquest_report_rows (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.conquest_reports (id) on delete cascade,
  pid text not null,
  display_name text,
  alliance_name text,
  score_delta bigint,
  kills_delta bigint,
  deaths_delta bigint,
  rank_delta integer,
  metadata jsonb not null default '{}'
);

create index conquest_report_rows_report_idx on public.conquest_report_rows (report_id);

-- Server contexts (per-user server selection history)
create table public.server_contexts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  server integer not null,
  last_accessed_at timestamptz not null default now(),
  unique (user_id, server)
);

-- Sync runs
create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  job_type public.sync_job_type not null,
  server integer,
  status public.sync_status not null default 'pending',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_processed integer not null default 0,
  error_message text
);

create index sync_runs_started_idx on public.sync_runs (started_at desc);

-- Audit log
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index audit_log_created_idx on public.audit_log (created_at desc);

-- Activity feed (materialized events for dashboard)
create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  summary text not null,
  actor_id uuid references public.profiles (id) on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index activity_events_created_idx on public.activity_events (created_at desc);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger alliances_updated_at before update on public.alliances
  for each row execute function public.set_updated_at();
create trigger tracked_players_updated_at before update on public.tracked_players
  for each row execute function public.set_updated_at();
create trigger player_notes_updated_at before update on public.player_notes
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url, discord_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'provider_id'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.alliances enable row level security;
alter table public.tracked_players enable row level security;
alter table public.player_snapshots enable row level security;
alter table public.player_notes enable row level security;
alter table public.player_tags enable row level security;
alter table public.player_titles enable row level security;
alter table public.conquest_reports enable row level security;
alter table public.conquest_report_rows enable row level security;
alter table public.server_contexts enable row level security;
alter table public.sync_runs enable row level security;
alter table public.audit_log enable row level security;
alter table public.activity_events enable row level security;

-- Helper: current user role
create or replace function public.current_user_role()
returns public.user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer;

-- RLS policies: authenticated users can read operational data
create policy "Authenticated users can read profiles"
  on public.profiles for select to authenticated using (true);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Authenticated users can read alliances"
  on public.alliances for select to authenticated using (true);

create policy "Officers can manage alliances"
  on public.alliances for all to authenticated
  using (public.current_user_role() in ('admin', 'leader', 'officer'))
  with check (public.current_user_role() in ('admin', 'leader', 'officer'));

create policy "Authenticated users can read tracked players"
  on public.tracked_players for select to authenticated using (true);

create policy "Officers can manage tracked players"
  on public.tracked_players for all to authenticated
  using (public.current_user_role() in ('admin', 'leader', 'officer'))
  with check (public.current_user_role() in ('admin', 'leader', 'officer'));

create policy "Authenticated users can read snapshots"
  on public.player_snapshots for select to authenticated using (true);

create policy "Authenticated users can read notes"
  on public.player_notes for select to authenticated using (true);

create policy "Officers can manage notes"
  on public.player_notes for all to authenticated
  using (public.current_user_role() in ('admin', 'leader', 'officer'))
  with check (public.current_user_role() in ('admin', 'leader', 'officer'));

create policy "Authenticated users can read tags"
  on public.player_tags for select to authenticated using (true);

create policy "Officers can manage tags"
  on public.player_tags for all to authenticated
  using (public.current_user_role() in ('admin', 'leader', 'officer'))
  with check (public.current_user_role() in ('admin', 'leader', 'officer'));

create policy "Authenticated users can read titles"
  on public.player_titles for select to authenticated using (true);

create policy "Leaders can manage titles"
  on public.player_titles for all to authenticated
  using (public.current_user_role() in ('admin', 'leader'))
  with check (public.current_user_role() in ('admin', 'leader'));

create policy "Authenticated users can read conquest reports"
  on public.conquest_reports for select to authenticated using (true);

create policy "Officers can manage conquest reports"
  on public.conquest_reports for all to authenticated
  using (public.current_user_role() in ('admin', 'leader', 'officer'))
  with check (public.current_user_role() in ('admin', 'leader', 'officer'));

create policy "Authenticated users can read report rows"
  on public.conquest_report_rows for select to authenticated using (true);

create policy "Users can manage own server contexts"
  on public.server_contexts for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Authenticated users can read sync runs"
  on public.sync_runs for select to authenticated using (true);

create policy "Admins can manage sync runs"
  on public.sync_runs for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "Leaders can read audit log"
  on public.audit_log for select to authenticated
  using (public.current_user_role() in ('admin', 'leader'));

create policy "Authenticated users can read activity"
  on public.activity_events for select to authenticated using (true);

-- Service role handles snapshot writes (via backend worker, not RLS bypass from client)
