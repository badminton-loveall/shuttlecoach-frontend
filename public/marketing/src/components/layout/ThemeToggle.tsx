import React from "react";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme, type ThemePreference } from "../../contexts/ThemeContext";

const order: ThemePreference[] = ["system", "light", "dark"];
const labels: Record<ThemePreference, string> = { system: "System", light: "Light", dark: "Dark" };

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  const next = order[(order.indexOf(preference) + 1) % order.length];
  const Icon = preference === "light" ? SunIcon : preference === "dark" ? MoonIcon : MonitorIcon;

  return (
    <button
      type="button"
      onClick={() => setPreference(next)}
      aria-label={`Theme: ${labels[preference]}. Switch to ${labels[next]}.`}
      title={`Theme: ${labels[preference]}`}
      className="flex size-9 items-center justify-center rounded-md text-fg-muted transition-colors duration-150 hover:bg-surface-alt hover:text-fg">
      
      <Icon className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />
    </button>);

}