"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { getGeneralSettings, saveGeneralSettings } from "./actions";
import { DEFAULT_GENERAL_SETTINGS, type GeneralSettings } from "./constants";

export function GeneralSettingsForm({ locale }: { locale: string }) {
    const t = useTranslations("Admin.settings");
    const [settings, setSettings] = React.useState<GeneralSettings>(
        DEFAULT_GENERAL_SETTINGS
    );
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        let active = true;
        getGeneralSettings(locale)
            .then((data) => {
                if (active) setSettings(data);
            })
            .catch(() => toast.error(t("loadError")))
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [locale, t]);

    const update = <K extends keyof GeneralSettings>(
        key: K,
        value: GeneralSettings[K]
    ) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        const toastId = "save-general";
        toast.loading(t("saving"), { id: toastId });
        const result = await saveGeneralSettings(locale, settings);
        if (!result.ok) {
            toast.error(result.error ?? t("saveError"), { id: toastId });
            setSaving(false);
            return;
        }
        toast.success(t("saved"), { id: toastId });
        setSaving(false);
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="space-y-3 p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-full" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t("generalTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label className="text-xs">{t("taglineEn")}</Label>
                        <Input
                            value={settings.site_tagline_en}
                            onChange={(e) => update("site_tagline_en", e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs">{t("taglineFr")}</Label>
                        <Input
                            value={settings.site_tagline_fr}
                            onChange={(e) => update("site_tagline_fr", e.target.value)}
                        />
                    </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label className="text-xs">{t("contactEmail")}</Label>
                        <Input
                            type="email"
                            value={settings.contact_email}
                            onChange={(e) => update("contact_email", e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs">{t("supportPhone")}</Label>
                        <Input
                            value={settings.support_phone}
                            onChange={(e) => update("support_phone", e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-muted/40 p-3">
                    <div>
                        <p className="text-sm font-medium">{t("carouselToggle")}</p>
                        <p className="text-xs text-muted-foreground">
                            {t("carouselToggleHint")}
                        </p>
                    </div>
                    <Switch
                        checked={settings.homepage_carousel_enabled}
                        onCheckedChange={(checked) =>
                            update("homepage_carousel_enabled", checked)
                        }
                    />
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving} size="sm">
                        {t("save")}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
