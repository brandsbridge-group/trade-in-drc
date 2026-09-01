"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, Loader2, MessageSquarePlus } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-provider";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import { ROUTES } from "@/constants/routes";
import { insertOpportunityResponse } from "@/lib/opportunities/actions";
import {
  CaptchaWidget,
  isCaptchaWidgetEnabled,
} from "@/components/messaging/captcha-widget";

/** Mirrors the DB CHECK (messages_content_length_check) in migration 00012. */
const MESSAGE_MAX = 5000;

interface RespondDialogProps {
  opportunityId: string;
  opportunityTitle: string;
  /** Owner of the company that posted the opportunity — used to block self-response. */
  ownerId: string;
}

/**
 * Public response form for an Opportunities Board listing. On submit it persists
 * an `opportunity_responses` row and opens an opportunity-scoped conversation
 * thread, then routes the responder to that thread in their inbox.
 */
export function RespondDialog({
  opportunityId,
  opportunityTitle,
  ownerId,
}: RespondDialogProps) {
  const t = useTranslations("Opportunities");
  const tm = useTranslations("Messaging");
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);

  const captchaRequired = isCaptchaWidgetEnabled();

  // Not signed in → link to login, preserving the locale-aware return path.
  if (!user) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className="inline-flex w-full items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-medium h-9 px-4 py-2 hover:bg-primary/90 transition-colors"
      >
        {t("respond.cta")}
      </Link>
    );
  }

  // Owner of the listing cannot respond to their own opportunity.
  if (user.id === ownerId) {
    return (
      <p className="text-xs text-muted-foreground">{t("respond.ownListing")}</p>
    );
  }

  const resetForm = () => {
    setMessage("");
    setCaptchaToken(null);
  };

  const errorText = (
    code: string | undefined
  ): string => {
    switch (code) {
      case "rate_limited":
        return tm("errors.rateLimited");
      case "captcha_failed":
        return tm("errors.captchaFailed");
      case "self_response":
        return t("respond.ownListing");
      case "email_not_verified":
        return t("respond.emailNotVerified");
      case "opportunity_unavailable":
        return t("respond.unavailable");
      case "not_authenticated":
        return tm("errors.notAuthenticated");
      case "validation_failed":
        return tm("errors.validationFailed");
      default:
        return t("respond.error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (captchaRequired && !captchaToken) {
      toast.error(tm("errors.captchaRequired"));
      return;
    }

    const toastId = toast.loading(t("respond.sending"));
    setIsSubmitting(true);
    try {
      const result = await insertOpportunityResponse({
        opportunityId,
        message: message.trim(),
        captchaToken,
      });
      if (!result.success || !result.conversationId) {
        toast.error(errorText(result.errorCode), { id: toastId });
        return;
      }
      toast.success(t("respond.success"), { id: toastId });
      resetForm();
      setOpen(false);
      router.push(`${ROUTES.DASHBOARD_INBOX}/${result.conversationId}`);
    } catch {
      toast.error(t("respond.error"), { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <MessageSquarePlus className="w-4 h-4 mr-1.5" />
          {t("respond.cta")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-base">{t("respond.title")}</DialogTitle>
          <DialogDescription className="text-sm">
            {t("respond.description", { title: opportunityTitle })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="response-message" className="text-sm">
              {t("respond.messageLabel")}
            </Label>
            <Textarea
              id="response-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("respond.messagePlaceholder")}
              rows={5}
              maxLength={MESSAGE_MAX}
              className="text-sm"
              required
            />
          </div>

          {captchaRequired && <CaptchaWidget onToken={setCaptchaToken} />}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              {t("respond.cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || (captchaRequired && !captchaToken)}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-1.5" />
              )}
              {t("respond.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
