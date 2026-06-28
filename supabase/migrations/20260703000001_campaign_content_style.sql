ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS content_style TEXT
  CHECK (
    content_style IS NULL
    OR content_style IN (
      'pain_point',
      'announcement',
      'educational',
      'entertainment',
      'aspirational'
    )
  );

COMMENT ON COLUMN campaigns.content_style IS
  'Gemini-classified narrative style for slide structure';
