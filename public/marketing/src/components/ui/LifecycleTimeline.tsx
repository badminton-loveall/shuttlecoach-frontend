import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ThemeIcon } from "../brand/Icons";
import type { LifecycleStep } from "../../types/content";
import { cn } from "../../utils/cn";

interface LifecycleTimelineProps {
  steps: LifecycleStep[];
}

/** Horizontal on desktop, vertical on mobile. The final step loops back to step III. */
export function LifecycleTimeline({ steps }: LifecycleTimelineProps) {
  const reduce = useReducedMotion();
  return (
    <ol className="relative grid gap-8 lg:grid-cols-7 lg:gap-5">
      <span
        aria-hidden="true"
        className="absolute bottom-6 left-5 top-5 w-px bg-rule-strong lg:bottom-auto lg:left-5 lg:right-5 lg:top-5 lg:h-px lg:w-auto" />
      
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <motion.li
            key={step.numeral}
            className="relative pl-16 lg:pl-0 lg:pt-16"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1], delay: reduce ? 0 : i * 0.045 }}>
            
            <span
              className={cn(
                "absolute left-0 top-0 flex size-10 items-center justify-center rounded-full border bg-canvas font-display text-[15px]",
                last ? "border-accent text-accent-ink" : "border-rule-strong text-fg"
              )}>
              
              <span className="numerals">{step.numeral}</span>
            </span>
            <ThemeIcon name={step.icon} size={20} className="text-primary" />
            <h3 className="mt-3 text-[19px] leading-snug text-fg">{step.title}</h3>
            <p className="mt-1.5 text-[15px] text-fg-muted">{step.description}</p>
            {last && <p className="mt-2 font-display text-[14px] italic text-accent-ink">Back to III, a level up.</p>}
          </motion.li>);

      })}
    </ol>);

}