/**
 * Pricing comes from the app's marketplace catalog (the same items coaches see
 * under Settings → Subscriptions), served publicly at GET /api/public/pricing.
 * FALLBACK_PRICING is a snapshot of that catalog, used only if the API can't
 * be reached, so the page never renders empty.
 */

export type PricingCategory = "STUDENT_CAPACITY" | "COACH_CAPACITY" | "ACCOUNTING" | "DRILL_PACK";

export interface PricingItem {
  id: string;
  name: string;
  description: string | null;
  category: PricingCategory;
  tier: "STANDARD" | "VIDEO_ENHANCED" | null;
  capacityLimit: number | null;
  price: number;
  billingPeriod: string;
  durationDays: number | null;
}

/** Enabled catalog items as of 30 Oct 2026. */
export const FALLBACK_PRICING: PricingItem[] = [
{ id: "fallback-accounting-trial", name: "Accounting Section — Free Trial", description: "Try the Accounting Section free for two months.", category: "ACCOUNTING", tier: null, capacityLimit: null, price: 0, billingPeriod: "MONTHLY", durationDays: 60 },
{ id: "fallback-accounting", name: "Accounting Section", description: "Subscription payments, coach salaries, student fees, and other expenses in one dashboard.", category: "ACCOUNTING", tier: null, capacityLimit: null, price: 1000, billingPeriod: "MONTHLY", durationDays: 30 },
{ id: "fallback-coaches-2", name: "2 Coaches (Free)", description: "A permanent free baseline for small or trial centers.", category: "COACH_CAPACITY", tier: null, capacityLimit: 2, price: 0, billingPeriod: "MONTHLY", durationDays: null },
{ id: "fallback-coaches-5", name: "5 Coaches", description: null, category: "COACH_CAPACITY", tier: null, capacityLimit: 5, price: 1000, billingPeriod: "MONTHLY", durationDays: 30 },
{ id: "fallback-students-2", name: "2 Students (Free)", description: "A permanent free baseline for small or trial centers.", category: "STUDENT_CAPACITY", tier: null, capacityLimit: 2, price: 0, billingPeriod: "MONTHLY", durationDays: null },
{ id: "fallback-students-10", name: "10 Students", description: null, category: "STUDENT_CAPACITY", tier: null, capacityLimit: 10, price: 1000, billingPeriod: "MONTHLY", durationDays: 30 },
{ id: "fallback-students-50", name: "50 Students", description: null, category: "STUDENT_CAPACITY", tier: null, capacityLimit: 50, price: 4500, billingPeriod: "MONTHLY", durationDays: 30 }];


/** Everything outside the Accounting Section is included free. */
export const freePlanFeatures = [
"Player profiles with BAID, guardian and medical details",
"Batches, batch timings and invite links",
"8-week curriculum builder and your own drill library",
"Skill assessments, progress tracking and training analytics",
"Attendance, leave requests and the session calendar",
"Student and parent portal"];


export const accountingFeatures = [
"Student fees with overdue alerts",
"Income and expense ledger",
"Coach salaries",
"Subscription payments in one dashboard"];


export interface SeatTier {
  limit: number;
  price: number;
}

export interface PricingSummary {
  freeStudents: number;
  freeCoaches: number;
  /** Paid seat tiers, smallest first. A tier sets the limit; tiers don't add up. */
  studentTiers: SeatTier[];
  coachTiers: SeatTier[];
  accountingTrialDays: number | null;
  accountingMonthly: number | null;
  drillPacks: PricingItem[];
}

const DEFAULT_FREE_SEATS = 2;

function seatTiers(items: PricingItem[], category: PricingCategory) {
  const tiers = items.
  filter((i) => i.category === category && i.capacityLimit !== null).
  map((i) => ({ limit: i.capacityLimit as number, price: i.price })).
  sort((a, b) => a.limit - b.limit);
  const free = tiers.filter((t) => t.price === 0);
  return {
    free: free.length ? free[0].limit : DEFAULT_FREE_SEATS,
    paid: tiers.filter((t) => t.price > 0)
  };
}

export function summarisePricing(items: PricingItem[]): PricingSummary {
  const students = seatTiers(items, "STUDENT_CAPACITY");
  const coaches = seatTiers(items, "COACH_CAPACITY");
  const accounting = items.filter((i) => i.category === "ACCOUNTING");
  const trial = accounting.find((i) => i.price === 0 && i.durationDays);
  const paid = accounting.filter((i) => i.price > 0).sort((a, b) => a.price - b.price)[0];
  return {
    freeStudents: students.free,
    freeCoaches: coaches.free,
    studentTiers: students.paid,
    coachTiers: coaches.paid,
    accountingTrialDays: trial?.durationDays ?? null,
    accountingMonthly: paid?.price ?? null,
    drillPacks: items.filter((i) => i.category === "DRILL_PACK").sort((a, b) => a.price - b.price)
  };
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

/** "60" days → "2 months"; anything not a whole month stays in days. */
export function formatTrial(days: number): string {
  if (days % 30 === 0) {
    const months = days / 30;
    return `${months} ${months === 1 ? "month" : "months"}`;
  }
  return `${days} days`;
}
