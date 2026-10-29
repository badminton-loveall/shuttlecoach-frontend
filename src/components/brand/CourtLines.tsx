
interface CourtLinesProps {
  className?: string;
  /** Draw the net line dashed (default) or solid. */
  dashedNet?: boolean;
}

/**
 * A badminton court drawn to scale (13.4m × 6.1m), viewed from above.
 * Strokes use currentColor and stay hairline at any size.
 */
export function CourtLines({ className, dashedNet = true }: CourtLinesProps) {
  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1,
    vectorEffect: "non-scaling-stroke" as const
  };
  return (
    <svg viewBox="0 0 134 61" preserveAspectRatio="none" className={className} aria-hidden="true">
      <rect x="0.5" y="0.5" width="133" height="60" {...stroke} />
      <line x1="0" y1="4.6" x2="134" y2="4.6" {...stroke} />
      <line x1="0" y1="56.4" x2="134" y2="56.4" {...stroke} />
      <line x1="7.6" y1="0" x2="7.6" y2="61" {...stroke} />
      <line x1="126.4" y1="0" x2="126.4" y2="61" {...stroke} />
      <line x1="47.2" y1="0" x2="47.2" y2="61" {...stroke} />
      <line x1="86.8" y1="0" x2="86.8" y2="61" {...stroke} />
      <line x1="0" y1="30.5" x2="47.2" y2="30.5" {...stroke} />
      <line x1="86.8" y1="30.5" x2="134" y2="30.5" {...stroke} />
      <line x1="67" y1="0" x2="67" y2="61" {...stroke} strokeDasharray={dashedNet ? "2 2" : undefined} />
    </svg>);

}

