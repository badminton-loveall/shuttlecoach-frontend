import type { Sport } from "../types/content";

/**
 * Sports roadmap. To launch a sport, change its status to "live".
 * See README → "Adding a new sport".
 */
export const sports: Sport[] = [
{
  id: "badminton",
  name: "Badminton",
  status: "live",
  description:
  "Live today. Player profiles with BAID, 8-week training cycles, skill assessments, attendance and fees, all built around how badminton academies work."
},
{
  id: "tennis",
  name: "Tennis",
  status: "soon",
  description: "Court bookings across surfaces and tennis-specific skill assessments."
},
{
  id: "squash",
  name: "Squash",
  status: "soon",
  description: "Built for small-group sessions and ladder-style squads."
},
{
  id: "table-tennis",
  name: "Table Tennis",
  status: "soon",
  description: "Built for multi-table halls and high-volume drill sessions."
},
{
  id: "pickleball",
  name: "Pickleball",
  status: "soon",
  description: "Built for clubs growing fast, from first-timers to competitive players."
}];