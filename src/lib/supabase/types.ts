export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// String-union helpers for text columns that carry a DB-level CHECK constraint.
// Kept as named unions so feature code gets autocompletion + narrowing, while the
// underlying column remains a plain `text` in Postgres.
export type ProfileRole = "user" | "admin";
export type AccountType = "congolese_company" | "international_business";
export type StaffRole = "moderator" | "super_admin";
export type CompanyStatus = "pending" | "verified" | "rejected";
export type VerificationTier = "none" | "basic" | "verified" | "premium";
export type ContactVisibility = "direct" | "obfuscated" | "login_required";
export type CompanyDocumentType =
  | "business_license"
  | "tax_registration"
  | "proof_of_address"
  | "logo"
  | "photo"
  | "additional_document";
export type CompanyDocumentStatus = "pending" | "approved" | "rejected";
export type VerificationDecision =
  | "approved"
  | "rejected"
  | "more_info_requested"
  | "resubmitted";
export type RfqType = "supply" | "demand";
export type RfqStatus = "active" | "expired" | "closed";
export type AnalyticsEntityType = "company" | "product" | "rfq";
export type AnalyticsEventType =
  | "view"
  | "contact_request"
  | "rfq_board"
  | "profile_view"
  | "search_appearance"
  | "search_query";
export type KypCheckType = "origin" | "quality" | "quantity" | "custom";
export type KypCheckStatus = "pending" | "passed" | "failed";
export type KycStatus = "pending" | "passed" | "failed";
export type ContentItemType = "news" | "event" | "blog";
export type ContentItemStatus = "draft" | "published" | "archived";
export type SegmentKey =
  | "manufacturer"
  | "importer"
  | "exporter"
  | "finance"
  | "logistics"
  | "government"
  | "public_corp"
  | "facilitation"
  | "investors";
export type ServiceType = "consulting" | "logistics" | "finance" | "legal" | "custom" | "other";
export type ServiceDeliveryMode = "on_request" | "subscription" | "one_off" | "retainer";
export type ServiceStatus = "active" | "paused" | "archived";
export type OpportunityCategory =
  | "tender"
  | "ppp"
  | "investment_call"
  | "offer"
  | "demand"
  | "quotation"
  | "partner_search"
  | "project_launch";
export type OpportunityStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected"
  | "expired";
export type ReportKind = "market_report" | "legal_guide" | "regulation";
export type ReportStatus = "draft" | "published" | "archived";
export type PriceSeriesStatus = "draft" | "published" | "archived";
export type MessageReportStatus = "open" | "reviewed" | "dismissed" | "actioned";
export type PageContentStatus = "draft" | "published";
export type ContactSubmissionStatus = "new" | "read" | "archived" | "spam";
export type CompanyMediaKind = "gallery" | "brochure" | "video";
export type CompanyReferenceStatus = "pending" | "approved" | "rejected";
export type OpportunityModerationAction = "approved" | "rejected" | "requested_changes";
// -- 00022_requests_and_premium --
export type BusinessRequestKind = "business" | "service";
export type BusinessRequestIntent =
  | "find_partner"
  | "invest"
  | "sell"
  | "buy"
  | "publish_opportunity"
  | "register_company"
  | "market_report"
  | "business_mission"
  | "partner_search"
  | "market_entry"
  | "business_verification"
  | "b2b_meeting"
  | "local_representation"
  | "delegation"
  | "other";
export type BusinessRequestStatus =
  | "new"
  | "in_progress"
  | "converted"
  | "pending"
  | "closed"
  | "rejected";
export type PremiumPlan = "congolese" | "international" | "international_strategic";
export type PremiumRequestStatus = "pending" | "approved" | "rejected" | "cancelled";
export type PremiumBillingPeriod = "year";

