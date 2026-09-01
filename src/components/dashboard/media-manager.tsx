"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ImagePlus,
  FileText,
  Video,
  Trash2,
  Loader2,
  Upload,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCompanyMedia,
  useUploadLogo,
  useRemoveLogo,
  useUploadMediaFile,
  useAddVideoEmbed,
  useDeleteMedia,
  validateImageFile,
  validateBrochureFile,
  QUOTA,
  IMAGE_ACCEPT,
  BROCHURE_ACCEPT,
  type CompanyMediaRow,
  type MediaValidationError,
} from "@/hooks/use-company-media";

interface MediaManagerProps {
  companyId: string;
}

/** Bytes -> "5 MB" for quota / size copy. */
const formatMb = (bytes: number) => `${Math.round(bytes / (1024 * 1024))} MB`;

/** Loose embed-URL sanity check (http/https only); RLS still owns the real gate. */
const isValidHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export function MediaManager({ companyId }: MediaManagerProps) {
  const t = useTranslations("Dashboard.media");
  const reduce = useReducedMotion();
  const { data, isLoading, isError } = useCompanyMedia(companyId);

  const uploadLogo = useUploadLogo();
  const removeLogo = useRemoveLogo();
  const uploadMediaFile = useUploadMediaFile();
  const addVideo = useAddVideoEmbed();
  const deleteMedia = useDeleteMedia();

  const [videoUrl, setVideoUrl] = React.useState("");

  const gallery = React.useMemo(
    () => (data?.media ?? []).filter((m) => m.kind === "gallery"),
    [data?.media],
  );
  const brochures = React.useMemo(
    () => (data?.media ?? []).filter((m) => m.kind === "brochure"),
    [data?.media],
  );
  const videos = React.useMemo(
    () => (data?.media ?? []).filter((m) => m.kind === "video"),
    [data?.media],
  );

  /** Maps a validation failure to a localized, actionable toast message. */
  const validationMessage = React.useCallback(
    (err: MediaValidationError): string => {
      switch (err.reason) {
        case "type":
          return t("error.type");
        case "size":
          return t("error.size", { max: formatMb(err.maxBytes) });
        case "quota":
          return t("error.quota", { max: err.max });
      }
    },
    [t],
  );

  const onLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const err = validateImageFile(file);
    if (err) {
      toast.error(validationMessage(err));
      return;
    }
    const toastId = toast.loading(t("uploading"));
    try {
      await uploadLogo.mutateAsync({ companyId, file });
      toast.success(t("logo.uploadSuccess"), { id: toastId });
    } catch {
      toast.error(t("uploadError"), { id: toastId });
    }
  };

  const onLogoRemove = async () => {
    if (!data?.logoUrl) return;
    const toastId = toast.loading(t("deleting"));
    try {
      await removeLogo.mutateAsync({ companyId, logoUrl: data.logoUrl });
      toast.success(t("logo.removeSuccess"), { id: toastId });
    } catch {
      toast.error(t("deleteError"), { id: toastId });
    }
  };

  const onGallerySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    let count = gallery.length;
    const toastId = toast.loading(t("uploading"));
    let uploaded = 0;
    try {
      for (const file of files) {
        const err = validateImageFile(file, {
          currentCount: count,
          max: QUOTA.gallery,
        });
        if (err) {
          toast.error(validationMessage(err), { id: toastId });
          if (err.reason === "quota") break;
          continue;
        }
        await uploadMediaFile.mutateAsync({ companyId, kind: "gallery", file });
        count += 1;
        uploaded += 1;
      }
      if (uploaded > 0) {
        toast.success(t("gallery.uploadSuccess", { count: uploaded }), {
          id: toastId,
        });
      } else {
        toast.dismiss(toastId);
      }
    } catch {
      toast.error(t("uploadError"), { id: toastId });
    }
  };

  const onBrochureSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    let count = brochures.length;
    const toastId = toast.loading(t("uploading"));
    let uploaded = 0;
    try {
      for (const file of files) {
        const err = validateBrochureFile(file, count);
        if (err) {
          toast.error(validationMessage(err), { id: toastId });
          if (err.reason === "quota") break;
          continue;
        }
        await uploadMediaFile.mutateAsync({ companyId, kind: "brochure", file });
        count += 1;
        uploaded += 1;
      }
      if (uploaded > 0) {
        toast.success(t("brochure.uploadSuccess", { count: uploaded }), {
          id: toastId,
        });
      } else {
        toast.dismiss(toastId);
      }
    } catch {
      toast.error(t("uploadError"), { id: toastId });
    }
  };

  const onAddVideo = async () => {
    const trimmed = videoUrl.trim();
    if (!isValidHttpUrl(trimmed)) {
      toast.error(t("video.invalidUrl"));
      return;
    }
    if (videos.length >= QUOTA.video) {
      toast.error(t("error.quota", { max: QUOTA.video }));
      return;
    }
    const toastId = toast.loading(t("saving"));
    try {
      await addVideo.mutateAsync({ companyId, url: trimmed });
      setVideoUrl("");
      toast.success(t("video.addSuccess"), { id: toastId });
    } catch {
      toast.error(t("saveError"), { id: toastId });
    }
  };

  const onDelete = async (row: CompanyMediaRow) => {
    const toastId = toast.loading(t("deleting"));
    try {
      await deleteMedia.mutateAsync({ companyId, row });
      toast.success(t("deleteSuccess"), { id: toastId });
    } catch {
      toast.error(t("deleteError"), { id: toastId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive py-4">{t("loadError")}</p>
    );
  }

  const galleryFull = gallery.length >= QUOTA.gallery;
  const brochureFull = brochures.length >= QUOTA.brochure;
  const videoFull = videos.length >= QUOTA.video;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, translateY: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, translateY: 0, filter: "blur(0px)" }}
      transition={reduce ? { duration: 0 } : { type: "spring", duration: 0.45, bounce: 0 }}
    >
      <Tabs defaultValue="logo" className="w-full">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="logo">
            <Building2 className="w-3.5 h-3.5" />
            {t("tabs.logo")}
          </TabsTrigger>
          <TabsTrigger value="gallery">
            <ImagePlus className="w-3.5 h-3.5" />
            {t("tabs.gallery")} ({gallery.length})
          </TabsTrigger>
          <TabsTrigger value="brochure">
            <FileText className="w-3.5 h-3.5" />
            {t("tabs.brochure")} ({brochures.length})
          </TabsTrigger>
          <TabsTrigger value="video">
            <Video className="w-3.5 h-3.5" />
            {t("tabs.video")} ({videos.length})
          </TabsTrigger>
        </TabsList>

        {/* LOGO ----------------------------------------------------------- */}
        <TabsContent value="logo" className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground">{t("logo.hint")}</p>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl border border-slate-200 bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {data?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.logoUrl}
                  alt={t("logo.alt")}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-7 h-7 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <UploadButton
                accept={IMAGE_ACCEPT}
                onChange={onLogoSelect}
                disabled={uploadLogo.isPending}
                pending={uploadLogo.isPending}
                label={data?.logoUrl ? t("logo.replace") : t("logo.upload")}
              />
              {data?.logoUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit text-destructive hover:text-destructive"
                  onClick={onLogoRemove}
                  disabled={removeLogo.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  {t("logo.remove")}
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                {t("imageConstraints", { max: formatMb(5 * 1024 * 1024) })}
              </p>
            </div>
          </div>
        </TabsContent>

        {/* GALLERY -------------------------------------------------------- */}
        <TabsContent value="gallery" className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{t("gallery.hint")}</p>
            <Badge variant={galleryFull ? "destructive" : "secondary"}>
              {t("count", { count: gallery.length, max: QUOTA.gallery })}
            </Badge>
          </div>
          {gallery.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {gallery.map((row) => (
                <div key={row.id} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={row.url}
                    alt={t("gallery.imageAlt")}
                    className="w-full aspect-square object-cover rounded-lg border border-slate-200"
                  />
                  <DeleteOverlayButton
                    onClick={() => onDelete(row)}
                    pending={deleteMedia.isPending}
                    label={t("delete")}
                  />
                </div>
              ))}
            </div>
          )}
          <UploadButton
            accept={IMAGE_ACCEPT}
            multiple
            onChange={onGallerySelect}
            disabled={galleryFull || uploadMediaFile.isPending}
            pending={uploadMediaFile.isPending}
            label={t("gallery.add")}
          />
          <p className="text-xs text-muted-foreground">
            {t("imageConstraints", { max: formatMb(5 * 1024 * 1024) })}
          </p>
        </TabsContent>

        {/* BROCHURE ------------------------------------------------------- */}
        <TabsContent value="brochure" className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{t("brochure.hint")}</p>
            <Badge variant={brochureFull ? "destructive" : "secondary"}>
              {t("count", { count: brochures.length, max: QUOTA.brochure })}
            </Badge>
          </div>
          {brochures.length > 0 && (
            <ul className="space-y-2">
              {brochures.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-card px-3 py-2"
                >
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm truncate flex-1 hover:underline"
                  >
                    {row.title_en ?? t("brochure.fallbackName")}
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onDelete(row)}
                    disabled={deleteMedia.isPending}
                    aria-label={t("delete")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <UploadButton
            accept={BROCHURE_ACCEPT}
            multiple
            onChange={onBrochureSelect}
            disabled={brochureFull || uploadMediaFile.isPending}
            pending={uploadMediaFile.isPending}
            label={t("brochure.add")}
          />
          <p className="text-xs text-muted-foreground">
            {t("brochureConstraints", { max: formatMb(15 * 1024 * 1024) })}
          </p>
        </TabsContent>

        {/* VIDEO ---------------------------------------------------------- */}
        <TabsContent value="video" className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{t("video.hint")}</p>
            <Badge variant={videoFull ? "destructive" : "secondary"}>
              {t("count", { count: videos.length, max: QUOTA.video })}
            </Badge>
          </div>
          {videos.length > 0 && (
            <ul className="space-y-2">
              {videos.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-card px-3 py-2"
                >
                  <Video className="w-4 h-4 text-primary shrink-0" />
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm truncate flex-1 hover:underline"
                  >
                    {row.url}
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onDelete(row)}
                    disabled={deleteMedia.isPending}
                    aria-label={t("delete")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="grid gap-2">
            <Label htmlFor="video-url">{t("video.urlLabel")}</Label>
            <div className="flex gap-2">
              <Input
                id="video-url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder={t("video.urlPlaceholder")}
                disabled={videoFull || addVideo.isPending}
              />
              <Button
                type="button"
                size="sm"
                onClick={onAddVideo}
                disabled={videoFull || addVideo.isPending}
              >
                {addVideo.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : null}
                {t("video.add")}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

/** File-input styled as a button. Hover follows MOTION.md (150 ms ease-out). */
function UploadButton({
  accept,
  multiple,
  onChange,
  disabled,
  pending,
  label,
}: {
  accept: string;
  multiple?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  pending?: boolean;
  label: string;
}) {
  return (
    <label
      className={`inline-flex w-fit items-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm transition-colors duration-150 ease-out ${
        disabled
          ? "cursor-not-allowed opacity-50 text-muted-foreground"
          : "cursor-pointer text-slate-600 hover:border-slate-400 hover:text-slate-800"
      }`}
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Upload className="w-4 h-4" />
      )}
      {label}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        disabled={disabled}
        onChange={onChange}
      />
    </label>
  );
}

/** Hover-revealed delete button overlaid on a gallery thumbnail. */
function DeleteOverlayButton({
  onClick,
  pending,
  label,
}: {
  onClick: () => void;
  pending: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={label}
      className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-150 ease-out disabled:opacity-50"
    >
      <Trash2 className="w-3 h-3" />
    </button>
  );
}
