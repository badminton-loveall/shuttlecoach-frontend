import React from "react";
import { SectionHeading } from "../ui/SectionHeading";
import { LifecycleTimeline } from "../ui/LifecycleTimeline";
import { lifecycleSteps } from "../../data/lifecycle";

export function LifecycleSection() {
  return (
    <section id="how-it-works" aria-labelledby="lifecycle-title" className="scroll-mt-20 py-20 md:py-28">
      <div className="container-page">
        <SectionHeading
          id="lifecycle-title"
          eyebrow="The trainee lifecycle"
          title="From the first serve to the next cycle."
          lead="LoveAll follows a player through the whole rhythm of academy life, then starts again, a level higher." />
        
        <div className="mt-14 md:mt-16">
          <LifecycleTimeline steps={lifecycleSteps} />
        </div>
      </div>
    </section>);

}