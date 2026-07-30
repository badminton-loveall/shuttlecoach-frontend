# ShuttleCoach (LoveAll) - Complete Application Guide

## Overview

ShuttleCoach is a badminton training management application designed for coaching academies. It enables coaches to manage students, track skill progress, design training curricula, record training sessions, and manage fees — all from a single platform.

---

## User Roles

| Role | Description |
|------|-------------|
| **Head Coach** | Full system access. Can manage coaches, students, batches, curriculum, fees, and all master data. |
| **Assistant Coach** | Access to assigned students/batches. Can record assessments, training logs, and view fees. |
| **Student** | Self-service portal. Can view own progress, skill scores, and fee status. |

---

## Login & Authentication

1. Navigate to the application URL
2. Enter your **Username** and **Password**
3. Click **Sign In**
4. You will be redirected to your role-specific dashboard

> Credentials are managed by the Head Coach who creates accounts for assistant coaches and students.

---

## Navigation Menu

After login, the top navigation bar shows grouped links based on your role:

### Head Coach Menu
- **Dashboard** — Overview of coaching operations
- **Students** — Manage all students
- **Training ▾** (dropdown) — Calendar, Attendance, Leave Requests, Analytics
- **Curriculum** — Build training plans
- **Finance ▾** (dropdown) — Fees, Coaches

Profile menu (avatar icon, top-right): My Profile, Settings (Master Data), Sign Out

### Assistant Coach Menu
- **Dashboard** — Overview of assigned students
- **Students** — View/manage assigned students
- **Training ▾** (dropdown) — Calendar, Attendance, Leave Requests, Analytics
- **Curriculum** — View/edit assigned student plans
- **Finance ▾** (dropdown) — Fees

Profile menu (avatar icon, top-right): My Profile, Settings (Master Data), Sign Out

### Student Menu
- **Dashboard** — Personal training overview with session card and leave request
- **Training ▾** (dropdown) — Calendar, My Progress
- **My Fees** — Fee payment status

Profile menu (avatar icon, top-right): Sign Out

---

## Features & Step-by-Step Guides

---

### 1. Dashboard (Coach)

**Path:** Dashboard → `/dashboard`

The Head Coach dashboard shows:
- **Welcome message** with coach name
- **Stat Cards**: Total Students, BAID Registered, Active Batches, Students Due for Review
- **Students Due for Review**: Students needing bi-monthly skill assessment (60+ days since last)
- **Fee Alerts**: Overdue fee notifications grouped by student
- **Coach Workload**: Distribution of students across coaches
- **Recent Activity**: Latest assessments and training log entries

**How to use:**
1. After login, you land on the Dashboard
2. Review stat cards for a quick overview
3. Click on students in "Due for Review" to navigate to their profile
4. Click "View Details" on fee alerts to go to the Fees page
5. Use the dashboard as your daily starting point

---

### 2. Student/Player Management

**Path:** Students → `/students`

#### Adding a New Student (Player)
1. Click **"+ Add Student"** button on the Students page
2. Fill in the form:
   - **Full Name** (required)
   - **Date of Birth** (required — age is auto-calculated)
   - **Gender** (Male/Female/Other)
   - **Contact Phone** (required)
   - **Email** (optional)
   - **Guardian Name & Phone** (required if under 18)
   - **BAID Number** (Badminton Association ID, optional)
   - **Batch** (select from dropdown)
   - **Assigned Coach** (select from dropdown)
   - **Physical Info**: Height (cm), Weight (kg) — BMI auto-calculated
   - **Blood Group**, Medical Conditions, Emergency Contact
   - **Skill Level**: Beginner / Intermediate / Advanced / Professional
   - **Strengths & Weaknesses** (tags)
3. Click **Save** to create the student

#### Editing a Student
1. On the Students page, click a student card/row
2. Navigate to their **Student Profile Page** (`/student/:id`)
3. Click **Edit** to update any field
4. Save changes

#### Searching & Filtering Students
1. Use the **search bar** to filter by name
2. Use **Batch filter** dropdown to show students from a specific batch
3. Use **Skill Level filter** to filter by ability

