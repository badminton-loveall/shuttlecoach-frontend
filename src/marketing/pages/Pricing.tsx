import { usePageMeta } from "../hooks/usePageMeta";
import { PageHeader } from "../components/sections/PageHeader";
import { FaqSection } from "../components/sections/FaqSection";
import { CtaBand } from "../components/sections/CtaBand";
import { PricingCard } from "../components/ui/PricingCard";
import { Badge } from "../components/ui/Badge";
import { Reveal } from "../components/layout/Reveal";
import { pricingTiers } from "../data/pricing";
import { faqs } from "../data/faqs";

export function PricingPage() {
  usePageMeta({
    title: "Pricing",
    description:
    "LoveAll plans for badminton academies: Starter Academy, Pro Academy and Enterprise. Prices in ₹ to be announced. Request a demo for indicative pricing.",
    path: "/pricing"
  });

  const pricingFaqs = faqs.filter((f) => ["pricing", "onboarding", "devices"].includes(f.topic));

  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        title="Plans for every size of academy."
        lead="We are finalising prices with our launch academies. Every plan is billed per academy in ₹, not per coach.">
        
        <Badge tone="sample">Prices to be announced</Badge>
      </PageHeader>

      <section aria-label="Plans" className="py-16 md:py-20">
        <div className="container-page grid gap-5 lg:grid-cols-3">
          {pricingTiers.map((tier, i) =>
          <Reveal key={tier.id} delay={i * 0.05}>
              <PricingCard tier={tier} />
            </Reveal>
          )}
        </div>
      </section>

      <div className="border-t border-rule">
        <FaqSection items={pricingFaqs} title="Before you choose a plan." />
      </div>
      <CtaBand />
    </>);

}