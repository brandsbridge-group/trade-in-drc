"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { User, Mail, Phone } from "lucide-react";

/**
 * Contact persons section (Req 3 — directory contact persons). Reads the
 * PII-safe `company_contacts_public` view (00020): rows are limited to public
 * contacts of verified companies, and email/phone are masked to NULL for anon
 * callers unless the company's contact_visibility is 'direct'. We therefore
 * never ship raw PII to a browser that should not see it — the view enforces
 * it at the database layer.
 */

interface ContactRow {
  id: string;
  name: string;
  title_en: string | null;
  title_fr: string | null;
  email: string | null;
  phone: string | null;
  sort_order: number;
}

function useContacts(companyId: string) {
  return useQuery({
    queryKey: ["company-contacts", companyId],
    queryFn: async (): Promise<ContactRow[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("company_contacts_public")
        .select("id, name, title_en, title_fr, email, phone, sort_order")
        .eq("company_id", companyId)
        .order("sort_order", { ascending: true });
      if (error) {
        if (error.code === "42P01") return [];
        throw error;
      }
      return ((data ?? []) as Array<Partial<ContactRow>>)
        .filter((r): r is ContactRow & { id: string; name: string } => Boolean(r.id && r.name))
        .map((r) => ({
          id: r.id,
          name: r.name,
          title_en: r.title_en ?? null,
          title_fr: r.title_fr ?? null,
          email: r.email ?? null,
          phone: r.phone ?? null,
          sort_order: r.sort_order ?? 0,
        }));
    },
    enabled: !!companyId,
  });
}

export function CompanyContacts({ companyId }: { companyId: string }) {
  const t = useTranslations("Marketplace.contacts");
  const locale = useLocale();
  const { data: contacts = [], isLoading, error } = useContacts(companyId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-muted-foreground">{t("error")}</p>;
  }

  if (contacts.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {contacts.map((c) => {
        const title = locale === "fr" ? c.title_fr : c.title_en;
        return (
          <div key={c.id} className="bg-card border rounded-md p-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{c.name}</p>
                {title && <p className="text-xs text-muted-foreground">{title}</p>}
                {c.email && (
                  <a
                    href={`mailto:${c.email}`}
                    className="text-xs text-primary inline-flex items-center gap-1 mt-1 hover:underline transition break-all"
                  >
                    <Mail className="w-3 h-3 shrink-0" aria-hidden />
                    {c.email}
                  </a>
                )}
                {c.phone && (
                  <a
                    href={`tel:${c.phone}`}
                    className="text-xs text-foreground/80 inline-flex items-center gap-1 mt-0.5 hover:underline transition"
                  >
                    <Phone className="w-3 h-3 shrink-0" aria-hidden />
                    {c.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
