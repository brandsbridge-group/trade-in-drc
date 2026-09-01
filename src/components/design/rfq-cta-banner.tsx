import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

interface RfqCtaBannerProps {
  title: string;
  action: ReactNode;     // typically a <Link> or <Button>
}

export function RfqCtaBanner({ title, action }: RfqCtaBannerProps) {
  return (
    <div className="bg-primary text-primary-foreground rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
      <p className="text-sm font-medium flex items-center gap-2">
        <ArrowRight className="w-4 h-4" aria-hidden />
        {title}
      </p>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
