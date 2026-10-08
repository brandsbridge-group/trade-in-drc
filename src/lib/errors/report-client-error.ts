/**
 * Sends a browser-side crash to `/api/client-errors`, which writes it to the
 * server logs. A client exception otherwise only exists in the visitor's own
 * console: nobody on the team ever sees it.
 */

export const CLIENT_ERRORS_ENDPOINT = "/api/client-errors";

export interface ClientErrorContext {
  /** Which error boundary caught it ("dashboard"…). */
  area: string;
  /** The code shown to the user, so a support message can be matched to its log line. */
  reference: string;
  userId?: string;
}

/**
 * Chrome's translation rewrites the page's text nodes, which React then fails
 * to update ("removeChild … not a child of this node"). Knowing whether the
 * page was translated tells that family of crashes apart from a real bug.
 */
function isPageTranslated(): boolean {
  const html = document.documentElement;
  return (
    html.classList.contains("translated-ltr") ||
    html.classList.contains("translated-rtl") ||
    document.querySelector("font[style*='vertical-align']") !== null
  );
}

/** Never throws: reporting an error must not cause another one. */
export function reportClientError(error: Error & { digest?: string }, context: ClientErrorContext): void {
  try {
    const body = JSON.stringify({
      ...context,
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      path: window.location.pathname,
      pageLang: document.documentElement.lang,
      translated: isPageTranslated(),
    });
    // A beacon still leaves when the user reloads or closes the tab right after the crash.
    if (navigator.sendBeacon?.(CLIENT_ERRORS_ENDPOINT, body)) return;
    void fetch(CLIENT_ERRORS_ENDPOINT, { method: "POST", body, keepalive: true }).catch(() => {});
  } catch {
    // Nothing to do.
  }
}
