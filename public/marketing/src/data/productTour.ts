import type { TourRow } from "../types/content";

export const productTour: TourRow[] = [
{
  id: "dashboard",
  eyebrow: "Dashboard",
  title: "The whole academy, at a glance.",
  body: "Each role gets its own dashboard. Head coaches see players, sessions, attendance, overdue fees and coach workload as soon as they log in.",
  points: ["Stats for each role", "Coach workload", "Recent activity"],
  mock: "dashboard"
},
{
  id: "curriculum",
  eyebrow: "Curriculum builder",
  title: "Eight weeks, planned like a match strategy.",
  body: "Give each week a focus, add drills from your library, and every session in the cycle follows from the plan.",
  points: ["8-week training cycles", "Drill library", "Session schedules"],
  mock: "curriculum"
},
{
  id: "assessment",
  eyebrow: "Skill assessment",
  title: "Measure progress, not impressions.",
  body: "Every two months, coaches score each player's skills on a consistent scale. LoveAll shows the change since last cycle and flags who is due for review.",
  points: ["Scores every two months", "Review alerts", "Progress over time"],
  mock: "assessment"
},
{
  id: "attendance",
  eyebrow: "Attendance",
  title: "Mark the register before the first rally.",
  body: "Mark a full batch in a few taps from any device. Leave requests from families arrive in the same place, ready to approve.",
  points: ["Present, absent or on leave", "Leave approvals", "Training log for each session"],
  mock: "attendance"
},
{
  id: "fees",
  eyebrow: "Fees",
  title: "A ledger as tidy as a scorecard.",
  body: "Track every payment by player and month. Overdue fees surface on their own, and families can check their status in the portal.",
  points: ["Running ledger", "Overdue alerts", "Fee status for families"],
  mock: "fees"
}];