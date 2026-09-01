"use client";

import * as React from "react";
import Script from "next/script";

/**
 * Cloudflare Turnstile CAPTCHA widget (Requirements module 6 anti-scraping).
 *
 * Renders only when NEXT_PUBLIC_CAPTCHA_SITE_KEY is configured. When the key is
 * absent (local dev / pre-provisioning), the widget renders nothing and the
 * parent treats CAPTCHA as not required — matching the server's graceful skip.
 *
 * The widget calls onToken with the solved token (or null when reset/expired).
 */

const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileRenderOptions {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact" | "flexible";
}

interface TurnstileApi {
  render: (el: HTMLElement, opts: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

interface CaptchaWidgetProps {
  /** Called with the solved token, or null when it expires/errors/resets. */
  onToken: (token: string | null) => void;
}

/** True when a Turnstile site key is configured (widget should render). */
export function isCaptchaWidgetEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY);
}

export function CaptchaWidget({ onToken }: CaptchaWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const widgetIdRef = React.useRef<string | null>(null);
  const [scriptReady, setScriptReady] = React.useState(false);

  // Keep the latest onToken without re-rendering the widget.
  const onTokenRef = React.useRef(onToken);
  React.useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  React.useEffect(() => {
    if (!siteKey || !scriptReady || !containerRef.current) {
      return;
    }
    const api = window.turnstile;
    if (!api) {
      return;
    }

    const container = containerRef.current;
    widgetIdRef.current = api.render(container, {
      sitekey: siteKey,
      callback: (token) => onTokenRef.current(token),
      "expired-callback": () => onTokenRef.current(null),
      "error-callback": () => onTokenRef.current(null),
      theme: "auto",
      size: "flexible",
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, scriptReady]);

  if (!siteKey) {
    return null;
  }

  return (
    <>
      <Script
        src={TURNSTILE_SCRIPT_SRC}
        strategy="lazyOnload"
        onReady={() => setScriptReady(true)}
      />
      <div ref={containerRef} className="min-h-[65px]" />
    </>
  );
}
