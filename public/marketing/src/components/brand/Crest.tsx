import React from "react";

interface CrestProps {
  size?: number;
  className?: string;
  title?: string;
}

interface Leaf {
  cx: number;
  cy: number;
  rot: number;
}

export function Crest({ size = 48, className, title }: CrestProps) {
  const { left, right } = buildLaurel();
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}>
      
      <circle cx="50" cy="50" r="47.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="50" cy="50" r="43.5" fill="none" stroke="currentColor" strokeWidth="0.7" />
      <g fill="none" stroke="var(--la-accent)" strokeWidth="0.9" strokeLinecap="round">
        <path d={arcPath(34, 104, 230, 1)} />
        <path d={arcPath(34, 76, -50, 0)} />
        {[...left, ...right].map((leaf, i) =>
        <ellipse
          key={i}
          cx={leaf.cx}
          cy={leaf.cy}
          rx="1.9"
          ry="4.6"
          transform={`rotate(${leaf.rot} ${leaf.cx} ${leaf.cy})`} />

        )}
      </g>
      <circle cx="50" cy="18.5" r="1.3" fill="var(--la-accent)" />
      <text
        x="50"
        y="59.5"
        textAnchor="middle"
        fontFamily="Libre Caslon Text, Georgia, serif"
        fontSize="27"
        fill="currentColor"
        letterSpacing="-0.5">
        
        LA
      </text>
      <line x1="38" y1="67" x2="62" y2="67" stroke="var(--la-accent)" strokeWidth="0.8" />
    </svg>);

}

function buildLaurel(): {left: Leaf[];right: Leaf[];} {
  const r = 34;
  const left: Leaf[] = [];
  const right: Leaf[] = [];
  for (let i = 0; i < 7; i++) {
    const deg = 112 + i * 18;
    const rad = deg * Math.PI / 180;
    const cx = 50 + r * Math.cos(rad);
    const cy = 50 + r * Math.sin(rad);
    left.push({ cx, cy, rot: deg + 28 });
    right.push({ cx: 100 - cx, cy, rot: -(deg + 28) });
  }
  return { left, right };
}

function arcPath(r: number, fromDeg: number, toDeg: number, sweep: 0 | 1): string {
  const p = (deg: number) => {
    const rad = deg * Math.PI / 180;
    return `${(50 + r * Math.cos(rad)).toFixed(2)} ${(50 + r * Math.sin(rad)).toFixed(2)}`;
  };
  return `M ${p(fromDeg)} A ${r} ${r} 0 0 ${sweep} ${p(toDeg)}`;
}