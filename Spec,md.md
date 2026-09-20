# ED Portal — Full Specification

BHT Education Fellows portal
Version as at 18 September 2026

---

## 1. Purpose

A single place for the Education Fellow programme to run the academic year:
the rota, leave, reflections, peer feedback, swaps, teaching commitments, the
faculty directory and administrator oversight — plus an agent (AI assistant)
connection so administrators can interrogate the data conversationally.

---

## 2. People and permissions

| Role | Who | What they can do |
|---|---|---|
| Fellow | Education Fellows | Own dashboard, full rota (add/edit/move/reassign any session), own reflections and actions, request leave, request swaps, give peer feedback, invite guest reviewers |
| Lead Fellow | Senior fellow | Everything a fellow can do, plus all administrator screens |
| Coordinator | Programme coordinator | All administrator screens, rota, leave decisions, imports |
| Administrator | Programme lead | Full access, including fellow/administrator management and quality scoring |
| Faculty | Consultants and other teachers listed in the directory | Sign in, view rota, give peer feedback |

Rules in force:
- No open sign-ups. A person can only create an account if their email is
  already on file in `profiles` as a fellow, administrator, coordinator or
  faculty member.
- Email verification is required on first sign-in.
- Everyone signed in can change the rota; every change is logged and shown.

---

## 3. Screens

**Public**
- `/auth` — sign in / first-time account activation
- `/forgot-password`, `/reset-password`
- `/guest-feedback` — token link for an external colleague to leave feedback on one session

**Signed in**
- `/dashboard` — greeting, sessions this week, reflections due, swap requests,
  peer-feedback count and average rating, upcoming sessions, declined-leave
  notices, recent rota changes
- `/rota` — the year's rota. Two views (By day, By fellow), filters by activity
  type and fellow, free-text search, availability shown as "available",
  all-day sessions rendered as one continuous block across morning and
  afternoon, click any session to edit, move, reassign, add notes or write a
  reflection, "New entry" to add a session
- `/reflections` — outstanding, completed (expandable and editable), "not
  needed" dismissals with restore, search, and a personal actions list fed from
  follow-up actions
- `/peer-feedback` — give and view feedback; past education and Sim sessions
  only; guest invites by NHS email with copy-link or mailto
- `/leave` — request annual/study leave, see entitlement, decisions and reasons
- `/swaps` — request and respond to session swaps
- `/help` — role-filtered how-to guide with "copy as Markdown"
- `/connect` — instructions for connecting Claude, Claude Code or ChatGPT

**Administration** (`/admin/...`)
index (overview) · fellows · administrators · faculty · teaching · rooms ·
leave (pending, decisions, overrides) · swaps · quality · import (Excel rota)

---

## 4. Key workflows

**Excel rota import.** A spreadsheet of the year's rota is parsed
heuristically, merged all-day cells are expanded into morning and afternoon,
duplicates are skipped, and every import is logged. Current data: 2,827 rota
entries, 107 leave days.

**Automated leave decisions.** On submission each requested day is checked:
1. Is the fellow timetabled to teach (education or Sim)? → declined, with the
   session named.
2. Otherwise, are at least two other fellows spare in both the morning and the
   afternoon? → approved (leaving one spare for sickness); if not → declined
   for cover.
The reason is shown to the fellow on their leave page and dashboard.
Administrators see every decision and can override it. Approved days
auto-increment the entitlement used for that academic year (August–July).

**Reflections.** Every past education or Sim session generates a reflection
prompt. Fellows complete, dismiss as "not needed", or restore. Follow-up
actions can be pushed to a personal actions list.

**Peer and guest feedback.** Fellows and faculty record strengths, development
areas and a 1–5 rating against a past session. A fellow can invite an external
consultant by NHS email; the guest opens a secure expiring token link and
their submission becomes a peer-feedback record carrying their name, email and
role.

**Quality scoring.** Reflections and peer feedback can be scored against a
rubric by AI, producing per-criterion scores, an overall score, a band and a
summary, all visible to administrators and lead fellows with space for
reviewer notes.

**Agent access (MCP).** An OAuth-protected server at `/mcp` exposes nine
tools: my_rota, team_rota, my_leave, request_leave, update_rota_notes,
faculty_directory, and the staff-only fellow_summary, fellow_reflections and
fellow_peer_feedback.

---

## 5. Data model

Preset value lists:
- activity_type: education, clinical, annual_leave, study_leave, nwd, toil, induction, prep_day, other_leave, other, sim
- time_slot: AM, PM, ALL_DAY
- user_role: fellow, lead_fellow, coordinator, administrator, faculty
- fellow_tier: Lead, Senior, Core, Haematology
- leave_type: annual, study · leave_request_status: pending, approved, declined
- reflection_status: not_started, in_progress, complete, dismissed
- swap_status: pending, accepted, declined · quality_subject: reflection, peer_feedback

