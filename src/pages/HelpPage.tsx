import React from 'react';
import DashboardLayout from '../components/DashboardLayout';

/**
 * HelpPage
 * Displays the complete trainee lifecycle guide and app usage instructions.
 * Accessible from the profile dropdown menu.
 */
const HelpPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="hc-dashboard">
        <div className="hc-dashboard-content">
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Help & Guide</h1>
              <p className="page-header-subtitle">
                Complete trainee lifecycle — from registration to ongoing training management
              </p>
            </div>
          </div>

          {/* Phase 1 */}
          <Section title="Phase 1: Setup (One-time, by Head Coach)">
            <Step number={1} title="Create Batches">
              Go to Settings → Batches tab → + Add Batch. Enter batch name and schedule info.
            </Step>
            <Step number={2} title="Add Assistant Coaches">
              Go to Finance → Coaches → + Add Coach. Enter name, username, password, specialization.
            </Step>
            <Step number={3} title="Set Up Session Schedule">
              Use the ScheduleBuilder for each batch. Select training days, set times, configure recurrence.
            </Step>
            <Step number={4} title="Create Drill Library">
              Go to Settings → Drills tab. Add drills with name, category, and description.
            </Step>
          </Section>

          {/* Phase 2 */}
          <Section title="Phase 2: Onboarding a New Student">
            <Step number={5} title="Add the Student">
              Go to Students → + Add Student. Fill in name, DOB, contact, guardian (if minor), skill level, batch, and coach.
            </Step>
            <Step number={6} title="Assign to Batch">
              Select the batch during student creation, or edit later to change assignment.
            </Step>
            <Step number={7} title="Assign to Coach">
              Select the assigned coach during student creation. Assistant coaches only see their assigned students.
            </Step>
          </Section>

          {/* Phase 3 */}
          <Section title="Phase 3: Training Cycle (Repeats every 8 weeks)">
            <Step number={8} title="Create Curriculum Plan">
              Go to Curriculum → select cycle and batch → Create New Plan. Define 8 weeks of focus areas, objectives, and drills. Optionally clone to individual students.
            </Step>
            <Step number={9} title="Record Baseline Skill Assessment">
              Go to student profile → Progress tab. Rate 60 skills (0-4) across 6 categories. This becomes the improvement baseline.
            </Step>
          </Section>

          {/* Phase 4 */}
          <Section title="Phase 4: Daily Operations (Ongoing)">
            <Step number={10} title="Mark Daily Attendance">
              <strong>Quick way:</strong> Use the Quick Attendance widget on your dashboard — it shows the next session with all students. Tap P/A/L, then Submit.
              <br /><strong>Full way:</strong> Go to Training → Attendance, select batch and date, mark each student.
            </Step>
            <Step number={11} title="Manage Leave Requests">
              Students submit leave requests from their dashboard. Coaches review in Training → Leave Requests (Approve/Reject).
            </Step>
            <Step number={12} title="Record Training Logs">
              Go to student profile → Training Log. Select cycle and week, enter session notes, mark as completed.
            </Step>
            <Step number={13} title="Add Session Notes">
              On the Calendar page, click a session to add coach notes visible to students.
            </Step>
          </Section>

          {/* Phase 5 */}
          <Section title="Phase 5: Assessment & Review (End of Cycle)">
            <Step number={14} title="Record End-of-Cycle Assessment">
              Same as Step 9 — record new skill scores. The system computes improvement deltas.
            </Step>
            <Step number={15} title="Review Analytics">
              Go to Training → Analytics. Check drill completion, batch comparison, skill trends, and training patterns.
            </Step>
            <Step number={16} title="Review Student Progress">
              Student profile → Progress (radar chart, trends), Attendance (history), Skill Analytics (correlation chart).
            </Step>
          </Section>

          {/* Phase 6 */}
          <Section title="Phase 6: Financial Management (Monthly)">
            <Step number={17} title="Create Fee Records">
              Go to Finance → Fees → + Create Fee. Select student, amount, month/year, due date.
            </Step>
            <Step number={18} title="Mark Fees Paid">
              Find the fee → Mark Paid. Enter paid date, payment method, and reference.
            </Step>
          </Section>

          {/* Phase 7 */}
          <Section title="Phase 7: Start New Cycle">
            <Step number={19} title="Create New Curriculum">
              Old plans auto-archive. Create new 8-week plan for the next cycle. Past assessments are locked.
            </Step>
          </Section>

          {/* Flow Diagram */}
          <div style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-card)', marginTop: 'var(--space-lg)' }}>
            <h3 style={{ margin: '0 0 var(--space-md) 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Summary Flow</h3>
            <pre style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
{`Add Student → Assign to Batch → Assign Coach
    ↓
Create Curriculum Plan (8 weeks)
    ↓
Record Baseline Skill Assessment
    ↓
┌─────────── Daily Loop ───────────┐
│  Mark Attendance (Dashboard)      │
│  Handle Leave Requests            │
│  Record Training Logs (weekly)    │
│  Add Coach Notes                  │
└───────────────────────────────────┘
    ↓
End-of-Cycle Assessment → Review Analytics
    ↓
Create Fee → Mark Paid
    ↓
Start New Cycle (repeat)`}
            </pre>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

/* ─── Sub-components ──────────────────────────────────────────────────────── */

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', boxShadow: 'var(--shadow-card)' }}>
    <h2 style={{ margin: '0 0 var(--space-md) 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {children}
    </div>
  </div>
);

const Step: React.FC<{ number: number; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
  <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
      {number}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>{title}</div>
      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{children}</div>
    </div>
  </div>
);

export default HelpPage;
