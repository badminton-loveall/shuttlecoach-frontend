import React from "react";
import { Calendar, ChartLine, ClipboardList, IndianRupee, Trophy } from "lucide-react";
import { SgSection } from "./SgSection";
import { SgExample } from "./SgExample";
import { CourtLines } from "../brand/CourtLines";
import { CourtDivider } from "../brand/CourtDivider";
import { Crest } from "../brand/Crest";
import { RacketIcon, ShuttlecockIcon, WhistleIcon } from "../brand/Icons";
import { PhotoFrame } from "../ui/PhotoFrame";
import { images } from "../../data/site";

const icons = [
{ label: "Shuttlecock", node: <ShuttlecockIcon size={28} /> },
{ label: "Racket", node: <RacketIcon size={28} /> },
{ label: "Calendar", node: <Calendar size={28} strokeWidth={1.5} aria-hidden="true" /> },
{ label: "Clipboard", node: <ClipboardList size={28} strokeWidth={1.5} aria-hidden="true" /> },
{ label: "Chart", node: <ChartLine size={28} strokeWidth={1.5} aria-hidden="true" /> },
{ label: "Rupee / ledger", node: <IndianRupee size={28} strokeWidth={1.5} aria-hidden="true" /> },
{ label: "Whistle", node: <WhistleIcon size={28} /> },
{ label: "Trophy", node: <Trophy size={28} strokeWidth={1.5} aria-hidden="true" /> }];


const chapters = ["I", "II", "III", "IV", "V", "VI", "VII"];

export function MotifSection() {
  return (
    <SgSection
      id="motifs"
      numeral="V"
      title="Motifs & imagery"
      description="A badminton court drawn to scale, used as a divider and a quiet background. Crests and Roman-numeral chapters for structure. Warm, natural-light photography with a light duotone and film grain.">
      
      <div className="grid gap-12 md:grid-cols-2">
        <SgExample title="Court lines">
          <div className="rounded-md border border-rule bg-surface p-6 text-accent">
            <CourtLines className="h-40 w-full" />
          </div>
        </SgExample>
        <SgExample title="Crest ornament">
          <div className="flex h-[202px] items-center justify-center rounded-md border border-rule bg-surface">
            <Crest size={120} className="text-fg" />
          </div>
        </SgExample>
      </div>

      <SgExample title="Court divider">
        <CourtDivider className="px-0 md:px-0" />
      </SgExample>

      <SgExample title="Chapters" note="Use only where order matters">
        <div className="flex flex-wrap gap-3">
          {chapters.map((c) =>
          <span key={c} className="flex size-12 items-center justify-center rounded-full border border-rule-strong font-display text-fg">
              <span className="numerals">{c}</span>
            </span>
          )}
        </div>
      </SgExample>

      <div className="grid gap-12 md:grid-cols-2">
        <SgExample title="Photography" note="duotone + grain utilities">
          <PhotoFrame {...images.footworkDrill} imgClassName="aspect-[3/2]" caption="Natural light, real academies, no posed stock." />
        </SgExample>
        <SgExample title="Icons" note="1.5px stroke · 24px grid">
          <ul className="grid grid-cols-4 gap-px overflow-hidden rounded-md border border-rule bg-rule">
            {icons.map((i) =>
            <li key={i.label} className="flex flex-col items-center gap-2 bg-surface px-2 py-5 text-center text-primary">
                {i.node}
                <span className="text-[11px] text-fg-subtle">{i.label}</span>
              </li>
            )}
          </ul>
        </SgExample>
      </div>
    </SgSection>);

}