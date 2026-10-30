import { useEffect } from "react";
import { usePageMeta } from "../hooks/usePageMeta";
import { useTheme, type ThemePreference } from "@/contexts/ThemeContext";
import { PageHeader } from "../components/sections/PageHeader";
import { BrandSection } from "../components/styleguide/BrandSection";
import { ColorSection } from "../components/styleguide/ColorSection";
import { TypeSection } from "../components/styleguide/TypeSection";
import { LayoutSection } from "../components/styleguide/LayoutSection";
import { MotifSection } from "../components/styleguide/MotifSection";
import { ControlsSection } from "../components/styleguide/ControlsSection";
import { DisplaySection } from "../components/styleguide/DisplaySection";
import { GuidelinesSection } from "../components/styleguide/GuidelinesSection";
import { cn } from "../utils/cn";

const toc = [
{ id: "brand", label: "Brand" },
{ id: "color", label: "Colour" },
{ id: "type", label: "Typography" },
{ id: "layout", label: "Spacing & layout" },
{ id: "motifs", label: "Motifs & imagery" },
{ id: "controls", label: "Actions & inputs" },
{ id: "display", label: "Content & layout" },
{ id: "guidelines", label: "Do's & don'ts" }];


const themeOptions: ThemePreference[] = ["system", "light", "dark"];

export function StyleGuidePage() {
  const { preference, setPreference } = useTheme();
  usePageMeta({
    title: "Design system",
    description: "The LoveAll design system: brand, colour tokens, typography, spacing, motifs and components.",
    path: "/style-guide"
  });

  // Internal reference page: not linked from the site and kept out of search.
  useEffect(() => {
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex, nofollow";
    document.head.appendChild(tag);
    return () => tag.remove();
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Design system"
        title="The LoveAll style guide."
        lead="A heritage club look with print-quality detail. Every token and component below is the same code the website is built from.">
        
        <div role="radiogroup" aria-label="Colour theme" className="inline-flex rounded-md border border-rule-strong bg-surface p-1">
          {themeOptions.map((opt) =>
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={preference === opt}
            onClick={() => setPreference(opt)}
            className={cn(
              "rounded-sm px-4 py-1.5 text-sm font-semibold capitalize transition-colors duration-150",
              preference === opt ? "bg-primary text-on-primary" : "text-fg-muted hover:text-fg"
            )}>
            
              {opt}
            </button>
          )}
        </div>
      </PageHeader>

      <div className="container-page grid gap-10 py-14 lg:grid-cols-12">
        <nav aria-label="Style guide sections" className="lg:col-span-3">
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:sticky lg:top-24 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-l lg:border-rule">
            {toc.map((t, i) =>
            <li key={t.id} className="shrink-0">
                <a
                href={`#${t.id}`}
                className="flex items-baseline gap-3 rounded-sm border border-rule px-3 py-1.5 text-[15px] text-fg-muted transition-colors duration-150 hover:text-fg lg:-ml-px lg:border-0 lg:border-l lg:border-transparent lg:px-4 lg:hover:border-accent">
                
                  <span className="numerals w-7 text-[13px] text-accent-ink">{["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][i]}</span>
                  {t.label}
                </a>
              </li>
            )}
          </ul>
        </nav>
        <div className="min-w-0 lg:col-span-9">
          <BrandSection />
          <ColorSection />
          <TypeSection />
          <LayoutSection />
          <MotifSection />
          <ControlsSection />
          <DisplaySection />
          <GuidelinesSection />
        </div>
      </div>
    </>);

}