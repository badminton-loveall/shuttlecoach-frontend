import React from "react";
import { cn } from "../../utils/cn";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "gold" | "sample";

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

const tones: Record<BadgeTone, string> = {
  neutral: "border border-rule bg-surface-alt text-fg-muted",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
  gold: "border border-accent text-accent-ink",
  sample: "border border-dashed border-rule-strong text-fg-subtle uppercase tracking-[0.12em]"
};

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-2 py-0.5 text-caption font-semibold",
        tones[tone],
        className
      )}>
      
      {children}
    </span>);

}