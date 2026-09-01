import type { SegmentKey } from "./segments";

export interface Segment {
  key: SegmentKey;
  name_en: string;
  name_fr: string;
  description_en: string | null;
  description_fr: string | null;
  sort_order: number;
}

export interface CompanySegment {
  company_id: string;
  segment_key: SegmentKey;
}

export type ServiceType = "consulting" | "logistics" | "finance" | "legal" | "custom" | "other";
export type ServiceDeliveryMode = "on_request" | "subscription" | "one_off" | "retainer";
export type ServiceStatus = "active" | "paused" | "archived";

export interface Service {
  id: string;
  company_id: string;
  name_en: string;
  name_fr: string;
  description_en: string | null;
  description_fr: string | null;
  category_id: string | null;
  service_type: ServiceType;
  delivery_mode: ServiceDeliveryMode;
  price_indication_en: string | null;
  price_indication_fr: string | null;
  status: ServiceStatus;
  created_at: string;
  updated_at: string;
}
