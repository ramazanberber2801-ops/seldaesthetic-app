alter policy "Users or admins can read profiles"
on public.profiles
using ((id = (select auth.uid())) or (select private.is_platform_admin(auth.uid())));

alter policy "Users or admins can update profiles"
on public.profiles
using ((id = (select auth.uid())) or (select private.is_platform_admin(auth.uid())))
with check ((id = (select auth.uid())) or (select private.is_platform_admin(auth.uid())));

alter policy "notifications_select_relevant"
on public.notifications
using ((target_user_id is null) or (target_user_id = (select auth.uid())) or (select private.is_platform_admin(auth.uid())));

alter policy "Users or admins can read push tokens"
on public.push_tokens
using ((user_id = (select auth.uid())) or (select private.is_platform_admin(auth.uid())));

alter policy "loyalty_events_insert_admin"
on public.loyalty_events
with check ((select private.is_platform_admin(auth.uid())));

alter policy "loyalty_events_select_own_or_admin"
on public.loyalty_events
using (((select auth.uid()) = user_id) or (select private.is_platform_admin(auth.uid())));

revoke all on function public.is_admin(uuid) from public, anon, authenticated;
