import { usePageMeta } from "../hooks/usePageMeta";
import { PageHeader } from "../components/sections/PageHeader";
import { CtaBand } from "../components/sections/CtaBand";
import { PhotoFrame } from "../components/ui/PhotoFrame";
import { Eyebrow } from "../components/ui/Eyebrow";
import { Crest } from "../components/brand/Crest";
import { CourtDivider } from "../components/brand/CourtDivider";
import { images, nameLine } from "../data/site";

const principles = [
{
  title: "Coaches first",
  body: "Every screen should save a coach time on court, never add to it. If a feature makes the head coach's evening longer, it doesn't ship."
},
{
  title: "Honest by default",
  body: "We describe only what LoveAll does today. Sample data is labelled as sample, and features still to come are marked as coming soon."
},
{
  title: "One sport at a time",
  body: "Badminton first, done properly. Other racket sports follow only when they are ready for real academies."
}];


export function AboutPage() {
  usePageMeta({
    title: "About: the Love all story",
    description:
    "Every great match begins at Love all. So does every great player. LoveAll brings structure to grassroots coaching, starting with badminton academies in India.",
    path: "/about"
  });

  return (
    <>
      <PageHeader eyebrow="About" title="Why we called it LoveAll." />

      <section aria-labelledby="story-title" className="py-20 md:py-24">
        <div className="container-page grid gap-12 lg:grid-cols-12 lg:gap-16">
          <PhotoFrame
            {...images.veteranCoach}
            className="min-w-0 lg:col-span-5"
            imgClassName="aspect-[4/5]"
            caption="Great academies are built one session at a time." />
          
          <div className="min-w-0 lg:col-span-7">
            <Eyebrow>The story</Eyebrow>
            <h2 id="story-title" className="mt-3 text-[30px] leading-[1.2] text-fg md:text-h2">
              Zero–zero. Everything still to play for.
            </h2>
            <div className="mt-6 space-y-5 text-lead text-fg-muted">
              <p className="first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-display first-letter:text-[64px] first-letter:leading-[0.8] first-letter:text-primary">
                In badminton, tennis, squash and table tennis, every match begins with the same call: “Love all.” Both
                sides on zero, and nothing decided yet. It is the most hopeful moment in the game.
              </p>
              <p>
                A young player walking into an academy for the first time is at Love all too. What happens next depends
                on coaching: a plan, steady practice, honest assessment, and someone keeping track.
              </p>
              <p>
                At most grassroots academies, that tracking lives in paper registers, WhatsApp groups and a spreadsheet
                one person understands. Coaches are brilliant on court and buried off it.
              </p>
            </div>
            <blockquote className="mt-10 border-l-2 border-accent pl-6 font-display text-[24px] italic leading-[1.4] text-fg md:text-[28px]">
              {nameLine}
            </blockquote>
          </div>
        </div>
      </section>

      <CourtDivider />

      <section aria-labelledby="mission-title" className="py-20 md:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <Crest size={64} className="mx-auto text-fg" />
            <Eyebrow className="mt-6">Our mission</Eyebrow>
            <h2 id="mission-title" className="mt-3 text-[30px] leading-[1.2] text-fg md:text-h1">
              Bring structure to grassroots coaching, so more players reach their potential.
            </h2>
            <p className="mt-5 text-lead text-fg-muted">
              We build LoveAll for academy owners and head coaches in India who take development seriously, starting
              with badminton.
            </p>
          </div>

          <div className="mt-16 grid gap-10 border-t border-rule-strong pt-10 md:grid-cols-3 md:gap-8">
            {principles.map((p) =>
            <div key={p.title}>
                <h3 className="text-h3 text-fg">{p.title}</h3>
                <p className="mt-3 text-fg-muted">{p.body}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <CtaBand />
    </>);

}