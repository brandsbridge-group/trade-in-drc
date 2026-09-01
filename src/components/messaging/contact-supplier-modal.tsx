"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-provider";
import { useRouter } from "@/i18n/routing";
import { ROUTES } from "@/constants/routes";
import { startConversation } from "@/lib/messaging/actions";
import {
  CaptchaWidget,
  isCaptchaWidgetEnabled,
} from "@/components/messaging/captcha-widget";

const SUBJECT_MAX = 200;
/** Mirrors the DB CHECK (messages_content_length_check) in migration 00012. */
const MESSAGE_MAX = 5000;

interface ContactSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  companyOwnerId: string;
}

export function ContactSupplierModal({
  isOpen,
  onClose,
  companyId,
  companyName,
  companyOwnerId,
}: ContactSupplierModalProps) {
  const t = useTranslations("Messaging");
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);

  const captchaRequired = isCaptchaWidgetEnabled();

  const resetForm = () => {
    setSubject("");
    setMessage("");
    setCaptchaToken(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(t("contact.signInRequired"));
      return;
    }
    if (user.id === companyOwnerId) {
      toast.error(t("contact.cannotSelfMessage"));
      return;
    }
    if (captchaRequired && !captchaToken) {
      toast.error(t("errors.captchaRequired"));
      return;
    }

    const toastId = toast.loading(t("contact.sending", { company: companyName }));
    setIsSubmitting(true);

    try {
      const result = await startConversation({
        companyId,
        companyOwnerId,
        subject: subject.trim(),
        message: message.trim(),
        captchaToken,
      });

      if (!result.success || !result.conversationId) {
        const messageText = (() => {
          switch (result.errorCode) {
            case "rate_limited":
              return t("errors.rateLimited");
            case "captcha_failed":
              return t("errors.captchaFailed");
            case "self_message":
              return t("contact.cannotSelfMessage");
            case "not_authenticated":
              return t("errors.notAuthenticated");
            case "validation_failed":
              return t("errors.validationFailed");
            default:
              return t("errors.sendFailed");
          }
        })();
        toast.error(messageText, { id: toastId });
        return;
      }

      toast.success(t("contact.success"), { id: toastId });
      resetForm();
      onClose();
      router.push(`${ROUTES.DASHBOARD_INBOX}/${result.conversationId}`);
    } catch {
      toast.error(t("errors.sendFailed"), { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-base">
            {t("contact.title", { company: companyName })}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {t("contact.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-sm">
              {t("contact.subjectLabel")}
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("contact.subjectPlaceholder")}
              maxLength={SUBJECT_MAX}
              className="h-9 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message" className="text-sm">
              {t("contact.messageLabel")}
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("contact.messagePlaceholder")}
              rows={5}
              maxLength={MESSAGE_MAX}
              className="text-sm"
              required
            />
          </div>

          {captchaRequired && <CaptchaWidget onToken={setCaptchaToken} />}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              {t("contact.cancel")}
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
              {t("contact.send")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