`!` marks a required field.

**profiles** (31 rows) — id uuid!, user_id uuid, name text!, email text!, role user_role!, tier fellow_tier, phone text, initials text!, role_title text, department text, responsibilities text, is_active bool!, created_at!, updated_at!

**rota_entries** (2,827) — id!, fellow_id uuid!, entry_date date!, time_slot!, activity_type!, activity_label text!, notes text, imported_from_excel bool!, import_batch_id uuid, created_at!, updated_at!

**rota_changes** — id!, rota_entry_id, fellow_id, entry_date, action text!, summary text!, changed_by, changed_by_name, created_at!

**reflections** (26) — id!, rota_entry_id!, fellow_id!, what_went_well, what_could_be_improved, key_learning_points, follow_up_actions, status reflection_status!, created_at!, updated_at!

**reflection_actions** — id!, fellow_id!, reflection_id, rota_entry_id, action_text text!, is_done bool!, done_at, created_at!, updated_at!

**peer_feedback** — id!, rota_entry_id!, from_fellow_id!, to_fellow_id!, strengths, development_areas, rating int, submitted_at!, guest_name, guest_email, guest_role

**guest_feedback_invites** — id!, rota_entry_id!, fellow_id!, invited_by, guest_email text!, guest_name, guest_role, token text!, status text!, message, strengths, development_areas, rating, expires_at!, submitted_at, created_at!

**leave_dates** (107) — id!, fellow_id!, leave_type!, leave_date date!, note, academic_year text!, status leave_request_status!, requested_at!, reviewed_at, reviewed_by, decision_reason, decided_automatically bool!, override_note, created_at!

**leave_entitlements** — id!, fellow_id!, leave_type!, total_entitlement int!, days_taken int!, carry_over_note, academic_year text!

**swap_requests** — id!, rota_entry_id!, requesting_fellow_id!, target_fellow_id!, reason, status swap_status!, created_at!, resolved_at

**quality_scores** — id!, subject_type quality_subject!, subject_id!, fellow_id!, criteria jsonb!, overall_score numeric!, band text!, ai_summary text!, reviewer_notes text!, model, scored_by, scored_at!, created_at!, updated_at!

**teaching_assignments** (39) — id!, fellow_id, assignment_type text!, university, block_code, block_name, rotation_level, session_name, duration_hours numeric, notes

**block_leads** — id!, block_code text!, specialty_name text!, lead_name text!, lead_email, lead_role, rotation_level text!

**ahd_sessions** — id!, session_date date!, time_slot!, block_number int, week_number int, cohort, colour_streams text[], fellow_id, location, notes, import_batch_id, created_at!

**rooms** (9) — id!, name text!, capacity int!, is_active bool!

**excel_import_log** — id!, imported_by, imported_at!, filename, rows_parsed int, rows_imported int, status text, error_log text

### Access rules (row-level security)
Every table is protected and readable only by signed-in users.
- Rota: everyone signed in may read, add, change and delete; changes are logged.
- Reflections and actions: private to the owning fellow; staff read reflections through server-side tools only.
- Peer feedback: readable by the team, insert by any signed-in user, update only by the author.
- Leave: fellows insert their own and may cancel while pending; staff manage all.
- Quality scores, import log: staff only.
- Teaching, rooms, block leads, AHD: all read, staff write.
- Guest invites: own or staff; guest submissions arrive through a public token endpoint that validates the token and expiry.

---

## 6. Design

- Typeface: Inter, tight heading letter-spacing, a small-caps label style for
  stat labels.
- Brand colour: royal blue. Light neutral background, white cards, 0.5rem
  corner radius, thin borders rather than heavy shadows.
- Activity colours mirror the rota spreadsheet key: education blue, clinical
  slate, annual leave red, study leave yellow, non-working day light grey,
  induction amber, AHD purple, Sim teal, teaching green.
- Tier badges: Lead gold, Senior blue, Core teal, Haematology purple.
- Layout: left sidebar navigation on desktop; on mobile the sidebar becomes a
  hamburger slide-out. Content is a centred max-width column of cards and
  tables. Dates are shown UK style (dd/mm/yyyy).

---

## 7. Technical notes

TanStack Start (React 19, Vite) with Lovable Cloud (Postgres, auth, storage)
behind it. Server-side logic lives in server functions
(`leave.functions.ts`, `swaps.functions.ts`, `quality.functions.ts`), the
public guest endpoint under `api/public/guest-feedback`, and the MCP server
under `/mcp`. Quality scoring uses the Lovable AI gateway. Academic years run
August–July and are always derived from the date, never hardcoded.

Known gap: no email sending domain is configured, so guest invitations use a
copied link or the user's own mail app.
