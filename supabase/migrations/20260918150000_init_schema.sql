-- ED Portal: initial schema
-- Enums, tables, indexes and updated_at triggers per spec.md §5.

create extension if not exists "pgcrypto";

-- ── Enums ────────────────────────────────────────────────────────────────

create type activity_type as enum (
  'education', 'clinical', 'annual_leave', 'study_leave', 'nwd', 'toil',
  'induction', 'prep_day', 'other_leave', 'other', 'sim'
);

create type time_slot as enum ('AM', 'PM', 'ALL_DAY');

create type user_role as enum (
  'fellow', 'lead_fellow', 'coordinator', 'administrator', 'faculty'
);

create type fellow_tier as enum ('Lead', 'Senior', 'Core', 'Haematology');

create type leave_type as enum ('annual', 'study');

create type leave_request_status as enum ('pending', 'approved', 'declined');

create type reflection_status as enum (
  'not_started', 'in_progress', 'complete', 'dismissed'
);

create type swap_status as enum ('pending', 'accepted', 'declined');

create type quality_subject as enum ('reflection', 'peer_feedback');

-- ── updated_at trigger helper ───────────────────────────────────────────

create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── profiles ─────────────────────────────────────────────────────────────

create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  email text not null unique,
  role user_role not null,
  tier fellow_tier,
  phone text,
  initials text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_user_id_key on profiles (user_id) where user_id is not null;
create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();

-- ── rota_entries ─────────────────────────────────────────────────────────