---

### 3. Coach Management (Head Coach Only)

**Path:** Coaches → `/coaches`

#### Adding an Assistant Coach
1. Navigate to the **Coaches** page
2. Click **"+ Add Coach"** button
3. Fill in:
   - **Name** (required)
   - **Username** (for login, required)
   - **Password** (required)
   - **Email**
   - **Specialization** (e.g., "Stroke Correction", "Fitness Training")
4. Click **Save** — the new coach can now log in

#### Viewing Coach Details
1. Click on any coach in the list
2. The **Coach Detail Page** (`/coach/:coachId`) has tabs:
   - **Profile** — View/edit coach profile, bio, qualifications
   - **Batches** — See batches assigned to this coach
   - **Students** — See students assigned to this coach
   - **Payments** — Financial summary (income from fees, expenses)

#### Assigning Students/Batches to a Coach
1. On the Coaches page, click a coach
2. Use the **Assign** action to assign/unassign students or batches
3. Alternatively, when editing a student, change the "Assigned Coach" field

---

### 4. Batch Management

**Path:** Master Data → `/master-data` (Batches Tab)

#### Creating a Batch
1. Navigate to **Master Data** page
2. Go to the **Batches** tab
3. Click **"+ Add Batch"**
4. Enter:
   - **Batch Name** (e.g., "Morning Beginners", "Evening Advanced")
   - **Schedule** (e.g., "Mon/Wed/Fri 6:00-7:30 AM")
   - **Assigned Coach** (select from dropdown)
5. Click **Save**

#### Editing/Archiving a Batch
1. Click on a batch in the list
2. Edit name, schedule, or coach assignment
3. To archive (soft-delete), use the **Archive** action

---

### 5. Curriculum / Training Plan Builder

**Path:** Curriculum → `/curriculum`

The curriculum is structured as an **8-week training cycle** (e.g., "Jan-Feb 2026").

#### Creating a Batch Curriculum Plan (Head Coach)
1. Navigate to **Curriculum** page
2. Select the **Cycle** (e.g., "Jul-Aug 2026")
3. Select a **Batch**
4. Click **"Create New Plan"**
5. For each of the 8 weeks, define:
   - **Focus Area** (e.g., "Footwork & Movement", "Net Play")
   - **Objective** (what students should achieve)
   - **Drills** (select from the drill library)
6. Save the plan

#### Cloning a Batch Plan to Individual Students
1. Open a batch curriculum plan
2. Click **"Clone to Students"**
3. The plan is copied to each student in that batch
4. Individual plans can then be customized per student

#### Viewing/Editing Individual Student Curriculum
1. Navigate to **Curriculum → Student** (`/curriculum/student/:studentId`)
2. View the 8-week plan specific to that student
3. Modify drills or focus areas as needed
4. Save changes

---

### 6. Drill Library

**Path:** Master Data → `/master-data` (Drills Tab)

#### Adding a Drill
1. Navigate to **Master Data** page
2. Go to the **Drills** tab
3. Click **"+ Add Drill"**
4. Enter:
   - **Name** (e.g., "Four-Corner Footwork")
   - **Category** (e.g., "Footwork", "Stroke Practice", "Service", "Net Play")
   - **Description** (detailed instructions)
5. Click **Save**

#### Editing/Archiving Drills
1. Click a drill in the list
2. Update name, category, or description
3. Archive drills that are no longer used

---

### 7. Skill Assessment & Score Tracking

**Path:** Student Profile → `/student/:id`

The application tracks **60 skills** across **6 categories** (10 skills each):
- Forehand (Clear, Drop, Smash, Drive, Net Shot, Lift, Cross Drop, Slice, Push, Tap)
- Backhand (same 10 skills)
- Return (Short, Deep, Cross, Fast, Slow, Attacking, Defensive, Flick, Push, Drive)
- Service (High, Low, Flick, Drive, Slice, Jump, Fastball, Deceptive, Side, Midcourt)
- Overhead (Smash, Clear, Drop, Drive, Lob, Cross Smash, Kill Shot, Flat Drive, Angled Smash, Block Smash)
- Rally (Control, Placement, Positioning, Movement, Selection, Tempo, Momentum, Pressure, Endurance, Resilience)

