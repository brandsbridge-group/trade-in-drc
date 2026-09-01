"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/design";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function SettingsPage() {
  const { user } = useAuth();
  const t = useTranslations("Auth.accountSettings");
  const ts = useTranslations("Settings");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<string>("user");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();
      if (data?.full_name) setFullName(data.full_name);
      if (data?.role) setRole(data.role);
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);

    if (error) {
      toast.error(ts("updateError"));
    } else {
      toast.success(ts("updateSuccess"));
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title={ts("title")} subtitle={ts("subtitle")} />

      <div className="max-w-md space-y-4 mt-6">
        <div>
          <Label htmlFor="email" className="text-sm">{t("email")}</Label>
          <Input
            id="email"
            value={user?.email || ""}
            disabled
            className="mt-1 h-9 text-sm bg-muted"
          />
        </div>

        <div>
          <Label className="text-sm">{t("role")}</Label>
          <Input
            value={role === "admin" ? t("roleAdmin") : t("roleUser")}
            disabled
            className="mt-1 h-9 text-sm bg-muted"
          />
        </div>

        <div>
          <Label htmlFor="fullName" className="text-sm">{ts("fullName")}</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={ts("fullNamePlaceholder")}
            className="mt-1 h-9 text-sm"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="text-sm"
        >
          {saving && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
          {ts("saveChanges")}
        </Button>

        <p className="text-xs text-muted-foreground pt-1">
          <Link
            href="/dashboard/settings/account"
            className="underline hover:text-foreground"
          >
            {t("gotoAccount")}
          </Link>
        </p>
      </div>
    </div>
  );
}
