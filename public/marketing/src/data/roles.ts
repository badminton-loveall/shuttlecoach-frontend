import type { Role } from "../types/content";

export const roles: Role[] = [
{
  id: "head-coach",
  tabLabel: "For Academies",
  title: "Head Coach",
  audience: "Academy owners and head coaches",
  description: "Full control of students, coaches, batches, curriculum, fees and settings.",
  icon: "trophy",
  capabilities: [
  "Manage every player, coach and batch",
  "Build curriculum and 8-week cycles",
  "Track fees, the ledger and coach payments",
  "See coach workload and academy activity"],

  highlights: [
  {
    title: "The whole academy on one screen",
    description: "Active players, sessions this week, attendance and overdue fees, as soon as you log in."
  },
  {
    title: "A curriculum your coaches follow",
    description: "Set the 8-week plan once. Every assistant coach trains from the same plan."
  },
  {
    title: "Fees without the notebook",
    description: "A clean ledger with overdue alerts, plus coach payments tracked next to income."
  },
  {
    title: "Control over who sees what",
    description: "Role-based access keeps each coach to their batches and each family to their own records."
  }],

  mock: "dashboard"
},
{
  id: "assistant-coach",
  tabLabel: "For Coaches",
  title: "Assistant Coach",
  audience: "Coaches running assigned batches",
  description: "Assigned batches and students, assessments, training logs and attendance.",
  icon: "whistle",
  capabilities: [
  "See only your assigned batches",
  "Mark attendance and approve leave",
  "Log every session",
  "Score skill assessments"],

  highlights: [
  {
    title: "Know today's plan before you reach the court",
    description: "Your sessions, batches and drills for the day, already laid out."
  },
  {
    title: "Register in seconds",
    description: "Mark a batch present, absent or on leave, then add a short training log."
  },
  {
    title: "Assessments that take minutes",
    description: "Score skills on a consistent scale. The last cycle's scores sit right alongside."
  },
  {
    title: "Leave without the phone calls",
    description: "Leave requests come to you in the app. Approve or decline in one tap."
  }],

  mock: "attendance"
},
{
  id: "student-parent",
  tabLabel: "For Students & Parents",
  title: "Student / Parent",
  audience: "Players and their families",
  description: "Personal dashboard, skill progress, session calendar, leave requests and fee status.",
  icon: "users",
  capabilities: [
  "See skill progress after each assessment",
  "Check the session calendar",
  "Request leave in a few taps",
  "View fee status any time"],

  highlights: [
  {
    title: "Progress you can see",
    description: "Skill scores from every assessment, so families can see exactly how a player is improving."
  },
  {
    title: "Always know the schedule",
    description: "Upcoming sessions on a simple calendar. No more checking the group chat."
  },
  {
    title: "Leave requests, done properly",
    description: "Request leave in the portal and see when the coach approves it."
  },
  {
    title: "Clear fee status",
    description: "See what has been paid and what is due, at any time."
  }],

  mock: "assessment"
}];