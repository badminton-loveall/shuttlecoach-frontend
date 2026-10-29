
interface SgSectionProps {
  id: string;
  numeral: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function SgSection({ id, numeral, title, description, children }: SgSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="rule-double scroll-mt-20 pb-16 pt-10 md:pb-20">
      <p className="font-display text-[15px] italic text-fg-subtle">
        Chapter <span className="numerals not-italic">{numeral}</span>
      </p>
      <h2 id={`${id}-title`} className="mt-1 text-[30px] leading-[1.2] text-fg md:text-h2">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-fg-muted">{description}</p>
      <div className="mt-10 space-y-12">{children}</div>
    </section>);

}