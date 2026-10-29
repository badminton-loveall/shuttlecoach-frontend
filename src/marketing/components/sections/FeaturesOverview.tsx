import { SectionHeading } from "../ui/SectionHeading";
import { FeatureCard } from "../ui/FeatureCard";
import { Button } from "../ui/Button";
import { Reveal } from "../layout/Reveal";
import { featureThemes } from "../../data/features";
import { cn } from "../../utils/cn";

const spans = ["lg:col-span-3", "lg:col-span-3", "lg:col-span-2", "lg:col-span-2", "md:col-span-2 lg:col-span-2"];

export function FeaturesOverview() {
  return (
    <section aria-labelledby="features-title" className="border-t border-rule bg-surface-alt py-20 md:py-28">
      <div className="container-page">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            id="features-title"
            eyebrow="The platform"
            title="Five parts of running an academy. One place to run them."
            lead="Everything a badminton academy runs on, from the first profile to the last fee receipt." />
          
          <Button to="/features" variant="tertiary" className="self-start md:self-end">
            All features in depth
          </Button>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-6">
          {featureThemes.map((theme, i) =>
          <Reveal key={theme.id} delay={i * 0.04} className={cn(spans[i])}>
              <FeatureCard theme={theme} />
            </Reveal>
          )}
        </div>
      </div>
    </section>);

}