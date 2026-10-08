-- Newsletter: campaigns are sent from a queue, one batch at a time.
--
-- Before, one request loaded every subscriber and sent the whole campaign: it
-- refused more than 500 recipients, and a request cut short left the campaign
-- in "sending" for ever. Now "send" only fills the delivery log with `pending`
-- rows grouped in numbered batches (newsletter_enqueue_campaign); a worker —
-- the console page, or the cron route — claims one batch at a time
-- (newsletter_claim_batch), sends it and writes the outcome back, and the
-- campaign totals are always recounted from the log (newsletter_refresh_campaign).
--
-- A batch keeps the same members and number for its whole life, so the e-mail
-- provider can be given a stable idempotency key (campaign / batch / attempt):
-- a batch claimed twice — a worker that died after the provider accepted it —
-- is not delivered twice.
--
-- The three functions are called with the service-role key only.

ALTER TABLE public.newsletter_campaign_deliveries
  ADD COLUMN IF NOT EXISTS batch_no integer NOT NULL DEFAULT 0 CHECK (batch_no >= 0),
  ADD COLUMN IF NOT EXISTS attempt integer NOT NULL DEFAULT 0 CHECK (attempt >= 0),
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

-- `sending`: claimed by a worker, outcome not written yet.
-- `skipped`: the subscriber left the list between "send" and its batch.
ALTER TABLE public.newsletter_campaign_deliveries
  DROP CONSTRAINT IF EXISTS newsletter_campaign_deliveries_status_check;
ALTER TABLE public.newsletter_campaign_deliveries
  ADD CONSTRAINT newsletter_campaign_deliveries_status_check
  CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'skipped'));

CREATE INDEX IF NOT EXISTS newsletter_campaign_deliveries_queue_idx
  ON public.newsletter_campaign_deliveries (campaign_id, batch_no)
  WHERE status IN ('pending', 'sending');

-- Recounts a campaign from its delivery log and closes it once nothing is left
-- to send: `sent` when every delivery went out, `failed` ("needs retry") otherwise.
CREATE OR REPLACE FUNCTION public.newsletter_refresh_campaign(p_campaign_id uuid)
RETURNS public.newsletter_campaigns
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_total integer;
  v_sent integer;
  v_failed integer;
  v_open integer;
  v_campaign public.newsletter_campaigns;
BEGIN
  SELECT
    count(*) FILTER (WHERE d.status <> 'skipped'),
    count(*) FILTER (WHERE d.status = 'sent'),
    count(*) FILTER (WHERE d.status = 'failed'),
    count(*) FILTER (WHERE d.status IN ('pending', 'sending'))
  INTO v_total, v_sent, v_failed, v_open
  FROM public.newsletter_campaign_deliveries d
  WHERE d.campaign_id = p_campaign_id;

  UPDATE public.newsletter_campaigns c
  SET recipient_count = v_total,
      sent_count = v_sent,
      failed_count = v_failed,
      status = CASE
        WHEN c.status <> 'sending' OR v_open > 0 THEN c.status
        WHEN v_failed > 0 THEN 'failed'
        ELSE 'sent'
      END,
      sent_at = CASE
        WHEN c.status = 'sending' AND v_open = 0 AND v_failed = 0 THEN now()
        ELSE c.sent_at
      END
  WHERE c.id = p_campaign_id
  RETURNING c.* INTO v_campaign;

  RETURN v_campaign;
END;
$$;

-- "Send": moves a draft (or a campaign to retry) to `sending` and queues its
-- recipients (every confirmed subscriber; for a retry, the failed deliveries only). Returns how many deliveries were queued, 0 when there is nobody
-- to write to (the campaign keeps its status), -1 when it cannot be sent.
CREATE OR REPLACE FUNCTION public.newsletter_enqueue_campaign(
  p_campaign_id uuid,
  p_batch_size integer DEFAULT 100
)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_previous text;
  v_first_batch integer;
  v_retried integer;
  v_added integer := 0;
