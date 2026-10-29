import React from "react";
import { SgSection } from "./SgSection";
import { SgExample } from "./SgExample";
import { FeatureCard } from "../ui/FeatureCard";
import { RoleCard } from "../ui/RoleCard";
import { PricingCard } from "../ui/PricingCard";
import { TestimonialCard } from "../ui/TestimonialCard";
import { ScoreTile } from "../ui/ScoreTile";
import { LifecycleTimeline } from "../ui/LifecycleTimeline";
import { MockScreen } from "../mocks/MockScreen";
import { featureThemes } from "../../data/features";
import { roles } from "../../data/roles";
import { pricingTiers } from "../../data/pricing";
import { testimonials } from "../../data/testimonials";
import { lifecycleSteps } from "../../data/lifecycle";

export function DisplaySection() {
  return (
    <SgSection
      id="display"
      numeral="VII"
      title="Components: content & layout"
      description="Cards share a 1px border, an 8px radius and a footer pinned to the bottom, so the baselines in a row always line up. Linked cards lift by 2px on hover. Static cards never react to hover.">
      
      <SgExample title="Feature, role, pricing & testimonial cards">
        <div className="grid gap-5 md:grid-cols-2">
          <FeatureCard theme={featureThemes[1]} />
          <RoleCard role={roles[1]} index={1} />
          <PricingCard tier={pricingTiers[1]} />
          <TestimonialCard testimonial={testimonials[0]} />
        </div>
      </SgExample>

      <SgExample title="Scoreboard tiles">
        <div className="grid gap-px overflow-hidden rounded-md border border-rule-strong bg-rule-strong sm:grid-cols-3">
          <ScoreTile label="Game one" score={["21", "0"]} caption="Match score format" className="border-0" />
          <ScoreTile label="Players profiled" value="3,240" caption="Metric format" className="border-0" />
          <ScoreTile label="Fees tracked" value="₹2.4 Cr" caption="Currency format" className="border-0" />
        </div>
      </SgExample>

      <SgExample title="Lifecycle stepper" note="Horizontal ≥ 1024px · vertical below">
        <LifecycleTimeline steps={lifecycleSteps} />
      </SgExample>

      <SgExample title="App screenshot frame">
        <MockScreen mock="curriculum" />
      </SgExample>

      <SgExample title="Navigation bar & footer">
        <p className="max-w-2xl text-fg-muted">
          The live navigation bar sits at the top of this page. It stays sticky with a 1px bottom rule, and the active
          link takes a gold underline. Below 1024px it collapses into a full-height menu: focus moves to the first link,
          Escape closes it and focus returns to the toggle. The footer, at the bottom of every page, opens with a double
          rule and carries the crest, sitemap, contact and social links.
        </p>
      </SgExample>
    </SgSection>);

}