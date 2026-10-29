import { useId } from "react";
import { cn } from "../../utils/cn";

interface Option {
  value: string;
  label: string;
}

interface FieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  as?: "input" | "textarea" | "select";
  type?: string;
  options?: Option[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string;
  autoComplete?: string;
  className?: string;
  /** Style-guide only: extra classes on the control to show a static state. */
  controlClassName?: string;
}

const controlBase =
"w-full rounded-md border border-rule-strong bg-surface px-3.5 text-[15px] text-fg placeholder:text-fg-subtle transition-[border-color,box-shadow] duration-150 ease-classic focus:border-primary focus:shadow-[0_0_0_1px_var(--la-primary)] focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-fg-subtle aria-[invalid=true]:border-danger aria-[invalid=true]:shadow-[0_0_0_1px_var(--la-danger)]";

export function Field({
  label,
  name,
  value,
  onChange,
  as = "input",
  type = "text",
  options = [],
  placeholder,
  required,
  disabled,
  hint,
  error,
  autoComplete,
  className,
  controlClassName
}: FieldProps) {
  const id = useId();
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  const shared = {
    id,
    name,
    value,
    required,
    disabled,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-fg">
        {label}
        {required &&
        <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        }
      </label>
      {as === "textarea" ?
      <textarea
        {...shared}
        rows={4}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(controlBase, "py-2.5 leading-relaxed", controlClassName)} /> :

      as === "select" ?
      <select
        {...shared}
        onChange={(e) => onChange(e.target.value)}
        className={cn(controlBase, "h-11 appearance-none bg-no-repeat pr-9", controlClassName)}
        style={{
          backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23857B66' stroke-width='2'><path d='m6 9 6 6 6-6'/></svg>\")",
          backgroundPosition: "right 14px center"
        }}>
        
          <option value="" disabled>
            {placeholder ?? "Select"}
          </option>
          {options.map((o) =>
        <option key={o.value} value={o.value}>
              {o.label}
            </option>
        )}
        </select> :

      <input
        {...shared}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className={cn(controlBase, "h-11", controlClassName)} />

      }
      {hint && !error &&
      <p id={`${id}-hint`} className="text-[13px] text-fg-subtle">
          {hint}
        </p>
      }
      {error &&
      <p id={`${id}-error`} className="text-[13px] font-medium text-danger">
          {error}
        </p>
      }
    </div>);

}