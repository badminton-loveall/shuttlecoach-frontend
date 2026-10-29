import { usePageMeta } from "../hooks/usePageMeta";
import { PageHeader } from "../components/sections/PageHeader";
import { NotifyForm } from "../components/sections/NotifyForm";
import { CtaBand } from "../components/sections/CtaBand";
import { SportChip } from "../components/ui/SportChip";
import { PhotoFrame } from "../components/ui/PhotoFrame";
import { Eyebrow } from "../components/ui/Eyebrow";
import { RacketIcon } from "../components/brand/Icons";
import { sports } from "../data/sports";
import { images, nameLine } from "../data/site";

const badmintonDetails = [
{ title: "BAID on every profile", description: "Record each player's Badminton Association ID alongside guardian, medical and body metrics." },
{ title: "Badminton skill assessments", description: "Score footwork, strokes, net play, defence and fitness every two months." },
{ title: "Age-group batches", description: "Organise U-11, U-13, U-15 and senior batches, each with its own timings and coaches." },
{ title: "8-week training cycles", description: "Plan footwork, stroke and match-play focus week by week, with drills from your library." }];


export function SportsPage() {
  const live = sports.find((s) => s.status === "live");
  const soon = sports.filter((s) => s.status === "soon");

  usePageMeta({
    title: "Sports: badminton live, more racket sports coming soon",
    description:
    "LoveAll is live for badminton academies. Tennis, squash, table tennis and pickleball are coming soon. Leave your email to be notified.",
    path: "/sports"
  });

  return (
    <>
      <PageHeader eyebrow="Sports" title="Built for racket sports. Live for badminton." lead={nameLine}>
        <div className="flex flex-wrap gap-2">
          {sports.map((s) =>
          <SportChip key={s.id} name={s.name} status={s.status} />
          )}
        </div>
      </PageHeader>

      {live &&
      <section aria-labelledby="badminton-title" className="py-20 md:py-24">
          <div className="container-page grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
            <PhotoFrame
            {...images.footworkDrill}
            className="min-w-0 lg:col-span-6"
            imgClassName="aspect-[3/2]"
            caption="Footwork before strokes. Strokes before tactics." />
          
            <div className="min-w-0 lg:col-span-6">
              <SportChip name={live.name} status="live" />
              <h2 id="badminton-title" className="mt-5 text-[30px] leading-[1.2] text-fg md:text-h2">
                Badminton, game, set and match.
              </h2>
              <p className="mt-4 text-lead text-fg-muted">{live.description}</p>
              <dl className="mt-8 grid gap-x-8 gap-y-6 border-t border-rule pt-6 sm:grid-cols-2">
                {badmintonDetails.map((d) =>
              <div key={d.title}>
                    <dt className="font-semibold text-fg">{d.title}</dt>
                    <dd className="mt-1 text-[15px] text-fg-muted">{d.description}</dd>
                  </div>
              )}
              </dl>
            </div>
          </div>
        </section>
      }

      <section aria-labelledby="soon-title" className="border-t border-rule bg-surface-alt py-20 md:py-24">
        <div className="container-page">
          <Eyebrow>Coming soon</Eyebrow>
          <h2 id="soon-title" className="mt-3 max-w-2xl text-[28px] leading-[1.2] text-fg md:text-h2">
            Next on court.
          </h2>
          <p className="mt-4 max-w-2xl text-lead text-fg-muted">
            These sports are on our roadmap and are not available today. Each one launches only when it is ready for
            real academies.
          </p>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {soon.map((s) =>
            <li key={s.id} className="flex h-full flex-col rounded-lg border border-dashed border-rule-strong bg-canvas p-6">
                <RacketIcon size={24} className="text-fg-subtle" />
                <h3 className="mt-5 text-h3 text-fg">{s.name}</h3>
                <p className="mt-2 text-[15px] text-fg-muted">{s.description}</p>
                <div className="mt-auto pt-6">
                  <SportChip name={s.name} status="soon" label="Coming soon" />
                </div>
              </li>
            )}
          </ul>

          <div id="notify" className="mt-16 scroll-mt-24">
            <h3 className="text-h3 text-fg">Coach another racket sport?</h3>
            <p className="mt-2 text-fg-muted">Leave your email and we'll tell you when your sport goes live.</p>
            <div className="mt-6 max-w-3xl">
              <NotifyForm />
            </div>
          </div>
        </div>
      </section>

      <CtaBand title="Run a badminton academy?" body="Request a demo and see LoveAll with batches like yours." />
    </>);

}