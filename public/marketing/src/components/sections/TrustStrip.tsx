import React from "react";
import { ThemeIcon } from "../brand/Icons";
import type { IconKey } from "../../types/content";

const items: {icon: IconKey;title: string;text: string;}[] = [
{ icon: "map", title: "Built for academies in India", text: "Fees in ₹, and routines shaped around Indian academies." },
{ icon: "shuttlecock", title: "BAID-ready", text: "Badminton Association ID on every player profile." },
{ icon: "shield", title: "Role-based access", text: "Separate views for head coaches, assistant coaches, students and parents." }];


export function TrustStrip() {
  return (
    <section aria-label="Why academies trust LoveAll" className="border-b border-rule">
      <ul className="container-page grid divide-y divide-rule sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map((item) =>
        <li key={item.title} className="flex gap-4 py-6 sm:px-6 sm:first:pl-0 sm:last:pr-0 md:py-8">
            <ThemeIcon name={item.icon} size={22} className="mt-0.5 shrink-0 text-accent-ink" />
            <div>
              <p className="font-semibold text-fg">{item.title}</p>
              <p className="mt-1 text-[15px] text-fg-muted">{item.text}</p>
            </div>
          </li>
        )}
      </ul>
    </section>);

}