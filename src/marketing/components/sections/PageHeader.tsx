import { CourtLines } from "../brand/CourtLines";
import { SectionHeading } from "../ui/SectionHeading";

interface PageHeaderProps {
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, lead, children }: PageHeaderProps) {
  return (
    <header className="relative overflow-hidden border-b border-rule">
      <CourtLines className="pointer-events-none absolute -right-20 top-1/2 hidden h-[300px] w-[660px] -translate-y-1/2 text-rule-strong opacity-70 lg:block" />
      <div className="container-page relative py-16 md:py-24">
        <SectionHeading as="h1" eyebrow={eyebrow} title={title} lead={lead} className="max-w-3xl" />
        {children && <div className="mt-8">{children}</div>}
      </div>
    </header>);

}