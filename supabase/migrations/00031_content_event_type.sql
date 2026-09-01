-- 00031: event_type for content_items (design 13 Events hub tabs/badges).
-- Events are content_items with type='event'; this classifies them for the
-- Conferences / B2B / Exhibitions / Training / Webinars / Trade Missions tabs
-- and the Forum/Summit/Conference featured badges.

ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS event_type TEXT
    CHECK (event_type IS NULL OR event_type IN (
      'conference', 'summit', 'forum', 'b2b_meeting',
      'exhibition', 'training', 'webinar', 'trade_mission'));

ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS organizer TEXT;

CREATE INDEX IF NOT EXISTS content_items_event_type_idx
  ON public.content_items (event_type) WHERE type = 'event';

COMMENT ON COLUMN public.content_items.event_type IS
  'Event classification for the Events hub (design 13). NULL for news/blog.';
COMMENT ON COLUMN public.content_items.organizer IS
  'Event organizer name (design 13). NULL for news/blog.';
