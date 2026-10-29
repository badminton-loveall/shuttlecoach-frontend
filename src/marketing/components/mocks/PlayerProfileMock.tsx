
const details = [
{ label: "Age", value: "14 years" },
{ label: "Guardian", value: "Neha Sharma (mother)" },
{ label: "Height", value: "162 cm" },
{ label: "Weight", value: "48 kg" },
{ label: "BMI", value: "18.3" },
{ label: "Skill level", value: "Advanced" }];


export function PlayerProfileMock() {
  return (
    <div className="bg-canvas p-4 text-left text-[12px] text-fg md:p-6" aria-hidden="true">
      <div className="flex flex-wrap items-center gap-4 border-b border-rule pb-4">
        <span className="flex size-12 items-center justify-center rounded-full border border-accent font-display text-[16px]">
          AS
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[19px]">Aarav Sharma</p>
          <p className="text-fg-subtle">Advanced U-15 · Mon, Wed, Fri · 6:00 AM · Coach Meera</p>
        </div>
        <span className="rounded-sm border border-rule bg-surface px-2 py-1 font-medium tabular text-fg-muted">
          BAID · KA-15-0427
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-rule bg-rule md:col-span-3 md:grid-cols-3">
          {details.map((d) =>
          <div key={d.label} className="bg-surface p-3">
              <dt className="text-fg-subtle">{d.label}</dt>
              <dd className="mt-0.5 font-medium">{d.value}</dd>
            </div>
          )}
        </dl>
        <div className="rounded-sm border border-rule bg-surface p-3 md:col-span-2">
          <p className="text-fg-subtle">Medical notes</p>
          <p className="mt-0.5 font-medium">Mild asthma. Inhaler in kit bag.</p>
          <p className="mt-3 text-fg-subtle">Emergency contact</p>
          <p className="mt-0.5 font-medium tabular">+91 98450 •• •••</p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-sm border border-rule bg-surface p-3">
          <p className="font-semibold">Strengths</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["Net play", "Deception", "Front-court speed"].map((s) =>
            <span key={s} className="rounded-sm bg-success-bg px-2 py-0.5 font-medium text-success">
                {s}
              </span>
            )}
          </div>
        </div>
        <div className="rounded-sm border border-rule bg-surface p-3">
          <p className="font-semibold">Working on</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["Backhand clear", "Endurance"].map((s) =>
            <span key={s} className="rounded-sm bg-warning-bg px-2 py-0.5 font-medium text-warning">
                {s}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>);

}