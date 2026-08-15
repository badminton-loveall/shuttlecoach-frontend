# Wizard UI Polish Bugfix Design

## Overview

The Batch Setup Wizard pages (`BatchWizardPage`, `WizardShell`, `StepperNav`, `StepActions`, `DetailsStep`) render without the application's TopNav and use inconsistent CSS values — hardcoded `rem` units, shadcn-style `hsl(var(--border))` references, and weaker visual treatments — instead of the project's canonical design tokens (`--space-*`, `--radius-*`, `--shadow-*`, `--font-*`, `--border-*`, `--surface-*`). The fix is purely cosmetic: align every CSS property to the token set defined in `src/styles/design-system.css` and wrap the page in `DashboardLayout` so the TopNav appears.

## Glossary

- **Bug_Condition (C)**: Any wizard component CSS that uses a hardcoded value, shadcn `hsl(var(--*))` reference, or non-token property where the design system provides a token — OR the page missing its `DashboardLayout` wrapper
- **Property (P)**: All wizard CSS properties SHALL reference the canonical token, and the page SHALL render inside `DashboardLayout`
- **Preservation**: Mobile responsiveness breakpoints, existing button behaviour, form validation messages, wizard navigation logic, and step content display must remain unchanged
- **DashboardLayout**: The wrapper component at `src/components/DashboardLayout.tsx` that renders `TopNav` above a `<main>` content area
- **Design tokens**: CSS custom properties defined in `src/styles/design-system.css` (spacing: `--space-*`, radii: `--radius-*`, shadows: `--shadow-*`, fonts: `--font-*`, surfaces: `--surface-*`, borders: `--border-*`)

## Bug Details

### Bug Condition

The bug manifests when the wizard pages render in any viewport. The CSS files for `DetailsStep`, `StepperNav`, `StepActions`, and `WizardShell` use values that bypass or conflict with the project design tokens, and `BatchWizardPage.tsx` does not wrap its content in `DashboardLayout`.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { file: CSSFile | TSXFile, property: CSSProperty | JSXElement }
  OUTPUT: boolean

  IF input.file == "BatchWizardPage.tsx"
    RETURN NOT wrappedInDashboardLayout(input.file)

  IF input.file IN ["DetailsStep.css", "StepperNav.css", "StepActions.css", "WizardShell.css"]
    RETURN usesHardcodedValue(input.property)
           OR usesHslVarSyntax(input.property)
           OR missesCanonicalToken(input.property)
