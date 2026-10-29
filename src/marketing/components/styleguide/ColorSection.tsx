import { SgSection } from "./SgSection";
import { SgExample } from "./SgExample";
import { brandColors, neutralScale, semanticStatus, semanticTokens } from "../../data/designTokens";
import { cn } from "../../utils/cn";

const contrast = [
{ pair: "Ink on Ivory", ratio: "15.2 : 1", level: "AAA" },
{ pair: "Court Green on Ivory", ratio: "9.0 : 1", level: "AAA" },
{ pair: "Muted text on Ivory", ratio: "7.7 : 1", level: "AAA" },
{ pair: "Subtle text on Ivory", ratio: "5.4 : 1", level: "AA" },
{ pair: "Gold ink on Ivory", ratio: "5.3 : 1", level: "AA" },
{ pair: "Ink on Electric Lime", ratio: "10.8 : 1", level: "AAA" },
{ pair: "Ivory on Court Green", ratio: "9.0 : 1", level: "AAA" }];


export function ColorSection() {
  return (
    <SgSection
      id="color"
      numeral="II"
      title="Colour"
      description="Court Green leads. Ivory sets the page. Champagne Gold is for ornament: crests, rules and numerals. Electric Lime is the product's own colour and appears only as a 'live' signal.">
      
      <SgExample title="Brand palette">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {brandColors.map((c) =>
          <li key={c.name} className="overflow-hidden rounded-md border border-rule bg-surface">
              <div className="flex h-28 items-end p-3" style={{ background: c.hex, color: c.text }}>
                <span className="tabular text-[13px] font-semibold">{c.hex}</span>
              </div>
              <div className="p-3">
                <p className="font-semibold text-fg">{c.name}</p>
                <p className="text-[13px] text-fg-subtle">{c.role}</p>
                <p className="mt-1 font-mono text-[11px] text-fg-subtle">{c.token}</p>
              </div>
            </li>
          )}
        </ul>
      </SgExample>

      <SgExample title="Warm neutral scale" note="--color-neutral-50 … 950">
        <ul className="grid grid-cols-6 overflow-hidden rounded-md border border-rule sm:grid-cols-11">
          {neutralScale.map((n, i) =>
          <li key={n.step} className="flex h-24 flex-col justify-end p-2" style={{ background: n.hex }}>
              <span className={cn("text-[11px] font-semibold", i < 5 ? "text-ink" : "text-ivory")}>{n.step}</span>
              <span className={cn("hidden text-[10px] tabular md:block", i < 5 ? "text-ink/70" : "text-ivory/70")}>{n.hex}</span>
            </li>
          )}
        </ul>
      </SgExample>

      <SgExample title="Semantic tokens" note="Switch with prefers-color-scheme or the theme toggle">
        <div className="overflow-x-auto rounded-md border border-rule">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead className="bg-surface-alt">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold text-fg">Token</th>
                <th scope="col" className="px-4 py-3 font-semibold text-fg">Utility</th>
                <th scope="col" className="px-4 py-3 font-semibold text-fg">Light</th>
                <th scope="col" className="px-4 py-3 font-semibold text-fg">Dark</th>
                <th scope="col" className="px-4 py-3 font-semibold text-fg">Use</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule bg-surface">
              {semanticTokens.map((t) =>
              <tr key={t.token}>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-fg">{t.token}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-fg-muted">{t.utility}</td>
                  {[t.light, t.dark].map((hex) =>
                <td key={hex} className="px-4 py-2.5">
                      <span className="flex items-center gap-2 tabular text-fg-muted">
                        <span className="size-4 rounded-sm border border-rule-strong" style={{ background: hex }} />
                        {hex}
                      </span>
                    </td>
                )}
                  <td className="px-4 py-2.5 text-fg-muted">{t.usage}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SgExample>

      <div className="grid gap-12 lg:grid-cols-2">
        <SgExample title="Status colours">
          <ul className="grid grid-cols-2 gap-3">
            {semanticStatus.map((s) =>
            <li key={s.name} className={cn("rounded-md p-4", s.bg)}>
                <p className={cn("font-semibold", s.fg)}>{s.name}</p>
                <p className={cn("mt-1 text-[12px] tabular", s.fg)}>{s.light}</p>
              </li>
            )}
          </ul>
        </SgExample>
        <SgExample title="Contrast (light mode)">
          <ul className="divide-y divide-rule border-y border-rule text-[14px]">
            {contrast.map((c) =>
            <li key={c.pair} className="flex items-center justify-between py-2">
                <span className="text-fg-muted">{c.pair}</span>
                <span className="tabular text-fg">
                  {c.ratio} <span className="ml-2 text-[12px] font-semibold text-success">{c.level}</span>
                </span>
              </li>
            )}
          </ul>
        </SgExample>
      </div>
    </SgSection>);

}