**Score Scale:** 0 (untested) → 1 (beginner) → 2 (intermediate) → 3 (advanced) → 4 (professional)

#### Recording Skill Scores for a Student
1. Navigate to the student's profile (`/student/:id`)
2. Go to the **Skills/Assessment** section
3. Select the current **Cycle** (e.g., "Jul-Aug 2026")
4. For each category, rate each skill from 0-4
5. Click **Save Assessment**

> Past cycle assessments are **locked** and cannot be modified.

#### Viewing Skill Progress
1. On the student profile, view:
   - **Radar Chart** — Visual overview of all 6 categories
   - **Progress Heatmap** — Color-coded skill grid
   - **Skill Timeline** — Track how a specific skill improves over cycles
   - **Trend Lines** — Category-level progression over time
   - **Weakness Tracker** — Skills scoring below threshold

---

### 8. Training Logs

**Path:** Training Log → `/training-log/:studentId`

Training logs record weekly session notes for each student within a cycle.

#### Recording a Training Log
1. Navigate to a student's profile
2. Click **"Training Log"** or go directly to `/training-log/:studentId`
3. Select the **Cycle** and **Week Number** (1-8)
4. Enter **Session Notes** (observations, what was practiced, areas to improve)
5. Mark **Is Completed** if the week's training is done
6. Click **Save**

#### Viewing Training History
1. On the training log page, filter by cycle
2. See all 8 weeks with notes and completion status
3. Use this to track what was covered and plan ahead

---

### 9. Fee Management

**Path:** Fees → `/fees`

#### Creating a Fee Record (Head Coach)
1. Navigate to the **Fees** page
2. Click **"+ Create Fee"**
3. Enter:
   - **Student** (select from dropdown)
   - **Amount** (fee amount)
   - **Month/Year** (e.g., "2026-07")
   - **Due Date**
4. The fee is created with status **PENDING**

#### Marking a Fee as Paid
1. On the Fees page, find the pending fee
2. Click **"Mark Paid"**
3. Enter:
   - **Paid Date**
   - **Payment Method** (Cash / UPI / Bank Transfer)
   - **Transaction Reference** (optional)
4. Status changes to **PAID**

#### Waiving a Fee
1. Find the fee record
2. Click **"Waive"**
3. Enter a **reason** for waiving
4. Status changes to **WAIVED**

#### Fee Status Types
- **PENDING** — Awaiting payment
- **PAID** — Payment received
- **OVERDUE** — Past due date (auto-calculated if pending past due date)
- **WAIVED** — Forgiven with reason

#### Filtering Fees
- Filter by **Student**, **Status**, **Month/Year**
- View all overdue fees at a glance

---

### 10. Student Self-Service Portal

#### Student Dashboard (`/student-dashboard`)
- Overview of training status
- Quick links to progress and fees

#### My Progress (`/my-progress`)
- View your own skill assessment scores
- See radar chart, heatmap, and trend lines
- Track improvement across cycles

#### My Fees (`/my-fees`)
- View all fee records
- See payment history and outstanding amounts

---

### 11. Coach Financial Tracking

**Path:** Coach Detail → Payments Tab (`/coach/:coachId`)

- **Income Ledger** — Fee payments collected
- **Expense Ledger** — Track expenses (shuttlecocks, supplies, travel, other)
- **Financial Summary** — Net balance, period-wise breakdown
- **Add Expense** — Record new expenses with type and description

---

## Features NOT Currently Available (Gaps)

All previously listed gaps have been addressed:

### ✅ 1. Attendance / Leave Management (NOW AVAILABLE)
- Daily attendance tracking with Present/Absent/Late status
- Leave type categorization (Planned Leave, Sick Leave, No Show)
- Student leave request submission and coach approval workflow
- Attendance percentage reports and statistics
- Consecutive no-show detection (3+ sessions flagging)
- 7-day attendance trend on dashboard

