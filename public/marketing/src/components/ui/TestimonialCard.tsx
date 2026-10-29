import React from "react";
import { Badge } from "./Badge";
import type { Testimonial } from "../../types/content";

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <figure className="flex h-full flex-col rounded-lg border border-rule bg-surface p-6 md:p-8">
      <div className="flex items-start justify-between">
        <span className="font-display text-[56px] leading-[0.6] text-accent" aria-hidden="true">
          “
        </span>
        <Badge tone="sample">Sample</Badge>
      </div>
      <blockquote className="mt-6 font-display text-[19px] italic leading-[1.55] text-fg">
        {testimonial.quote}
      </blockquote>
      <figcaption className="mt-auto border-t border-rule pt-5 text-[15px]">
        <span className="block font-semibold text-fg">{testimonial.name}</span>
        <span className="block text-fg-subtle">
          {testimonial.role} · {testimonial.academy}
        </span>
      </figcaption>
    </figure>);

}