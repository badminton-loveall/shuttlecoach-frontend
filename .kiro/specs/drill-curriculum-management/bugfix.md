# Bugfix Requirements Document

## Introduction

The drill/curriculum management system has critical data source inconsistencies and missing workflow integrations that break the end-to-end flow of: creating drills → building a curriculum → assigning it to a student → reflecting scheduled drills in calendars. The `DrillLibrary` component reads from a static local JSON file instead of the live API. The `CurriculumBuilderPage` persists to `localStorage` instead of the backend. Curriculum is not properly center-independent (coaches should manage drills and curricula globally). And the assignment of a curriculum to a student (via the student's profile) does not properly propagate to the student calendar or coach calendar views.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a coach creates a new drill via the Drills management page (DrillsTab using API) THEN the new drill does not appear in the DrillLibrary component used by the Curriculum Builder because DrillLibrary reads from a static local `drills.json` file

1.2 WHEN a coach updates or deletes a drill via the Drills management page (DrillsTab using API) THEN the DrillLibrary in the Curriculum Builder continues showing the stale/deleted drill from the static JSON file

1.3 WHEN a coach saves a batch curriculum plan in the CurriculumBuilderPage THEN the plan is stored only in browser localStorage and is not persisted to the backend API

1.4 WHEN a coach saves a batch plan in CurriculumBuilderPage and then navigates to a student's IndividualCurriculumPage THEN the individual curriculum page (which fetches from the API) shows no plan or an empty plan because the batch plan was never sent to the API

1.5 WHEN a coach saves a batch plan in CurriculumBuilderPage on one browser/device THEN the batch plan is not visible on any other browser or device because it only exists in that browser's localStorage

1.6 WHEN a coach assigns a curriculum to a student via the student profile THEN the assigned curriculum's drills do not appear in the student's calendar view

1.7 WHEN a coach assigns a curriculum to a student THEN the coach's own calendar does not show the individually assigned curriculum details for that student (coach must navigate into each student's profile to see their plan)

1.8 WHEN a coach changes or reassigns a curriculum for a student who already has progress THEN the system does not display any warning that the student's progress will reset to week 1, day 1

### Expected Behavior (Correct)

2.1 WHEN a coach creates a new drill via the Drills management page THEN the system SHALL display that drill in the DrillLibrary component within the Curriculum Builder by fetching drills from the API

2.2 WHEN a coach updates or deletes a drill via the Drills management page THEN the system SHALL reflect the update or removal in the DrillLibrary within the Curriculum Builder by fetching the current drill list from the API

2.3 WHEN a coach saves a batch curriculum plan in the CurriculumBuilderPage THEN the system SHALL persist the plan to the backend API using the existing `/api/curriculum` endpoint

2.4 WHEN a coach saves a batch plan and then navigates to a student's IndividualCurriculumPage THEN the system SHALL show the student's individual plan (cloned from the batch plan via API) with correct data because both pages use the same API data source

2.5 WHEN a coach saves a batch plan THEN the system SHALL make that plan accessible from any browser or device by storing it in the backend database rather than localStorage

2.6 WHEN a coach assigns a curriculum to a student from the student's profile page (selecting batch and curriculum based on performance) THEN the system SHALL reflect the assigned curriculum's scheduled drills in the student's calendar view

2.7 WHEN a coach assigns a curriculum to a student THEN the system SHALL display the session schedule (with curriculum drills) in the coach's calendar view, with individual student details accessible by navigating into that student's profile

2.8 WHEN a coach changes or reassigns a curriculum for a student who already has progress THEN the system SHALL display a confirmation warning indicating that the student's progress will reset to week 1, day 1, and require explicit confirmation before proceeding

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a coach drags a drill from the DrillLibrary onto a week in the Curriculum Builder THEN the system SHALL CONTINUE TO add that drill to the selected week's drill list via drag-and-drop

3.2 WHEN a coach filters or searches drills in the DrillLibrary THEN the system SHALL CONTINUE TO filter results by name/description match and category selection

3.3 WHEN a coach edits a student's individual curriculum plan (adding/removing drills, changing focus area) THEN the system SHALL CONTINUE TO save changes without affecting the master batch plan or other students' plans

3.4 WHEN a curriculum plan is from a past cycle (archived) THEN the system SHALL CONTINUE TO display it as read-only and prevent editing

3.5 WHEN viewing the IndividualCurriculumPage for a student whose plan was copied from a batch plan THEN the system SHALL CONTINUE TO show diff indicators highlighting which weeks have been modified from the original batch plan

3.6 WHEN the SessionCalendarPage loads THEN the system SHALL CONTINUE TO display calendar entries with mapped curriculum drills and focus areas for scheduled sessions

3.7 WHEN drills and curricula are managed by coaches THEN the system SHALL CONTINUE TO treat them as independent of specific centers (coaches manage drills and curricula globally, with default curricula optionally provided at center level that coaches can customize)
