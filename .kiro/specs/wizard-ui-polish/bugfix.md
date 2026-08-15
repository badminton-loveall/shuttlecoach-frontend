# Bugfix Requirements Document

## Introduction

The Batch Setup Wizard UI (WizardShell, StepperNav, StepActions, DetailsStep) does not properly leverage the application's design system tokens and visual patterns. The result is a wizard that looks plain, inconsistent, and disconnected from the rest of the ShuttleCoach application. This fix aligns the wizard components with the established design system — using Electric Lime (#B8E135) for active/focus states, proper card elevation, the Plus Jakarta Sans display font, pill-shaped buttons, correct spacing scale, and input focus rings with lime shadow.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the BatchWizardPage renders THEN the system does not wrap it in DashboardLayout, so the TopNav (app header with logo, navigation links, and user menu) is absent, making the page feel completely disconnected from the parent application

1.2 WHEN the stepper nav renders active/completed step indicators THEN the system displays thin 2px bordered circles (28px) that appear visually weak and do not convey strong progress feedback

1.3 WHEN the wizard card container renders THEN the system displays a card with only a 1px border and basic shadow that appears flat and does not match the elevated card pattern used elsewhere in the app

1.4 WHEN the DetailsStep summary section renders THEN the system displays emojis as icons with a faint muted background (hsl muted/0.3) that lacks visual differentiation from the form area below it

1.5 WHEN form inputs and selects in DetailsStep receive focus THEN the system applies a generic 2px ring using hsl(var(--primary)/0.25) instead of the design system's standard focus shadow (0 0 0 3px rgba(184,225,53,0.3))

1.6 WHEN the Cancel and Back buttons render THEN the system displays them with square border-radius (var(--radius-md) = 10px) and a plain hover state, lacking the pill shape and visual hierarchy that distinguishes secondary actions from the primary CTA

1.7 WHEN the page title "Edit Batch" / "Create Batch" renders THEN the system uses the body font (Inter) instead of the display font family (Plus Jakarta Sans) for the wizard heading

1.8 WHEN the wizard content area and summary/form sections render THEN the system uses inconsistent spacing — hardcoded rem values (1.5rem, 0.75rem, 1.25rem) and non-token gaps instead of the design system's spacing scale (--space-xs through --space-xl)

### Expected Behavior (Correct)

2.1 WHEN the BatchWizardPage renders THEN the system SHALL wrap it in DashboardLayout so the TopNav is visible, providing the user with app-level context (logo, navigation, user menu) and a sense of continuity with the rest of the application

2.2 WHEN the stepper nav renders active/completed step indicators THEN the system SHALL display solid filled circles with Electric Lime background (#B8E135), dark foreground text, and a slightly larger size (32px) that clearly communicates progress state

2.3 WHEN the wizard card container renders THEN the system SHALL display a card with the standard shadow-card (0 2px 12px rgba(0,0,0,0.07)), border-radius-lg (16px), and sufficient padding (--space-xl) that matches other elevated card components in the application

2.4 WHEN the DetailsStep summary section renders THEN the system SHALL display a visually distinct summary area with a slightly elevated background (--surface-hover or --color-slate-100), proper border-radius (--radius-md), and icon placeholders using styled spans instead of raw emojis

2.5 WHEN form inputs and selects in DetailsStep receive focus THEN the system SHALL apply the design system's standard focus ring: border-color var(--border-focus) and box-shadow var(--shadow-focus) which is 0 0 0 3px rgba(184,225,53,0.3)

2.6 WHEN the Cancel and Back buttons render THEN the system SHALL display them with pill-shaped border-radius (var(--radius-pill) = 999px) and a subtle border with hover state that elevates slightly, creating clear visual hierarchy below the primary CTA

2.7 WHEN the page title renders THEN the system SHALL use the display font family (Plus Jakarta Sans via var(--font-display)) at the --font-xl size with --weight-bold, matching the typographic hierarchy used on other pages

2.8 WHEN the wizard content area and summary/form sections render THEN the system SHALL use exclusively design system spacing tokens (--space-sm, --space-md, --space-lg, --space-xl) for all gaps, padding, and margins

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the stepper nav renders on mobile viewports (≤480px) THEN the system SHALL CONTINUE TO hide step labels and show only the numeric/checkmark indicators

3.2 WHEN a completed step indicator is clicked THEN the system SHALL CONTINUE TO navigate back to that step via the goToStep function

3.3 WHEN the primary "Next" / "Save Changes" / "Create Batch" button renders THEN the system SHALL CONTINUE TO use the Electric Lime pill-shaped style with hover elevation already in place

3.4 WHEN the wizard renders in edit mode THEN the system SHALL CONTINUE TO display "Save Changes" as the final action label and "Edit Batch" as the title

3.5 WHEN form validation detects whitespace-only batch name THEN the system SHALL CONTINUE TO display the red error text below the input field

3.6 WHEN the wizard shell renders on tablet/mobile breakpoints THEN the system SHALL CONTINUE TO reduce padding and card spacing responsively as currently implemented

3.7 WHEN the DetailsStep summary displays schedule, curriculum, and coach information THEN the system SHALL CONTINUE TO show the same textual content and formatting logic for each summary row

3.8 WHEN the user navigates away with unsaved changes THEN the system SHALL CONTINUE TO show the "Discard unsaved changes?" confirmation dialog
