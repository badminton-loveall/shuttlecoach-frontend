import { SectionHeading } from "../ui/SectionHeading";
import { RoleCard } from "../ui/RoleCard";
import { Reveal } from "../layout/Reveal";
import { roles } from "../../data/roles";

export function RolesSection() {
  return (
    <section aria-labelledby="roles-title" className="border-t border-rule bg-surface-alt py-20 md:py-28">
      <div className="container-page">
        <SectionHeading
          id="roles-title"
          eyebrow="Built for every role"
          title="One academy. Three ways in."
          lead="Everyone sees what they need and nothing they shouldn't." />
        
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {roles.map((role, i) =>
          <Reveal key={role.id} delay={i * 0.05}>
              <RoleCard role={role} index={i} />
            </Reveal>
          )}
        </div>
      </div>
    </section>);

}