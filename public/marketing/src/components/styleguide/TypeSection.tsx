import React from "react";
import { SgSection } from "./SgSection";
import { SgExample } from "./SgExample";
import { Eyebrow } from "../ui/Eyebrow";
import { typeScale } from "../../data/designTokens";

export function TypeSection() {
  return (
    <SgSection
      id="type"
      numeral="III"
      title="Typography"
      description="Libre Caslon Text for display and headings, with the italic kept for emphasis and quotes. Source Sans 3 for body and UI. Scores use tabular serif numerals so columns line up like a printed scorecard.">
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-md border border-rule bg-surface p-6">
          <p className="eyebrow text-fg-subtle">Display · Headings</p>
          <p className="mt-4 font-display text-[44px] leading-none text-fg">
            Aa <span className="italic">Aa</span>
          </p>
          <p className="mt-4 text-[14px] text-fg-muted">Libre Caslon Text · 400, 700, Italic 400</p>
        </div>
        <div className="rounded-md border border-rule bg-surface p-6">
          <p className="eyebrow text-fg-subtle">Body · Interface</p>
          <p className="mt-4 font-sans text-[44px] font-semibold leading-none text-fg">Aa</p>
          <p className="mt-4 text-[14px] text-fg-muted">Source Sans 3 · 400, 500, 600, 700</p>
        </div>
      </div>

      <SgExample title="Type scale" note="64 / 42 / 36 / 24 / 18 / 16 / 12">
        <ul className="divide-y divide-rule border-y border-rule">
          {typeScale.map((t) =>
          <li key={t.name} className="grid gap-2 py-5 md:grid-cols-[180px_1fr] md:items-baseline">
              <div>
                <p className="font-semibold text-fg">{t.name}</p>
                <p className="text-[13px] tabular text-fg-subtle">{t.spec}</p>
              </div>
              <p className={`${t.className} min-w-0 break-words text-fg`}>{t.sample}</p>
            </li>
          )}
        </ul>
      </SgExample>

      <div className="grid gap-12 md:grid-cols-2">
        <SgExample title="Scoreboard numerals" note="numerals utility">
          <p className="numerals text-[64px] leading-none text-fg">
            21 <span className="text-accent">–</span> 19
          </p>
          <p className="numerals mt-3 text-[20px] text-fg-muted">1,10,000 · ₹2,45,500 · 96%</p>
        </SgExample>
        <SgExample title="Eyebrow label" note="eyebrow utility · 12px · 0.18em">
          <Eyebrow>The platform</Eyebrow>
          <p className="mt-3 text-[15px] text-fg-muted">Sits above section headings in Gold Ink. Use it once per section.</p>
        </SgExample>
      </div>
    </SgSection>);

}