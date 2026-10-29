import React, { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PlusIcon } from "lucide-react";
import { cn } from "../../utils/cn";

interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpenId?: string;
  className?: string;
}

export function Accordion({ items, defaultOpenId, className }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null);
  const baseId = useId();
  const reduce = useReducedMotion();

  return (
    <div className={cn("border-t border-rule-strong", className)}>
      {items.map((item) => {
        const open = openId === item.id;
        const buttonId = `${baseId}-${item.id}-button`;
        const panelId = `${baseId}-${item.id}-panel`;
        return (
          <div key={item.id} className="border-b border-rule">
            <h3 className="text-[19px] leading-snug md:text-[21px]">
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? null : item.id)}
                className="flex w-full items-start justify-between gap-6 py-5 text-left font-display text-fg transition-colors duration-150 hover:text-primary">
                
                <span>{item.question}</span>
                <PlusIcon
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className={cn(
                    "mt-1 size-5 shrink-0 text-accent-ink transition-transform duration-200 ease-classic",
                    open && "rotate-45"
                  )} />
                
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {open &&
              <motion.div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                initial={reduce ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden">
                
                  <p className="max-w-2xl pb-6 pr-10 text-fg-muted">{item.answer}</p>
                </motion.div>
              }
            </AnimatePresence>
          </div>);

      })}
    </div>);

}