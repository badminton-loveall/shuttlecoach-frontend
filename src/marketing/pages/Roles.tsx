import { useSearchParams } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import { PageHeader } from "../components/sections/PageHeader";
import { CtaBand } from "../components/sections/CtaBand";
import { MockScreen } from "../components/mocks/MockScreen";
import { Tabs } from "../components/ui/Tabs";
import { Eyebrow } from "../components/ui/Eyebrow";
import { ThemeIcon } from "../components/brand/Icons";
import { roles } from "../data/roles";
import type { RoleId } from "../types/content";

const permissions: {area: string;values: [string, string, string];}[] = [
{ area: "Players & batches", values: ["Manage all", "Assigned batches", "Own profile"] },
{ area: "Curriculum & drills", values: ["Create & edit", "View & follow", "—"] },
{ area: "Session calendar", values: ["All sessions", "Own sessions", "Own sessions"] },
{ area: "Attendance", values: ["All batches", "Mark assigned", "View own"] },
{ area: "Leave requests", values: ["Approve", "Approve", "Submit"] },
{ area: "Skill assessments", values: ["All players", "Score assigned", "View own progress"] },
{ area: "Fees & ledger", values: ["Full ledger", "—", "Own fee status"] },
{ area: "Coaches & settings", values: ["Full control", "—", "—"] }];


export function RolesPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("role") as RoleId | null;
  const active = roles.find((r) => r.id === requested) ?? roles[0];

  usePageMeta({
    title: "For Academies, Coaches, Students & Parents",
    description:
    "LoveAll gives head coaches full control, assistant coaches their batches, and students and parents a personal dashboard with progress, sessions, leave and fee status.",
    path: "/roles"
  });

  return (
    <>
      <PageHeader
        eyebrow="Who it's for"
        title="The right view for everyone on court."
        lead="Head coaches run the academy. Assistant coaches run their batches. Students and parents follow their own progress. Access is set by role, so each person sees only what they should." />
      

      <section aria-label="Roles" className="py-16 md:py-20">
        <div className="container-page">
          <Tabs
            label="Choose a role"
            idPrefix="roles"
            items={roles.map((r) => ({ id: r.id, label: r.tabLabel }))}
            value={active.id}
            onChange={(id) => setParams({ role: id }, { replace: true, preventScrollReset: true })}>
            
            <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-14">
              <div className="lg:col-span-5">
                <ThemeIcon name={active.icon} size={28} className="text-primary" />
                <Eyebrow className="mt-5">{active.audience}</Eyebrow>
                <h2 className="mt-3 text-[30px] leading-[1.2] text-fg md:text-h2">{active.title}</h2>
                <p className="mt-4 text-lead text-fg-muted">{active.description}</p>
                <dl className="mt-8 divide-y divide-rule border-y border-rule">
                  {active.highlights.map((h) =>
                  <div key={h.title} className="py-4">
                      <dt className="font-semibold text-fg">{h.title}</dt>
                      <dd className="mt-1 text-[15px] text-fg-muted">{h.description}</dd>
                    </div>
                  )}
                </dl>
              </div>
              <div className="lg:col-span-7">
                <MockScreen mock={active.mock} />
                <p className="mt-3 text-[13px] text-fg-subtle">Illustrative screen. Names and figures are examples.</p>
              </div>
            </div>
          </Tabs>
        </div>
      </section>

      <section aria-labelledby="permissions-title" className="border-t border-rule bg-surface-alt py-20 md:py-24">
        <div className="container-page">
          <Eyebrow>Role-based access</Eyebrow>
          <h2 id="permissions-title" className="mt-3 text-[28px] leading-[1.2] text-fg md:text-h2">
            Who sees what, at a glance.
          </h2>
          <div className="mt-10 overflow-x-auto rounded-md border border-rule-strong bg-surface">
            <table className="w-full min-w-[640px] text-left text-[15px]">
              <caption className="sr-only">Access by role in LoveAll</caption>
              <thead>
                <tr className="rule-double-b">
                  <th scope="col" className="px-5 py-4 eyebrow text-fg-subtle">
                    Area
                  </th>
                  {roles.map((r) =>
                  <th key={r.id} scope="col" className="px-5 py-4 font-display text-[18px] font-normal text-fg">
                      {r.title}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {permissions.map((row) =>
                <tr key={row.area}>
                    <th scope="row" className="px-5 py-3.5 font-semibold text-fg">
                      {row.area}
                    </th>
                    {row.values.map((v, i) =>
                  <td key={i} className={v === "—" ? "px-5 py-3.5 text-fg-subtle" : "px-5 py-3.5 text-fg-muted"}>
                        {v === "—" ? <span aria-label="No access">—</span> : v}
                      </td>
                  )}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <CtaBand />
    </>);

}