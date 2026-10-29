import { cn } from "../../utils/cn";

type Status = "Paid" | "Due" | "Overdue";

const rows: {player: string;batch: string;amount: string;status: Status;}[] = [
{ player: "Aarav Sharma", batch: "Advanced U-15", amount: "₹4,500", status: "Paid" },
{ player: "Diya Nair", batch: "Intermediate U-13", amount: "₹3,500", status: "Paid" },
{ player: "Rohan Das", batch: "Beginners U-11", amount: "₹2,500", status: "Overdue" },
{ player: "Ananya Iyer", batch: "Beginners U-11", amount: "₹2,500", status: "Due" },
{ player: "Ishaan Gupta", batch: "Advanced U-15", amount: "₹4,500", status: "Overdue" }];


const statusStyle: Record<Status, string> = {
  Paid: "bg-success-bg text-success",
  Due: "bg-info-bg text-info",
  Overdue: "bg-danger-bg text-danger"
};

const summary = [
{ label: "Collected · Oct", value: "₹1,84,000" },
{ label: "Outstanding", value: "₹32,500" },
{ label: "Overdue players", value: "4" }];


export function FeesMock() {
  return (
    <div className="bg-canvas p-4 text-left text-[12px] text-fg md:p-6" aria-hidden="true">
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-sm border border-rule bg-rule">
        {summary.map((s) =>
        <div key={s.label} className="bg-surface p-3">
            <p className="text-fg-subtle">{s.label}</p>
            <p className="numerals mt-1 text-[16px] leading-none sm:text-[20px]">{s.value}</p>
          </div>
        )}
      </div>

      <div className="mt-3 overflow-hidden rounded-sm border border-rule bg-surface">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-rule bg-surface-alt px-3 py-2 font-semibold text-fg-muted sm:grid-cols-[1.3fr_1fr_auto_auto]">
          <span>Player</span>
          <span className="hidden sm:block">Batch</span>
          <span className="text-right">Oct fee</span>
          <span className="w-16 text-right">Status</span>
        </div>
        <ul className="divide-y divide-rule">
          {rows.map((r) =>
          <li
            key={r.player}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-3 py-2 sm:grid-cols-[1.3fr_1fr_auto_auto]">
            
              <span className="truncate font-medium">{r.player}</span>
              <span className="hidden truncate text-fg-subtle sm:block">{r.batch}</span>
              <span className="text-right tabular">{r.amount}</span>
              <span className="flex w-16 justify-end">
                <span className={cn("rounded-sm px-1.5 py-0.5 text-[10px] font-semibold", statusStyle[r.status])}>
                  {r.status}
                </span>
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>);

}