import { cn } from "@/lib/utils";
import { Crest } from "./Crest";

type LogoVariant = "horizontal" | "stacked" | "icon";

interface LogoProps {
  variant?: LogoVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const crestSizes = { sm: 36, md: 48, lg: 72 };
const wordSizes = { sm: "text-[24px]", md: "text-[30px]", lg: "text-[42px]" };

export function Logo({ variant = "horizontal", size = "md", className }: LogoProps) {
  if (variant === "icon") {
    return <Crest size={crestSizes[size]} title="LoveAll" className={cn("text-fg", className)} />;
  }

  const wordmark =
  <span className={cn("font-display leading-none tracking-[-0.01em] text-fg", wordSizes[size])}>
      Love<span className="italic">All</span>
    </span>;


  if (variant === "stacked") {
    return (
      <span className={cn("inline-flex flex-col items-center gap-3", className)} aria-label="LoveAll">
        <Crest size={crestSizes[size] * 1.3} className="text-fg" />
        {wordmark}
      </span>);

  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} aria-label="LoveAll">
      <Crest size={crestSizes[size]} className="text-fg" />
      {wordmark}
    </span>);

}