### ✅ 2. Training Analysis / Session Analytics (NOW AVAILABLE)
- Drill completion rate tracking per curriculum week
- Skill improvement correlation (Training Effectiveness Score)
- Batch-level and student-level comparison reports
- Attendance vs skill improvement trend analysis with Pearson correlation
- Training pattern visualization (category distribution, attendance heatmap)
- Session calendar with planned drills and focus areas
- Structured session schedule builder with recurrence patterns

---

## New Features: Attendance & Training

### 12. Attendance Management

**Path:** Training → Calendar → Mark Attendance, or Training → Attendance (`/attendance`)

#### Marking Daily Attendance
1. Navigate to **Training → Attendance** from the top navigation
2. Select a **Batch** from the dropdown
3. Select the **Session Date** (within 7 days of today)
4. For each student, click **Present**, **Absent**, or **Late**
5. If marking Absent, select a **Leave Type** (Planned Leave, Sick Leave, No Show)
6. Click **Submit Attendance**
7. A confirmation toast appears on success

#### Quick Actions
- **Mark All Present/Absent/Late** — Bulk-set all students to the same status

#### Viewing Attendance History
1. On the Attendance page, switch to the **History** tab
2. Filter by Batch, Start Date, and End Date
3. View records in a table showing date, student, status, and leave type

---

### 13. Leave Request Management

**Path:** Training → Leave Requests (`/leave-requests`)

#### Student: Submitting a Leave Request
1. On the **Student Dashboard**, find the "Leave Request" section
2. Click **Request Leave**
3. Select a future date, leave type, and optional reason
4. Click **Submit Leave Request**

#### Coach: Reviewing Leave Requests
1. Navigate to **Training → Leave Requests**
2. Filter by status: All, Pending, Approved, Rejected
3. For pending requests, click **Approve** or **Reject**
4. Approved requests automatically pre-populate attendance as Planned Leave

---

### 14. Session Calendar

**Path:** Training → Calendar (`/calendar`)

#### Viewing the Calendar
1. Navigate to **Training → Calendar**
2. Toggle between **Week** and **Month** views
3. Navigate forward/backward using arrows, or click **Today**
4. Session slots appear on their scheduled days showing batch name and time
5. Click a session to see details: focus area, planned drills, coach notes, attendance status

#### Coach: Quick Attendance Marking
1. Click any session on the calendar
2. In the detail panel, click **Mark Attendance** to navigate directly to the attendance form

---

### 15. Training Analytics

**Path:** Training → Analytics (`/training-analytics`)

#### Drill Completion Analysis
1. Navigate to **Training → Analytics**
2. Enter a **Cycle Key** (e.g., "Jan-Feb 2025") and select a Batch
3. View per-week drill completion bar charts
4. Expand any week to see individual drill completion status

#### Batch Comparison
1. Switch to the **Batch Comparison** tab
2. View sortable table comparing batches by skill improvement, attendance, and drill completion
3. Below-average metrics are highlighted in amber

#### Skill Trends
1. Switch to the **Skill Trends** tab
2. Select a batch and student
3. View dual-axis chart showing attendance % vs skill score across cycles
4. Pearson correlation coefficient shown when 3+ cycles available

#### Training Patterns
1. Switch to the **Training Patterns** tab
2. Select date range and batch
3. View attendance heatmap (day of week × curriculum week)
4. View category distribution showing drill focus proportions

---

### 16. Session Schedule Management

**Path:** Training → Calendar → (Coach creates via API or ScheduleBuilder component)

#### Creating a Session Schedule (Head Coach)
1. Define training days using day-of-week toggles (S, M, T, W, T, F, S)
2. Set start and end times for each day
3. Add multiple time slots per day if needed
4. Configure recurrence: repeat interval (every N weeks), end condition (never, on date, after N occurrences)
5. Save the schedule — curriculum week mappings are auto-generated

---

### 17. Dashboard Widgets

The following widgets have been added to dashboards:

