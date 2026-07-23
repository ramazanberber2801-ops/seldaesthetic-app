-- Restore the function permission required by existing RLS policies.
-- The profiles, notifications and push-token policies call public.is_admin(uuid)
-- while authenticated users query through PostgREST.

grant execute on function public.is_admin(uuid) to authenticated;
revoke execute on function public.is_admin(uuid) from anon, public;
