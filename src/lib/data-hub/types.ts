import type { ReportKind } from "./kinds";

export type ReportStatus = "draft" | "published" | "archived";

export interface Report {
  id: string;
  kind: ReportKind;
  slug: string;
  title_en: string;
  title_fr: string;
  summary_en: string | null;
  summary_fr: string | null;
  body_en: string;
  body_fr: string;
  attachment_url: string | null;
  sector_id: string | null;
  status: ReportStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriceSeries {
  id: string;
  commodity_en: string;
  commodity_fr: string;
  unit: string;
  currency: string;
  sector_id: string | null;
  source: string | null;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

export interface PricePoint {
  id: string;
  series_id: string;
  observed_at: string;
  value: number;
  created_at: string;
}
