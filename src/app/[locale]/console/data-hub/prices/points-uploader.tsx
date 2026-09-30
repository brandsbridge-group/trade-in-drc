"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { parsePriceCsv } from "@/lib/data-hub/csv";
import type { PricePoint } from "@/lib/data-hub/types";

interface PointsUploaderProps {
  seriesId: string;
  initialPoints: PricePoint[];
}

export function PointsUploader({ seriesId, initialPoints }: PointsUploaderProps) {
  const t = useTranslations("DataHub");
  const locale = useLocale();
  const router = useRouter();
  const [csv, setCsv] = React.useState("");
  const [uploading, setUploading] = React.useState(false);

  const handleUpload = async () => {
    setUploading(true);
    const toastId = "price-points-upload";
    toast.loading(t("admin.uploading"), { id: toastId });
    try {
      const { rows: parsed, errors } = parsePriceCsv(csv);

      // Any malformed row aborts the whole batch so the operator fixes the
      // source rather than silently importing a partial, misleading series.
      if (errors.length > 0) {
        const first = errors[0];
        toast.error(t("admin.parseErrorLine", { line: first.line }), { id: toastId });
        return;
      }
      if (parsed.length === 0) {
        toast.error(t("admin.parseError"), { id: toastId });
        return;
      }

      const rows = parsed.map((p) => ({
        series_id: seriesId,
        observed_at: p.observed_at,
        value: p.value,
      }));

      const supabase = createClient();
      const { error } = await supabase
        .from("price_points")
        .upsert(rows as never, { onConflict: "series_id,observed_at" });
      if (error) throw error;
      toast.success(t("admin.uploadedCount", { count: rows.length }), { id: toastId });
      setCsv("");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("admin.uploadFailed");
      toast.error(message, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePoint = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("price_points").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <h3 className="text-sm font-semibold">{t("admin.dataPoints")}</h3>

      {/* CSV upload */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          {t("admin.pasteCsv")}
        </label>
        <Textarea
          className="text-sm font-mono min-h-[100px]"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={"observed_at,value\n2024-01-01,1234.5\n2024-02-01,1300"}
        />
        <p className="text-xs text-muted-foreground">{t("admin.csvHint")}</p>
        <Button
          type="button"
          size="sm"
          onClick={handleUpload}
          disabled={uploading || csv.trim().length === 0}
        >
          {uploading ? t("admin.uploading") : t("admin.upload")}
        </Button>
      </div>

      {/* Existing points table */}
      {initialPoints.length > 0 && (
        <table className="w-full text-sm border-collapse">
          <thead className="text-left text-xs text-muted-foreground border-b">
            <tr>
              <th className="py-2 font-medium">{t("fields.observedAt")}</th>
              <th className="py-2 font-medium">{t("fields.value")}</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {initialPoints.map((pt) => (
              <tr key={pt.id} className="border-b hover:bg-muted/30">
                <td className="py-1.5 text-muted-foreground">
                  {new Date(pt.observed_at).toLocaleDateString(locale)}
                </td>
                <td className="py-1.5">{pt.value}</td>
                <td className="py-1.5 text-right">
                  <button
                    type="button"
                    className="text-xs text-destructive hover:underline"
                    onClick={() => handleDeletePoint(pt.id)}
                  >
                    {t("admin.delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {initialPoints.length === 0 && (
        <p className="text-xs text-muted-foreground">{t("admin.noPoints")}</p>
      )}
    </div>
  );
}
