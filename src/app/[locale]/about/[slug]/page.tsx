
import { ConstructionNotice } from "@/components/ui/construction-notice";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    // Simple title formatting: remove hyphens, capitalize words
    const title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    return <ConstructionNotice title={title} />;
}
