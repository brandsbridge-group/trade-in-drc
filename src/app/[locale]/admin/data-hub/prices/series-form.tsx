"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PriceSeries } from "@/lib/data-hub/types";

type SeriesStatus = PriceSeries["status"];

const STATUS_OPTIONS: SeriesStatus[] = ["draft", "published", "archived"];

interface Sector {
  id: string;
  name_en: string;
  name_fr: string;
}

interface SeriesFormProps {
  mode: "create" | "edit";
  initial?: Partial<PriceSeries>;
  sectors: Sector[];
}

export function SeriesForm({ mode, initial, sectors }: SeriesFormProps) {
  const t = useTranslations("DataHub");
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const [commodityEn, setCommodityEn] = React.useState(initial?.commodity_en ?? "");
  const [commodityFr, setCommodityFr] = React.useState(initial?.commodity_fr ?? "");
  const [unit, setUnit] = React.useState(initial?.unit ?? "");
  const [currency, setCurrency] = React.useState(initial?.currency ?? "USD");
  const [sectorId, setSectorId] = React.useState(initial?.sector_id ?? "");
  const [source, setSource] = React.useState(initial?.source ?? "");
  const [status, setStatus] = React.useState<SeriesStatus>(initial?.status ?? "draft");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        commodity_en: commodityEn,
        commodity_fr: commodityFr,
        unit,
        currency,
        sector_id: sectorId || null,
        source: source || null,
        status,
      };

      if (mode === "create") {
        const { data, error } = await supabase
          .from("price_series")
          .insert(payload as never)
          .select()
          .single();
        if (error) throw error;
        toast.success(t("admin.saved"));
        const newSeries = data as unknown as PriceSeries;
        router.push(`/admin/data-hub/prices/${newSeries.id}`);
      } else {
        const { error } = await supabase
          .from("price_series")
          .update(payload as never)
          .eq("id", initial!.id!)
          .select()
          .single();
        if (error) throw error;
        toast.success(t("admin.saved"));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t("admin.deleteConfirm"))) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("price_series")
        .delete()
        .eq("id", initial!.id!);
      if (error) throw error;
      toast.success(t("admin.deleted"));
      router.push("/admin/data-hub/prices");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete";
      toast.error(message);
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {mode === "create" ? t("admin.newSeries") : t("admin.editSeries")}
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
              {deleting ? t("admin.deleting") : t("admin.delete")}
            </Button>
          )}
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? t("admin.saving") : t("admin.save")}
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-1 max-w-xs">
        <label className="text-xs font-medium text-muted-foreground">{t("fields.status")}</label>
        <Select value={status} onValueChange={(v) => setStatus(v as SeriesStatus)}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Commodity */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{t("fields.commodity")} (EN)</label>
          <Input
            className="h-8 text-sm"
            value={commodityEn}
            onChange={(e) => setCommodityEn(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{t("fields.commodity")} (FR)</label>
          <Input
            className="h-8 text-sm"
            value={commodityFr}
            onChange={(e) => setCommodityFr(e.target.value)}
          />
        </div>
      </div>

      {/* Unit / Currency */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{t("fields.unit")}</label>
          <Input
            className="h-8 text-sm"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            required
            placeholder={t("admin.unitPlaceholder")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{t("fields.currency")}</label>
          <Input
            className="h-8 text-sm"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Sector */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">{t("fields.sector")}</label>
        <Select value={sectorId || "__none__"} onValueChange={(v) => setSectorId(v === "__none__" ? "" : v)}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder={t("admin.none")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">{t("admin.none")}</SelectItem>
            {sectors.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Source */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">{t("fields.source")}</label>
        <Input
          className="h-8 text-sm"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder={t("admin.sourcePlaceholder")}
        />
      </div>
    </form>
  );
}