export interface Database {
  public: {
    Tables: {
      // -- 00001_initial_schema --------------------------------------------
      profiles: {
        Row: {
          id: string;
          role: ProfileRole;
          full_name: string | null;
          avatar_url: string | null;
          // 00013_rbac_roles
          account_type: AccountType | null;
          staff_role: StaffRole | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: ProfileRole;
          full_name?: string | null;
          avatar_url?: string | null;
          account_type?: AccountType | null;
          staff_role?: StaffRole | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: ProfileRole;
          full_name?: string | null;
          avatar_url?: string | null;
          account_type?: AccountType | null;
          staff_role?: StaffRole | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sectors: {
        Row: {
          id: string;
          name_en: string;
          name_fr: string;
          slug: string;
          parent_id: string | null;
        };
        Insert: {
          id?: string;
          name_en: string;
          name_fr: string;
          slug: string;
          parent_id?: string | null;
        };
        Update: {
          id?: string;
          name_en?: string;
          name_fr?: string;
          slug?: string;
          parent_id?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name_en: string;
          name_fr: string;
          slug: string;
          sector_id: string;
        };
        Insert: {
          id?: string;
          name_en: string;
          name_fr: string;
          slug: string;
          sector_id: string;
        };
        Update: {
          id?: string;
          name_en?: string;
          name_fr?: string;
          slug?: string;
          sector_id?: string;
        };
        Relationships: [];
      };
      market_metrics: {
        Row: { id: string; key: string; label_en: string; label_fr: string; value_display: string; value_numeric: number | null; delta_pct: number | null; period_en: string | null; period_fr: string | null; sort_order: number; updated_at: string; };
        Insert: { id?: string; key: string; label_en: string; label_fr: string; value_display: string; value_numeric?: number | null; delta_pct?: number | null; period_en?: string | null; period_fr?: string | null; sort_order?: number; updated_at?: string; };
        Update: { id?: string; key?: string; label_en?: string; label_fr?: string; value_display?: string; value_numeric?: number | null; delta_pct?: number | null; period_en?: string | null; period_fr?: string | null; sort_order?: number; updated_at?: string; };
        Relationships: [];
      };
      trade_series: {
        Row: { id: string; month: string; exports_usd: number; imports_usd: number; };
        Insert: { id?: string; month: string; exports_usd: number; imports_usd: number; };
        Update: { id?: string; month?: string; exports_usd?: number; imports_usd?: number; };
        Relationships: [];
      };
      sector_activity: {
        Row: { id: string; label_en: string; label_fr: string; trade_value_usd: number; sort_order: number; };
        Insert: { id?: string; label_en: string; label_fr: string; trade_value_usd: number; sort_order?: number; };
        Update: { id?: string; label_en?: string; label_fr?: string; trade_value_usd?: number; sort_order?: number; };
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          sector_id: string | null;
          status: CompanyStatus;
          contact_email: string | null;
          contact_phone: string | null;
          website: string | null;
          address: string | null;
          city: string | null;
          province: string | null;
          country: string | null;
          registration_profile: string | null;
          logo_url: string | null;
          // 00004_trust_center
          verification_tier: VerificationTier;
          verified_at: string | null;
          verification_summary: Json | null;
          // 00009_global_search (tsvector; serialized as string by PostgREST)
          search_en: string | null;
          search_fr: string | null;
          // 00012_message_reports_and_rls
          contact_visibility: ContactVisibility;
          // 00017_page_content
          slug: string | null;
          // 00018_company_rich_profile
          production_capacity: string | null;
          moq: string | null;
          lead_time: string | null;
          markets: string[];
          spoken_languages: string[];
          certifications: string[];
          // 00022_requests_and_premium (admin-only; REVOKE'd from owners)
          is_premium: boolean;
          premium_plan: PremiumPlan | null;
          premium_since: string | null;
          premium_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          sector_id?: string | null;
          status?: CompanyStatus;
          contact_email?: string | null;
          contact_phone?: string | null;
          website?: string | null;
          address?: string | null;
          city?: string | null;
          province?: string | null;
          country?: string | null;
          registration_profile?: string | null;
          logo_url?: string | null;
          verification_tier?: VerificationTier;
          verified_at?: string | null;
          verification_summary?: Json | null;
          search_en?: string | null;
          search_fr?: string | null;
          contact_visibility?: ContactVisibility;
          slug?: string | null;
          production_capacity?: string | null;
          moq?: string | null;
          lead_time?: string | null;
          markets?: string[];
          spoken_languages?: string[];
          certifications?: string[];
          is_premium?: boolean;
          premium_plan?: PremiumPlan | null;
          premium_since?: string | null;
          premium_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          sector_id?: string | null;
          status?: CompanyStatus;
          contact_email?: string | null;
          contact_phone?: string | null;
          website?: string | null;
          address?: string | null;
          city?: string | null;
          province?: string | null;
          country?: string | null;
          registration_profile?: string | null;
          logo_url?: string | null;
          verification_tier?: VerificationTier;
          verified_at?: string | null;
          verification_summary?: Json | null;
          search_en?: string | null;
          search_fr?: string | null;
          contact_visibility?: ContactVisibility;
          slug?: string | null;
          production_capacity?: string | null;
          moq?: string | null;
          lead_time?: string | null;
          markets?: string[];
          spoken_languages?: string[];
          certifications?: string[];
          is_premium?: boolean;
          premium_plan?: PremiumPlan | null;
          premium_since?: string | null;
          premium_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      company_documents: {
        Row: {
          id: string;
          company_id: string;
          type: CompanyDocumentType;
          file_url: string;
          file_name: string;
          status: CompanyDocumentStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          type: CompanyDocumentType;
          file_url: string;
          file_name: string;
          status?: CompanyDocumentStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          type?: CompanyDocumentType;
          file_url?: string;
          file_name?: string;
          status?: CompanyDocumentStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          description: string | null;
          category_id: string | null;
          images: string[];
          specs: Json | null;
          // 00009_global_search
          search_en: string | null;
          search_fr: string | null;
          // 00018_company_rich_profile (bilingual additions; legacy name/description retained)
          name_en: string | null;
          name_fr: string | null;
          description_en: string | null;
          description_fr: string | null;
          video_embed: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          description?: string | null;
          category_id?: string | null;
          images?: string[];
          specs?: Json | null;
          search_en?: string | null;
          search_fr?: string | null;
          name_en?: string | null;
          name_fr?: string | null;
          description_en?: string | null;
          description_fr?: string | null;
          video_embed?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          description?: string | null;
          category_id?: string | null;
          images?: string[];
          specs?: Json | null;
          search_en?: string | null;
          search_fr?: string | null;
          name_en?: string | null;
          name_fr?: string | null;
          description_en?: string | null;
          description_fr?: string | null;
          video_embed?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rfq_listings: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          description: string | null;
          type: RfqType;
          status: RfqStatus;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          title: string;
          description?: string | null;
          type: RfqType;
          status?: RfqStatus;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          title?: string;
          description?: string | null;
          type?: RfqType;
          status?: RfqStatus;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          company_id: string;
          initiator_id: string;
          subject: string | null;
          opportunity_id: string | null;
          last_message_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          initiator_id: string;
          subject?: string | null;
          opportunity_id?: string | null;
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          initiator_id?: string;
          subject?: string | null;
          opportunity_id?: string | null;
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversation_participants: {
        Row: {
          conversation_id: string;
          user_id: string;
          last_read_at: string | null;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
          last_read_at?: string | null;
        };
        Update: {
          conversation_id?: string;
          user_id?: string;
          last_read_at?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      verification_reviews: {
        Row: {
          id: string;
          company_id: string;
          admin_id: string;
          decision: VerificationDecision;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          admin_id: string;
          decision: VerificationDecision;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          admin_id?: string;
          decision?: VerificationDecision;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: string;
          entity_type: AnalyticsEntityType;
          entity_id: string;
          event_type: AnalyticsEventType;
          visitor_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: AnalyticsEntityType;
          entity_id: string;
          event_type: AnalyticsEventType;
          visitor_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: AnalyticsEntityType;
          entity_id?: string;
          event_type?: AnalyticsEventType;
          visitor_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      // -- 00004_trust_center ----------------------------------------------
      kyp_checks: {
        Row: {
          id: string;
          product_id: string;
          type: KypCheckType;
          status: KypCheckStatus;
          summary: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          type: KypCheckType;
          status?: KypCheckStatus;
          summary?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          type?: KypCheckType;
          status?: KypCheckStatus;
          summary?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      kyc_individuals: {
        Row: {
          id: string;
          profile_id: string;
          id_doc_status: KycStatus;
          address_status: KycStatus;
          summary: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          id_doc_status?: KycStatus;
          address_status?: KycStatus;
          summary?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          id_doc_status?: KycStatus;
          address_status?: KycStatus;
          summary?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // -- 00005_content_items ---------------------------------------------
      content_items: {
        Row: {
          id: string;
          type: ContentItemType;
          slug: string;
          title_en: string;
          title_fr: string;
          excerpt_en: string | null;
          excerpt_fr: string | null;
          body_en: string;
          body_fr: string;
          cover_url: string | null;
          author_id: string | null;
          status: ContentItemStatus;
          published_at: string | null;
          event_start_at: string | null;
          event_end_at: string | null;
          event_location: string | null;
          event_type: string | null;
          organizer: string | null;
          tags: string[];
          sector_id: string | null;
          // 00009_global_search
          search_en: string | null;
          search_fr: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: ContentItemType;
          slug: string;
          title_en: string;
          title_fr: string;
          excerpt_en?: string | null;
          excerpt_fr?: string | null;
          body_en?: string;
          body_fr?: string;
          cover_url?: string | null;
          author_id?: string | null;
          status?: ContentItemStatus;
          published_at?: string | null;
          event_start_at?: string | null;
          event_end_at?: string | null;
          event_location?: string | null;
          event_type?: string | null;
          organizer?: string | null;
          tags?: string[];
          sector_id?: string | null;
          search_en?: string | null;
          search_fr?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: ContentItemType;
          slug?: string;
          title_en?: string;
          title_fr?: string;
          excerpt_en?: string | null;
          excerpt_fr?: string | null;
          body_en?: string;
          body_fr?: string;
          cover_url?: string | null;
          author_id?: string | null;
          status?: ContentItemStatus;
          published_at?: string | null;
          event_start_at?: string | null;
          event_end_at?: string | null;
          event_location?: string | null;
          event_type?: string | null;
          organizer?: string | null;
          tags?: string[];
          sector_id?: string | null;
          search_en?: string | null;
          search_fr?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // -- 00006_marketplace_segments --------------------------------------
      segments: {
        Row: {
          key: SegmentKey;
          name_en: string;
          name_fr: string;
          description_en: string | null;
          description_fr: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          key: SegmentKey;
          name_en: string;
          name_fr: string;
          description_en?: string | null;
          description_fr?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          key?: SegmentKey;
          name_en?: string;
          name_fr?: string;
          description_en?: string | null;
          description_fr?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      institutions: {
        Row: {
          id: string;
          acronym: string | null;
          name_en: string;
          name_fr: string;
          category: string;
          description_en: string | null;
          description_fr: string | null;
          city: string | null;
          province: string | null;
          website: string | null;
          email: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          acronym?: string | null;
          name_en: string;
          name_fr: string;
          category: string;
          description_en?: string | null;
          description_fr?: string | null;
          city?: string | null;
          province?: string | null;
          website?: string | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          acronym?: string | null;
          name_en?: string;
          name_fr?: string;
          category?: string;
          description_en?: string | null;
          description_fr?: string | null;
          city?: string | null;
          province?: string | null;
          website?: string | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      company_segments: {
        Row: {
          company_id: string;
          segment_key: SegmentKey;
          created_at: string;
        };
        Insert: {
          company_id: string;
          segment_key: SegmentKey;
          created_at?: string;
        };
        Update: {
          company_id?: string;
          segment_key?: SegmentKey;
          created_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
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
          // 00009_global_search
          search_en: string | null;
          search_fr: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name_en: string;
          name_fr: string;
          description_en?: string | null;
          description_fr?: string | null;
          category_id?: string | null;
          service_type?: ServiceType;
          delivery_mode?: ServiceDeliveryMode;
          price_indication_en?: string | null;
          price_indication_fr?: string | null;
          status?: ServiceStatus;
          search_en?: string | null;
          search_fr?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name_en?: string;
          name_fr?: string;
          description_en?: string | null;
          description_fr?: string | null;
          category_id?: string | null;
          service_type?: ServiceType;
          delivery_mode?: ServiceDeliveryMode;
          price_indication_en?: string | null;
          price_indication_fr?: string | null;
          status?: ServiceStatus;
          search_en?: string | null;
          search_fr?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // -- 00007_opportunities ---------------------------------------------
      opportunities: {
        Row: {
          id: string;
          company_id: string;
          category: OpportunityCategory;
          slug: string;
          title_en: string;
          title_fr: string;
          summary_en: string;
          summary_fr: string;
          body_en: string;
          body_fr: string;
          budget_min: number | null;
          budget_max: number | null;
          budget_currency: string | null;
          deadline_at: string | null;
          sector_id: string | null;
          region: string | null;
          status: OpportunityStatus;
          rejected_reason: string | null;
          published_at: string | null;
          // 00009_global_search
          search_en: string | null;
          search_fr: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          category: OpportunityCategory;
          slug: string;
          title_en: string;
          title_fr: string;
          summary_en: string;
          summary_fr: string;
          body_en?: string;
          body_fr?: string;
          budget_min?: number | null;
          budget_max?: number | null;
          budget_currency?: string | null;
          deadline_at?: string | null;
          sector_id?: string | null;
          region?: string | null;
          status?: OpportunityStatus;
          rejected_reason?: string | null;
          published_at?: string | null;
          search_en?: string | null;
          search_fr?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          category?: OpportunityCategory;
          slug?: string;
          title_en?: string;
          title_fr?: string;
          summary_en?: string;
          summary_fr?: string;
          body_en?: string;
          body_fr?: string;
          budget_min?: number | null;
          budget_max?: number | null;
          budget_currency?: string | null;
          deadline_at?: string | null;
          sector_id?: string | null;
          region?: string | null;
          status?: OpportunityStatus;
          rejected_reason?: string | null;
          published_at?: string | null;
          search_en?: string | null;
          search_fr?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // -- 00008_data_hub --------------------------------------------------
      reports: {
        Row: {
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
          // 00009_global_search
          search_en: string | null;
          search_fr: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          kind: ReportKind;
          slug: string;
          title_en: string;
          title_fr: string;
          summary_en?: string | null;
          summary_fr?: string | null;
          body_en?: string;
          body_fr?: string;
          attachment_url?: string | null;
          sector_id?: string | null;
          status?: ReportStatus;
          published_at?: string | null;
          search_en?: string | null;
          search_fr?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          kind?: ReportKind;
          slug?: string;
          title_en?: string;
          title_fr?: string;
          summary_en?: string | null;
          summary_fr?: string | null;
          body_en?: string;
          body_fr?: string;
          attachment_url?: string | null;
          sector_id?: string | null;
          status?: ReportStatus;
          published_at?: string | null;
          search_en?: string | null;
          search_fr?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      price_series: {
        Row: {
          id: string;
          commodity_en: string;
          commodity_fr: string;
          unit: string;
          currency: string;
          sector_id: string | null;
          source: string | null;
          status: PriceSeriesStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          commodity_en: string;
          commodity_fr: string;
          unit: string;
          currency?: string;
          sector_id?: string | null;
          source?: string | null;
          status?: PriceSeriesStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          commodity_en?: string;
          commodity_fr?: string;
          unit?: string;
          currency?: string;
          sector_id?: string | null;
          source?: string | null;
          status?: PriceSeriesStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      price_points: {
        Row: {
          id: string;
          series_id: string;
          observed_at: string;
          value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          series_id: string;
          observed_at: string;
          value: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          series_id?: string;
          observed_at?: string;
          value?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      // -- 00012_message_reports_and_rls -----------------------------------
      message_reports: {
        Row: {
          id: string;
          message_id: string;
          conversation_id: string;
          reporter_id: string;
          reason: string;
          details: string | null;
          status: MessageReportStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          conversation_id: string;
          reporter_id: string;
          reason: string;
          details?: string | null;
          status?: MessageReportStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          conversation_id?: string;
          reporter_id?: string;
          reason?: string;
          details?: string | null;
          status?: MessageReportStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // -- 00014_taxonomy_hs_tags ------------------------------------------
      hs_codes: {
        Row: {
          id: string;
          code: string;
          name_en: string;
          name_fr: string;
          parent_code: string | null;
          sector_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name_en: string;
          name_fr: string;
          parent_code?: string | null;
          sector_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name_en?: string;
          name_fr?: string;
          parent_code?: string | null;
          sector_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          slug: string;
          name_en: string;
          name_fr: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name_en: string;
          name_fr: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name_en?: string;
          name_fr?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      company_hs_codes: {
        Row: {
          id: string;
          company_id: string;
          hs_code_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          hs_code_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          hs_code_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      company_tags: {
        Row: {
          id: string;
          company_id: string;
          tag_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          tag_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          tag_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // -- 00015_audit_log -------------------------------------------------
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          summary: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          summary?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          summary?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // -- 00016_site_settings_homepage ------------------------------------
      site_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      carousel_slides: {
        Row: {
          id: string;
          title_en: string;
          title_fr: string;
          subtitle_en: string | null;
          subtitle_fr: string | null;
          image_url: string;
          cta_label_en: string | null;
          cta_label_fr: string | null;
          cta_href: string | null;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title_en: string;
          title_fr: string;
          subtitle_en?: string | null;
          subtitle_fr?: string | null;
          image_url: string;
          cta_label_en?: string | null;
          cta_label_fr?: string | null;
          cta_href?: string | null;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title_en?: string;
          title_fr?: string;
          subtitle_en?: string | null;
          subtitle_fr?: string | null;
          image_url?: string;
          cta_label_en?: string | null;
          cta_label_fr?: string | null;
          cta_href?: string | null;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      featured_companies: {
        Row: {
          id: string;
          company_id: string;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // -- 00017_page_content ----------------------------------------------
      page_content: {
        Row: {
          id: string;
          slug: string;
          title_en: string;
          title_fr: string;
          body_en: Json;
          body_fr: Json;
          status: PageContentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title_en: string;
          title_fr: string;
          body_en?: Json;
          body_fr?: Json;
          status?: PageContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title_en?: string;
          title_fr?: string;
          body_en?: Json;
          body_fr?: Json;
          status?: PageContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      faqs: {
        Row: {
          id: string;
          question_en: string;
          question_fr: string;
          answer_en: string;
          answer_fr: string;
          category: string | null;
          sort_order: number;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question_en: string;
          question_fr: string;
          answer_en: string;
          answer_fr: string;
          category?: string | null;
          sort_order?: number;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question_en?: string;
          question_fr?: string;
          answer_en?: string;
          answer_fr?: string;
          category?: string | null;
          sort_order?: number;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      help_articles: {
        Row: {
          id: string;
          slug: string;
          title_en: string;
          title_fr: string;
          body_en: Json;
          body_fr: Json;
          category: string | null;
          sort_order: number;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title_en: string;
          title_fr: string;
          body_en?: Json;
          body_fr?: Json;
          category?: string | null;
          sort_order?: number;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title_en?: string;
          title_fr?: string;
          body_en?: Json;
          body_fr?: Json;
          category?: string | null;
          sort_order?: number;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contact_submissions: {
        Row: {
          id: string;
          name: string;
          email: string;
          subject: string | null;
          message: string;
          locale: string | null;
          status: ContactSubmissionStatus;
          ip: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          subject?: string | null;
          message: string;
          locale?: string | null;
          status?: ContactSubmissionStatus;
          ip?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          subject?: string | null;
          message?: string;
          locale?: string | null;
          status?: ContactSubmissionStatus;
          ip?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // -- 00018_company_rich_profile --------------------------------------
      company_media: {
        Row: {
          id: string;
          company_id: string;
          kind: CompanyMediaKind;
          url: string;
          title_en: string | null;
          title_fr: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          kind: CompanyMediaKind;
          url: string;
          title_en?: string | null;
          title_fr?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          kind?: CompanyMediaKind;
          url?: string;
          title_en?: string | null;
          title_fr?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // -- 00019_verified_references ---------------------------------------
      company_references: {
        Row: {
          id: string;
          company_id: string;
          referenced_company_id: string | null;
          referenced_name: string | null;
          relationship: string | null;
          note_en: string | null;
          note_fr: string | null;
          status: CompanyReferenceStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          referenced_company_id?: string | null;
          referenced_name?: string | null;
          relationship?: string | null;
          note_en?: string | null;
          note_fr?: string | null;
          status?: CompanyReferenceStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          referenced_company_id?: string | null;
          referenced_name?: string | null;
          relationship?: string | null;
          note_en?: string | null;
          note_fr?: string | null;
          status?: CompanyReferenceStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // -- 00020_company_contacts ------------------------------------------
      company_contacts: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          title_en: string | null;
          title_fr: string | null;
          email: string | null;
          phone: string | null;
          is_public: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          title_en?: string | null;
          title_fr?: string | null;
          email?: string | null;
          phone?: string | null;
          is_public?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          title_en?: string | null;
          title_fr?: string | null;
          email?: string | null;
          phone?: string | null;
          is_public?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // -- 00021_opportunity_moderation_and_responses ----------------------
      opportunity_moderation_events: {
        Row: {
          id: string;
          opportunity_id: string;
          actor_id: string;
          action: OpportunityModerationAction;
          reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          opportunity_id: string;
          actor_id: string;
          action: OpportunityModerationAction;
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          opportunity_id?: string;
          actor_id?: string;
          action?: OpportunityModerationAction;
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      opportunity_responses: {
        Row: {
          id: string;
          opportunity_id: string;
          responder_id: string;
          company_id: string | null;
          message: string;
          conversation_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          opportunity_id: string;
          responder_id: string;
          company_id?: string | null;
          message: string;
          conversation_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          opportunity_id?: string;
          responder_id?: string;
          company_id?: string | null;
          message?: string;
          conversation_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // -- 00022_requests_and_premium --------------------------------------
      business_requests: {
        Row: {
          id: string;
          submitter_id: string | null;
          company_id: string | null;
          kind: BusinessRequestKind;
          intent: BusinessRequestIntent;
          full_name: string;
          company_name: string | null;
          country: string | null;
          email: string;
          phone: string | null;
          sector: string | null;
          preferred_location: string | null;
          timeline: string | null;
          message: string;
          promotion_plan: string | null;
          promotion_amount_usd: number | null;
          status: BusinessRequestStatus;
          follow_up_owner: string | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          submitter_id?: string | null;
          company_id?: string | null;
          kind?: BusinessRequestKind;
          intent?: BusinessRequestIntent;
          full_name: string;
          company_name?: string | null;
          country?: string | null;
          email: string;
          phone?: string | null;
          sector?: string | null;
          preferred_location?: string | null;
          timeline?: string | null;
          message: string;
          status?: BusinessRequestStatus;
          follow_up_owner?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          submitter_id?: string | null;
          company_id?: string | null;
          kind?: BusinessRequestKind;
          intent?: BusinessRequestIntent;
          full_name?: string;
          company_name?: string | null;
          country?: string | null;
          email?: string;
          phone?: string | null;
          sector?: string | null;
          preferred_location?: string | null;
          timeline?: string | null;
          message?: string;
          promotion_plan?: string | null;
          promotion_amount_usd?: number | null;
          status?: BusinessRequestStatus;
          follow_up_owner?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      premium_requests: {
        Row: {
          id: string;
          company_id: string;
          requested_by: string;
          plan: PremiumPlan;
          amount_usd: number;
          billing_period: PremiumBillingPeriod;
          status: PremiumRequestStatus;
          admin_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          requested_by: string;
          plan: PremiumPlan;
          amount_usd: number;
          billing_period?: PremiumBillingPeriod;
          status?: PremiumRequestStatus;
          admin_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          requested_by?: string;
          plan?: PremiumPlan;
          amount_usd?: number;
          billing_period?: PremiumBillingPeriod;
          status?: PremiumRequestStatus;
          admin_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      // -- 00012_message_reports_and_rls (PII-masked, status='verified' only)
      companies_public: {
        Row: {
          id: string | null;
          owner_id: string | null;
          name: string | null;
          description: string | null;
          sector_id: string | null;
          status: CompanyStatus | null;
          website: string | null;
          address: string | null;
          city: string | null;
          province: string | null;
          country: string | null;
          logo_url: string | null;
          contact_visibility: ContactVisibility | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Relationships: [];
      };
      // -- 00020_company_contacts (email/phone masked for anon callers)
      company_contacts_public: {
        Row: {
          id: string | null;
          company_id: string | null;
          name: string | null;
          title_en: string | null;
          title_fr: string | null;
          email: string | null;
          phone: string | null;
          is_public: boolean | null;
          sort_order: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: Record<string, unknown>;
  };
}
