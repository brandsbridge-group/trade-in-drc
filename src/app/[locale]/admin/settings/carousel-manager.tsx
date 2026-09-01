"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Images } from "lucide-react";
import {
    listCarouselSlides,
    saveCarouselSlide,
    deleteCarouselSlide,
} from "./actions";
import {
    type CarouselSlideRow,
    type CarouselSlideInput,
} from "./constants";

const EMPTY_SLIDE: CarouselSlideInput = {
    title_en: "",
    title_fr: "",
    subtitle_en: "",
    subtitle_fr: "",
    image_url: "",
    cta_label_en: "",
    cta_label_fr: "",
    cta_href: "",
    sort_order: 0,
    active: true,
};

export function CarouselManager({ locale }: { locale: string }) {
    const t = useTranslations("Admin.settings");
    const [slides, setSlides] = React.useState<CarouselSlideRow[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [editing, setEditing] = React.useState<CarouselSlideInput | null>(null);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [busy, setBusy] = React.useState(false);

    const load = React.useCallback(async () => {
        try {
            setSlides(await listCarouselSlides(locale));
        } catch {
            toast.error(t("loadError"));
        } finally {
            setLoading(false);
        }
    }, [locale, t]);

    React.useEffect(() => {
        load();
    }, [load]);

    const openNew = () => {
        setEditing({ ...EMPTY_SLIDE, sort_order: slides.length });
        setDialogOpen(true);
    };

    const openEdit = (slide: CarouselSlideRow) => {
        setEditing(slide);
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!editing) return;
        setBusy(true);
        const toastId = "save-slide";
        toast.loading(t("saving"), { id: toastId });
        const result = await saveCarouselSlide(locale, editing);
        if (!result.ok) {
            toast.error(result.error ?? t("saveError"), { id: toastId });
            setBusy(false);
            return;
        }
        toast.success(t("saved"), { id: toastId });
        setDialogOpen(false);
        setEditing(null);
        setBusy(false);
        await load();
    };

    const handleDelete = async (id: string) => {
        const toastId = `del-${id}`;
        toast.loading(t("deleting"), { id: toastId });
        const result = await deleteCarouselSlide(locale, id);
        if (!result.ok) {
            toast.error(result.error ?? t("deleteError"), { id: toastId });
            return;
        }
        toast.success(t("deleted"), { id: toastId });
        await load();
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{t("carouselHint")}</p>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={openNew}>
                            <Plus className="mr-1.5 h-4 w-4" />
                            {t("addSlide")}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-sm">
                                {editing?.id ? t("editSlide") : t("addSlide")}
                            </DialogTitle>
                        </DialogHeader>
                        {editing && (
                            <SlideForm
                                value={editing}
                                onChange={setEditing}
                                tEn={t("slideTitleEn")}
                                tFr={t("slideTitleFr")}
                                sEn={t("slideSubtitleEn")}
                                sFr={t("slideSubtitleFr")}
                                img={t("slideImage")}
                                ctaEn={t("slideCtaEn")}
                                ctaFr={t("slideCtaFr")}
                                href={t("slideHref")}
                                order={t("slideOrder")}
                                activeLabel={t("slideActive")}
                            />
                        )}
                        <DialogFooter>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDialogOpen(false)}
                                disabled={busy}
                            >
                                {t("cancel")}
                            </Button>
                            <Button size="sm" onClick={handleSave} disabled={busy}>
                                {t("save")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                </div>
            ) : slides.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                        <Images className="h-6 w-6 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground">{t("carouselEmpty")}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {slides.map((slide) => (
                        <div
                            key={slide.id}
                            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-card p-3"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={slide.image_url}
                                alt={slide.title_en}
                                className="h-12 w-20 shrink-0 rounded-lg object-cover"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{slide.title_en}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {slide.subtitle_en || slide.cta_href || "—"}
                                </p>
                            </div>
                            <Badge
                                variant={slide.active ? "secondary" : "outline"}
                                className="text-xs"
                            >
                                {slide.active ? t("slideActive") : t("slideInactive")}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                #{slide.sort_order}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEdit(slide)}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDelete(slide.id)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function SlideForm({
    value,
    onChange,
    tEn,
    tFr,
    sEn,
    sFr,
    img,
    ctaEn,
    ctaFr,
    href,
    order,
    activeLabel,
}: {
    value: CarouselSlideInput;
    onChange: (v: CarouselSlideInput) => void;
    tEn: string;
    tFr: string;
    sEn: string;
    sFr: string;
    img: string;
    ctaEn: string;
    ctaFr: string;
    href: string;
    order: string;
    activeLabel: string;
}) {
    const set = <K extends keyof CarouselSlideInput>(
        key: K,
        v: CarouselSlideInput[K]
    ) => onChange({ ...value, [key]: v });

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <Field label={tEn}>
                <Input value={value.title_en} onChange={(e) => set("title_en", e.target.value)} />
            </Field>
            <Field label={tFr}>
                <Input value={value.title_fr} onChange={(e) => set("title_fr", e.target.value)} />
            </Field>
            <Field label={sEn}>
                <Input
                    value={value.subtitle_en}
                    onChange={(e) => set("subtitle_en", e.target.value)}
                />
            </Field>
            <Field label={sFr}>
                <Input
                    value={value.subtitle_fr}
                    onChange={(e) => set("subtitle_fr", e.target.value)}
                />
            </Field>
            <Field label={img} className="sm:col-span-2">
                <Input
                    value={value.image_url}
                    onChange={(e) => set("image_url", e.target.value)}
                    placeholder="https://"
                />
            </Field>
            <Field label={ctaEn}>
                <Input
                    value={value.cta_label_en}
                    onChange={(e) => set("cta_label_en", e.target.value)}
                />
            </Field>
            <Field label={ctaFr}>
                <Input
                    value={value.cta_label_fr}
                    onChange={(e) => set("cta_label_fr", e.target.value)}
                />
            </Field>
            <Field label={href} className="sm:col-span-2">
                <Input
                    value={value.cta_href}
                    onChange={(e) => set("cta_href", e.target.value)}
                    placeholder="/companies"
                />
            </Field>
            <Field label={order}>
                <Input
                    type="number"
                    min={0}
                    value={value.sort_order}
                    onChange={(e) => set("sort_order", Number(e.target.value) || 0)}
                />
            </Field>
            <div className="flex items-end gap-2 pb-1">
                <Switch
                    checked={value.active}
                    onCheckedChange={(checked) => set("active", checked)}
                />
                <Label className="text-xs">{activeLabel}</Label>
            </div>
        </div>
    );
}

function Field({
    label,
    className,
    children,
}: {
    label: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={`space-y-1.5 ${className ?? ""}`}>
            <Label className="text-xs">{label}</Label>
            {children}
        </div>
    );
}
