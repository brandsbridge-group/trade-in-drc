import type { getTranslations } from "next-intl/server";

/**
 * Server-side translator handle passed from the async page component down into
 * the presentational (RSC) sections. Server→server prop passing keeps these
 * sections out of the client bundle while still sharing one `getTranslations`
 * call. `.raw` is included for reading array-valued message keys.
 */
export type Translator = Awaited<ReturnType<typeof getTranslations>>;