END FUNCTION
```

### Examples

- **DetailsStep.css** uses `gap: 1.5rem` → should be `gap: var(--space-lg)` (24px)
- **DetailsStep.css** uses `padding: 1.25rem` → should be `padding: var(--space-lg)` (24px)
- **DetailsStep.css** input focus uses `box-shadow: 0 0 0 2px hsl(var(--primary) / 0.25)` → should be `box-shadow: var(--shadow-focus)`
- **DetailsStep.css** summary card uses `background: hsl(var(--muted) / 0.3)` → should be `background: var(--surface-hover)`
- **StepperNav.css** indicator is `28px` → should be `32px` for stronger presence
- **StepActions.css** secondary buttons lack `border-radius: var(--radius-pill)` → should use pill shape
- **BatchWizardPage.tsx** returns `<WizardProvider>` directly → should wrap in `<DashboardLayout>`

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Mobile breakpoint at ≤480px hides stepper labels and stacks action buttons (Req 3.1, 3.6)
- Tablet breakpoint at ≤768px reduces wizard padding (Req 3.6)
- Completed step indicators remain clickable to navigate back (Req 3.2)
- Primary "Next"/"Create Batch"/"Save Changes" button keeps its existing Electric Lime pill style (Req 3.3)
- Edit mode displays "Save Changes" label and "Edit Batch" title (Req 3.4)
- Whitespace-only batch name error text continues to display (Req 3.5)
- Summary row text content (schedule, curriculum, coach) is unchanged (Req 3.7)
- Unsaved changes confirmation dialog still fires on cancel (Req 3.8)

**Scope:**
All non-CSS behaviour (React component logic, form validation, API calls, routing, state management) is completely unaffected by this fix. Only CSS property values and one JSX wrapping element change.

## Hypothesized Root Cause

Based on the bug analysis, the root causes are:

1. **Missing DashboardLayout wrapper**: `BatchWizardPage.tsx` was built without wrapping in `DashboardLayout`, so TopNav never renders on wizard pages. Other pages (e.g. `BatchListPage`) use this wrapper.

2. **Shadcn token leakage in DetailsStep.css**: The file was written using shadcn's `hsl(var(--border))`, `hsl(var(--muted) / 0.3)` pattern rather than the project's compatibility-layer tokens (`--border-default`, `--surface-hover`, etc.)

3. **Hardcoded spacing in DetailsStep.css**: Values like `1.5rem`, `0.75rem`, `1.25rem`, `0.5rem` were used instead of `--space-*` tokens.

4. **Weak step indicator sizing**: `StepperNav.css` uses `28px` indicators which appear thin — the design system's button/badge sizing convention calls for `32px` minimum for touch targets with clear visual weight.

5. **Missing pill radius on secondary buttons**: The `btn-secondary` class in `design-system.css` does not apply `--radius-pill` by default. The fix needs to override locally in `StepActions.css` to match the primary CTA's pill shape.

## Correctness Properties

Property 1: Bug Condition - Design Token Alignment

_For any_ CSS property in the wizard component files (WizardShell.css, StepperNav.css, StepActions.css, DetailsStep.css) that has a corresponding design system token, the fixed CSS SHALL use the token reference (e.g. `var(--space-lg)`) rather than a hardcoded value or shadcn `hsl(var(--*))` reference.

**Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8**

Property 2: Preservation - Mobile Responsiveness and Existing Behaviour

_For any_ viewport width or user interaction that is NOT affected by the bug condition (mobile breakpoints, click handlers, form validation, navigation logic), the fixed code SHALL produce the same visual layout and behaviour as the original code, preserving responsive stacking, label hiding, button sizing, and error display.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

## Fix Implementation

### Changes Required

**File**: `src/pages/BatchWizardPage.tsx`

**Change**: Wrap the wizard render output in `DashboardLayout`

**Specific Changes**:
1. Add `import { DashboardLayout } from '../components/DashboardLayout';`
2. Wrap the `<WizardProvider>` return in `<DashboardLayout>…</DashboardLayout>`

---

**File**: `src/components/batch-wizard/DetailsStep.css`

**Specific Changes** (token migration):

| Current Value | Design Token | Properties Affected |
|---|---|---|
| `gap: 1.5rem` | `gap: var(--space-lg)` | `.details-step` |
| `gap: 0.75rem` | `gap: var(--space-md)` | `.details-step__summary-card` |
| `padding: 1.25rem` | `padding: var(--space-lg)` | `.details-step__summary-card` |
| `border: 1px solid hsl(var(--border))` | `border: 1px solid var(--border-default)` | `.details-step__summary-card` |
| `border-radius: var(--radius)` | `border-radius: var(--radius-md)` | `.details-step__summary-card`, inputs, selects |
| `background: hsl(var(--muted) / 0.3)` | `background: var(--surface-hover)` | `.details-step__summary-card` |
| `font-size: 0.9rem` | `font-size: var(--font-sm)` | `.details-step__summary-title`, `__summary-value`, inputs, selects |
| `font-size: 0.75rem` | `font-size: var(--font-xs)` | `.details-step__summary-label` |
| `font-size: 0.8rem` | `font-size: var(--font-xs)` | `.details-step__label`, `__error-text` |
| `font-size: 1.125rem` | `font-size: var(--font-lg)` | `.details-step__form-title` |
| `color: hsl(var(--foreground))` | `color: var(--text-primary)` | titles, values |
| `color: hsl(var(--muted-foreground))` | `color: var(--text-secondary)` | labels |
| `color: hsl(var(--destructive))` | `color: var(--color-danger)` | required asterisk, error text |
| `border: 1px solid hsl(var(--input))` | `border: 1px solid var(--border-default)` | inputs, selects |
| `background: hsl(var(--background))` | `background: var(--surface-card)` | inputs, selects |
| `color: hsl(var(--foreground))` | `color: var(--text-primary)` | inputs, selects |
| `border-color: hsl(var(--primary))` | `border-color: var(--border-focus)` | input/select `:focus` |
| `box-shadow: 0 0 0 2px hsl(var(--primary) / 0.25)` | `box-shadow: var(--shadow-focus)` | input/select `:focus` |
| `gap: 1rem` | `gap: var(--space-md)` | `.details-step__form` |
| `gap: 0.375rem` | `gap: var(--space-xs)` | `.details-step__field` |
| `gap: 0.75rem` | `gap: var(--space-sm)` | `.details-step__summary-row` |
| `padding: 0.5rem 0` | `padding: var(--space-sm) 0` | `.details-step__summary-row` |
| `border-bottom: 1px solid hsl(var(--border) / 0.5)` | `border-bottom: 1px solid var(--border-default)` | `.details-step__summary-row` |
| `padding: 0.5rem 0.75rem` | `padding: var(--space-sm) var(--space-md)` | inputs, selects |
| `gap: 0.125rem` | `gap: 2px` | `.details-step__summary-content` (use `var(--space-xs)` / 4px or literal 2px) |

---

**File**: `src/components/batch-wizard/StepperNav.css`

**Specific Changes**:
1. **Indicator size**: Change `width: 28px; height: 28px` → `width: 32px; height: 32px` for active/default indicators
2. **Mobile indicator**: Change `width: 24px; height: 24px` → `width: 28px; height: 28px`
3. All other token references are already correct (uses `var(--space-*)`, `var(--radius-*)`, `var(--font-*)`, `hsl(var(--primary))`)

---

**File**: `src/components/batch-wizard/StepActions.css`

**Specific Changes**:
1. Add rule: `.step-actions .btn-secondary { border-radius: var(--radius-pill); }` — gives Cancel/Back buttons the pill shape matching primary CTA

---

**File**: `src/components/batch-wizard/WizardShell.css`

**Status**: Already uses design tokens correctly (`--space-*`, `--radius-lg`, `--shadow-card`, `--font-display`, `--font-xl`, `--weight-bold`). No changes needed — confirms Req 2.3, 2.7 are already met.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, confirm the visual defects exist (counterexamples on unfixed code), then verify the fix applies correct tokens and preserves responsive behaviour.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the CSS token misalignment BEFORE implementing the fix. Confirm the root cause analysis.

**Test Plan**: Inspect computed styles in devtools and assert that wizard elements use design-system token values. Run on unfixed code to observe failures.

**Test Cases**:
1. **Missing TopNav**: Load `/batches/new` — TopNav is absent (will fail on unfixed code)
2. **DetailsStep hardcoded spacing**: Inspect `.details-step` computed gap — should be 24px but may differ (will fail on unfixed code)
3. **Focus ring mismatch**: Focus an input — shadow should be `0 0 0 3px rgba(184,225,53,0.3)` but shows `0 0 0 2px` with hsl (will fail on unfixed code)
4. **Secondary button shape**: Inspect Cancel button `border-radius` — should be 999px, shows 10px (will fail on unfixed code)

**Expected Counterexamples**:
- TopNav DOM element is not rendered on wizard pages
- Computed style values don't match design token values
- Possible causes: CSS uses hardcoded values and shadcn references, page missing DashboardLayout wrapper

### Fix Checking

**Goal**: Verify that for all wizard CSS properties where the bug condition holds, the fixed files reference the canonical design token.

**Pseudocode:**
```
FOR ALL property WHERE isBugCondition(property) DO
  result := getComputedStyle(property) after fix
  ASSERT result == expectedTokenValue(property)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all layout and behaviour that is NOT part of the bug condition, the fixed code produces the same result as the original.

