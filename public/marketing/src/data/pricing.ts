import type { PricingTier } from "../types/content";

export const pricingTiers: PricingTier[] = [
{
  id: "starter",
  name: "Starter Academy",
  audience: "For a single-centre academy getting organised.",
  price: "₹ TBD",
  priceNote: "Per academy, per month",
  features: [
  "Player profiles with BAID",
  "Batches and batch timings",
  "Attendance and leave requests",
  "Fee tracking and ledger",
  "Student and parent portal"],

  cta: "Request a demo"
},
{
  id: "pro",
  name: "Pro Academy",
  audience: "For growing academies with several batches and coaches.",
  price: "₹ TBD",
  priceNote: "Per academy, per month",
  features: [
  "Everything in Starter",
  "8-week curriculum builder and drill library",
  "Skill assessments with review alerts",
  "Progress tracking and training analytics",
  "Coach workload and financial tracking"],

  cta: "Request a demo",
  recommended: true
},
{
  id: "enterprise",
  name: "Enterprise",
  audience: "For multi-centre academies and associations.",
  price: "Custom",
  priceNote: "Priced to your setup",
  features: [
  "Everything in Pro",
  "Multiple centres under one account",
  "Guided onboarding for your coaches",
  "Priority support"],

  cta: "Talk to us"
}];