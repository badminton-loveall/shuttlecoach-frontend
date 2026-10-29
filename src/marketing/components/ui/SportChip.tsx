import { cn } from "../../utils/cn";
import type { SportStatus } from "../../types/content";

interface SportChipProps {
  name: string;
  status: SportStatus;
  /** Override the full label, e.g. "Now live for Badminton". */
  label?: string;
  className?: string;
}

export function SportChip({ name, status, label, className }: SportChipProps) {
  if (status === "live") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 whitespace-nowrap rounded-sm bg-signal px-2.5 py-1 text-[13px] font-semibold text-on-signal",
          className
        )}>
        
        <span className="relative flex size-2" aria-hidden="true">
          <span className="size-2 rounded-full bg-ink" />
        </span>
        {label ??
        <>
            {name}
            <span className="font-medium opacity-80">· Live</span>
          </>
        }
      </span>);

  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-sm border border-dashed border-rule-strong px-2.5 py-1 text-[13px] font-semibold text-fg-muted",
        className
      )}>
      
      <span className="size-2 rounded-full border border-fg-subtle" aria-hidden="true" />
      {label ??
      <>
          {name}
          <span className="font-medium text-fg-subtle">· Coming soon</span>
        </>
      }
    </span>);

}