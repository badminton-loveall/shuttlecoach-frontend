export type IconKey =
"players" |
"training" |
"assessment" |
"attendance" |
"fees" |
"shuttlecock" |
"racket" |
"calendar" |
"clipboard" |
"chart" |
"ledger" |
"whistle" |
"trophy" |
"shield" |
"map" |
"users" |
"bell" |
"repeat";

export type MockKey =
"dashboard" |
"profile" |
"curriculum" |
"assessment" |
"attendance" |
"fees";

export interface NavItem {
  label: string;
  to: string;
}

export interface FeatureItem {
  title: string;
  description: string;
}

export interface FeatureTheme {
  id: string;
  letter: string;
  numeral: string;
  title: string;
  summary: string;
  icon: IconKey;
  mock: MockKey;
  items: FeatureItem[];
}

export interface LifecycleStep {
  numeral: string;
  title: string;
  description: string;
  icon: IconKey;
}

export type RoleId = "head-coach" | "assistant-coach" | "student-parent";

export interface Role {
  id: RoleId;
  tabLabel: string;
  title: string;
  audience: string;
  description: string;
  icon: IconKey;
  capabilities: string[];
  highlights: FeatureItem[];
  mock: MockKey;
}

export type SportStatus = "live" | "soon";

export interface Sport {
  id: string;
  name: string;
  status: SportStatus;
  description: string;
}

export type FaqTopic = "privacy" | "onboarding" | "devices" | "pricing" | "sports";

export interface Faq {
  id: string;
  topic: FaqTopic;
  question: string;
  answer: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  academy: string;
}

export interface Stat {
  id: string;
  value: string;
  label: string;
  caption: string;
}

export interface TourRow {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  mock: MockKey;
}

export interface ProblemRow {
  area: string;
  before: string;
  after: string;
}