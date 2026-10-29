import { cn } from "../../utils/cn";

interface SgExampleProps {
  title: string;
  note?: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function SgExample({ title, note, children, className, bodyClassName }: SgExampleProps) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-2">
        <h3 className="text-[19px] text-fg">{title}</h3>
        {note && <p className="text-[13px] text-fg-subtle">{note}</p>}
      </div>
      <div className={cn("pt-6", bodyClassName)}>{children}</div>
    </div>);

}