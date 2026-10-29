import React from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "./Eyebrow";

interface SectionHeadingProps {
  eyebrow?: string;
  chapter?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2";
  id?: string;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  chapter,
  title,
  lead,
  align = "left",
  as = "h2",
  id,
  className
}: SectionHeadingProps) {
  const Heading = as;
  return (
    <div className={cn(align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl", className)}>
      {chapter &&
      <p className="mb-2 font-display text-[15px] italic text-fg-subtle">
          Chapter <span className="numerals not-italic">{chapter}</span>
        </p>
      }
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading
        id={id}
        className={cn(
          "mt-3 text-fg",
          as === "h1" ? "text-[40px] leading-[1.1] md:text-display" : "text-[30px] leading-[1.2] md:text-h2"
        )}>
        
        {title}
      </Heading>
      {lead && <p className="mt-4 text-lead text-fg-muted">{lead}</p>}
    </div>);

}
