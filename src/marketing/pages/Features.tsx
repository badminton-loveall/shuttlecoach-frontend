import { usePageMeta } from "../hooks/usePageMeta";
import { PageHeader } from "../components/sections/PageHeader";
import { CtaBand } from "../components/sections/CtaBand";
import { MockScreen } from "../components/mocks/MockScreen";
import { Eyebrow } from "../components/ui/Eyebrow";
import { ThemeIcon } from "../components/brand/Icons";
import { Reveal } from "../components/layout/Reveal";
import { featureThemes } from "../data/features";
import { cn } from "../utils/cn";

const notYet = ["Video analysis", "Live match scoring", "A native mobile app (LoveAll runs in any browser)"];

export function FeaturesPage() {
  usePageMeta({
    title: "Features",
    description:
    "Player profiles with BAID, batch management, 8-week training plans, drill library, skill assessments, attendance, leave requests and fee tracking for badminton academies.",
    path: "/features"
  });

  return (
    <>
      <PageHeader
        eyebrow="Features"
        title="Everything your academy runs on."
        lead="Five areas of academy work, each built around how badminton coaches already work. Pick a theme, or read straight through.">
        
        <nav aria-label="Feature themes">
          <ul className="flex flex-wrap gap-2">
            {featureThemes.map((t) =>
            <li key={t.id}>
                <a
                href={`#${t.id}`}
                className="inline-flex items-center gap-2 rounded-sm border border-rule bg-surface px-3 py-1.5 text-sm font-medium text-fg transition-colors duration-150 hover:border-rule-strong">
                
                  <span className="numerals text-accent-ink">{t.letter}</span>
                  {t.title}
                </a>
              </li>
            )}
          </ul>
        </nav>
      </PageHeader>

      {featureThemes.map((theme, i) => {
        const flip = i % 2 === 1;
        return (
          <section
            key={theme.id}
            id={theme.id}
            aria-labelledby={`${theme.id}-title`}
            className={cn("scroll-mt-16 py-20 md:py-24", flip && "border-y border-rule bg-surface-alt")}>
            
            <div className="container-page grid items-start gap-12 lg:grid-cols-12 lg:gap-14">
              <div className={cn("min-w-0 lg:col-span-5", flip && "lg:order-2")}>
                <p className="font-display text-[15px] italic text-fg-subtle">
                  Chapter <span className="numerals not-italic">{theme.numeral}</span>
                </p>
                <Eyebrow className="mt-2">Theme {theme.letter}</Eyebrow>
                <h2 id={`${theme.id}-title`} className="mt-3 flex items-center gap-3 text-[30px] leading-[1.2] text-fg md:text-h2">
                  {theme.title}
                </h2>
                <p className="mt-4 text-lead text-fg-muted">{theme.summary}</p>
                <dl className="mt-8 divide-y divide-rule border-y border-rule">
                  {theme.items.map((item) =>
                  <div key={item.title} className="py-4">
                      <dt className="font-semibold text-fg">{item.title}</dt>
                      <dd className="mt-1 text-[15px] text-fg-muted">{item.description}</dd>
                    </div>
                  )}
                </dl>
              </div>
              <Reveal className={cn("min-w-0 lg:col-span-7 lg:pt-10", flip && "lg:order-1")}>
                <MockScreen mock={theme.mock} />
                <p className="mt-3 flex items-center gap-2 text-[13px] text-fg-subtle">
                  <ThemeIcon name={theme.icon} size={14} />
                  Illustrative screen. Names and figures are examples.
                </p>
              </Reveal>
            </div>
          </section>);

      })}

      <section aria-labelledby="not-yet-title" className="py-20 md:py-24">
        <div className="container-page grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Eyebrow>In fairness</Eyebrow>
            <h2 id="not-yet-title" className="mt-3 text-[28px] leading-[1.2] text-fg md:text-h2">
              What LoveAll doesn't do yet.
            </h2>
          </div>
          <div className="lg:col-span-7">
            <p className="text-lead text-fg-muted">
              We'd rather tell you now than in the middle of a season. LoveAll does not currently offer:
            </p>
            <ul className="mt-5 divide-y divide-rule border-y border-rule">
              {notYet.map((n) =>
              <li key={n} className="flex items-center gap-3 py-3 text-fg">
                  <span className="h-px w-4 bg-accent" aria-hidden="true" />
                  {n}
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>

      <CtaBand />
    </>);

}