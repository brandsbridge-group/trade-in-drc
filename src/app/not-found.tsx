import "./globals.css";

/**
 * 404 for addresses WITHOUT a valid language prefix (`/dashboard/products`,
 * `/xx/anything`). No language is known here, so there is no next-intl
 * provider and no site chrome: a small self-contained page, in the two working
 * languages, that sends the visitor back to the home page — where the language
 * is negotiated. Addresses under a language get `[locale]/not-found.tsx`.
 */
export default function GlobalNotFound() {
  return (
    <html lang="fr">
      <head>
        <title>404 · Trade in DRC</title>
        <meta name="robots" content="noindex" />
      </head>
      <body className="min-h-screen bg-market-navy font-sans text-white antialiased">
        <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-market-or-light">Trade in DRC · 404</p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Cette page est introuvable</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-white/75">
            L&apos;adresse est peut-être mal saisie, ou la page a été déplacée.
          </p>
          <p lang="en" className="mt-5 text-lg font-semibold text-white/90">This page cannot be found</p>
          <p lang="en" className="mt-1 text-[15px] leading-relaxed text-white/75">
            The address may be mistyped, or the page has been moved.
          </p>
          <div className="mt-8">
            {/* A plain link: "/" is where the language is chosen for the visitor. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- no locale here, the i18n Link cannot be used */}
            <a
              href="/"
              className="inline-flex items-center rounded-full bg-market-or px-6 py-3 text-sm font-semibold text-market-navy transition-colors hover:bg-market-or-light"
            >
              Retour à l&apos;accueil · Back to home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
