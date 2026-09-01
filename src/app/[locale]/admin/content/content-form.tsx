"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/content/slug";
import { locales, type Locale } from "@/config/locales";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AssetUploader } from "@/components/admin/asset-uploader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ContentItem, ContentType, ContentStatus } from "@/lib/content/types";

const STATUS_OPTIONS: ContentStatus[] = ["draft", "published", "archived"];

// EN + FR must always be filled; the three additional locales are optional and
// fall back to English via pickLocalized() on the public surfaces.
const REQUIRED_LOCALES: Locale[] = ["en", "fr"];

// Postgres unique-violation SQLSTATE. content_items has UNIQUE (type, slug)
// (migration 00005), so a duplicate slug surfaces as this code.
const PG_UNIQUE_VIOLATION = "23505";

/** Narrow an unknown error to "is this a duplicate-slug unique violation?". */
function isSlugCollision(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === PG_UNIQUE_VIOLATION
  );
}

/** Per-locale editable text fields for one content item. */
interface LocaleText {
  title: string;
  excerpt: string;
  body: string;
}

/** Seed a locale's fields from the initial row's `<base>_<locale>` columns. */
function initLocaleText(initial: Partial<ContentItem> | undefined, locale: Locale): LocaleText {
  const row = (initial ?? {}) as Record<string, unknown>;
  return {
    title: (row[`title_${locale}`] as string | null) ?? "",
    excerpt: (row[`excerpt_${locale}`] as string | null) ?? "",
    body: (row[`body_${locale}`] as string | null) ?? "",
  };
}

interface ContentFormProps {
  type: ContentType;
  initial?: Partial<ContentItem>;
  mode: "create" | "edit";
}

