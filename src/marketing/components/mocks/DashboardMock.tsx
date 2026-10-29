import {
  BellIcon,
  CalendarCheckIcon,
  ChartLineIcon,
  ClipboardListIcon,
  IndianRupeeIcon,
  LayoutDashboardIcon,
  UsersIcon } from
"lucide-react";
import { Crest } from "../brand/Crest";
import { cn } from "../../utils/cn";

const nav = [
{ label: "Dashboard", Icon: LayoutDashboardIcon },
{ label: "Players", Icon: UsersIcon },
{ label: "Curriculum", Icon: ClipboardListIcon },
{ label: "Attendance", Icon: CalendarCheckIcon },
{ label: "Assessments", Icon: ChartLineIcon },
{ label: "Fees", Icon: IndianRupeeIcon }];


const stats = [
{ label: "Active players", value: "128", note: "+6 this month", tone: "text-success" },
{ label: "Sessions this week", value: "42", note: "6 batches", tone: "text-fg-subtle" },
{ label: "Attendance", value: "94%", note: "Last 30 days", tone: "text-fg-subtle" },
{ label: "Fees overdue", value: "₹18,500", note: "4 players", tone: "text-danger" }];


const attendance = [
{ day: "Mon", value: 92 },
{ day: "Tue", value: 88 },
{ day: "Wed", value: 96 },
{ day: "Thu", value: 90 },
{ day: "Fri", value: 97 },
{ day: "Sat", value: 84 }];


const due = [
{ name: "Diya Nair", batch: "Intermediate U-13", when: "Due in 3 days" },
{ name: "Ishaan Gupta", batch: "Advanced U-15", when: "Due in 5 days" },
{ name: "Meera Pillai", batch: "Beginners U-11", when: "Due next week" }];


const workload = [
{ coach: "Coach Meera", sessions: 14 },
{ coach: "Coach Arjun", sessions: 11 },
{ coach: "Coach Farah", sessions: 9 }];


export function DashboardMock() {
  return (
    <div className="flex bg-canvas text-left text-[12px] text-fg" aria-hidden="true">
      <aside className="hidden w-44 shrink-0 border-r border-rule bg-surface p-4 md:block">
        <div className="flex items-center gap-2">
          <Crest size={22} className="text-fg" />
          <span className="font-display text-[15px]">
            Love<span className="italic">All</span>
          </span>
        </div>
        <ul className="mt-6 space-y-0.5">
          {nav.map(({ label, Icon }, i) =>
          <li
            key={label}
            className={cn(
              "flex items-center gap-2 rounded-sm px-2 py-1.5",
              i === 0 ? "bg-signal/35 font-semibold text-fg" : "text-fg-muted"
            )}>
            
              <Icon className="size-3.5" strokeWidth={1.5} />
              {label}
            </li>
          )}
        </ul>
      </aside>

      <div className="min-w-0 flex-1 p-4 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-[17px] md:text-[19px]">Good morning, Coach Rao</p>
            <p className="text-fg-subtle">Smash Point Academy · Head Coach</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-sm border border-rule bg-surface px-2 py-1 text-fg-muted">
            <BellIcon className="size-3" strokeWidth={1.5} /> 3
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {stats.map((s) =>
          <div key={s.label} className="rounded-sm border border-rule bg-surface p-3">
              <p className="text-fg-subtle">{s.label}</p>
              <p className="numerals mt-1 text-[20px] leading-none">{s.value}</p>
              <p className={cn("mt-1 text-[11px]", s.tone)}>{s.note}</p>
            </div>
          )}
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-5">
          <div className="rounded-sm border border-rule bg-surface p-3 lg:col-span-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Attendance this week</p>
              <p className="text-fg-subtle">% present</p>
            </div>
            <div className="mt-3 flex h-24 items-end gap-2 border-b border-rule">
              {attendance.map((a, i) =>
              <div key={a.day} className="flex flex-1 flex-col items-center gap-1">
                  <div
                  className={cn("w-full rounded-t-[2px]", i === 4 ? "bg-signal" : "bg-primary/80")}
                  style={{ height: `${(a.value - 60) * 2.2}px` }} />
                
                </div>
              )}
            </div>
            <div className="mt-1 flex gap-2 text-[10px] text-fg-subtle">
              {attendance.map((a) =>
              <span key={a.day} className="flex-1 text-center">
                  {a.day}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-sm border border-rule bg-surface p-3 lg:col-span-2">
            <p className="font-semibold">Due for review</p>
            <ul className="mt-2 divide-y divide-rule">
              {due.map((d) =>
              <li key={d.name} className="flex items-center justify-between gap-2 py-1.5">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{d.name}</span>
                    <span className="block truncate text-[11px] text-fg-subtle">{d.batch}</span>
                  </span>
                  <span className="shrink-0 rounded-sm bg-warning-bg px-1.5 py-0.5 text-[10px] font-semibold text-warning">
                    {d.when}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-3 hidden rounded-sm border border-rule bg-surface p-3 sm:block">
          <p className="font-semibold">Coach workload · sessions this week</p>
          <div className="mt-2 grid grid-cols-3 gap-4">
            {workload.map((w) =>
            <div key={w.coach}>
                <div className="flex justify-between text-fg-muted">
                  <span>{w.coach}</span>
                  <span className="tabular">{w.sessions}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-surface-alt">
                  <div className="h-1.5 rounded-full bg-primary" style={{ width: `${w.sessions / 16 * 100}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>);

}