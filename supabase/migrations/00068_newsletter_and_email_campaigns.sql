-- Newsletter subscribers, bilingual campaigns, and per-recipient delivery log.
--
-- Renumbered from 00053 (the number collided with
-- 00053_fix_storage_owner_folder_policies) and made re-runnable: staging already
-- holds these tables, created before the file was part of the migration
-- history, so every statement must be a no-op there and a creation elsewhere.

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  locale text NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'fr')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'unsubscribed')),
  confirmation_token_hash text,
  confirmation_expires_at timestamptz,
  unsubscribe_token_hash text,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_lower_uidx
  ON public.newsletter_subscribers (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_confirmation_token_uidx
  ON public.newsletter_subscribers (confirmation_token_hash)
  WHERE confirmation_token_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_unsubscribe_token_uidx
  ON public.newsletter_subscribers (unsubscribe_token_hash)
  WHERE unsubscribe_token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS newsletter_subscribers_active_idx
  ON public.newsletter_subscribers (locale, created_at)
  WHERE status = 'active';

DROP TRIGGER IF EXISTS newsletter_subscribers_updated ON public.newsletter_subscribers;
CREATE TRIGGER newsletter_subscribers_updated
  BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- No anon/authenticated policies: public operations go through server actions
-- using the service-role client, and staff do not need to view raw subscriber data.

CREATE TABLE IF NOT EXISTS public.newsletter_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_en text NOT NULL,
  subject_fr text NOT NULL,
  body_en text NOT NULL,
  body_fr text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_count integer NOT NULL DEFAULT 0 CHECK (recipient_count >= 0),
  sent_count integer NOT NULL DEFAULT 0 CHECK (sent_count >= 0),
  failed_count integer NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS newsletter_campaigns_created_at_idx
  ON public.newsletter_campaigns (created_at DESC);
CREATE INDEX IF NOT EXISTS newsletter_campaigns_status_idx
  ON public.newsletter_campaigns (status, created_at DESC);

DROP TRIGGER IF EXISTS newsletter_campaigns_updated ON public.newsletter_campaigns;
CREATE TRIGGER newsletter_campaigns_updated
  BEFORE UPDATE ON public.newsletter_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP POLICY IF EXISTS newsletter_campaigns_super_admin_read ON public.newsletter_campaigns;
CREATE POLICY newsletter_campaigns_super_admin_read
  ON public.newsletter_campaigns FOR SELECT TO authenticated
  USING (public.is_super_admin());
DROP POLICY IF EXISTS newsletter_campaigns_super_admin_insert ON public.newsletter_campaigns;
CREATE POLICY newsletter_campaigns_super_admin_insert
  ON public.newsletter_campaigns FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS newsletter_campaigns_super_admin_update ON public.newsletter_campaigns;
CREATE POLICY newsletter_campaigns_super_admin_update
  ON public.newsletter_campaigns FOR UPDATE TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE TABLE IF NOT EXISTS public.newsletter_campaign_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
  subscriber_id uuid REFERENCES public.newsletter_subscribers(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  resend_email_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, recipient_email)
);
ALTER TABLE public.newsletter_campaign_deliveries ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS newsletter_campaign_deliveries_campaign_status_idx
  ON public.newsletter_campaign_deliveries (campaign_id, status);

DROP TRIGGER IF EXISTS newsletter_campaign_deliveries_updated ON public.newsletter_campaign_deliveries;
CREATE TRIGGER newsletter_campaign_deliveries_updated
  BEFORE UPDATE ON public.newsletter_campaign_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP POLICY IF EXISTS newsletter_campaign_deliveries_super_admin_read ON public.newsletter_campaign_deliveries;
CREATE POLICY newsletter_campaign_deliveries_super_admin_read
  ON public.newsletter_campaign_deliveries FOR SELECT TO authenticated
  USING (public.is_super_admin());

COMMENT ON TABLE public.newsletter_subscribers IS
  'Double opt-in newsletter subscribers; all public mutations are performed server-side.';
COMMENT ON TABLE public.newsletter_campaigns IS
  'Bilingual newsletter drafts and aggregate delivery status; sending restricted to super-admins.';
COMMENT ON TABLE public.newsletter_campaign_deliveries IS
  'Per-recipient campaign delivery log used for reporting and safe retries.';