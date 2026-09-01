-- 00039_promotion_plans.sql
--
-- "Promote Your Business in the DRC Market" (customer design 2026-07-28) splits
-- promotion into Local (Congolese) and International tabs, and adds a THIRD
-- tier — Strategic Market Promotion at USD 6,000/year — alongside the existing
-- USD 3,000 Congolese and USD 3,600 international plans.
--
-- Two things to fix:
--   1. premium_requests.plan only admits 'congolese' | 'international', and
--      00023 pins amount_usd to those two prices. The new tier cannot be stored.
--   2. Applications from the page land in `business_requests` (anonymous lead,
--      see premium-apply-actions.ts) which records NO plan at all — so an admin
--      could not tell which package was requested. That is the whole point of
--      splitting the page.
--
-- Prices mirror src/config/promotion-plans.ts. Changing one means changing both.

-- ---------------------------------------------------------------------------
-- 1. premium_requests — admit the third tier, keep prices unforgeable
-- ---------------------------------------------------------------------------
ALTER TABLE public.premium_requests
  DROP CONSTRAINT IF EXISTS premium_requests_plan_check;
ALTER TABLE public.premium_requests
  ADD CONSTRAINT premium_requests_plan_check
  CHECK (plan IN ('congolese', 'international', 'international_strategic'));

ALTER TABLE public.premium_requests
  DROP CONSTRAINT IF EXISTS premium_requests_amount_matches_plan;
ALTER TABLE public.premium_requests
  ADD CONSTRAINT premium_requests_amount_matches_plan
  CHECK ((plan = 'congolese'              AND amount_usd = 3000)
      OR (plan = 'international'          AND amount_usd = 3600)
      OR (plan = 'international_strategic' AND amount_usd = 6000));

-- ---------------------------------------------------------------------------
-- 2. business_requests — record WHICH promotion package the lead asked for
-- ---------------------------------------------------------------------------
ALTER TABLE public.business_requests
  ADD COLUMN IF NOT EXISTS promotion_plan text,
  ADD COLUMN IF NOT EXISTS promotion_amount_usd integer;

ALTER TABLE public.business_requests
  DROP CONSTRAINT IF EXISTS business_requests_promotion_plan_check;
ALTER TABLE public.business_requests
  ADD CONSTRAINT business_requests_promotion_plan_check
  CHECK (
    promotion_plan IS NULL
    OR (promotion_plan = 'congolese'               AND promotion_amount_usd = 3000)
    OR (promotion_plan = 'international'           AND promotion_amount_usd = 3600)
    OR (promotion_plan = 'international_strategic' AND promotion_amount_usd = 6000)
  );

-- Same anti-forgery posture as 00023: the price is set server-side from the
-- plan, never accepted from the client.
REVOKE UPDATE (promotion_plan, promotion_amount_usd)
  ON public.business_requests FROM authenticated;

CREATE INDEX IF NOT EXISTS business_requests_promotion_plan_idx
  ON public.business_requests (promotion_plan)
  WHERE promotion_plan IS NOT NULL;

COMMENT ON COLUMN public.business_requests.promotion_plan IS
  'Promotion package requested from /pricing. NULL for non-promotion requests. Price pinned by CHECK (00039).';
