import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    let locale = await requestLocale;

    // Ensure that a valid locale is used
    if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
        locale = routing.defaultLocale;
    }

    return {
        locale,
        messages: (await import(`../config/messages/${locale}.json`)).default,
        // Fail loudly in dev/CI when a key is missing or malformed (e.g. a flat
        // dotted key that does not resolve by nested traversal) so it is caught
        // before release; stay resilient in production by logging instead.
        onError(error) {
            if (process.env.NODE_ENV !== 'production') {
                throw error;
            }
            console.error('[next-intl]', error.message);
        },
        // Never render a raw key path to users; in dev mark it so it is obvious.
        getMessageFallback({ namespace, key }) {
            const path = [namespace, key].filter(Boolean).join('.');
            return process.env.NODE_ENV === 'production' ? '' : `⟪${path}⟫`;
        }
    };
});
