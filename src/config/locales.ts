export const locales = ['en', 'fr', 'tr', 'es', 'zh'] as const;
export const defaultLocale = 'en';

export type Locale = (typeof locales)[number];
