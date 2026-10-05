"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-provider";
import { MESSAGING_ENABLED } from "@/config/features";
import { trackView } from "@/lib/analytics/track-view";
import { ContactSupplierModal } from "@/components/messaging/contact-supplier-modal";

/** Records one product view per mount (analytics, best-effort). */
export function OfferViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    trackView("product", productId);
  }, [productId]);
  return null;
}

/**
 * Signed-in members can still message the supplier directly through the
 * platform inbox (no contact details are revealed). Guests use the request form.
 */
export function OfferDirectContact({
  companyId,
  companyName,
  companyOwnerId,
}: {
  companyId: string;
  companyName: string;
  companyOwnerId: string;
}) {
  const t = useTranslations("OfferDetail.request");
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  if (!MESSAGING_ENABLED || !user || user.id === companyOwnerId) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary transition-colors duration-150 ease-out hover:text-[#003a8c]"
      >
        <MessageSquare className="h-3.5 w-3.5" aria-hidden />
        {t("messageSupplier")}
      </button>
      {open && (
        <ContactSupplierModal
          isOpen={open}
          onClose={() => setOpen(false)}
          companyId={companyId}
          companyName={companyName}
          companyOwnerId={companyOwnerId}
        />
      )}
    </>
  );
}
