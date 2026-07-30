# Requirements Document

## Introduction

Align the Drill Library with the coach's training taxonomy by replacing the current drill data and categories with 5 coach-defined categories (Service, Service Return, Forehand, Round Head, Backhand) containing 54 specific drills. The data is stored locally in a JSON file with a structure supporting future API migration.

## Glossary

- **DrillLibrary**: The React component that displays available drills with search and category filtering
- **Drill**: An individual training exercise with a name, description, and category
- **DrillCategory**: One of the 5 defined categories: Service, Service Return, Forehand (FH), Round Head, Backhand (BH)
- **drills.json**: The local JSON data file serving as the drill data source
- **DRILL_CATEGORIES**: The constant array defining the valid drill categories

## Requirements

### Requirement 1: Drill Data Source

**User Story:** As a coach, I want the drill library to contain my exact training drills organized by my categories, so that I can build curriculum plans with drills I actually use.

#### Acceptance Criteria

1. THE drills.json file SHALL contain exactly 54 drill entries matching the coach-defined drill list
2. WHEN the DrillLibrary loads THEN the component SHALL import drills from the local drills.json file
3. THE drills.json file SHALL use a flat array structure (`{ "drills": [...] }`) compatible with future API response format

### Requirement 2: Drill Categories

**User Story:** As a coach, I want drills organized into 5 specific categories, so that I can quickly find drills by shot type.

#### Acceptance Criteria

1. THE DRILL_CATEGORIES constant SHALL define exactly 5 categories: Service, Service Return, Forehand (FH), Round Head, Backhand (BH)
2. WHEN a drill entry exists in drills.json THEN the drill SHALL have a category value matching one of the 5 defined categories
3. THE Service category SHALL contain exactly 5 drills: BH Short Service, BH Flick Service, FH Short Service, FH Long Service, FH Flick Service
4. THE Service Return category SHALL contain exactly 6 drills matching the coach-defined list
5. THE Forehand (FH) category SHALL contain exactly 19 drills matching the coach-defined list
6. THE Round Head category SHALL contain exactly 9 drills matching the coach-defined list
7. THE Backhand (BH) category SHALL contain exactly 14 drills matching the coach-defined list

### Requirement 3: Category Dropdown

**User Story:** As a coach, I want the category filter dropdown to show my 5 categories, so that I can filter drills by training focus area.

#### Acceptance Criteria

1. THE DrillLibrary category dropdown SHALL display exactly 6 options: All Categories, Service, Service Return, Forehand (FH), Round Head, Backhand (BH)
2. WHEN "All Categories" is selected THEN the DrillLibrary SHALL display all 54 drills
3. WHEN a specific category is selected THEN the DrillLibrary SHALL display only drills whose category matches the selected value

### Requirement 4: Drill Data Structure

**User Story:** As a developer, I want each drill to have a consistent structure, so that the data can migrate to an API without frontend changes.

#### Acceptance Criteria

1. THE drills.json file SHALL assign each drill a unique ID following the pattern `drill-{prefix}-{nn}`
2. THE drills.json file SHALL include a description field for each drill
3. WHEN two drills exist in drills.json THEN their id values SHALL be distinct

### Requirement 5: Backward Compatibility

**User Story:** As a coach, I want my existing curriculum plans to continue working, so that I don't lose training history.

#### Acceptance Criteria

1. WHEN an existing curriculum plan references old drill IDs THEN the curriculum plan view SHALL continue rendering the embedded drill data without errors
2. THE DrillLibrary update SHALL NOT modify the CurriculumPlan type or existing curriculum plan data
