import React from "react";
import { SectionHeading } from "../ui/SectionHeading";
import { SportChip } from "../ui/SportChip";
import { PhotoFrame } from "../ui/PhotoFrame";
import { Button } from "../ui/Button";
import { sports } from "../../data/sports";
import { images } from "../../data/site";

export function SportsRoadmap() {
  const live = sports.filter((s) => s.status === "live");
  const soon = sports.filter((s) => s.status === "soon");

  return (
    <section aria-labelledby="sports-title" className="py-20 md:py-28">
      <div className="container-page">
        <SectionHeading
          id="sports-title"
          eyebrow="Sports"
          title="Badminton today. More racket sports to follow."
          lead="LoveAll is built for racket sports. We launched with badminton and will add each new sport only when it is ready." />
        

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-14">
          {live.map((sport) =>
          <article key={sport.id} className="grid gap-6 sm:grid-cols-2 lg:col-span-6">
              <PhotoFrame {...images.shuttle} imgClassName="aspect-[4/5]" />
              <div className="flex flex-col">
                <SportChip name={sport.name} status="live" className="self-start" />
                <h3 className="mt-5 text-h3 text-fg">{sport.name}</h3>
                <p className="mt-3 text-fg-muted">{sport.description}</p>
                <div className="mt-auto pt-6">
                  <Button to="/sports" variant="tertiary">
                    Badminton on LoveAll
                  </Button>
                </div>
              </div>
            </article>
          )}

          <div className="lg:col-span-6">
            <p className="eyebrow text-fg-subtle">On the roadmap</p>
            <ul className="mt-4 divide-y divide-rule border-y border-rule">
              {soon.map((sport) =>
              <li key={sport.id} className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <div>
                    <h3 className="text-[21px] text-fg-muted">{sport.name}</h3>
                    <p className="mt-0.5 text-[15px] text-fg-subtle">{sport.description}</p>
                  </div>
                  <SportChip name={sport.name} status="soon" label="Coming soon" className="self-start sm:self-center" />
                </li>
              )}
            </ul>
            <div className="mt-6">
              <Button to="/sports#notify" variant="secondary">
                Notify me when my sport launches
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>);

}