-- Replaces the profiles_public view, which the Supabase linter flagged
-- (security_definer_view). The view ran with its creator's privileges, so it
-- bypassed RLS on profiles, and Supabase's default grants also exposed it to
-- the anon role: anyone holding the publishable key could list every user's
-- name, region and role without logging in.
--
-- The replacement is a SECURITY DEFINER function that still returns only the
-- non-sensitive columns (never phone/email), but refuses unauthenticated
-- callers and is only executable by the authenticated role.

create or replace function get_public_profiles(p_ids uuid[])
returns table (id uuid, name text, region text, role text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return query
    select p.id, p.name, p.region, p.role
    from profiles p
    where p.id = any(p_ids);
end;
$$;

revoke all on function get_public_profiles(uuid[]) from public, anon;
grant execute on function get_public_profiles(uuid[]) to authenticated;

-- The keep-alive workflow used to ping profiles_public anonymously. Give it a
-- dedicated, data-free endpoint instead so it never needs access to user rows.
create or replace function keepalive()
returns boolean
language sql
stable
set search_path = public
as $$ select true $$;

grant execute on function keepalive() to anon;

drop view if exists profiles_public;
