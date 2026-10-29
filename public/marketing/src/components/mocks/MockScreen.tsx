import React from "react";
import { BrowserFrame } from "../ui/BrowserFrame";
import { DashboardMock } from "./DashboardMock";
import { PlayerProfileMock } from "./PlayerProfileMock";
import { CurriculumMock } from "./CurriculumMock";
import { AssessmentMock } from "./AssessmentMock";
import { AttendanceMock } from "./AttendanceMock";
import { FeesMock } from "./FeesMock";
import type { MockKey } from "../../types/content";

const screens: Record<MockKey, {url: string;label: string;Component: () => JSX.Element;}> = {
  dashboard: { url: "app.loveall.in/dashboard", label: "Head coach dashboard with stats, attendance and players due for review", Component: DashboardMock },
  profile: { url: "app.loveall.in/players/aarav-sharma", label: "Player profile with BAID, guardian, body metrics, medical notes, strengths and weaknesses", Component: PlayerProfileMock },
  curriculum: { url: "app.loveall.in/curriculum/cycle-3", label: "8-week training cycle with weekly focus and session drills", Component: CurriculumMock },
  assessment: { url: "app.loveall.in/assessments/diya-nair", label: "Skill assessment comparing this cycle's scores with the last", Component: AssessmentMock },
  attendance: { url: "app.loveall.in/attendance", label: "Attendance register with a pending leave request and training log", Component: AttendanceMock },
  fees: { url: "app.loveall.in/fees", label: "Fee ledger with paid, due and overdue statuses", Component: FeesMock }
};

interface MockScreenProps {
  mock: MockKey;
  className?: string;
}

/** A product screen inside the classic browser frame. Data shown is illustrative. */
export function MockScreen({ mock, className }: MockScreenProps) {
  const { url, label, Component } = screens[mock];
  return (
    <BrowserFrame url={url} label={`Illustrative screen: ${label}`} className={className}>
      <Component />
    </BrowserFrame>);

}