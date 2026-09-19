-- ED Portal: row-level security
-- Every table is protected and readable only by signed-in users, per spec.md §5.

-- ── Helper functions ─────────────────────────────────────────────────────

create function current_fellow_id() returns uuid as $$
  select id from profiles where user_id = auth.uid();
$$ language sql stable security definer set search_path = public;

create function current_user_role() returns user_role as $$
  select role from profiles where user_id = auth.uid();
$$ language sql stable security definer set search_path = public;

create function is_staff() returns boolean as $$
  select coalesce(
    (select role in ('lead_fellow', 'coordinator', 'administrator')
     from profiles where user_id = auth.uid()),
    false
  );
$$ language sql stable security definer set search_path = public;

-- ── profiles ─────────────────────────────────────────────────────────────
-- Directory is readable by anyone signed in; only staff manage it.
-- Account linking (user_id) on first sign-in happens via a server function
-- using the service-role key, not through these policies.

alter table profiles enable row level security;

create policy profiles_select on profiles
  for select using (auth.uid() is not null);

create policy profiles_write on profiles
  for all using (is_staff()) with check (is_staff());

-- ── rota_entries / rota_changes ──────────────────────────────────────────
-- Everyone signed in may read, add, change and delete; changes are logged
-- separately by the application layer.

alter table rota_entries enable row level security;

create policy rota_entries_select on rota_entries
  for select using (auth.uid() is not null);

create policy rota_entries_write on rota_entries
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

alter table rota_changes enable row level security;

create policy rota_changes_select on rota_changes
  for select using (auth.uid() is not null);

create policy rota_changes_insert on rota_changes
  for insert with check (auth.uid() is not null);

-- ── reflections / reflection_actions ─────────────────────────────────────
-- Private to the owning fellow. Staff read reflections through server-side
-- tools only (service role), never through these client-facing policies.

alter table reflections enable row level security;

create policy reflections_owner on reflections
  for all using (fellow_id = current_fellow_id())
  with check (fellow_id = current_fellow_id());

alter table reflection_actions enable row level security;

create policy reflection_actions_owner on reflection_actions
  for all using (fellow_id = current_fellow_id())
  with check (fellow_id = current_fellow_id());

-- ── peer_feedback ────────────────────────────────────────────────────────
-- Readable by the team, insert by any signed-in user, update only by the
-- author.

alter table peer_feedback enable row level security;

create policy peer_feedback_select on peer_feedback
  for select using (auth.uid() is not null);

create policy peer_feedback_insert on peer_feedback
  for insert with check (auth.uid() is not null);

create policy peer_feedback_update on peer_feedback
  for update using (from_fellow_id = current_fellow_id())
  with check (from_fellow_id = current_fellow_id());

-- ── guest_feedback_invites ───────────────────────────────────────────────
-- Own or staff for authenticated access. Guest submissions arrive through
-- the public token endpoint, which uses the service role and validates the
-- token and expiry outside of RLS.

alter table guest_feedback_invites enable row level security;

create policy guest_feedback_invites_select on guest_feedback_invites
  for select using (fellow_id = current_fellow_id() or is_staff());

create policy guest_feedback_invites_insert on guest_feedback_invites
  for insert with check (fellow_id = current_fellow_id() or is_staff());

create policy guest_feedback_invites_update on guest_feedback_invites
  for update using (fellow_id = current_fellow_id() or is_staff())
  with check (fellow_id = current_fellow_id() or is_staff());

-- ── leave_dates ──────────────────────────────────────────────────────────
-- Fellows insert their own and may cancel while pending; staff manage all.

alter table leave_dates enable row level security;

create policy leave_dates_select on leave_dates
  for select using (fellow_id = current_fellow_id() or is_staff());

create policy leave_dates_insert on leave_dates
  for insert with check (fellow_id = current_fellow_id() or is_staff());

create policy leave_dates_update on leave_dates
  for update using (
    is_staff() or (fellow_id = current_fellow_id() and status = 'pending')
  ) with check (
    is_staff() or (fellow_id = current_fellow_id() and status = 'pending')
  );

create policy leave_dates_delete on leave_dates
  for delete using (
    is_staff() or (fellow_id = current_fellow_id() and status = 'pending')
  );

-- ── leave_entitlements ───────────────────────────────────────────────────
-- Fellows read their own entitlement; staff manage all.

alter table leave_entitlements enable row level security;

create policy leave_entitlements_select on leave_entitlements
  for select using (fellow_id = current_fellow_id() or is_staff());

create policy leave_entitlements_write on leave_entitlements
  for all using (is_staff()) with check (is_staff());

-- ── swap_requests ────────────────────────────────────────────────────────
-- Requesting or target fellow may see and act on their own swaps; staff see
-- and manage all (admin/swaps).

alter table swap_requests enable row level security;

create policy swap_requests_select on swap_requests
  for select using (
    requesting_fellow_id = current_fellow_id()
    or target_fellow_id = current_fellow_id()
    or is_staff()
  );

create policy swap_requests_insert on swap_requests
  for insert with check (requesting_fellow_id = current_fellow_id());

create policy swap_requests_update on swap_requests
  for update using (
    requesting_fellow_id = current_fellow_id()
    or target_fellow_id = current_fellow_id()
    or is_staff()
  ) with check (
    requesting_fellow_id = current_fellow_id()
    or target_fellow_id = current_fellow_id()
    or is_staff()
  );

-- ── quality_scores / excel_import_log ────────────────────────────────────
-- Staff only.

alter table quality_scores enable row level security;

create policy quality_scores_staff on quality_scores
  for all using (is_staff()) with check (is_staff());

alter table excel_import_log enable row level security;

create policy excel_import_log_staff on excel_import_log
  for all using (is_staff()) with check (is_staff());

-- ── faculty_contacts / teaching_assignments / rooms / block_leads /
--    ahd_sessions ────────────────────────────────────────────────────────
-- All signed-in users read; staff write.

alter table faculty_contacts enable row level security;
create policy faculty_contacts_select on faculty_contacts
  for select using (auth.uid() is not null);
create policy faculty_contacts_write on faculty_contacts
  for all using (is_staff()) with check (is_staff());

alter table teaching_assignments enable row level security;
create policy teaching_assignments_select on teaching_assignments
  for select using (auth.uid() is not null);
create policy teaching_assignments_write on teaching_assignments
  for all using (is_staff()) with check (is_staff());

alter table rooms enable row level security;
create policy rooms_select on rooms
  for select using (auth.uid() is not null);
create policy rooms_write on rooms
  for all using (is_staff()) with check (is_staff());

alter table block_leads enable row level security;
create policy block_leads_select on block_leads
  for select using (auth.uid() is not null);
create policy block_leads_write on block_leads
  for all using (is_staff()) with check (is_staff());

alter table ahd_sessions enable row level security;
create policy ahd_sessions_select on ahd_sessions
  for select using (auth.uid() is not null);
create policy ahd_sessions_write on ahd_sessions
  for all using (is_staff()) with check (is_staff());
