import React from "react";
import { Logo } from "../brand/Logo";
import { SgSection } from "./SgSection";
import { SgExample } from "./SgExample";
import { nameLine, taglines } from "../../data/site";

const reverseVars = { "--la-fg": "#FAF7F0", "--la-accent": "#D9C39A" } as React.CSSProperties;

export function BrandSection() {
  return (
    <SgSection
      id="brand"
      numeral="I"
      title="Brand"
      description="A serif wordmark with an italic 'All', paired with a roundel crest: an LA monogram inside a champagne-gold laurel. Keep clear space equal to the height of the 'L' on every side.">
      
      <SgExample title="Logo lockups" note="Horizontal · Stacked · Icon only">
        <div className="grid gap-px overflow-hidden rounded-md border border-rule bg-rule md:grid-cols-3">
          <div className="flex min-h-48 items-center justify-center bg-surface p-8">
            <Logo variant="horizontal" size="md" />
          </div>
          <div className="flex min-h-48 items-center justify-center bg-surface p-8">
            <Logo variant="stacked" size="md" />
          </div>
          <div className="flex min-h-48 items-center justify-center bg-surface p-8">
            <Logo variant="icon" size="lg" />
          </div>
        </div>
      </SgExample>

      <SgExample title="Reversed on Court Green">
        <div className="flex min-h-40 flex-wrap items-center justify-center gap-12 rounded-md bg-court p-8" style={reverseVars}>
          <Logo variant="horizontal" size="md" />
          <Logo variant="icon" size="md" />
        </div>
      </SgExample>

      <SgExample title="The name, in one line">
        <p className="max-w-3xl font-display text-[26px] italic leading-[1.4] text-fg md:text-[32px]">{nameLine}</p>
      </SgExample>

      <SgExample title="Tagline options">
        <ol className="divide-y divide-rule border-y border-rule">
          {taglines.map((t, i) =>
          <li key={t} className="flex items-baseline gap-5 py-4">
              <span className="numerals w-6 text-accent-ink">{["I", "II", "III"][i]}</span>
              <span className="font-display text-[22px] text-fg">{t}</span>
            </li>
          )}
        </ol>
      </SgExample>
    </SgSection>);

}