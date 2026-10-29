export const brandColors = [
{ name: "Court Green", token: "--color-court-600", hex: "#1F4D3A", role: "Primary · buttons, CTA band", text: "#FAF7F0" },
{ name: "Shuttle Ivory", token: "--color-ivory", hex: "#FAF7F0", role: "Background", text: "#14202B" },
{ name: "Ink", token: "--color-ink", hex: "#14202B", role: "Text", text: "#FAF7F0" },
{ name: "Champagne Gold", token: "--color-gold-500", hex: "#B8975A", role: "Crests, rules, ornaments", text: "#14202B" },
{ name: "Electric Lime", token: "--color-lime", hex: "#B8E135", role: "Live / badminton signal only", text: "#14202B" }];


export const neutralScale = [
{ step: "50", hex: "#FAF7F0" },
{ step: "100", hex: "#F3EEE2" },
{ step: "200", hex: "#E3DCCB" },
{ step: "300", hex: "#CFC4AC" },
{ step: "400", hex: "#A89D86" },
{ step: "500", hex: "#857B66" },
{ step: "600", hex: "#675F4E" },
{ step: "700", hex: "#4E483B" },
{ step: "800", hex: "#36322A" },
{ step: "900", hex: "#221F1A" },
{ step: "950", hex: "#14120F" }];


export const semanticTokens = [
{ token: "--la-canvas", utility: "bg-canvas", light: "#FAF7F0", dark: "#0F1713", usage: "Page background" },
{ token: "--la-surface", utility: "bg-surface", light: "#FFFDF8", dark: "#151F1A", usage: "Cards, inputs" },
{ token: "--la-surface-alt", utility: "bg-surface-alt", light: "#F3EEE2", dark: "#1A2620", usage: "Alternate sections" },
{ token: "--la-fg", utility: "text-fg", light: "#14202B", dark: "#F1ECE0", usage: "Primary text" },
{ token: "--la-fg-muted", utility: "text-fg-muted", light: "#45505A", dark: "#C9C2B2", usage: "Body copy" },
{ token: "--la-fg-subtle", utility: "text-fg-subtle", light: "#5F666D", dark: "#A39D8E", usage: "Captions, meta" },
{ token: "--la-rule", utility: "border-rule", light: "#E3DCCB", dark: "#28352E", usage: "Hairlines" },
{ token: "--la-rule-strong", utility: "border-rule-strong", light: "#C9BDA3", dark: "#3B4A42", usage: "Double rules, inputs" },
{ token: "--la-primary", utility: "bg-primary", light: "#1F4D3A", dark: "#A7D1B8", usage: "Primary actions" },
{ token: "--la-accent-ink", utility: "text-accent-ink", light: "#7E6331", dark: "#D8BD86", usage: "Gold text (AA)" }];


export const semanticStatus = [
{ name: "Success", fg: "text-success", bg: "bg-success-bg", light: "#2F6B4F on #E6EFE8" },
{ name: "Warning", fg: "text-warning", bg: "bg-warning-bg", light: "#8A5A12 on #F6ECD9" },
{ name: "Danger", fg: "text-danger", bg: "bg-danger-bg", light: "#9B2C2C on #F6E4E1" },
{ name: "Info", fg: "text-info", bg: "bg-info-bg", light: "#2C5A7A on #E3ECF2" }];


export const typeScale = [
{ name: "Display", className: "font-display text-display", spec: "64 / 1.05 / −0.02em", sample: "Love all." },
{ name: "Heading 1", className: "font-display text-h1", spec: "42 / 1.15 / −0.015em", sample: "Every great match begins here." },
{ name: "Heading 2", className: "font-display text-h2", spec: "36 / 1.2 / −0.01em", sample: "The Trainee Lifecycle" },
{ name: "Heading 3", className: "font-display text-h3", spec: "24 / 1.3 / −0.005em", sample: "Skill assessments" },
{ name: "Lead", className: "text-lead", spec: "18 / 1.6 / 0", sample: "The training management platform for badminton academies." },
{ name: "Body", className: "text-body", spec: "16 / 1.6 / 0", sample: "Mark the register in seconds. Approve leave without a phone call." },
{ name: "Caption", className: "text-caption", spec: "12 / 1.5 / 0.04em", sample: "Next review · 14 December" }];


export const spacingScale = [2, 4, 8, 12, 16, 24, 36, 42, 64];

export const radii = [
{ name: "sm", value: "4px", className: "rounded-sm" },
{ name: "md", value: "6px", className: "rounded-md" },
{ name: "lg", value: "8px", className: "rounded-lg" }];


export const dosAndDonts = {
  dos: [
  "Use fine 1px rules and double rules to separate content.",
  "Keep Electric Lime for 'live' signals and the badminton chip only.",
  "Set headings in Libre Caslon, and keep body and UI in Source Sans 3.",
  "Use tabular serif numerals for scores and stats.",
  "Label sample data and placeholder quotes clearly."],

  donts: [
  "Use gradients, glassmorphism, neon or heavy 3D.",
  "Use lime for body text or large backgrounds.",
  "Imply that tennis, squash, table tennis or pickleball work today.",
  "Stack more than two shadow levels. Prefer borders.",
  "Claim video analysis, live scoring or a native mobile app."]

};