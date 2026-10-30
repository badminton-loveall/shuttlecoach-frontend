import { usePageMeta } from "../hooks/usePageMeta";
import { usePricing } from "../hooks/usePricing";
import { PageHeader } from "../components/sections/PageHeader";
import { FaqSection } from "../components/sections/FaqSection";
import { CtaBand } from "../components/sections/CtaBand";
import { PlanCard } from "../components/ui/PlanCard";
import { Button } from "../components/ui/Button";
import { Reveal } from "../components/layout/Reveal";
import {
  accountingFeatures,
  formatInr,
  formatTrial,
  freePlanFeatures,
  summarisePricing,
  type SeatTier } from
"../data/pricing";
import { faqs } from "../data/faqs";

const seatRows = (free: number, tiers: SeatTier[], noun: string) => [
{ label: `Up to ${free} ${noun}`, value: "Free" },
...tiers.map((t) => ({ label: `Up to ${t.limit} ${noun}`, value: `${formatInr(t.price)} / mo` }))];


export function PricingPage() {
  usePageMeta({
    title: "Pricing",
    description:
    "Start LoveAll free with up to 2 coaches and 2 students. Add student and coach seats or the Accounting Section as your badminton academy grows. Prices in ₹, per academy.",
    path: "/pricing"
  });

  const { items } = usePricing();
  const p = summarisePricing(items);
  const pricingFaqs = faqs.filter((f) => ["pricing", "onboarding", "devices"].includes(f.topic));

  const largestStudents = p.studentTiers.at(-1);
  const largestCoaches = p.coachTiers.at(-1);
  const example =
  largestStudents && largestCoaches && p.accountingMonthly !== null ?
  {
    students: largestStudents.limit,
    coaches: largestCoaches.limit,
    total: largestStudents.price + largestCoaches.price + p.accountingMonthly
  } :
  null;

  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        title="Start free. Add what your academy needs."
        lead={`The full training platform is free for up to ${p.freeCoaches} coaches and ${p.freeStudents} students. Add seats and the Accounting Section as you grow. Prices are per academy, in ₹.`} />
      

      <section aria-label="Plan and add-ons" className="py-16 md:py-20">
        <div className="container-page grid gap-5 lg:grid-cols-3">
          <Reveal className="lg:col-span-3">
            <PlanCard
              id="free"
              wide
              title="Free"
              badge="Start here"
              featured
              description="Everything you need to run training, for a small academy or a trial."
              price={formatInr(0)}
              priceNote="Free for as long as you like"
              rows={[
              { label: "Coaches", value: `Up to ${p.freeCoaches}` },
              { label: "Students", value: `Up to ${p.freeStudents}` }]
              }
              features={freePlanFeatures}
              footer={
              <Button to="/contact" className="w-full">
                  Get started free
                </Button>
              } />
            
          </Reveal>

          {p.studentTiers.length > 0 &&
          <Reveal delay={0.05}>
              <PlanCard
              id="students"
              title="Student seats"
              description="Add seats as your batches fill up. Pick the tier that covers your academy."
              pricePrefix="From"
              price={formatInr(p.studentTiers[0].price)}
              priceNote="Per month, per academy"
              rows={seatRows(p.freeStudents, p.studentTiers, "students")} />
            
            </Reveal>
          }

          {p.coachTiers.length > 0 &&
          <Reveal delay={0.1}>
              <PlanCard
              id="coaches"
              title="Coach seats"
              description="Give assistant coaches their own logins for assessments, logs and attendance."
              pricePrefix="From"
              price={formatInr(p.coachTiers[0].price)}
              priceNote="Per month, per academy"
              rows={seatRows(p.freeCoaches, p.coachTiers, "coaches")} />
            
            </Reveal>
          }

          {p.accountingMonthly !== null &&
          <Reveal delay={0.15}>
              <PlanCard
              id="accounting"
              title="Accounting Section"
              badge={p.accountingTrialDays ? `${formatTrial(p.accountingTrialDays)} free` : undefined}
              description="Fees, salaries and expenses in one place, alongside your training data."
              price={formatInr(p.accountingMonthly)}
              priceNote={
              p.accountingTrialDays ?
              `Per month, after a ${formatTrial(p.accountingTrialDays)} free trial` :
              "Per month, per academy"
              }
              features={accountingFeatures} />
            
            </Reveal>
          }
        </div>

        {p.drillPacks.length > 0 &&
        <div className="container-page mt-5">
            <PlanCard
            id="drill-packs"
            title="Drill packs"
            description="Ready-made badminton drill catalogs you can adopt into your library."
            pricePrefix="From"
            price={formatInr(p.drillPacks[0].price)}
            priceNote="One-time purchase"
            rows={p.drillPacks.map((d) => ({ label: d.name, value: formatInr(d.price) }))} />
          
          </div>
        }

        <div className="container-page mt-12">
          <div className="rule-double grid gap-8 pt-8 md:grid-cols-2">
            {example &&
            <p className="font-display text-[22px] leading-snug text-fg">
                An academy with {example.students} students, {example.coaches} coaches and the Accounting Section
                pays <span className="numerals">{formatInr(example.total)}</span> a month.
              </p>
            }
            <ul className="space-y-2 text-[15px] text-fg-muted">
              <li>Prices are per academy, in ₹, for each 30-day period. Free seats never expire.</li>
              <li>Seat tiers set your limit; they don't add up. Choose the one that covers your academy.</li>
              <li>Upgrade any time from Settings → Subscriptions in the app. Paid add-ons switch on once payment is confirmed.</li>
              <li>
                More than {largestStudents?.limit ?? p.freeStudents} students or {largestCoaches?.limit ?? p.freeCoaches} coaches?{" "}
                <Button to="/contact" variant="tertiary">
                  Talk to us
                </Button>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div className="border-t border-rule">
        <FaqSection items={pricingFaqs} title="Before you choose." />
      </div>
      <CtaBand />
    </>);

}
