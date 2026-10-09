ALTER TABLE public.newsletter_campaigns
  ADD COLUMN IF NOT EXISTS link_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS photo_url text NOT NULL DEFAULT '';