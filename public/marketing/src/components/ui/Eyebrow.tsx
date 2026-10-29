import React from "react";
import { cn } from "../../utils/cn";

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
  tone?: "accent" | "court";
}

/** Small-caps label with em-rules, e.g. "— THE PLATFORM —". */
export function Eyebrow({ children, className, tone = "accent" }: EyebrowProps) {
  return (
    <p className={cn("eyebrow", tone === "accent" ? "text-accent-ink" : "text-on-court-muted", className)}>
      <span aria-hidden="true">— </span>
      {children}
      <span aria-hidden="true"> —</span>
    </p>);

}