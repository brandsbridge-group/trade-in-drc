import { redirect } from "@/i18n/routing";

// Retired: the standalone public RFQ board duplicated the Opportunities system.
// All RFQ traffic now flows through the unified Opportunities board. The locale-
// aware redirect (next-intl) needs the active locale so the target keeps its prefix.
export default async function RfqRedirectPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    redirect({ href: "/opportunities", locale });
}
