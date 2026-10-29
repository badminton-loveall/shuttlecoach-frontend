import { SectionHeading } from "../ui/SectionHeading";
import { Accordion } from "../ui/Accordion";
import { Button } from "../ui/Button";
import { faqs as allFaqs } from "../../data/faqs";
import type { Faq } from "../../types/content";

interface FaqSectionProps {
  items?: Faq[];
  title?: string;
}

export function FaqSection({ items = allFaqs, title = "Questions from the sideline." }: FaqSectionProps) {
  return (
    <section aria-labelledby="faq-title" className="py-20 md:py-28">
      <div className="container-page grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeading id="faq-title" eyebrow="FAQ" title={title} />
          <p className="mt-5 text-fg-muted">Something we haven't covered?</p>
          <Button to="/contact" variant="tertiary" className="mt-2">
            Ask us directly
          </Button>
        </div>
        <div className="lg:col-span-8">
          <Accordion items={items} defaultOpenId={items[0]?.id} />
        </div>
      </div>
    </section>);

}