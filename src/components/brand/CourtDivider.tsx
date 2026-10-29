import { cn } from "@/lib/utils";
import { CourtLines } from "./CourtLines";

interface CourtDividerProps {
  className?: string;
}

/** Section divider: hairline — miniature court — hairline. */
export function CourtDivider({ className }: CourtDividerProps) {
  return (
    <div className={cn("container-page", className)} role="separator" aria-hidden="true">
      <div className="flex items-center gap-4 text-accent">
        <span className="h-px flex-1 bg-rule" />
        <CourtLines className="h-7 w-16 shrink-0" />
        <span className="h-px flex-1 bg-rule" />
      </div>
    </div>);

}
