import { CheckIcon } from "lucide-react";
import { Badge } from "./Badge";
import { cn } from "../../utils/cn";

export interface PlanRow {
  label: string;
  value: string;
}

interface PlanCardProps {
  id: string;
  title: string;
  description: string;
  price: string;
  /** Small label above the price, e.g. "From". */
  pricePrefix?: string;
  priceNote: string;
  badge?: string;
  /** Price table, e.g. seat tiers. */
  rows?: PlanRow[];
  features?: string[];
  featured?: boolean;
  /** Full-width card: details on the left, features on the right (lg+). */
  wide?: boolean;
  footer?: React.ReactNode;
  className?: string;
}

export function PlanCard({
  id,
  title,
  description,
  price,
  pricePrefix,
  priceNote,
  badge,
  rows,
  features,
  featured,
  wide,
  footer,
  className
}: PlanCardProps) {
  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-lg bg-surface p-6 md:p-8",
        featured ? "border-[3px] border-double border-primary" : "border border-rule",
        className
      )}
      aria-labelledby={`plan-${id}`}>
      
      <div className={cn(wide && "lg:grid lg:grid-cols-2 lg:gap-12")}>
        <div className="flex flex-col">
          <div className="flex min-h-7 flex-wrap items-center justify-between gap-3">
            <h3 id={`plan-${id}`} className="text-h3 text-fg">
              {title}
            </h3>
            {badge && <Badge tone="gold">{badge}</Badge>}
          </div>
          <p className="mt-2 text-fg-muted">{description}</p>
          <div className="mt-6 border-y border-rule py-5">
            {pricePrefix && <p className="eyebrow mb-1 text-fg-subtle">{pricePrefix}</p>}
            <p className="numerals text-[40px] leading-none text-fg">{price}</p>
            <p className="mt-2 text-[13px] text-fg-subtle">{priceNote}</p>
          </div>
          {rows && rows.length > 0 &&
          <dl className="mt-5 divide-y divide-rule text-[15px]">
              {rows.map((r) =>
            <div key={r.label} className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="text-fg">{r.label}</dt>
                  <dd className="numerals text-fg">{r.value}</dd>
                </div>
            )}
            </dl>
          }
          {wide && footer && <div className="mt-auto hidden pt-8 lg:block">{footer}</div>}
        </div>
        {features && features.length > 0 &&
        <ul className={cn("mt-6 space-y-3 text-[15px] text-fg", wide && "lg:mt-0 lg:self-center")}>
            {features.map((f) =>
          <li key={f} className="flex gap-3">
                <CheckIcon className="mt-1 size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
                {f}
              </li>
          )}
          </ul>
        }
      </div>
      {footer && <div className={cn("mt-auto pt-8", wide && "lg:hidden")}>{footer}</div>}
    </article>);

}
