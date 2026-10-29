import type { FeatureTheme } from "../types/content";

export const featureThemes: FeatureTheme[] = [
{
  id: "players",
  letter: "A",
  numeral: "I",
  title: "Players & Batches",
  summary: "Every player fully on record. Every batch properly staffed.",
  icon: "players",
  mock: "profile",
  items: [
  {
    title: "Detailed player profiles",
    description:
    "Age, guardian contacts, BAID, height, weight and BMI, medical notes, skill level, strengths and weaknesses, all in one profile."
  },
  {
    title: "Batch management",
    description: "Group players by level and age, then set batch timings once for the whole season."
  },
  {
    title: "Coach assignment",
    description: "Assign coaches to batches, so every coach knows exactly which players are theirs."
  }]

},
{
  id: "training",
  letter: "B",
  numeral: "II",
  title: "Training & Curriculum",
  summary: "Plan the season in 8-week cycles. Run it session by session.",
  icon: "training",
  mock: "curriculum",
  items: [
  {
    title: "Training plan builder",
    description: "Build 8-week training cycles with a clear focus for each week and a plan for each session."
  },
  {
    title: "Drill library",
    description: "Keep your academy's drills in one place and reuse them across batches and cycles."
  },
  {
    title: "Session calendar",
    description: "See every session and its schedule across batches and coaches."
  },
  {
    title: "Training logs",
    description: "Record what was actually covered in each session, while it is still fresh."
  }]

},
{
  id: "assessment",
  letter: "C",
  numeral: "III",
  title: "Assessment & Progress",
  summary: "Assess every two months. See who is improving and who needs attention.",
  icon: "assessment",
  mock: "assessment",
  items: [
  {
    title: "Skill assessments",
    description: "Score each player's skills every two months, on the same scale, so results compare fairly."
  },
  {
    title: "Review alerts",
    description: "Know which players are due for their next assessment before it slips."
  },
  {
    title: "Progress & analytics",
    description: "Follow each player's scores across cycles, with training analytics for every batch."
  }]

},
{
  id: "attendance",
  letter: "D",
  numeral: "IV",
  title: "Attendance & Operations",
  summary: "Mark the register in seconds. Approve leave without a phone call.",
  icon: "attendance",
  mock: "attendance",
  items: [
  {
    title: "Attendance marking",
    description: "Mark a full batch present, absent or on leave from any phone, tablet or laptop."
  },
  {
    title: "Leave requests",
    description: "Students and parents submit leave in the portal. Coaches approve it in one tap."
  },
  {
    title: "Role dashboards",
    description: "Stats, coach workload and recent activity, shaped for each role."
  }]

},
{
  id: "fees",
  letter: "E",
  numeral: "V",
  title: "Fees & Finance",
  summary: "Know who has paid, who is due, and what the academy owes its coaches.",
  icon: "fees",
  mock: "fees",
  items: [
  {
    title: "Fee tracking & ledger",
    description: "Record fees by player and month, with a running ledger for the whole academy."
  },
  {
    title: "Overdue alerts",
    description: "See overdue fees at a glance and follow up before they pile up."
  },
  {
    title: "Coach financial tracking",
    description: "Track coach payments alongside academy income."
  },
  {
    title: "Fee status for families",
    description: "Students and parents see their own fee status in the portal. No more awkward reminders."
  }]

}];