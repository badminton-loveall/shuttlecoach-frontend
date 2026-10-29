import { useState } from "react";
import { SgSection } from "./SgSection";
import { SgExample } from "./SgExample";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { SportChip } from "../ui/SportChip";
import { Field } from "../ui/Field";
import { Tabs } from "../ui/Tabs";
import { Accordion } from "../ui/Accordion";
import { faqs } from "../../data/faqs";

const states = ["default", "hover", "focus", "active", "disabled"] as const;
const variants = ["primary", "secondary", "tertiary"] as const;

const tabItems = [
{ id: "overview", label: "Overview" },
{ id: "sessions", label: "Sessions" },
{ id: "progress", label: "Progress" }];


export function ControlsSection() {
  const [tab, setTab] = useState("overview");
  const [demo, setDemo] = useState("Smash Point Academy");

  return (
    <SgSection
      id="controls"
      numeral="VI"
      title="Components: actions & inputs"
      description="Every interactive component shows a visible 2px focus outline and responds to the keyboard. Hover changes stay within 150ms. Form fields have no hover state: they react to focus.">
      
      <SgExample title="Buttons" note="Primary · Secondary · Tertiary × states">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr>
                <th scope="col" className="w-28 pb-4 text-[13px] font-semibold text-fg-subtle">Variant</th>
                {states.map((s) =>
                <th key={s} scope="col" className="pb-4 text-[13px] font-semibold capitalize text-fg-subtle">
                    {s}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {variants.map((v) =>
              <tr key={v}>
                  <th scope="row" className="py-3 text-[14px] font-semibold capitalize text-fg">{v}</th>
                  {states.map((s) =>
                <td key={s} className="py-3 pr-4">
                      <Button
                    variant={v}
                    size="sm"
                    disabled={s === "disabled"}
                    demoState={s === "hover" || s === "focus" || s === "active" ? s : undefined}
                    tabIndex={-1}>
                    
                        {v === "tertiary" ? "Read more" : "Request a demo"}
                      </Button>
                    </td>
                )}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SgExample>

      <div className="grid gap-12 md:grid-cols-2">
        <SgExample title="Sport chips">
          <div className="flex flex-wrap gap-2">
            <SportChip name="Badminton" status="live" />
            <SportChip name="Badminton" status="live" label="Now live for Badminton" />
            <SportChip name="Tennis" status="soon" />
            <SportChip name="Pickleball" status="soon" label="Coming soon" />
          </div>
        </SgExample>
        <SgExample title="Badges">
          <div className="flex flex-wrap gap-2">
            <Badge>Neutral</Badge>
            <Badge tone="success">Paid</Badge>
            <Badge tone="warning">Due for review</Badge>
            <Badge tone="danger">Overdue</Badge>
            <Badge tone="info">Next review · 15 Dec</Badge>
            <Badge tone="gold">Recommended</Badge>
            <Badge tone="sample">Sample</Badge>
          </div>
        </SgExample>
      </div>

      <SgExample title="Form inputs" note="Default · Focus · Error · Disabled">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Academy name" name="sg-default" value={demo} onChange={setDemo} />
          <Field
            label="City"
            name="sg-focus"
            value="Bengaluru"
            onChange={() => undefined}
            controlClassName="border-primary shadow-[0_0_0_1px_var(--la-primary)]"
            hint="Shown in its focus state" />
          
          <Field label="Email" name="sg-error" value="coach@" onChange={() => undefined} error="Please enter a valid email address." />
          <Field label="Plan" name="sg-disabled" value="Pro Academy" onChange={() => undefined} disabled />
        </div>
      </SgExample>

      <div className="grid gap-12 lg:grid-cols-2">
        <SgExample title="Tabs" note="Arrow keys, Home and End move between tabs">
          <Tabs label="Demo tabs" idPrefix="sg-tabs" items={tabItems} value={tab} onChange={setTab}>
            <p className="text-fg-muted">
              {tab === "overview" && "A summary of the player's current cycle."}
              {tab === "sessions" && "Upcoming sessions from the calendar."}
              {tab === "progress" && "Assessment scores across cycles."}
            </p>
          </Tabs>
        </SgExample>
        <SgExample title="Accordion" note="Enter or Space toggles · one open at a time">
          <Accordion items={faqs.slice(2, 4)} />
        </SgExample>
      </div>
    </SgSection>);

}