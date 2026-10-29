import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";
import { ThemeIcon } from "../brand/Icons";
import type { FeatureTheme } from "../../types/content";
import { cn } from "../../utils/cn";

interface FeatureCardProps {
  theme: FeatureTheme;
  className?: string;
}

export function FeatureCard({ theme, className }: FeatureCardProps) {
  return (
    <Link
      to={`/features#${theme.id}`}
      className={cn(
        "group flex h-full flex-col rounded-lg border border-rule bg-surface p-6 transition-[border-color,transform] duration-200 ease-classic hover:-translate-y-0.5 hover:border-rule-strong md:p-7",
        className
      )}>
      
      <div className="flex items-start justify-between">
        <span className="flex size-12 items-center justify-center rounded-full border border-rule text-primary">
          <ThemeIcon name={theme.icon} size={22} />
        </span>
        <span className="font-display text-[15px] italic text-accent-ink">
          <span className="numerals not-italic">{theme.numeral}</span>
        </span>
      </div>
      <h3 className="mt-7 text-h3 text-fg">{theme.title}</h3>
      <p className="mt-2 text-fg-muted">{theme.summary}</p>
      <ul className="mt-5 space-y-1.5 border-t border-rule pt-4 text-[15px] text-fg-muted">
        {theme.items.map((item) =>
        <li key={item.title} className="flex gap-2.5">
            <span className="mt-[11px] h-px w-3 shrink-0 bg-accent" aria-hidden="true" />
            {item.title}
          </li>
        )}
      </ul>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-primary">
        Explore {theme.title.split(" ")[0].toLowerCase()}
        <ArrowRightIcon
          className="size-4 transition-transform duration-150 ease-classic group-hover:translate-x-0.5"
          strokeWidth={1.75}
          aria-hidden="true" />
        
      </span>
    </Link>);

}