#### Coach Dashboard
- **Attendance Today** widget showing present/absent/expected counts and 7-day trend bars
- **Today's Session** card showing upcoming session with time, batch, focus area, and drills

#### Student Dashboard
- **Attendance** percentage card (highlighted red if below 75%)
- **Today's Session** card showing next upcoming session
- **Leave Request** section to submit leave directly from dashboard

---

## Complete Trainee Lifecycle (Step-by-Step)

This section walks through the full journey of a trainee from registration to ongoing training management.

### Phase 1: Setup (One-time, by Head Coach)

**Step 1: Create Batches**
1. Go to **Settings** (profile menu) → Batches tab
2. Click **+ Add Batch**
3. Enter batch name (e.g., "Morning Beginners"), schedule info
4. Save

**Step 2: Add Assistant Coaches**
1. Go to **Finance → Coaches**
2. Click **+ Add Coach**
3. Enter name, username, password, specialization
4. Save — they can now log in

**Step 3: Set Up Session Schedule**
1. Use the **ScheduleBuilder** (via API or calendar page) for each batch
2. Select training days (e.g., Mon/Wed/Fri)
3. Set start/end times per day
4. Configure recurrence (every week, or every 2 weeks, etc.)
5. Save — calendar entries are auto-generated

**Step 4: Create Drill Library**
1. Go to **Settings** → Drills tab
2. Add drills with name, category, and description
3. These drills will be used in curriculum plans

---

### Phase 2: Onboarding a New Student

**Step 5: Add the Student**
1. Go to **Students** → Click **+ Add Student**
2. Fill in: Full Name, Date of Birth, Gender, Contact Phone
3. If under 18: add Guardian Name & Phone
4. Optional: BAID number, height, weight, blood group, medical conditions
5. Set **Skill Level** (Beginner/Intermediate/Advanced/Professional)
6. Select **Batch** from dropdown
7. Select **Assigned Coach** from dropdown
8. Save

**Step 6: Assign to Batch**
- Already done in Step 5 via the Batch dropdown
- Or: edit the student later to change their batch assignment

**Step 7: Assign to Coach**
- Already done in Step 5 via the Assigned Coach dropdown
- Head Coach sees all students; Assistant Coach only sees their assigned students

---

### Phase 3: Training Cycle (Repeats every 8 weeks)

**Step 8: Create Curriculum Plan**
1. Go to **Curriculum**
2. Select the current **Cycle** (e.g., "Jul-Aug 2026")
3. Select the batch
4. Click **Create New Plan**
5. For each of the 8 weeks, define: Focus Area, Objective, and Drills
6. Save
7. Optionally: **Clone to Students** to create individual customizable plans

**Step 9: Record Initial Skill Assessment**
1. Go to **Students** → Click a student → **Progress** tab
2. Under Skill Assessment, select the current cycle
3. Rate each of the 60 skills (0-4 scale) across 6 categories
4. Save — this becomes the baseline for improvement tracking

---

### Phase 4: Daily Operations (Ongoing)

**Step 10: Mark Daily Attendance**
- **Quick way (recommended):** On the Coach Dashboard, the **Quick Attendance** widget shows the next session with all students listed. Tap P/A/L for each, then Submit.
- **Full way:** Go to **Training → Attendance**, select batch and date, mark each student, submit.
- Late marking allowed up to 7 days in the past.

**Step 11: Manage Leave Requests**
- Students submit leave requests from their dashboard (future dates only)
- Coaches: Go to **Training → Leave Requests**, review pending requests, Approve or Reject
- Approved requests auto-mark attendance as "Planned Leave" on that date

**Step 12: Record Training Logs**
1. Go to a student's profile → Click **Training Log**
2. Select Cycle and Week Number (1-8)
3. Enter session notes (what was practiced, observations)
4. Mark "Completed" when the week's training is done
5. Save

**Step 13: Add Session Notes (Coach)**
- On the Calendar page, click a session → add a Coach Note
- Notes appear on the student's SessionCard and calendar detail panel

---

