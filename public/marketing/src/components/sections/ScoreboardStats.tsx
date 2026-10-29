import React from "react";
import { SectionHeading } from "../ui/SectionHeading";
import { ScoreTile } from "../ui/ScoreTile";
import { Badge } from "../ui/Badge";
import { sampleStats } from "../../data/stats";

export function ScoreboardStats() {
  return (
    <section aria-labelledby="stats-title" className="border-y border-rule bg-surface-alt py-20 md:py-24">
      <div className="container-page">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <SectionHeading id="stats-title" eyebrow="The scoreboard" title="The numbers academies care about." />
          <Badge tone="sample" className="self-start md:self-end">
            Sample data · for illustration only
          </Badge>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-rule-strong bg-rule-strong sm:grid-cols-2 lg:grid-cols-4">
          {sampleStats.map((s) =>
          <ScoreTile key={s.id} label={s.label} value={s.value} caption={s.caption} className="border-0" />
          )}
        </div>
      </div>
    </section>);

}