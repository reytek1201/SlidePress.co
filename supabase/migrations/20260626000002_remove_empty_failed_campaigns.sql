-- Remove text-generation failures that should not appear in the campaigns list.

DELETE FROM public.campaigns AS c
WHERE c.status = 'failed'
  AND NOT EXISTS (
    SELECT 1 FROM public.slides AS s WHERE s.campaign_id = c.id
  );
