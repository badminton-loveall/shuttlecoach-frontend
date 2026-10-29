import { CheckIcon } from "lucide-react";
import { cn } from "../../utils/cn";

const weeks = [
{ n: 1, focus: "Footwork base", state: "done" },
{ n: 2, focus: "Clears & lifts", state: "done" },
{ n: 3, focus: "Net play", state: "current" },
{ n: 4, focus: "Drop shots", state: "next" },
{ n: 5, focus: "Smash & follow", state: "next" },
{ n: 6, focus: "Defence", state: "next" },
{ n: 7, focus: "Doubles rotation", state: "next" },
{ n: 8, focus: "Match play", state: "next" }] as
const;

const sessions = [
{ day: "Mon", drills: ["Six-corner shadow footwork · 15 min", "Net kill & tumble · 20 min"] },
{ day: "Wed", drills: ["Multi-shuttle net feed · 20 min", "Half-court net rallies · 25 min"] },
{ day: "Fri", drills: ["Spin serve practice · 15 min", "Conditioned games · 30 min"] }];


export function CurriculumMock() {
  return (
    <div className="bg-canvas p-4 text-left text-[12px] text-fg md:p-6" aria-hidden="true">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-display text-[19px]">Cycle 3 · Intermediate U-13</p>
          <p className="text-fg-subtle">8-week training plan · 2 Sep – 27 Oct</p>
        </div>
        <span className="rounded-sm border border-rule bg-surface px-2 py-1 text-fg-muted">Week 3 of 8</span>
      </div>

      <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {weeks.map((w) =>
        <li
          key={w.n}
          className={cn(
            "rounded-sm border bg-surface p-2.5",
            w.state === "current" ? "border-2 border-signal" : "border-rule"
          )}>
          
            <div className="flex items-center justify-between text-fg-subtle">
              <span className="tabular">Week {w.n}</span>
              {w.state === "done" && <CheckIcon className="size-3 text-success" strokeWidth={2} />}
            </div>
            <p className={cn("mt-1 font-medium", w.state === "next" && "text-fg-muted")}>{w.focus}</p>
          </li>
        )}
      </ol>

      <div className="mt-3 rounded-sm border border-rule bg-surface p-3">
        <p className="font-semibold">Week 3 · Net play: sessions</p>
        <div className="mt-2 grid gap-3 md:grid-cols-3">
          {sessions.map((s) =>
          <div key={s.day} className="border-t border-rule pt-2">
              <p className="font-semibold text-fg-muted">{s.day}</p>
              <ul className="mt-1 space-y-1">
                {s.drills.map((d) =>
              <li key={d} className="text-fg-muted">
                    {d}
                  </li>
              )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>);

}