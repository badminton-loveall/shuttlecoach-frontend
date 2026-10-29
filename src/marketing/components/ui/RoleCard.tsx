import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";
import { ThemeIcon } from "../brand/Icons";
import type { Role } from "../../types/content";

interface RoleCardProps {
  role: Role;
  index: number;
}

export function RoleCard({ role, index }: RoleCardProps) {
  return (
    <Link
      to={`/roles?role=${role.id}`}
      className="group flex h-full flex-col rounded-lg border border-rule bg-surface p-6 transition-[border-color,transform] duration-200 ease-classic hover:-translate-y-0.5 hover:border-rule-strong md:p-8">
      
      <div className="flex items-center justify-between border-b border-rule pb-5">
        <ThemeIcon name={role.icon} size={26} className="text-primary" />
        <span className="eyebrow text-fg-subtle">Role {index + 1} of 3</span>
      </div>
      <h3 className="mt-6 text-h3 text-fg">{role.title}</h3>
      <p className="mt-1 text-[15px] text-accent-ink">{role.audience}</p>
      <p className="mt-4 text-fg-muted">{role.description}</p>
      <ul className="mt-6 space-y-2 text-[15px] text-fg">
        {role.capabilities.map((c) =>
        <li key={c} className="flex gap-3">
            <span className="mt-[11px] h-px w-3 shrink-0 bg-accent" aria-hidden="true" />
            {c}
          </li>
        )}
      </ul>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-8 text-sm font-semibold text-primary">
        See the {role.title.toLowerCase()} view
        <ArrowRightIcon
          className="size-4 transition-transform duration-150 ease-classic group-hover:translate-x-0.5"
          strokeWidth={1.75}
          aria-hidden="true" />
        
      </span>
    </Link>);

}