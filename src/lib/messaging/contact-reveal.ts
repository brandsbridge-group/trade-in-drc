/**
 * Contact-reveal policy (Requirements module 6 — contact & anti-spam).
 *
 * Decides whether and how a company's contact details are shown, based on the
 * company's configured `contact_visibility` and the viewer's auth state.
 *
 * Hard guarantee: this helper NEVER returns a raw contact_email / contact_phone
 * to an anonymous (logged-out) viewer, regardless of visibility mode. Public
 * reads should source company data from the `companies_public` view, which
 * excludes the contact_* columns entirely — so anonymous callers physically
 * cannot pass real values in. Authenticated reveal still flows through the
 * secure "Contact Supplier" messaging path; raw values are only surfaced when a
 * company explicitly opts into `direct` visibility for signed-in viewers.
 *
 * This module is pure (no IO) so it is safe to import from server or client.
 */

import type { ContactVisibility } from "@/lib/supabase/types";

/** How the UI should present a company's contact affordance. */
export type ContactRevealMode =
  /** Show raw email/phone (company opted in, viewer authenticated). */
  | "direct"
  /** Show masked values + click-to-reveal; real values withheld. */
  | "obfuscated"
  /** Hide values; prompt the viewer to sign in first. */
  | "login_required"
  /** No contact channel available (no values + secure messaging only). */
  | "messaging_only";

export interface ContactRevealInput {
  visibility: ContactVisibility | null | undefined;
  /** Whether the current viewer is authenticated. */
  isAuthenticated: boolean;
  /** Raw email from a privileged source. Pass null/undefined for anon reads. */
  rawEmail?: string | null;
  /** Raw phone from a privileged source. Pass null/undefined for anon reads. */
  rawPhone?: string | null;
}

export interface ContactRevealResult {
  mode: ContactRevealMode;
  /** Safe-to-render email, or null when it must not be shown. */
  email: string | null;
  /** Safe-to-render phone, or null when it must not be shown. */
  phone: string | null;
  /** Masked email for click-to-reveal UIs (obfuscated mode), else null. */
  maskedEmail: string | null;
  /** Masked phone for click-to-reveal UIs (obfuscated mode), else null. */
  maskedPhone: string | null;
  /** Whether the "Contact Supplier" secure-messaging button should show. */
  showSecureContactButton: boolean;
}

const DEFAULT_VISIBILITY: ContactVisibility = "login_required";

/**
 * Masks an email to "j•••@example.com" — keeps the first char and the domain,
 * hides the rest of the local part.
 */
function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) {
    return "•••";
  }
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const head = local.slice(0, 1);
  return `${head}•••${domain}`;
}

/** Masks a phone, keeping only the last two digits: "••• •• 12". */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 2) {
    return "•••";
  }
  return `••• •• ${digits.slice(-2)}`;
}

/**
 * Resolves the reveal policy for a company contact block.
 *
 * Anonymous viewers can never see raw values: even if a caller mistakenly
 * passes rawEmail/rawPhone while isAuthenticated is false, this returns
 * login_required with all raw fields nulled out.
 */
export function resolveContactReveal(
  input: ContactRevealInput
): ContactRevealResult {
  const visibility = input.visibility ?? DEFAULT_VISIBILITY;
  const hasEmail = Boolean(input.rawEmail);
  const hasPhone = Boolean(input.rawPhone);

  const emptyContact: ContactRevealResult = {
    mode: "messaging_only",
    email: null,
    phone: null,
    maskedEmail: null,
    maskedPhone: null,
    showSecureContactButton: true,
  };

  // Anonymous viewers: never reveal, never echo raw values.
  if (!input.isAuthenticated) {
    return {
      mode: "login_required",
      email: null,
      phone: null,
      maskedEmail: null,
      maskedPhone: null,
      showSecureContactButton: true,
    };
  }

  switch (visibility) {
    case "direct": {
      if (!hasEmail && !hasPhone) {
        return emptyContact;
      }
      return {
        mode: "direct",
        email: input.rawEmail ?? null,
        phone: input.rawPhone ?? null,
        maskedEmail: null,
        maskedPhone: null,
        showSecureContactButton: true,
      };
    }
    case "obfuscated": {
      if (!hasEmail && !hasPhone) {
        return emptyContact;
      }
      return {
        mode: "obfuscated",
        // Real values are withheld until the viewer clicks to reveal; the UI
        // re-runs this helper with a click flag handled at the call site.
        email: null,
        phone: null,
        maskedEmail: input.rawEmail ? maskEmail(input.rawEmail) : null,
        maskedPhone: input.rawPhone ? maskPhone(input.rawPhone) : null,
        showSecureContactButton: true,
      };
    }
    case "login_required":
    default: {
      // Viewer is authenticated, so login_required is satisfied → reveal.
      if (!hasEmail && !hasPhone) {
        return emptyContact;
      }
      return {
        mode: "direct",
        email: input.rawEmail ?? null,
        phone: input.rawPhone ?? null,
        maskedEmail: null,
        maskedPhone: null,
        showSecureContactButton: true,
      };
    }
  }
}

/**
 * Reveals the real values for an obfuscated company after the viewer clicks
 * to reveal. Only valid for authenticated viewers in obfuscated mode.
 */
export function revealObfuscatedContact(
  input: ContactRevealInput
): ContactRevealResult {
  if (!input.isAuthenticated || (input.visibility ?? DEFAULT_VISIBILITY) !== "obfuscated") {
    return resolveContactReveal(input);
  }
  return {
    mode: "direct",
    email: input.rawEmail ?? null,
    phone: input.rawPhone ?? null,
    maskedEmail: null,
    maskedPhone: null,
    showSecureContactButton: true,
  };
}
