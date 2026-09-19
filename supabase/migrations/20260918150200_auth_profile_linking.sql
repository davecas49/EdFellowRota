-- Links a newly verified auth.users row to its matching profiles row by
-- email. Account eligibility itself (email already on file as a fellow,
-- administrator, coordinator or faculty contact) is enforced before the
-- magic link is ever sent — see src/server/auth.functions.ts — so this
-- trigger only performs the linking once Supabase confirms the sign-in.

create function link_profile_to_auth_user() returns trigger as $$
begin
  update public.profiles
  set user_id = new.id
  where lower(email) = lower(new.email)
    and is_active = true
    and user_id is null;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function link_profile_to_auth_user();
