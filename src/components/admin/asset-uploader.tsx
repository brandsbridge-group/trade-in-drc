"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadAdminAsset, type AdminAssetFolder } from "@/lib/admin/asset-upload";

interface AssetUploaderProps {
  folder: AdminAssetFolder;
  value: string;
  onChange: (url: string) => void;
  /** image → render a thumbnail preview; file → render a filename link. */
  preview?: "image" | "file";
  accept?: string;
}

export function AssetUploader({
  folder,
  value,
  onChange,
  preview = "file",
  accept,
}: AssetUploaderProps) {
  const t = useTranslations("AdminUpload");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const toastId = `asset-upload-${folder}`;
    toast.loading(t("uploading"), { id: toastId });
    try {
      const formData = new FormData();
      formData.append("folder", folder);
      formData.append("file", file);
      const result = await uploadAdminAsset(formData);
      if (result.error || !result.url) {
        toast.error(t(`error.${result.error ?? "upload_failed"}`), { id: toastId });
        return;
      }
      onChange(result.url);
      toast.success(t("uploaded"), { id: toastId });
    } catch {
      toast.error(t("error.upload_failed"), { id: toastId });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          {t("chooseFile")}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
            className="text-destructive"
          >
            <X className="w-3.5 h-3.5" />
            {t("remove")}
          </Button>
        )}
      </div>

      {/* Manual URL fallback — operators can paste an external URL too. */}
      <Input
        className="h-8 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("urlPlaceholder")}
      />

      {value && preview === "image" && (
        <div className="relative h-24 w-40 overflow-hidden rounded-md border border-slate-200 bg-muted">
          <Image
            src={value}
            alt={t("previewAlt")}
            fill
            sizes="160px"
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      {value && preview === "file" && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs text-primary hover:underline truncate max-w-full"
        >
          {value}
        </a>
      )}
    </div>
  );
}
