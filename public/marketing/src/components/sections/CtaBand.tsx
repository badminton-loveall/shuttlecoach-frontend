import React from "react";
import { Link } from "react-router-dom";
import { Crest } from "../brand/Crest";
import { CourtLines } from "../brand/CourtLines";
import { Button } from "../ui/Button";

interface CtaBandProps {
  title?: string;
  body?: string;
}

export function CtaBand({
  title = "Ready to serve?",
  body = "Request a demo. We'll walk you through LoveAll using batches and routines like yours."
}: CtaBandProps) {
  return (
    <section data-surface="court" aria-labelledby="cta-title" className="relative overflow-hidden bg-court text-on-court">
      <CourtLines className="pointer-events-none absolute -right-24 top-1/2 hidden h-[340px] w-[740px] -translate-y-1/2 text-on-court/15 md:block" />
      <div className="container-page relative py-20 md:py-24">
        <div className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
          <div className="flex max-w-xl items-start gap-6">
            <Crest size={64} className="hidden shrink-0 text-on-court sm:block" />
            <div>
              <h2 id="cta-title" className="text-[34px] leading-[1.15] text-on-court md:text-h1">
                {title}
              </h2>
              <p className="mt-3 text-lead text-on-court-muted">{body}</p>
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button to="/contact" variant="inverse" size="lg">
              Request a demo
            </Button>
            <Link
              to="/pricing"
              className="text-[15px] font-semibold text-on-court underline decoration-lime decoration-1 underline-offset-[6px] hover:decoration-2">
              
              See pricing plans
            </Link>
          </div>
        </div>
      </div>
    </section>);

}