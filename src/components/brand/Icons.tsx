import React from "react";
import {
  Bell,
  BookOpen,
  Calendar,
  CalendarCheck,
  ChartLine,
  ClipboardList,
  IndianRupee,
  MapPin,
  Repeat,
  ShieldCheck,
  Trophy,
  Users } from
"lucide-react";

export type IconKey =
  | "players"
  | "training"
  | "assessment"
  | "attendance"
  | "fees"
  | "shuttlecock"
  | "racket"
  | "calendar"
  | "clipboard"
  | "chart"
  | "ledger"
  | "whistle"
  | "trophy"
  | "shield"
  | "map"
  | "users"
  | "bell"
  | "repeat";

type SvgProps = React.SVGProps<SVGSVGElement> & {size?: number;};

function base(size: number, props: React.SVGProps<SVGSVGElement>) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props
  };
}

export function ShuttlecockIcon({ size = 24, ...props }: SvgProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M9 16.5h6v1.5a3 3 0 0 1-6 0v-1.5Z" />
      <path d="M9 16.5 5.5 4h13L15 16.5" />
      <path d="M12 16.5V4" />
      <path d="M10.5 16.5 8.8 4" />
      <path d="M13.5 16.5 15.2 4" />
      <path d="M6.6 8h10.8" />
    </svg>);

}

export function RacketIcon({ size = 24, ...props }: SvgProps) {
  return (
    <svg {...base(size, props)}>
      <ellipse cx="9.5" cy="9" rx="5.2" ry="6.4" transform="rotate(-45 9.5 9)" />
      <path d="M6.5 6.5l6 6M5.4 9.4l3.2 3.2M9.4 5.4l3.2 3.2" />
      <path d="M13.3 12.8 19 18.5" />
      <path d="M18 17.5l2.5 2.5" strokeWidth="2.25" />
    </svg>);

}

export function WhistleIcon({ size = 24, ...props }: SvgProps) {
  return (
    <svg {...base(size, props)}>
      <circle cx="8.5" cy="14.5" r="5" />
      <path d="M11.5 10.5H21v3.5h-6.2" />
      <path d="M4 6.5l1.8 2.2M8 4.5v2.6" />
      <circle cx="8.5" cy="14.5" r="1.4" />
    </svg>);

}

interface ThemeIconProps {
  name: IconKey;
  size?: number;
  className?: string;
}

export function ThemeIcon({ name, size = 24, className }: ThemeIconProps) {
  const common = { size, className, strokeWidth: 1.5, "aria-hidden": true as const };
  switch (name) {
    case "players":
    case "users":
      return <Users {...common} />;
    case "training":
    case "clipboard":
      return <ClipboardList {...common} />;
    case "assessment":
    case "chart":
      return <ChartLine {...common} />;
    case "attendance":
      return <CalendarCheck {...common} />;
    case "calendar":
      return <Calendar {...common} />;
    case "fees":
      return <IndianRupee {...common} />;
    case "ledger":
      return <BookOpen {...common} />;
    case "trophy":
      return <Trophy {...common} />;
    case "shield":
      return <ShieldCheck {...common} />;
    case "map":
      return <MapPin {...common} />;
    case "bell":
      return <Bell {...common} />;
    case "repeat":
      return <Repeat {...common} />;
    case "shuttlecock":
      return <ShuttlecockIcon size={size} className={className} />;
    case "racket":
      return <RacketIcon size={size} className={className} />;
    case "whistle":
      return <WhistleIcon size={size} className={className} />;
    default:
      return null;
  }
}

