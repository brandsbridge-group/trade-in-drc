# Architecture Documentation

## Project Overview
Next.js 15 application utilizing App Router, Shadcn UI for components, and Firebase for backend services. Designed for high performance, SEO, and accessibility.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Shadcn/UI
- **Animation**: Framer Motion
- **Internationalization**: next-intl
- **Backend/Db**: Firebase (Auth, Firestore, Storage)
- **Forms**: React Hook Form + Zod

## Directory Structure
```
src/
├── app/
│   └── [locale]/    # Localized routes
├── components/
│   ├── ui/          # Shadcn primitives
│   └── ...          # Feature components
├── config/          # Site config, locales, messages
├── i18n/            # Routing and request configuration
├── lib/             # Utils and helpers
└── middleware.ts    # i18n routing matcher
```

## Key Patterns
- **Localized Routing**: All public pages reside under `/[locale]`.
- **Server Components**: Default to server components; use "use client" only when interaction is needed.
- **Config-Driven**: Text and site settings centralized in `src/config`.

## Dependencies
- **Firebase**: Auth, Firestore, Storage.
- **Resend** (Potential): Transactional Emails.

---

*Last updated: 2026-01-15*
