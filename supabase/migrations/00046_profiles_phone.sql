-- =============================================================================
-- TradeInDRC — Profile phone number
-- Migration: 00046_profiles_phone.sql
-- =============================================================================
-- The signup form now collects: full name, e-mail, password, phone.
-- full_name already exists (00001) and is filled by handle_new_user() from the
-- signUp() user metadata. This adds `phone` the same way.
--
-- Stored on profiles, NOT auth.users.phone: that column is Supabase's SMS-login
-- identifier and requires OTP verification.
--
-- Nullable on purpose: existing accounts have no phone, and OAuth signups don't
-- go through the form.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Loose sanity check only (the form enforces the real format): an optional
-- leading +, then digits/spaces/dashes/dots/parentheses, 6–20 chars.
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_phone_format
  CHECK (phone IS NULL OR phone ~ '^\+?[0-9 ().-]{6,20}$');

COMMENT ON COLUMN public.profiles.phone IS
  'Contact phone captured at signup (international format, e.g. +243…). Self-editable.';

-- Copy full_name + phone from the signUp() metadata into the new profile row.
-- A phone that fails the CHECK is dropped to NULL rather than inserted: a
-- CHECK violation inside this trigger would abort the auth.users insert and
-- fail the entire signup ("Database error saving new user").
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_phone TEXT := NULLIF(btrim(NEW.raw_user_meta_data->>'phone'), '');
BEGIN
  IF v_phone IS NOT NULL AND v_phone !~ '^\+?[0-9 ().-]{6,20}$' THEN
    v_phone := NULL;
  END IF;

  INSERT INTO public.profiles (id, full_name, phone, avatar_url)
  VALUES (
    NEW.id,
    NULLIF(btrim(NEW.raw_user_meta_data->>'full_name'), ''),
    v_phone,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Column-level grant (see 00037): users may edit their own phone, nothing more.
GRANT UPDATE (phone) ON public.profiles TO authenticated;
