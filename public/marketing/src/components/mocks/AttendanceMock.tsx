import React from "react";
import { cn } from "../../utils/cn";

type Mark = "P" | "A" | "L";

const players: {name: string;mark: Mark;}[] = [
{ name: "Aarav Sharma", mark: "P" },
{ name: "Ananya Iyer", mark: "P" },
{ name: "Kabir Rao", mark: "L" },
{ name: "Meera Pillai", mark: "P" },
{ name: "Rohan Das", mark: "A" },
{ name: "Ishaan Gupta", mark: "P" }];


const markStyle: Record<Mark, string> = {
  P: "bg-success-bg text-success border-success/40",
  A: "bg-danger-bg text-danger border-danger/40",
  L: "bg-warning-bg text-warning border-warning/40"
};

export function AttendanceMock() {
  return (
    <div className="grid gap-3 bg-canvas p-4 text-left text-[12px] text-fg md:grid-cols-5 md:p-6" aria-hidden="true">
      <div className="rounded-sm border border-rule bg-surface p-3 md:col-span-3">
        <div className="flex items-baseline justify-between gap-2 border-b border-rule pb-2">
          <div>
            <p className="font-display text-[17px]">Beginners U-11</p>
            <p className="text-fg-subtle">Tue · 5:30 PM · Coach Arjun</p>
          </div>
          <p className="tabular text-fg-muted">4 / 6 present</p>
        </div>
        <ul className="divide-y divide-rule">
          {players.map((p) =>
          <li key={p.name} className="flex items-center justify-between py-1.5">
              <span className="font-medium">{p.name}</span>
              <span className="flex gap-1">
                {(["P", "A", "L"] as Mark[]).map((m) =>
              <span
                key={m}
                className={cn(
                  "flex size-6 items-center justify-center rounded-sm border text-[11px] font-semibold",
                  p.mark === m ? markStyle[m] : "border-rule text-fg-subtle"
                )}>
                
                    {m}
                  </span>
              )}
              </span>
            </li>
          )}
        </ul>
      </div>

      <div className="flex flex-col gap-3 md:col-span-2">
        <div className="rounded-sm border border-rule bg-surface p-3">
          <p className="font-semibold">Leave request</p>
          <p className="mt-1 text-fg-muted">Kabir Rao · Tue 29 Oct</p>
          <p className="mt-0.5 text-fg-subtle">“School exam. Back on Thursday.”</p>
          <div className="mt-3 flex gap-2">
            <span className="rounded-sm bg-primary px-2.5 py-1 font-semibold text-on-primary">Approve</span>
            <span className="rounded-sm border border-rule-strong px-2.5 py-1 font-semibold text-fg-muted">Decline</span>
          </div>
        </div>
        <div className="rounded-sm border border-rule bg-surface p-3">
          <p className="font-semibold">Training log</p>
          <p className="mt-1 text-fg-muted">Grip basics, underarm lifts, shadow footwork. Rohan absent without notice.</p>
        </div>
      </div>
    </div>);

}