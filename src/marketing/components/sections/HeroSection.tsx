import { CourtLines } from "../brand/CourtLines";
import { Button } from "../ui/Button";
import { SportChip } from "../ui/SportChip";
import { MockScreen } from "../mocks/MockScreen";
import { Reveal } from "../layout/Reveal";

export function HeroSection() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="container-page pt-12 md:pt-20">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-7">
            <SportChip name="Badminton" status="live" label="Now live for Badminton" />
            <h1
              id="hero-title"
              className="mt-6 text-[42px] leading-[1.06] tracking-[-0.02em] text-fg sm:text-[54px] lg:text-display">
              
              Every great match begins at <em className="italic">Love all.</em>
            </h1>
          </div>
          <div className="lg:col-span-5 lg:pb-1.5">
            <p className="text-lead text-fg-muted">
              The training management platform for badminton academies. Players, batches, training plans,
              assessments, attendance and fees, run from one place.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button to="/contact" size="lg">
                Request a demo
              </Button>
              <Button to="/#how-it-works" size="lg" variant="secondary">
                See how it works
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-12 md:mt-16">
        <div className="absolute inset-x-0 bottom-0 top-[22%] border-t border-rule bg-surface-alt" aria-hidden="true">
          <CourtLines className="absolute inset-x-4 bottom-10 top-10 h-[calc(100%-5rem)] w-[calc(100%-2rem)] text-rule-strong opacity-60" />
        </div>
        <div className="container-page relative pb-12 md:pb-16">
          <Reveal>
            <MockScreen mock="dashboard" />
          </Reveal>
          <p className="mt-4 text-center text-[13px] text-fg-subtle">
            Head coach dashboard. Names and figures are illustrative.
          </p>
        </div>
      </div>
    </section>);

}