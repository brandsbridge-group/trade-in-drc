"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-provider";
import { useCompanies } from "@/hooks/use-companies";
import { requestPremium } from "@/app/[locale]/(public)/pricing/actions";
import type { PremiumPlan } from "@/lib/supabase/types";

const TOAST_ID = "premium-request";

interface CompanyOption {
  id: string;
  name: string;
  is_premium?: boolean | null;
}

interface PremiumCtaProps {
  plan: PremiumPlan;
  label: string;
  className?: string;
}

/**
 * Choose-Premium button. Resolves the user's owned companies and routes the
 * request through the `requestPremium` server action. Signed-out users are sent
 * to the login flow with a return path. When the user owns more than one
 * company, a small picker dialog disambiguates the target.
 */
export function PremiumCta({ plan, label, className }: PremiumCtaProps) {
  const t = useTranslations("Pricing");
  const router = useRouter();
  const { user, loading } = useAuth();
  const {
    data: companies,
    isLoading: companiesLoading,
    isFetching: companiesFetching,
  } = useCompanies(user?.id);

  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  // Set when the user clicks while companies are still loading; the click
  // resolves once the list settles (see the effect below).
  const [pendingClick, setPendingClick] = React.useState(false);

  const ownedCompanies: CompanyOption[] = React.useMemo(
    () => (companies ?? []) as unknown as CompanyOption[],
    [companies]
  );

  // Only companies eligible for a Premium request — already-premium ones cannot
  // be (re)submitted.
  const eligibleCompanies: CompanyOption[] = React.useMemo(
    () => ownedCompanies.filter((company) => company.is_premium !== true),
    [ownedCompanies]
  );

  // The company list is still resolving when the auth user is known, the query
  // is enabled, and it hasn't produced data yet.
  const companiesResolving =
    !!user?.id && companies === undefined && (companiesLoading || companiesFetching);

  const submit = React.useCallback(
    async (companyId: string) => {
      setIsSubmitting(true);
      toast.loading(t("requestingToast"), { id: TOAST_ID });

      const result = await requestPremium({ companyId, plan });

      if (result.ok) {
        toast.success(t("requestSentToast"), { id: TOAST_ID });
        setPickerOpen(false);
        return;
      }

      switch (result.error) {
        case "already_premium":
          toast.error(t("alreadyPremium"), { id: TOAST_ID });
          break;
        case "pending_exists":
          toast.error(t("pendingRequest"), { id: TOAST_ID });
          break;
        case "not_authenticated":
          router.push(`/login?next=/pricing`);
          toast.dismiss(TOAST_ID);
          break;
        default:
          toast.error(t("signInRequired.body"), { id: TOAST_ID });
      }
      setIsSubmitting(false);
    },
    [plan, router, t]
  );

  // Routes a resolved company list to the correct next step. Only ever called
  // once the companies query has settled, so a length/eligibility check here is
  // never racing a still-loading list.
  const routeResolved = React.useCallback(() => {
    if (ownedCompanies.length === 0) {
      // No company yet — owner must register one before requesting Premium.
      router.push(`/register`);
      return;
    }

    if (eligibleCompanies.length === 0) {
      // Every owned company is already Premium — nothing to request.
      toast.error(t("alreadyPremium"), { id: TOAST_ID });
      return;
    }

    if (eligibleCompanies.length === 1) {
      void submit(eligibleCompanies[0].id);
      return;
    }

    // Multiple eligible companies — disambiguate via the picker dialog.
    setSelectedCompanyId(eligibleCompanies[0].id);
    setPickerOpen(true);
  }, [ownedCompanies, eligibleCompanies, router, submit, t]);

  // Resolve a click that was parked while the companies list was still loading.
  React.useEffect(() => {
    if (!pendingClick || companiesResolving) return;
    setPendingClick(false);
    routeResolved();
  }, [pendingClick, companiesResolving, routeResolved]);

  const handleClick = React.useCallback(() => {
    if (loading) return;

    // Signed-out: send to login with a return path to the pricing page.
    if (!user) {
      router.push(`/login?next=/pricing`);
      return;
    }

    // Companies still loading — park the click and let the effect resolve it
    // once the list settles. Never treat an unresolved list as "no company".
    if (companiesResolving) {
      setPendingClick(true);
      return;
    }

    routeResolved();
  }, [loading, user, companiesResolving, router, routeResolved]);

  return (
    <>
      <Button
        type="button"
        onClick={handleClick}
        disabled={isSubmitting || pendingClick}
        className={className}
      >
        {label}
      </Button>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("selectCompany.title")}</DialogTitle>
            <DialogDescription>{t("selectCompany.body")}</DialogDescription>
          </DialogHeader>

          <Select
            value={selectedCompanyId}
            onValueChange={setSelectedCompanyId}
          >
            <SelectTrigger className="w-full rounded-md">
              <SelectValue placeholder={t("selectCompany.placeholder")} />
            </SelectTrigger>
            <SelectContent>
              {eligibleCompanies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => selectedCompanyId && submit(selectedCompanyId)}
              disabled={!selectedCompanyId || isSubmitting}
            >
              {t("selectCompany.confirmCta")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
