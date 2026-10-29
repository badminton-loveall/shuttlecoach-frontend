import { SgSection } from "./SgSection";
import { SgExample } from "./SgExample";
import { radii, spacingScale } from "../../data/designTokens";

export function LayoutSection() {
  return (
    <SgSection
      id="layout"
      numeral="IV"
      title="Spacing, layout & shape"
      description="A 12-column grid with a maximum content width of 1200px and 16px gutters on mobile. Radii stay between 4 and 8px. Group content with fine rules first and shadows last.">
      
      <SgExample title="Spacing scale" note="--la-space-1 … 9">
        <ul className="space-y-2.5">
          {spacingScale.map((s, i) =>
          <li key={s} className="grid grid-cols-[110px_1fr] items-center gap-4">
              <span className="font-mono text-[12px] text-fg-subtle">
                space-{i + 1} · {s}px
              </span>
              <span className="h-3 rounded-[1px] bg-primary" style={{ width: s * 3 }} />
            </li>
          )}
        </ul>
      </SgExample>

      <SgExample title="12-column grid" note="max 1200px · 24px gutters ≥ 768px · 16px below">
        <div className="grid grid-cols-12 gap-2 md:gap-6">
          {Array.from({ length: 12 }).map((_, i) =>
          <div key={i} className="flex h-20 items-end justify-center border border-dashed border-accent bg-surface pb-1 text-[11px] tabular text-fg-subtle">
              {i + 1}
            </div>
          )}
        </div>
      </SgExample>

      <div className="grid gap-12 md:grid-cols-2">
        <SgExample title="Radii">
          <div className="flex flex-wrap gap-5">
            {radii.map((r) =>
            <div key={r.name} className="text-center">
                <div className={`size-20 border border-rule-strong bg-surface ${r.className}`} />
                <p className="mt-2 text-[13px] text-fg-subtle">
                  {r.name} · {r.value}
                </p>
              </div>
            )}
          </div>
        </SgExample>
        <SgExample title="Rules & elevation">
          <div className="grid grid-cols-2 gap-4 text-[13px] text-fg-subtle">
            <div className="rounded-md border border-rule bg-surface p-4">Hairline · 1px rule</div>
            <div className="rule-double bg-surface p-4">Double rule · 3px</div>
            <div className="rounded-md bg-surface p-4 shadow-soft-1">Elevation 1 · soft-1</div>
            <div className="rounded-md bg-surface p-4 shadow-soft-2">Elevation 2 · soft-2</div>
          </div>
        </SgExample>
      </div>
    </SgSection>);

}