### Phase 5: Assessment & Review (End of Cycle or Bi-Monthly)

**Step 14: Record End-of-Cycle Skill Assessment**
1. Same as Step 9 — record new scores at the end of the cycle
2. The system computes improvement deltas automatically

**Step 15: Review Analytics**
1. Go to **Training → Analytics**
2. Check **Drill Completion** tab — see which weeks had full training
3. Check **Batch Comparison** — compare batch averages
4. Check **Skill Trends** — see attendance vs skill correlation for individual students
5. Check **Training Patterns** — identify focus area gaps

**Step 16: Review Student Progress**
1. Go to student profile → **Progress** tab
2. View radar chart, trend lines, and weakness tracker
3. Go to **Attendance** tab — see attendance history and percentage
4. Go to **Skill Analytics** tab — see attendance vs skill improvement chart

---

### Phase 6: Financial Management (Monthly)

**Step 17: Create Fee Records**
1. Go to **Finance → Fees** → Click **+ Create Fee**
2. Select student, amount, month/year, due date
3. Fee is created as PENDING

**Step 18: Mark Fees Paid**
1. When payment received, find the fee → Click **Mark Paid**
2. Enter paid date, payment method, and optional reference
3. Track overdue fees on the dashboard (Fee Alerts)

---

### Phase 7: Start New Cycle

**Step 19: Archive Old Curriculum & Create New**
1. Old cycle plans auto-archive when a new cycle begins
2. Create new 8-week plan for the next cycle (repeat Step 8)
3. Past assessments are locked — new assessments can be recorded for the new cycle

---

### Summary Flow Diagram

```
Add Student → Assign to Batch → Assign Coach
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
Start New Cycle (repeat)
```

---

## Technical Details

| Component | Technology |
|-----------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS 4 + CSS custom properties |
| Backend | Express.js + TypeScript |
| Database | PostgreSQL (Supabase) |
| Auth | JWT with bcrypt password hashing |
| Hosting | Vercel (both frontend and API) |

---

## Summary of All Available Actions

| Action | Menu Path | Who Can Do It |
|--------|-----------|---------------|
| Add Student | Students → + Add Student | Head Coach, Assistant Coach |
| Edit Student | Students → Click Student → Edit | Head Coach, Assistant Coach |
| Add Assistant Coach | Finance → Coaches → + Add Coach | Head Coach |
| Assign Coach to Batch/Students | Finance → Coaches → Click Coach → Assign | Head Coach |
| Create Batch | Settings → Batches → + Add Batch | Head Coach |
| Add Drill | Settings → Drills → + Add Drill | Head Coach |
| Create Curriculum Plan | Curriculum → Create New Plan | Head Coach |
| Clone Plan to Students | Curriculum → Clone to Students | Head Coach |
| Edit Individual Curriculum | Curriculum → Student → Edit | Head Coach, Assistant Coach |
| Record Skill Assessment | Student Profile → Assessment → Save | Head Coach, Assistant Coach |
| Record Training Log | Training Log → Add Entry | Head Coach, Assistant Coach |
| Create Fee Record | Finance → Fees → + Create Fee | Head Coach |
| Mark Fee Paid | Finance → Fees → Mark Paid | Head Coach |
| Waive Fee | Finance → Fees → Waive | Head Coach |
| Mark Attendance | Training → Attendance → Submit | Head Coach, Assistant Coach |
| View Attendance History | Training → Attendance → History tab | Head Coach, Assistant Coach |
| Submit Leave Request | Student Dashboard → Request Leave | Student |
| Approve/Reject Leave | Training → Leave Requests → Approve/Reject | Head Coach, Assistant Coach |
| View Session Calendar | Training → Calendar | All Roles |
| Create Session Schedule | API: POST /api/session-schedules | Head Coach |
| View Training Analytics | Training → Analytics | Head Coach, Assistant Coach |
| View Own Progress | Training → My Progress | Student |
| View Own Fees | My Fees | Student |
| Add Expense | Profile → My Profile → Payments → Add Expense | Head Coach, Assistant Coach |