BEGIN
  IF p_batch_size < 1 OR p_batch_size > 100 THEN
    RAISE EXCEPTION 'batch size must be between 1 and 100';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_campaign_id::text, 0));

  SELECT c.status INTO v_previous
  FROM public.newsletter_campaigns c
  WHERE c.id = p_campaign_id
  FOR UPDATE;
  IF v_previous IS NULL OR v_previous NOT IN ('draft', 'failed') THEN
    RETURN -1;
  END IF;

  -- A retry: the same batches go again, under a new attempt number.
  UPDATE public.newsletter_campaign_deliveries d
  SET status = 'pending', attempt = d.attempt + 1, error_message = NULL, claimed_at = NULL
  WHERE d.campaign_id = p_campaign_id AND d.status = 'failed';
  GET DIAGNOSTICS v_retried = ROW_COUNT;

  -- A first send reaches every confirmed subscriber. A retry does not add the
  -- people who subscribed since: they would receive a campaign that predates them.
  IF v_previous = 'draft' THEN
    SELECT COALESCE(max(d.batch_no), -1) + 1 INTO v_first_batch
    FROM public.newsletter_campaign_deliveries d
    WHERE d.campaign_id = p_campaign_id;

    INSERT INTO public.newsletter_campaign_deliveries
      (campaign_id, subscriber_id, recipient_email, status, batch_no)
    SELECT
      p_campaign_id,
      s.id,
      s.email,
      'pending',
      v_first_batch + ((row_number() OVER (ORDER BY s.id) - 1) / p_batch_size)::integer
    FROM public.newsletter_subscribers s
    WHERE s.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM public.newsletter_campaign_deliveries d
        WHERE d.campaign_id = p_campaign_id AND d.recipient_email = s.email
      )
    ON CONFLICT (campaign_id, recipient_email) DO NOTHING;
    GET DIAGNOSTICS v_added = ROW_COUNT;
  END IF;

  IF v_retried + v_added = 0 THEN
    RETURN 0;
  END IF;

  UPDATE public.newsletter_campaigns c SET status = 'sending' WHERE c.id = p_campaign_id;
  PERFORM public.newsletter_refresh_campaign(p_campaign_id);
  RETURN v_retried + v_added;
END;
$$;

-- Hands the next batch of a campaign to a worker. Claims are serialised per
-- campaign, so two workers never get the same batch. A batch claimed more than
-- p_stale_seconds ago and never closed is handed out again (its worker died).
CREATE OR REPLACE FUNCTION public.newsletter_claim_batch(
  p_campaign_id uuid,
  p_stale_seconds integer DEFAULT 120
)
RETURNS TABLE (
  delivery_id uuid,
  subscriber_id uuid,
  recipient_email text,
  locale text,
  batch_no integer,
  attempt integer
)
LANGUAGE plpgsql
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_batch integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_campaign_id::text, 0));

  IF NOT EXISTS (
    SELECT 1 FROM public.newsletter_campaigns c
    WHERE c.id = p_campaign_id AND c.status = 'sending'
  ) THEN
    RETURN;
  END IF;

  -- Whoever unsubscribed (or was removed) since "send" is not written to.
  UPDATE public.newsletter_campaign_deliveries d
  SET status = 'skipped', error_message = 'Subscriber no longer active.'
  WHERE d.campaign_id = p_campaign_id
    AND d.status = 'pending'
    AND NOT EXISTS (
      SELECT 1 FROM public.newsletter_subscribers s
      WHERE s.id = d.subscriber_id AND s.status = 'active'
    );

  SELECT min(d.batch_no) INTO v_batch
  FROM public.newsletter_campaign_deliveries d
  WHERE d.campaign_id = p_campaign_id
    AND (
      d.status = 'pending'
      OR (d.status = 'sending' AND d.claimed_at < now() - make_interval(secs => p_stale_seconds))
    );
  IF v_batch IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE public.newsletter_campaign_deliveries d
  SET status = 'sending', claimed_at = now()
  FROM public.newsletter_subscribers s
  WHERE d.campaign_id = p_campaign_id
    AND d.batch_no = v_batch
    AND d.status IN ('pending', 'sending')
    AND s.id = d.subscriber_id
  RETURNING d.id, d.subscriber_id, d.recipient_email, s.locale, d.batch_no, d.attempt;
END;
$$;

REVOKE ALL ON FUNCTION public.newsletter_refresh_campaign(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.newsletter_enqueue_campaign(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.newsletter_claim_batch(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.newsletter_refresh_campaign(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.newsletter_enqueue_campaign(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.newsletter_claim_batch(uuid, integer) TO service_role;

COMMENT ON COLUMN public.newsletter_campaign_deliveries.batch_no IS
  'Send batch (at most 100 recipients). Fixed once queued: it is part of the provider idempotency key.';
COMMENT ON COLUMN public.newsletter_campaign_deliveries.attempt IS
  'Incremented each time a failed delivery is queued again; part of the provider idempotency key.';
COMMENT ON COLUMN public.newsletter_subscribers.unsubscribe_token_hash IS
  'Legacy. Unsubscribe links are now signed (HMAC of the subscriber id) and never expire; this hash only keeps links from e-mails sent before 00069 working.';
