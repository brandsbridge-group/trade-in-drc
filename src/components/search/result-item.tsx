import { Link } from "@/i18n/routing";
import { VerificationBadge } from "@/components/trust/verification-badge";
import type { SearchResult } from "@/lib/search/types";

export function ResultItem({ item, onSelect }: { item: SearchResult; onSelect?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onSelect}
      className="block px-3 py-2 rounded hover:bg-muted text-sm"
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-medium truncate">{item.title}</span>
        {item.verification_tier && item.verification_tier !== "none" && (
          <VerificationBadge tier={item.verification_tier} />
        )}
      </div>
      {item.snippet && <div className="text-xs text-muted-foreground truncate">{item.snippet}</div>}
    </Link>
  );
}
