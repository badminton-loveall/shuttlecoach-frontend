import React from "react";
import { cn } from "../../utils/cn";

interface ScoreTileProps {
  label: string;
  value?: string;
  /** Render a match score, e.g. ["21", "0"]. */
  score?: [string, string];
  caption?: string;
  className?: string;
}

export function ScoreTile({ label, value, score, caption, className }: ScoreTileProps) {
  return (
    <div className={cn("flex h-full flex-col border border-rule bg-surface p-5 md:p-6", className)}>
      <p className="eyebrow text-fg-subtle">{label}</p>
      <p className="numerals mt-4 flex items-baseline gap-3 text-[40px] leading-none text-fg md:text-[48px]">
        {score ?
        <>
            <span>{score[0]}</span>
            <span className="text-[0.6em] text-accent" aria-hidden="true">
              –
            </span>
            <span className="sr-only">to</span>
            <span>{score[1]}</span>
          </> :

        value
        }
      </p>
      {caption && <p className="rule-double mt-auto pt-3 text-[13px] text-fg-subtle">{caption}</p>}
    </div>);

}