**Pseudocode:**
```
FOR ALL viewport IN [320px, 480px, 768px, 1024px, 1440px] DO
  FOR ALL element IN wizard_elements DO
    ASSERT layout(element, viewport, fixed) == layout(element, viewport, original)
           OR element is explicitly changed by fix
  END FOR
END FOR
```

**Testing Approach**: Manual visual regression testing is appropriate here since the changes are CSS-only. Automated snapshot testing (e.g. Storybook + Chromatic) or Playwright visual comparisons would provide strong guarantees.

**Test Plan**: Observe layout on unfixed code at each breakpoint, then verify the same structural layout after fix.

**Test Cases**:
1. **Mobile stacking (≤480px)**: Verify stepper labels still hide, action buttons stack vertically
2. **Tablet padding (≤768px)**: Verify wizard card uses reduced padding
3. **Step navigation**: Verify clicking completed step still navigates
4. **Primary CTA unchanged**: Verify "Next" button retains Electric Lime pill shape with hover elevation
5. **Form validation**: Verify whitespace-only batch name error text still displays in red

### Unit Tests

- Verify `BatchWizardPage` renders `TopNav` (via DashboardLayout) — check for nav element presence
- Verify `StepActions` Cancel/Back buttons have `border-radius: 999px` computed style
- Verify `DetailsStep` input focus ring matches `--shadow-focus` token value

### Property-Based Tests

- Generate random viewport widths and verify responsive breakpoint triggers remain unchanged
- Generate random wizard states and verify CSS class application is unchanged (no logic change)

### Integration Tests

- Full flow: navigate to `/batches/new`, verify TopNav visible, complete wizard, verify submission works
- Edit flow: navigate to `/batches/:id/edit`, verify title is "Edit Batch", verify TopNav visible
- Resize viewport during wizard interaction, verify layout adapts correctly
