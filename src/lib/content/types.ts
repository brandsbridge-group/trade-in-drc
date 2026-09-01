export type ContentType = "news" | "event" | "blog";
export type ContentStatus = "draft" | "published" | "archived";

export interface ContentItem {
  id: string;
  type: ContentType;
  slug: string;
  title_en: string;
  title_fr: string;
  excerpt_en: string | null;
  excerpt_fr: string | null;
  body_en: string;
  body_fr: string;
  cover_url: string | null;
  author_id: string | null;
  status: ContentStatus;
  published_at: string | null;
  event_start_at: string | null;
  event_end_at: string | null;
  event_location: string | null;
  tags: string[];
  sector_id: string | null;
  created_at: string;
  updated_at: string;
}
