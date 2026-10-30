interface ShuttleCourtProps {
  className?: string;
}

/**
 * A badminton court drawn to scale (6.1m × 13.4m) in portrait, viewed from
 * above, with a shuttle's flight from the near service box over the net.
 * Court lines use currentColor; the flight path uses the gold accent and the
 * landing mark the lime signal.
 */
export function ShuttleCourt({ className }: ShuttleCourtProps) {
  const line = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1,
    vectorEffect: "non-scaling-stroke" as const
  };
  return (
    <svg viewBox="-6 -6 73 146" className={className} aria-hidden="true">
      {/* Court: boundary, singles sidelines, long & short service lines, centre lines */}
      <rect x="0" y="0" width="61" height="134" {...line} />
      <line x1="4.6" y1="0" x2="4.6" y2="134" {...line} />
      <line x1="56.4" y1="0" x2="56.4" y2="134" {...line} />
      <line x1="0" y1="7.6" x2="61" y2="7.6" {...line} />
      <line x1="0" y1="126.4" x2="61" y2="126.4" {...line} />
      <line x1="0" y1="47.2" x2="61" y2="47.2" {...line} />
      <line x1="0" y1="86.8" x2="61" y2="86.8" {...line} />
      <line x1="30.5" y1="0" x2="30.5" y2="47.2" {...line} />
      <line x1="30.5" y1="86.8" x2="30.5" y2="134" {...line} />

      {/* Net and posts */}
      <line x1="-3" y1="67" x2="64" y2="67" {...line} strokeWidth={2} />
      <line x1="-3" y1="67" x2="64" y2="67" {...line} strokeDasharray="1.5 1.5" opacity={0.6} transform="translate(0 1.2)" />
      <circle cx="-3" cy="67" r="1" fill="currentColor" />
      <circle cx="64" cy="67" r="1" fill="currentColor" />

      {/* Shuttle flight: serve from the near left box into the far right box */}
      <path
        d="M 17 112 Q 0 60 44 27"
        fill="none"
        stroke="var(--la-accent)"
        strokeWidth={1.25}
        strokeDasharray="3 3"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke" />

      <circle cx="17" cy="112" r="1.1" fill="var(--la-accent)" />
      <circle cx="44" cy="27" r="3.2" fill="none" stroke="var(--color-lime)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <circle cx="44" cy="27" r="1" fill="var(--color-lime)" />

      {/* Shuttlecock, cork-first along the flight path */}
      <g transform="translate(39.5 30.6) rotate(51)" stroke="var(--la-on-court)" strokeWidth={0.8} strokeLinejoin="round" fill="none">
        <path d="M -1.6 0 A 1.6 1.6 0 0 1 1.6 0 Z" fill="var(--la-on-court)" />
        <path d="M -1.6 0 L -3.4 6 L 3.4 6 L 1.6 0" />
        <path d="M 0 0 L 0 6 M -0.8 0 L -1.7 6 M 0.8 0 L 1.7 6" strokeWidth={0.5} />
      </g>
    </svg>);

}
