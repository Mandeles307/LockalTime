-- Auto-create a public.users profile row on signup (all three providers).
-- Test-first contract: supabase/tests/users_trigger_test.sql (pgTAP, run via
-- `supabase test db`).
--
-- GoTrue inserts into auth.users on signup regardless of provider (email OTP,
-- Google/Apple via signInWithIdToken), so an AFTER INSERT trigger there is the
-- single choke point that guarantees a profile row always exists.
--
-- SECURITY DEFINER: the insert runs under supabase_auth_admin, which has no
-- privileges on public.users; definer (owner: postgres, who owns the table)
-- makes the insert succeed without granting auth admin anything. A definer
-- function must pin search_path, otherwise a caller-controlled search_path
-- could hijack unqualified names — pinned to '' and everything fully qualified.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, display_name)
  values (
    new.id,
    -- Derivation chain, first non-empty wins:
    --   full_name (Google/Apple id-token shape) → name (variant key) →
    --   email local-part (email OTP carries no name metadata; human-readable
    --   and user-editable later via the column-scoped UPDATE grant) →
    --   'user' (display_name is NOT NULL and must never abort the signup,
    --   e.g. future phone/anonymous auth with no email).
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'user'
    )
  )
  -- A pre-existing profile row (e.g. backfill or re-run) must never error the
  -- auth insert — that would break signup itself.
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
