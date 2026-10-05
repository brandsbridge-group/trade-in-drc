-- 00063_company_public_verification.sql
--
-- "What we verified" on the public offer page, read from the REAL circuit.
--
-- The block used to read `companies.verification_summary.checks` — a checklist
-- the old trust form wrote. The verification workflow that replaced it (00058)
-- records its outcome elsewhere: per-document decisions in `company_documents`
-- and the company's approval in `verification_reviews`. So a company approved
-- through the real workflow showed "Verified" in the header and "0 of 4 points
-- verified" right under it (26 of the 28 verified companies have no `checks`).
--
-- Visitors cannot read `company_documents` (owner + staff only, rightly: the
-- rows point at the files). This function returns booleans and one count —
-- never a file, a note or an identifier.
--
-- A document counts as checked when staff approved it, or when the company is
-- verified and the document was not refused: approving a company attests the
-- required documents on file (see submitVerificationDecision). Legacy `checks`
-- that passed are still honoured, so older reviews keep their result.
--
-- Same visibility as the company itself: verified for everyone, any status for
-- the owner and for staff. NULL when the caller may not see the company.

CREATE OR REPLACE FUNCTION public.company_public_verification(p_company_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH c AS (
    SELECT co.id, co.status, co.verification_summary
      FROM public.companies co
     WHERE co.id = p_company_id
       AND (co.status = 'verified' OR co.owner_id = auth.uid() OR public.is_admin())
  ),
  docs AS (
    SELECT d.type,
           bool_or(d.status = 'approved' OR (d.status <> 'rejected' AND c.status = 'verified')) AS ok
      FROM public.company_documents d
      JOIN c ON c.id = d.company_id
     GROUP BY d.type
  ),
  passed AS (
    SELECT k ->> 'key' AS key
      FROM c,
           jsonb_array_elements(
             CASE WHEN jsonb_typeof(c.verification_summary -> 'checks') = 'array'
                  THEN c.verification_summary -> 'checks' ELSE '[]'::jsonb END) AS k
     WHERE k ->> 'status' = 'passed'
  )
  SELECT jsonb_build_object(
           'registration', COALESCE((SELECT ok FROM docs WHERE type = 'business_license'), false)
                           OR EXISTS (SELECT 1 FROM passed WHERE key = 'kyb'),
           'tax',          COALESCE((SELECT ok FROM docs WHERE type = 'tax_registration'), false)
                           OR EXISTS (SELECT 1 FROM passed WHERE key = 'tax'),
           'address',      COALESCE((SELECT ok FROM docs WHERE type = 'proof_of_address'), false)
                           OR EXISTS (SELECT 1 FROM passed WHERE key = 'address'),
           'license',      EXISTS (SELECT 1 FROM passed WHERE key = 'license'),
           'site_visit',   EXISTS (SELECT 1 FROM passed WHERE key = 'site_visit'),
           'references',   (SELECT count(*) FROM public.company_references r
                             WHERE r.company_id = c.id AND r.status = 'approved'))
    FROM c;
$$;

REVOKE ALL ON FUNCTION public.company_public_verification(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.company_public_verification(uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.company_public_verification(uuid) IS
  'Public-safe verification facts of a company: booleans + approved reference count, from company_documents, legacy summary checks and company_references (00063).';
