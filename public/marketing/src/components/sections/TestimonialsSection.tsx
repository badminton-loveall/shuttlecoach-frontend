import React from "react";
import { SectionHeading } from "../ui/SectionHeading";
import { TestimonialCard } from "../ui/TestimonialCard";
import { Reveal } from "../layout/Reveal";
import { testimonials } from "../../data/testimonials";

export function TestimonialsSection() {
  return (
    <section aria-labelledby="testimonials-title" className="border-t border-rule bg-surface-alt py-20 md:py-28">
      <div className="container-page">
        <SectionHeading
          id="testimonials-title"
          eyebrow="Heard courtside"
          title="What a well-run academy sounds like."
          lead="These are sample quotes for illustration. Real testimonials from our launch academies will replace them." />
        
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {testimonials.map((t, i) =>
          <Reveal key={t.id} delay={i * 0.05}>
              <TestimonialCard testimonial={t} />
            </Reveal>
          )}
        </div>
      </div>
    </section>);

}