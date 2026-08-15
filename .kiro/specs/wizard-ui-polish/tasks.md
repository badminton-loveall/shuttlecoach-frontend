# Implementation Plan

## Overview

Fix the Batch Setup Wizard UI to align with the ShuttleCoach design system. The wizard pages currently render without TopNav (missing DashboardLayout wrapper), use hardcoded CSS values and shadcn `hsl(var(--*))` syntax instead of canonical design tokens, have undersized step indicators, and lack pill-shaped secondary buttons.

## Tasks

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Missing DashboardLayout and Design Token Misalignment
  - **IMPORTANT**: Write this test BEFORE implementing the fix
  - **GOAL**: Surface counterexamples that demonstrate the wizard renders without TopNav and uses non-token CSS values
  - **Scoped Approach**: Write a unit test that renders `BatchWizardPage` and asserts a `<nav>` element (from TopNav via DashboardLayout) is present in the DOM
  - Test that `BatchWizardPage` does NOT render TopNav (confirms missing DashboardLayout wrapper)
  - Run test on UNFIXED code - expect FAILURE (this confirms the bug exists)
  - Document counterexample: "BatchWizardPage renders without TopNav — DashboardLayout is missing"
  - _Requirements: 1.1_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Wizard Navigation and Form Validation Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Primary CTA button retains `border-radius: 999px` (pill shape) on unfixed code
  - Observe: Form validation shows red error text for whitespace-only batch name on unfixed code
  - Observe: Step navigation via clicking completed steps still calls `goToStep` on unfixed code
  - Write test: Render `StepActions` and verify primary button has class `btn-primary` with existing lime pill style
  - Write test: Render `DetailsStep` with empty name, verify `.details-step__error-text` displays
  - Write test: Render `StepperNav` with completed steps, click a completed indicator, verify `goToStep` is called
  - Verify all tests pass on UNFIXED code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Wrap BatchWizardPage in DashboardLayout

  - [ ] 3.1 Add DashboardLayout wrapper to BatchWizardPage.tsx
    - Add `import { DashboardLayout } from '../components/DashboardLayout';`
    - Wrap the `<WizardProvider>` return in `<DashboardLayout>…</DashboardLayout>`
    - Ensures TopNav renders on wizard pages providing app-level navigation context
    - _Bug_Condition: isBugCondition(BatchWizardPage.tsx) — NOT wrappedInDashboardLayout_
    - _Expected_Behavior: Page renders inside DashboardLayout with TopNav visible_
    - _Preservation: Wizard content, routing, and state management unchanged_
    - _Requirements: 2.1_

  - [ ] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - DashboardLayout Present
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 asserts TopNav presence via DashboardLayout
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms DashboardLayout wrapper is applied)
    - _Requirements: 2.1_