create table rota_entries (
  id uuid primary key default gen_random_uuid(),
  fellow_id uuid not null references profiles (id) on delete cascade,
  entry_date date not null,
  time_slot time_slot not null,
  activity_type activity_type not null,
  activity_label text not null,
  notes text,
  imported_from_excel boolean not null default false,
  import_batch_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index rota_entries_fellow_date_idx on rota_entries (fellow_id, entry_date);
create index rota_entries_date_idx on rota_entries (entry_date);
create trigger rota_entries_set_updated_at before update on rota_entries
  for each row execute function set_updated_at();

-- ── rota_changes ─────────────────────────────────────────────────────────

create table rota_changes (
  id uuid primary key default gen_random_uuid(),
  rota_entry_id uuid references rota_entries (id) on delete set null,
  fellow_id uuid references profiles (id) on delete set null,
  entry_date date,
  action text not null,
  summary text not null,
  changed_by uuid references profiles (id) on delete set null,
  changed_by_name text,
  created_at timestamptz not null default now()
);
create index rota_changes_entry_idx on rota_changes (rota_entry_id);
create index rota_changes_created_idx on rota_changes (created_at desc);

-- ── reflections ──────────────────────────────────────────────────────────

create table reflections (
  id uuid primary key default gen_random_uuid(),
  rota_entry_id uuid not null references rota_entries (id) on delete cascade,
  fellow_id uuid not null references profiles (id) on delete cascade,
  what_went_well text,
  what_could_be_improved text,
  key_learning_points text,
  follow_up_actions text,
  status reflection_status not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reflections_fellow_idx on reflections (fellow_id);
create unique index reflections_rota_entry_key on reflections (rota_entry_id);
create trigger reflections_set_updated_at before update on reflections
  for each row execute function set_updated_at();

-- ── reflection_actions ───────────────────────────────────────────────────

create table reflection_actions (
  id uuid primary key default gen_random_uuid(),
  fellow_id uuid not null references profiles (id) on delete cascade,
  reflection_id uuid references reflections (id) on delete cascade,
  rota_entry_id uuid references rota_entries (id) on delete set null,
  action_text text not null,
  is_done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reflection_actions_fellow_idx on reflection_actions (fellow_id);
create trigger reflection_actions_set_updated_at before update on reflection_actions
  for each row execute function set_updated_at();

-- ── peer_feedback ────────────────────────────────────────────────────────

create table peer_feedback (
  id uuid primary key default gen_random_uuid(),
  rota_entry_id uuid not null references rota_entries (id) on delete cascade,
  from_fellow_id uuid not null references profiles (id) on delete cascade,
  to_fellow_id uuid not null references profiles (id) on delete cascade,
  strengths text,
  development_areas text,
  rating int check (rating between 1 and 5),
  submitted_at timestamptz not null default now(),
  guest_name text,
  guest_email text,
  guest_role text
);
create index peer_feedback_to_fellow_idx on peer_feedback (to_fellow_id);
create index peer_feedback_rota_entry_idx on peer_feedback (rota_entry_id);

-- ── guest_feedback_invites ───────────────────────────────────────────────

create table guest_feedback_invites (
  id uuid primary key default gen_random_uuid(),
  rota_entry_id uuid not null references rota_entries (id) on delete cascade,
  fellow_id uuid not null references profiles (id) on delete cascade,
  invited_by uuid references profiles (id) on delete set null,
  guest_email text not null,
  guest_name text,
  guest_role text,
  token text not null unique,
  status text not null default 'pending',
  message text,
  strengths text,
  development_areas text,
  rating int check (rating between 1 and 5),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);
create index guest_feedback_invites_fellow_idx on guest_feedback_invites (fellow_id);
create index guest_feedback_invites_token_idx on guest_feedback_invites (token);

-- ── leave_dates ──────────────────────────────────────────────────────────

create table leave_dates (
  id uuid primary key default gen_random_uuid(),
  fellow_id uuid not null references profiles (id) on delete cascade,
  leave_type leave_type not null,
  leave_date date not null,
  note text,
  academic_year text not null,
  status leave_request_status not null default 'pending',
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references profiles (id) on delete set null,
  decision_reason text,
  decided_automatically boolean not null default false,
  override_note text,
  created_at timestamptz not null default now()
);
create index leave_dates_fellow_idx on leave_dates (fellow_id, academic_year);
create index leave_dates_date_idx on leave_dates (leave_date);

-- ── leave_entitlements ───────────────────────────────────────────────────

create table leave_entitlements (
  id uuid primary key default gen_random_uuid(),
  fellow_id uuid not null references profiles (id) on delete cascade,
  leave_type leave_type not null,
  total_entitlement int not null,
  days_taken int not null default 0,
  carry_over_note text,
  academic_year text not null
);
create unique index leave_entitlements_fellow_type_year_key
  on leave_entitlements (fellow_id, leave_type, academic_year);

-- ── swap_requests ────────────────────────────────────────────────────────

create table swap_requests (
  id uuid primary key default gen_random_uuid(),
  rota_entry_id uuid not null references rota_entries (id) on delete cascade,
  requesting_fellow_id uuid not null references profiles (id) on delete cascade,
  target_fellow_id uuid not null references profiles (id) on delete cascade,
  reason text,
  status swap_status not null default 'pending',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index swap_requests_requesting_idx on swap_requests (requesting_fellow_id);
create index swap_requests_target_idx on swap_requests (target_fellow_id);

-- ── quality_scores ───────────────────────────────────────────────────────

create table quality_scores (
  id uuid primary key default gen_random_uuid(),
  subject_type quality_subject not null,
  subject_id uuid not null,
  fellow_id uuid not null references profiles (id) on delete cascade,
  criteria jsonb not null,
  overall_score numeric not null,
  band text not null,
  ai_summary text not null,
  reviewer_notes text not null default '',
  model text,
  scored_by uuid references profiles (id) on delete set null,
  scored_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index quality_scores_subject_idx on quality_scores (subject_type, subject_id);
create index quality_scores_fellow_idx on quality_scores (fellow_id);
create trigger quality_scores_set_updated_at before update on quality_scores
  for each row execute function set_updated_at();

-- ── faculty_contacts ─────────────────────────────────────────────────────

create table faculty_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_title text,
  department text not null,
  email text,
  phone text,
  responsibilities text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── teaching_assignments ─────────────────────────────────────────────────

create table teaching_assignments (
  id uuid primary key default gen_random_uuid(),
  fellow_id uuid references profiles (id) on delete set null,
  assignment_type text not null,
  university text,
  block_code text,
  block_name text,
  rotation_level text,
  session_name text,
  duration_hours numeric,
  notes text
);
create index teaching_assignments_fellow_idx on teaching_assignments (fellow_id);

-- ── block_leads ──────────────────────────────────────────────────────────

create table block_leads (
  id uuid primary key default gen_random_uuid(),
  block_code text not null,
  specialty_name text not null,
  lead_name text not null,
  lead_email text,
  lead_role text,
  rotation_level text not null
);

-- ── ahd_sessions ─────────────────────────────────────────────────────────

create table ahd_sessions (
  id uuid primary key default gen_random_uuid(),
  session_date date not null,
  time_slot time_slot not null,
  block_number int,
  week_number int,
  cohort text,
  colour_streams text[],
  fellow_id uuid references profiles (id) on delete set null,
  location text,
  notes text,
  import_batch_id uuid,
  created_at timestamptz not null default now()
);
create index ahd_sessions_date_idx on ahd_sessions (session_date);
create index ahd_sessions_fellow_idx on ahd_sessions (fellow_id);

-- ── rooms ────────────────────────────────────────────────────────────────

create table rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  capacity int not null,
  is_active boolean not null default true
);

-- ── excel_import_log ─────────────────────────────────────────────────────

create table excel_import_log (
  id uuid primary key default gen_random_uuid(),
  imported_by uuid references profiles (id) on delete set null,
  imported_at timestamptz not null default now(),
  filename text,
  rows_parsed int,
  rows_imported int,
  status text,
  error_log text
);
