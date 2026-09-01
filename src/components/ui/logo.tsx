import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Official Trade in DRC logo (DRC map + growth chart + wordmark), extracted
 * from the customer design art. `variant="white"` renders the horizontal
 * lockup used on the navy navbar/footer. Its background is keyed to transparent
 * so it blends on ANY navy shade (no visible box on large screens). Assets:
 * public/images/brand/logo-mark.png (319×70, transparent), logo-color.png
 * (281×160, light surfaces).
 */
const RATIOS = {
  white: 319 / 70, // horizontal lockup (mark + wordmark + tagline)
  default: 281 / 160,
} as const;
const HEIGHTS = { sm: 26, md: 40, lg: 52 } as const;

interface LogoProps {
  className?: string;
  size?: keyof typeof HEIGHTS;
  variant?: "default" | "white";
}

export function Logo({ className, size = "md", variant = "default" }: LogoProps) {
  const height = HEIGHTS[size];
  const ratio = RATIOS[variant];
  const width = Math.round(height * ratio);
  const src = variant === "white" ? "/images/brand/logo-mark.png" : "/images/brand/logo-color.png";
  return (
    <Image
      src={src}
      alt="Trade in DRC"
      width={width}
      height={height}
      priority
      // shrink-0: inside a flex row the logo must never be squashed by long
      // nav links or a signed-in avatar — it distorts the wordmark.
      className={cn("w-auto shrink-0", className)}
      style={{ height, width: "auto" }}
    />
  );
}
