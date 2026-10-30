interface HoneypotProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * A field people never see or reach by keyboard. Bots that fill every input
 * fill this one too, and the API quietly drops those submissions.
 */
export function Honeypot({ value, onChange }: HoneypotProps) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>);

}
