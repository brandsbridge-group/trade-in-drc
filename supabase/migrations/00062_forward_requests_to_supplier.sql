-- 00062: a buyer's request reaches the supplier once staff has forwarded it.
--
-- A quote request (product page) or a contact request (company page) lands in
-- business_requests and was visible to staff only: the buyer was told "our team
-- qualifies your request, then passes it on to the supplier", but nothing in the
-- platform did the passing on, and the company had no screen to read it.
--
-- `company_id` cannot say who the request is FOR: some forms fill it with the
-- requester's own company (supply-chain request, granted promotion). The target
-- gets its own column, set only by the two forms aimed at one company.
--
-- Owners never read the table: its rows carry staff-only columns (admin_notes,
-- follow_up_owner, status). They go through two SECURITY DEFINER functions that
-- return only forwarded requests aimed at a company they own, without those
-- columns.

ALTER TABLE public.business_requests
  ADD COLUMN IF NOT EXISTS target_company_id UUID REFERENCES public.companies (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_id        UUID REFERENCES public.products (id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quantity          TEXT,
  ADD COLUMN IF NOT EXISTS interest          TEXT,
  ADD COLUMN IF NOT EXISTS forwarded_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS forwarded_by      UUID REFERENCES public.profiles (id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS supplier_seen_at  TIMESTAMPTZ;

COMMENT ON COLUMN public.business_requests.target_company_id IS
  'Company the request is addressed to (quote request, contact request). NULL for requests addressed to the TradeInDRC team.';
COMMENT ON COLUMN public.business_requests.product_id IS
  'Product a quote request is about.';
COMMENT ON COLUMN public.business_requests.quantity IS
  'Quantity asked for in a quote request, as the buyer typed it.';
COMMENT ON COLUMN public.business_requests.interest IS
  'Kind of relationship asked for in a contact request (distribution, investment, partnership, sourcing, other).';
COMMENT ON COLUMN public.business_requests.forwarded_at IS
  'When staff passed the request on to the target company. NULL = the company cannot see it.';
COMMENT ON COLUMN public.business_requests.supplier_seen_at IS
  'When the target company first opened its received requests after the forward.';

CREATE INDEX IF NOT EXISTS business_requests_target_forwarded_idx
  ON public.business_requests (target_company_id, forwarded_at DESC)
  WHERE forwarded_at IS NOT NULL;

-- Forwarded requests aimed at the caller's companies, newest forward first.
CREATE OR REPLACE FUNCTION public.company_received_requests()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.forwarded_at DESC), '[]'::jsonb)
    FROM (
      SELECT br.id,
             br.reference,
             br.full_name,
             br.company_name,
             br.country,
             br.email,
             br.phone,
             br.quantity,
             br.interest,
             br.preferred_location,
             br.timeline,
             br.message,
             br.created_at,
             br.forwarded_at,
             br.supplier_seen_at,
             c.id      AS target_company_id,
             c.name    AS target_company_name,
             p.id      AS product_id,
             p.name    AS product_name,
             p.name_en AS product_name_en,
             p.name_fr AS product_name_fr
        FROM public.business_requests br
        JOIN public.companies c     ON c.id = br.target_company_id
        LEFT JOIN public.products p ON p.id = br.product_id
       WHERE br.forwarded_at IS NOT NULL
         AND c.owner_id = auth.uid()
       ORDER BY br.forwarded_at DESC
       LIMIT 200
    ) r;
$$;

REVOKE ALL ON FUNCTION public.company_received_requests() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.company_received_requests() TO authenticated;

-- The caller has opened its received requests: none of them is "new" any more.
CREATE OR REPLACE FUNCTION public.mark_received_requests_seen()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  n integer;
BEGIN
  UPDATE public.business_requests br
     SET supplier_seen_at = now()
    FROM public.companies c
   WHERE c.id = br.target_company_id
     AND c.owner_id = auth.uid()
     AND br.forwarded_at IS NOT NULL
     AND br.supplier_seen_at IS NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_received_requests_seen() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_received_requests_seen() TO authenticated;
