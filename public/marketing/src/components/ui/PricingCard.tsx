import React from "react";
import { CheckIcon } from "lucide-react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import type { PricingTier } from "../../types/content";
import { cn } from "../../utils/cn";

interface PricingCardProps {
  tier: PricingTier;
}

export function PricingCard({ tier }: PricingCardProps) {
  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-lg bg-surface p-6 md:p-8",
        tier.recommended ? "border-[3px] border-double border-primary" : "border border-rule"
      )}
      aria-labelledby={`tier-${tier.id}`}>
      
      <div className="flex min-h-7 items-center justify-between gap-3">
        <h3 id={`tier-${tier.id}`} className="text-h3 text-fg">
          {tier.name}
        </h3>
        {tier.recommended && <Badge tone="gold">Recommended</Badge>}
      </div>
      <p className="mt-2 min-h-[3.2em] text-fg-muted">{tier.audience}</p>
      <div className="mt-6 border-y border-rule py-5">
        <p className="numerals text-[40px] leading-none text-fg">{tier.price}</p>
        <p className="mt-2 text-[13px] text-fg-subtle">{tier.priceNote} · Prices to be announced</p>
      </div>
      <ul className="mt-6 space-y-3 text-[15px] text-fg">
        {tier.features.map((f) =>
        <li key={f} className="flex gap-3">
            <CheckIcon className="mt-1 size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
            {f}
          </li>
        )}
      </ul>
      <div className="mt-auto pt-8">
        <Button to="/contact" variant={tier.recommended ? "primary" : "secondary"} className="w-full">
          {tier.cta}
        </Button>
      </div>
    </article>);

}