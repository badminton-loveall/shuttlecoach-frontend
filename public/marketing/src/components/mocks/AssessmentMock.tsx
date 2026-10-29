import React from "react";

const skills = [
{ name: "Footwork", prev: 6.5, now: 7.5 },
{ name: "Clears", prev: 6.0, now: 6.5 },
{ name: "Smash", prev: 5.5, now: 6.5 },
{ name: "Net play", prev: 7.0, now: 7.5 },
{ name: "Defence", prev: 5.0, now: 6.0 },
{ name: "Fitness", prev: 6.5, now: 6.5 }];


export function AssessmentMock() {
  return (
    <div className="bg-canvas p-4 text-left text-[12px] text-fg md:p-6" aria-hidden="true">
      <div className="flex flex-wrap items-center gap-3 border-b border-rule pb-4">
        <span className="flex size-10 items-center justify-center rounded-full border border-accent font-display text-[14px]">
          DN
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[18px]">Diya Nair</p>
          <p className="text-fg-subtle">Intermediate U-13 · Assessment 4 · October</p>
        </div>
        <div className="text-right">
          <p className="text-fg-subtle">Overall</p>
          <p className="numerals text-[22px] leading-none">
            6.8 <span className="text-[12px] text-success">+0.8</span>
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {skills.map((s) => {
          const delta = s.now - s.prev;
          return (
            <li key={s.name} className="grid grid-cols-[72px_1fr_64px] items-center gap-3">
              <span className="font-medium">{s.name}</span>
              <span className="relative h-2 rounded-full bg-surface-alt">
                <span className="absolute inset-y-0 left-0 rounded-full bg-primary/25" style={{ width: `${s.prev * 10}%` }} />
                <span className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${s.now * 10}%` }} />
              </span>
              <span className="text-right tabular">
                {s.now.toFixed(1)}{" "}
                <span className={delta > 0 ? "text-success" : "text-fg-subtle"}>
                  {delta > 0 ? `+${delta.toFixed(1)}` : "·"}
                </span>
              </span>
            </li>);

        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-3 text-fg-subtle">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-primary/25" /> Last cycle
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-primary" /> This cycle
          </span>
        </span>
        <span className="rounded-sm bg-info-bg px-2 py-0.5 font-semibold text-info">Next review · 15 Dec</span>
      </div>
    </div>);

}