export function ContentForm({ type, initial, mode }: ContentFormProps) {
  const t = useTranslations("Content.admin");
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  // One text bundle per locale, plus the active editing tab.
  const [content, setContent] = React.useState<Record<Locale, LocaleText>>(
    () =>
      Object.fromEntries(
        locales.map((l) => [l, initLocaleText(initial, l)])
      ) as Record<Locale, LocaleText>
  );
  const [activeLocale, setActiveLocale] = React.useState<Locale>("en");

  // Language-neutral fields.
  const [coverUrl, setCoverUrl] = React.useState(initial?.cover_url ?? "");
  const [tags, setTags] = React.useState((initial?.tags ?? []).join(", "));
  const [slug, setSlug] = React.useState(initial?.slug ?? "");
  const [status, setStatus] = React.useState<ContentStatus>(initial?.status ?? "draft");
  // Event-only fields
  const [eventStartAt, setEventStartAt] = React.useState(
    initial?.event_start_at ? initial.event_start_at.slice(0, 16) : ""
  );
  const [eventEndAt, setEventEndAt] = React.useState(
    initial?.event_end_at ? initial.event_end_at.slice(0, 16) : ""
  );
  const [eventLocation, setEventLocation] = React.useState(initial?.event_location ?? "");

  const setField = (locale: Locale, field: keyof LocaleText, value: string) =>
    setContent((prev) => ({ ...prev, [locale]: { ...prev[locale], [field]: value } }));

  // Editing the EN title auto-derives the slug while it tracks the old EN title.
  const handleTitleChange = (locale: Locale, value: string) => {
    if (locale === "en" && (!initial?.slug || slug === slugify(content.en.title))) {
      setSlug(slugify(value));
    }
    setField(locale, "title", value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Manual validation: with tabbed inputs only the active locale is mounted,
    // so HTML `required` can't see the others. Jump to the first offending tab.
    const missing = REQUIRED_LOCALES.find(
      (l) => !content[l].title.trim() || !content[l].body.trim()
    );
    if (missing) {
      setActiveLocale(missing);
      toast.error(t("requiredLangMissing"));
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();

      // Expand the per-locale bundles into flat `<base>_<locale>` columns.
      // Required locales persist "" (NOT NULL columns); optional locales persist
      // null when blank so pickLocalized() falls back to English.
      const localeColumns: Record<string, unknown> = {};
      for (const l of locales) {
        const required = REQUIRED_LOCALES.includes(l);
        localeColumns[`title_${l}`] = content[l].title || (required ? "" : null);
        localeColumns[`excerpt_${l}`] = content[l].excerpt || null;
        localeColumns[`body_${l}`] = content[l].body || (required ? "" : null);
      }

      const payload: Record<string, unknown> = {
        type,
        ...localeColumns,
        cover_url: coverUrl || null,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        slug: slug || slugify(content.en.title),
        status,
        ...(type === "event" && {
          event_start_at: eventStartAt || null,
          event_end_at: eventEndAt || null,
          event_location: eventLocation || null,
        }),
      };

      if (mode === "create") {
        const { data, error } = await supabase
          .from("content_items")
          .insert(payload as never)
          .select()
          .single();
        if (error) throw error;
        toast.success(t("created"));
        const newItem = data as unknown as ContentItem;
        router.push(`/admin/content/${type}/${newItem.id}`);
      } else {
        const { error } = await supabase
          .from("content_items")
          .update(payload as never)
          .eq("id", initial!.id!)
          .select()
          .single();
        if (error) throw error;
        toast.success(t("saved"));
      }
    } catch (err) {
      const message = isSlugCollision(err)
        ? t("slugTaken")
        : err instanceof Error
          ? err.message
          : t("saveError");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t("deleteConfirm"))) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("content_items")
        .delete()
        .eq("id", initial!.id!);
      if (error) throw error;
      toast.success(t("deleted"));
      router.push(`/admin/content/${type}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("deleteError");
      toast.error(message);
      setDeleting(false);
    }
  };

  const active = content[activeLocale];
  const titleRequired = REQUIRED_LOCALES.includes(activeLocale);

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {mode === "create" ? t(`newKind.${type}`) : t(`editKind.${type}`)}
        </h2>
        <div className="flex gap-2">
          {mode === "edit" && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t("deleting") : t("delete")}
            </Button>
          )}
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? t("saving") : t("save")}
          </Button>
        </div>
      </div>

      {/* Status + Slug row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">{t("fields.status")}</label>
          <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="text-sm">
                  {t(`status.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">{t("fields.slug")}</label>
          <Input
            className="h-8 text-sm"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={t("slugPlaceholder")}
          />
        </div>
      </div>

      {/* Per-language content: tab switcher + the active locale's fields */}
      <div className="space-y-3 border border-slate-200 rounded-xl p-3">
        <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
          {locales.map((l) => {
            const isActive = l === activeLocale;
            const required = REQUIRED_LOCALES.includes(l);
            const filled = content[l].title.trim().length > 0;
            return (
              <button
                key={l}
                type="button"
                onClick={() => setActiveLocale(l)}
                className={`px-2.5 h-7 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {l.toUpperCase()}
                {required ? " *" : filled ? " •" : ""}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">{t("langHint")}</p>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">
            {t("fields.title")}
            {titleRequired ? " *" : ""}
          </label>
          <Input
            className="h-8 text-sm"
            value={active.title}
            onChange={(e) => handleTitleChange(activeLocale, e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">{t("fields.excerpt")}</label>
          <Textarea
            className="text-sm"
            rows={2}
            value={active.excerpt}
            onChange={(e) => setField(activeLocale, "excerpt", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">
            {t("fields.body")}
            {titleRequired ? " *" : ""}
          </label>
          <Textarea
            className="text-sm font-mono"
            rows={10}
            value={active.body}
            onChange={(e) => setField(activeLocale, "body", e.target.value)}
          />
        </div>
      </div>

      {/* Cover image (upload or external URL) + Tags */}
      <div className="grid grid-cols-2 gap-3 items-start">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">{t("fields.cover")}</label>
          <AssetUploader
            folder="content-covers"
            value={coverUrl}
            onChange={setCoverUrl}
            preview="image"
            accept="image/*"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground font-medium">
            {t("fields.tags")}
          </label>
          <Input
            className="h-8 text-sm"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={t("tagsPlaceholder")}
          />
        </div>
      </div>

      {/* Event-only fields */}
      {type === "event" && (
        <div className="space-y-3 border border-slate-200 rounded-xl p-3 bg-muted/20">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t("eventDetails")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">{t("eventStartLabel")}</label>
              <Input
                className="h-8 text-sm"
                type="datetime-local"
                value={eventStartAt}
                onChange={(e) => setEventStartAt(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">{t("eventEndLabel")}</label>
              <Input
                className="h-8 text-sm"
                type="datetime-local"
                value={eventEndAt}
                onChange={(e) => setEventEndAt(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">{t("eventLocationLabel")}</label>
            <Input
              className="h-8 text-sm"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder={t("eventLocationPlaceholder")}
            />
          </div>
        </div>
      )}
    </form>
  );
}
