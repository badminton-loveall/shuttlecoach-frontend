import { useRef } from "react";
import { cn } from "../../utils/cn";

interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  idPrefix: string;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ items, value, onChange, label, idPrefix, children, className }: TabsProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % items.length;else
    if (e.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;else
    if (e.key === "Home") next = 0;else
    if (e.key === "End") next = items.length - 1;else
    return;
    e.preventDefault();
    onChange(items[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div className={className}>
      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div role="tablist" aria-label={label} className="flex min-w-max gap-1 border-b border-rule md:min-w-0">
          {items.map((item, i) => {
            const selected = item.id === value;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                role="tab"
                type="button"
                id={`${idPrefix}-tab-${item.id}`}
                aria-selected={selected}
                aria-controls={`${idPrefix}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => onChange(item.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={cn(
                  "-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-[15px] font-semibold transition-[color,border-color] duration-150 ease-classic",
                  selected ? "border-primary text-fg" : "border-transparent text-fg-subtle hover:text-fg"
                )}>
                
                {item.label}
              </button>);

          })}
        </div>
      </div>
      <div
        role="tabpanel"
        id={`${idPrefix}-panel`}
        aria-labelledby={`${idPrefix}-tab-${value}`}
        tabIndex={0}
        className="pt-10 focus-visible:outline-offset-8">
        
        {children}
      </div>
    </div>);

}