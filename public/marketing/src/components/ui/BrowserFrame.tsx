import React from "react";
import { LockIcon } from "lucide-react";
import { cn } from "../../utils/cn";

interface BrowserFrameProps {
  url: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}

/** App screenshot frame with a classic thin border. `label` describes the screen for assistive tech. */
export function BrowserFrame({ url, label, children, className }: BrowserFrameProps) {
  return (
    <figure
      className={cn("overflow-hidden rounded-lg border border-rule-strong bg-surface shadow-soft-2", className)}
      aria-label={label}>
      
      <div className="flex h-9 items-center gap-3 border-b border-rule bg-surface-alt px-3.5" aria-hidden="true">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full border border-rule-strong" />
          <span className="size-2.5 rounded-full border border-rule-strong" />
          <span className="size-2.5 rounded-full border border-rule-strong" />
        </div>
        <div className="mx-auto flex h-6 min-w-0 max-w-[65%] items-center gap-1.5 rounded-sm border border-rule bg-surface px-3 text-[11px] text-fg-subtle">
          <LockIcon className="size-2.5 shrink-0" strokeWidth={2} />
          <span className="truncate tabular">{url}</span>
        </div>
        <span className="w-[42px]" />
      </div>
      <div className="relative">{children}</div>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>);

}