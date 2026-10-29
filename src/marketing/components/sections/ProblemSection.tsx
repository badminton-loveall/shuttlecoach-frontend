import { CheckIcon } from "lucide-react";
import { SectionHeading } from "../ui/SectionHeading";
import { PhotoFrame } from "../ui/PhotoFrame";
import { Reveal } from "../layout/Reveal";
import { problemRows } from "../../data/problem";
import { images } from "../../data/site";

export function ProblemSection() {
  return (
    <section aria-labelledby="problem-title" className="py-20 md:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="min-w-0 lg:col-span-4">
          <SectionHeading
            id="problem-title"
            eyebrow="The problem"
            title="Registers, WhatsApp groups and spreadsheets don't make an academy."
            lead="You run sessions all day. Then the admin starts. LoveAll brings it into one organised academy." />
          
          <PhotoFrame {...images.coachJunior} className="mt-10 hidden lg:flex" imgClassName="aspect-[4/5]" />
        </div>

        <Reveal className="min-w-0 lg:col-span-8">
          <div className="grid grid-cols-[1fr_1fr] gap-6 border-b border-rule-strong pb-3 md:grid-cols-[150px_1fr_1fr]">
            <span className="hidden md:block" />
            <p className="eyebrow text-fg-subtle">Today</p>
            <p className="eyebrow text-accent-ink">With LoveAll</p>
          </div>
          <ul>
            {problemRows.map((row) =>
            <li key={row.area} className="grid gap-x-6 gap-y-2 border-b border-rule py-5 md:grid-cols-[150px_1fr_1fr]">
                <h3 className="text-[19px] text-fg">{row.area}</h3>
                <div className="grid grid-cols-2 gap-6 md:contents">
                  <p className="text-[15px] text-fg-subtle">{row.before}</p>
                  <p className="flex gap-2 text-[15px] font-medium text-fg">
                    <CheckIcon className="mt-1 size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
                    {row.after}
                  </p>
                </div>
              </li>
            )}
          </ul>
        </Reveal>
      </div>
    </section>);

}