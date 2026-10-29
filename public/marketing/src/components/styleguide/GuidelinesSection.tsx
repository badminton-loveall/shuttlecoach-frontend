import React from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { SgSection } from "./SgSection";
import { SgExample } from "./SgExample";
import { dosAndDonts } from "../../data/designTokens";

const snippet = `/* CSS custom properties */
.scorecard { color: var(--la-fg); border-color: var(--la-rule); }

/* Tailwind v4 utilities from @theme */
<section class="bg-surface-alt border-t border-rule">
  <h2 class="font-display text-h2 text-fg">…</h2>
  <span class="numerals text-accent-ink">21 – 19</span>
</section>`;

const motion = [
"Fade + 12px rise on scroll, 280ms, cubic-bezier(0.23, 1, 0.32, 1), once only.",
"Hover and press feedback 150ms. Accordion 220ms. Menus 200ms.",
"Name the properties you animate. Never transition-all.",
"Everything is disabled under prefers-reduced-motion."];


export function GuidelinesSection() {
  return (
    <SgSection
      id="guidelines"
      numeral="VIII"
      title="Do's, don'ts & tokens in code"
      description="The rules that keep LoveAll looking classic, honest and easy to read.">
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-md border border-rule bg-surface p-6">
          <p className="flex items-center gap-2 font-semibold text-success">
            <CheckIcon className="size-4" strokeWidth={2} aria-hidden="true" /> Do
          </p>
          <ul className="mt-4 space-y-3 text-[15px] text-fg-muted">
            {dosAndDonts.dos.map((d) =>
            <li key={d}>{d}</li>
            )}
          </ul>
        </div>
        <div className="rounded-md border border-rule bg-surface p-6">
          <p className="flex items-center gap-2 font-semibold text-danger">
            <XIcon className="size-4" strokeWidth={2} aria-hidden="true" /> Don't
          </p>
          <ul className="mt-4 space-y-3 text-[15px] text-fg-muted">
            {dosAndDonts.donts.map((d) =>
            <li key={d}>{d}</li>
            )}
          </ul>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        <SgExample title="Motion">
          <ul className="divide-y divide-rule border-y border-rule text-[15px] text-fg-muted">
            {motion.map((m) =>
            <li key={m} className="py-3">
                {m}
              </li>
            )}
          </ul>
        </SgExample>
        <SgExample title="Using tokens" note="index.css · @theme / @theme inline">
          <pre className="overflow-x-auto rounded-md border border-rule bg-surface-alt p-4 font-mono text-[12px] leading-relaxed text-fg">
            <code>{snippet}</code>
          </pre>
        </SgExample>
      </div>
    </SgSection>);

}