- [ ] 4. Migrate DetailsStep.css to design tokens

  - [ ] 4.1 Replace spacing values with design system tokens
    - Change `gap: 1.5rem` → `gap: var(--space-lg)` on `.details-step`
    - Change `gap: 1rem` → `gap: var(--space-md)` on `.details-step__form`
    - Change `gap: 0.375rem` → `gap: var(--space-xs)` on `.details-step__field`
    - Change `gap: 0.75rem` → `gap: var(--space-sm)` on `.details-step__summary-row`
    - Change `padding: 1.25rem` → `padding: var(--space-lg)` on `.details-step__summary-card`
    - Change `padding: 0.5rem 0` → `padding: var(--space-sm) 0` on `.details-step__summary-row`
    - Change `padding: 0.5rem 0.75rem` → `padding: var(--space-sm) var(--space-md)` on inputs/selects
    - _Requirements: 2.8_

  - [ ] 4.2 Replace color and border values with design tokens
    - Change `border: 1px solid hsl(var(--border))` → `border: 1px solid var(--border-default)` on summary card and inputs
    - Change `background: hsl(var(--muted) / 0.3)` → `background: var(--surface-hover)` on summary card
    - Change `background: hsl(var(--background))` → `background: var(--surface-card)` on inputs/selects
    - Change `color: hsl(var(--foreground))` → `color: var(--text-primary)` on titles, values, inputs
    - Change `color: hsl(var(--muted-foreground))` → `color: var(--text-secondary)` on labels
    - Change `color: hsl(var(--destructive))` → `color: var(--color-danger)` on error text and required asterisk
    - Change `border-bottom: 1px solid hsl(var(--border) / 0.5)` → `border-bottom: 1px solid var(--border-default)` on summary rows
    - _Requirements: 2.4_

  - [ ] 4.3 Replace font sizes and focus styles with design tokens
    - Change `font-size: 1.125rem` → `font-size: var(--font-lg)` on `.details-step__form-title`
    - Change `font-size: 0.9rem` → `font-size: var(--font-sm)` on summary title, summary value, inputs, selects
    - Change `font-size: 0.75rem` → `font-size: var(--font-xs)` on summary labels
    - Change `font-size: 0.8rem` → `font-size: var(--font-xs)` on field labels and error text
    - Change `border-radius: var(--radius)` → `border-radius: var(--radius-md)` on summary card, inputs, selects
    - Change input/select `:focus` `border-color: hsl(var(--primary))` → `border-color: var(--border-focus)`
    - Change input/select `:focus` `box-shadow: 0 0 0 2px hsl(var(--primary) / 0.25)` → `box-shadow: var(--shadow-focus)`
    - _Requirements: 2.5, 2.8_

- [ ] 5. Update StepperNav.css indicator sizing

  - [ ] 5.1 Increase step indicator dimensions
    - Change active/default indicator `width: 28px; height: 28px` → `width: 32px; height: 32px`
    - Change mobile indicator `width: 24px; height: 24px` → `width: 28px; height: 28px`
    - Maintains stronger visual weight for progress communication
    - _Bug_Condition: usesHardcodedValue(indicator size 28px) — below design convention minimum_
    - _Preservation: Mobile breakpoint at ≤480px still hides labels, indicator remains clickable_
    - _Requirements: 2.2_

- [ ] 6. Update StepActions.css for pill-shaped secondary buttons

  - [ ] 6.1 Add pill border-radius to secondary buttons
    - Add rule: `.step-actions .btn-secondary { border-radius: var(--radius-pill); }`
    - Gives Cancel/Back buttons pill shape matching the primary CTA
    - _Bug_Condition: missesCanonicalToken(border-radius) on secondary buttons_
    - _Expected_Behavior: Cancel/Back buttons render with border-radius 999px_
    - _Preservation: Primary button style unchanged (Req 3.3), hover states preserved_
    - _Requirements: 2.6_

- [ ] 7. Verify preservation tests still pass
  - **Property 2: Preservation** - Wizard Navigation and Form Validation Unchanged
  - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
  - Run preservation tests from step 2
  - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
  - Confirm primary CTA still has pill shape with Electric Lime style
  - Confirm form validation error text still displays
  - Confirm step navigation still works via click
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Run full test suite to verify no regressions
  - Visually verify wizard at multiple viewports (320px, 480px, 768px, 1024px, 1440px)
  - Confirm TopNav is visible on wizard pages
  - Confirm design tokens are applied consistently across all wizard components
  - Ask the user if questions arise


## Task Dependency Graph

```json
{
  "waves": [
    ["1", "2"],
    ["3.1"],
    ["3.2", "4.1", "4.2", "4.3", "5.1", "6.1"],
    ["7"],
    ["8"]
  ]
}
```

## Notes

- WizardShell.css already uses design tokens correctly — no changes needed.
- All changes are CSS-only except the single JSX wrapper in BatchWizardPage.tsx.
- Property-based tests are not applicable for CSS value changes; visual verification and unit tests for DOM structure are appropriate.
- The design tokens referenced are defined in `src/styles/design-system.css`.
