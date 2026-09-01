"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export function AuthFlash() {
  const search = useSearchParams();
  const t = useTranslations("Admin");
  useEffect(() => {
    if (search.get("error") === "not_authorized") {
      toast.error(t("notAuthorized"));
    }
  }, [search, t]);
  return null;
}
