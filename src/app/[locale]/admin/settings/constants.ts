import { z } from "zod";
import { dbId } from "@/lib/validation/db-id";

/**
 * Non-action constants, types, and Zod schemas for the admin settings cluster
 * (general site settings, homepage carousel, featured companies).
 *
 * These live OUTSIDE `actions.ts` because that file is a `"use server"` module,
 * which may only export async functions. Client components import the types and
 * defaults from here; the server actions import the schemas from here.
 */

export interface ActionResult {
  ok: boolean;
  error?: string;
}

// --- General site settings -------------------------------------------------

/** The `site_settings.key` row that stores the branding / general settings blob. */
export const GENERAL_SETTINGS_KEY = "general";

export interface GeneralSettings {
  site_tagline_en: string;
  site_tagline_fr: string;
  contact_email: string;
  support_phone: string;
  homepage_carousel_enabled: boolean;
}

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  site_tagline_en: "",
  site_tagline_fr: "",
  contact_email: "",
  support_phone: "",
  homepage_carousel_enabled: true,
};

export const generalSettingsSchema = z.object({
  site_tagline_en: z.string().max(160),
  site_tagline_fr: z.string().max(160),
  contact_email: z.string().email().or(z.literal("")),
  support_phone: z.string().max(40),
  homepage_carousel_enabled: z.boolean(),
});

// --- Carousel slides -------------------------------------------------------

export interface CarouselSlideInput {
  id?: string;
  title_en: string;
  title_fr: string;
  subtitle_en: string;
  subtitle_fr: string;
  image_url: string;
  cta_label_en: string;
  cta_label_fr: string;
  cta_href: string;
  sort_order: number;
  active: boolean;
}

export interface CarouselSlideRow extends CarouselSlideInput {
  id: string;
}

export const carouselSchema = z.object({
  id: dbId().optional(),
  title_en: z.string().min(1).max(120),
  title_fr: z.string().min(1).max(120),
  subtitle_en: z.string().max(240),
  subtitle_fr: z.string().max(240),
  image_url: z.string().url(),
  cta_label_en: z.string().max(60),
  cta_label_fr: z.string().max(60),
  cta_href: z.string().max(300),
  sort_order: z.number().int().min(0),
  active: z.boolean(),
});

// --- Featured companies ----------------------------------------------------

export interface CompanyOption {
  id: string;
  name: string;
}

export interface FeaturedCompanyRow {
  id: string;
  companyId: string;
  companyName: string;
  sortOrder: number;
  active: boolean;
}

export const featuredSchema = z.object({
  company_id: dbId(),
  sort_order: z.number().int().min(0),
  active: z.boolean(),
});
