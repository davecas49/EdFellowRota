-- ED Portal: swap request lifecycle
-- Adds cancelled/expired to swap_status (spec.md §3/§4 swaps workflow) and
-- tightens swap_requests RLS so staff can read all swaps but never write or
-- override one (spec.md §5 access rules): only the requester or the target
-- fellow may update a row.

alter type swap_status add value 'cancelled';
alter type swap_status add value 'expired';

drop policy swap_requests_update on swap_requests;

create policy swap_requests_update on swap_requests
  for update using (
    requesting_fellow_id = current_fellow_id()
    or target_fellow_id = current_fellow_id()
  ) with check (
    requesting_fellow_id = current_fellow_id()
    or target_fellow_id = current_fellow_id()
  );
