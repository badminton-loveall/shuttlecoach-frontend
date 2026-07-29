/**
 * Design System Consistency — Forbidden-Value Static Scan
 *
 * Feature: design-system-consistency
 * Property 3: No ad-hoc spacing utilities in pages and modals
 * Property 4: No hardcoded color, radius, or shadow in pages and modals
 *
 * This test reads every in-scope page and modal/dialog file and asserts that
 * the full forbidden-value set is absent. Violations indicate a file still
 * uses ad-hoc Tailwind utilities instead of design-token-backed semantic classes.
 *
 * **Validates: Requirements 2.4, 3.2, 3.3, 4.1, 4.2, 5.1, 6.1, 6.2, 6.3, 6.4**
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// In-scope files (from the design doc, Section "Verified Findings")
// ---------------------------------------------------------------------------

const SRC_DIR = path.resolve(__dirname, '..');

const IN_SCOPE_PAGES = [
  'pages/HeadCoachDashboard.tsx',
  'pages/AssistantCoachDashboard.tsx',
  'pages/CoachesPage.tsx',
  'pages/CoachDetailPage.tsx',
  'pages/FeesPage.tsx',
  'pages/StudentsPage.tsx',
  'pages/StudentDashboard.tsx',
  'pages/StudentProfilePage.tsx',
  'pages/CurriculumPage.tsx',
  'pages/CurriculumBuilderPage.tsx',
  'pages/IndividualCurriculumPage.tsx',
  'pages/TrainingLogPage.tsx',
  'pages/MyFeesPage.tsx',
  'pages/MyProgressPage.tsx',
  'pages/AccessDeniedPage.tsx',
  'pages/LoginPage.tsx',
].map((f) => path.join(SRC_DIR, f));

const IN_SCOPE_MODALS_AND_DIALOGS = [
  'components/AddStudentModal.tsx',
  'components/AddCoachModal.tsx',
  'components/AddBatchModal.tsx',
  'components/EditCoachModal.tsx',
  'components/MarkPaidModal.tsx',
  'components/WaiveFeeModal.tsx',
  'components/EnrollStudentModal.tsx',
  'components/CreateFeeModal.tsx',
  'components/EditFeeModal.tsx',
  'components/StudentQuickViewModal.tsx',
  'components/DeleteConfirmDialog.tsx',
  'components/DeleteCoachConfirmDialog.tsx',
].map((f) => path.join(SRC_DIR, f));

const ALL_IN_SCOPE_FILES = [...IN_SCOPE_PAGES, ...IN_SCOPE_MODALS_AND_DIALOGS];

// ---------------------------------------------------------------------------
// Forbidden patterns
// ---------------------------------------------------------------------------

/**
 * Ad-hoc spacing utilities (Tailwind numeric spacing classes).
 * Matches whole CSS class tokens like p-4, px-8, py-2, mb-3, mt-6, space-y-6, gap-4.
 * Does NOT match fractional values like mt-0.5 (used for micro icon alignment)
 * or responsive-prefixed classes like sm:p-6 (those are in sub-components, not pages).
 */
const SPACING_PATTERN =
  /(?<![a-zA-Z0-9:_-])(p|px|py|mb|mt|space-y|gap)-(\d+)(?![.\d])/g;

/**
 * Forbidden radius utilities: rounded-lg, rounded-md, rounded-xl.
 * NOT forbidden: rounded-full (avatars), rounded (bare, used in skeletons — non-structural),
 * rounded-pill, rounded-none, or custom rounded-[…].
 */
const RADIUS_PATTERN = /(?<![a-zA-Z0-9:_-])rounded-(lg|md|xl)(?![a-zA-Z0-9_-])/g;

/**
 * Forbidden color utilities: text-gray-*, bg-gray-*, border-gray-*.
 * Only gray is forbidden — other colors (green, red, yellow, blue, slate, etc.) are allowed.
 */
const GRAY_COLOR_PATTERN = /(?<![a-zA-Z0-9:_-])(text|bg|border)-gray-\d+/g;

/**
 * Forbidden shadow: literal box-shadow with pixel values NOT using var(--shadow-*).
 * Matches inline style box-shadow declarations with px values.
 */
const LITERAL_SHADOW_PATTERN = /box-shadow:\s*(?!var\(--shadow)[^;]*\d+px/g;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Violation {
  file: string;
  line: number;
  match: string;
  category: string;
}

function stripComments(content: string): string {
  // Remove single-line comments (// ...)
  let result = content.replace(/\/\/.*$/gm, '');
  // Remove multi-line comments (/* ... */)
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  return result;
}

function scanFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  const content = stripComments(rawContent);
  const lines = content.split('\n');
  const relPath = path.relative(SRC_DIR, filePath);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Only scan className strings and JSX attributes, skip imports/type definitions
    if (line.trim().startsWith('import ') || line.trim().startsWith('type ') || line.trim().startsWith('interface ')) {
      continue;
    }

    // Check spacing
    let match: RegExpExecArray | null;
    const spacingRegex = new RegExp(SPACING_PATTERN.source, 'g');
    while ((match = spacingRegex.exec(line)) !== null) {
      violations.push({ file: relPath, line: lineNum, match: match[0], category: 'spacing' });
    }

    // Check radius
    const radiusRegex = new RegExp(RADIUS_PATTERN.source, 'g');
    while ((match = radiusRegex.exec(line)) !== null) {
      violations.push({ file: relPath, line: lineNum, match: match[0], category: 'radius' });
    }

    // Check gray colors
    const colorRegex = new RegExp(GRAY_COLOR_PATTERN.source, 'g');
    while ((match = colorRegex.exec(line)) !== null) {
      violations.push({ file: relPath, line: lineNum, match: match[0], category: 'color' });
    }

    // Check literal box-shadow
    const shadowRegex = new RegExp(LITERAL_SHADOW_PATTERN.source, 'g');
    while ((match = shadowRegex.exec(line)) !== null) {
      violations.push({ file: relPath, line: lineNum, match: match[0], category: 'shadow' });
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Feature: design-system-consistency — Forbidden-Value Static Scan', () => {
  it('all in-scope files exist', () => {
    for (const filePath of ALL_IN_SCOPE_FILES) {
      expect(fs.existsSync(filePath), `Missing file: ${filePath}`).toBe(true);
    }
  });

  describe('Property 3: No ad-hoc spacing utilities in pages and modals', () => {
    it.each(ALL_IN_SCOPE_FILES.map((f) => [path.relative(SRC_DIR, f), f]))(
      '%s has no forbidden spacing utilities',
      (_relPath, filePath) => {
        const violations = scanFile(filePath as string).filter((v) => v.category === 'spacing');
        if (violations.length > 0) {
          const details = violations
            .map((v) => `  Line ${v.line}: "${v.match}"`)
            .join('\n');
          expect.fail(
            `Found ${violations.length} ad-hoc spacing violation(s) in ${_relPath}:\n${details}`
          );
        }
      }
    );
  });

  describe('Property 4: No hardcoded color, radius, or shadow in pages and modals', () => {
    it.each(ALL_IN_SCOPE_FILES.map((f) => [path.relative(SRC_DIR, f), f]))(
      '%s has no forbidden radius utilities',
      (_relPath, filePath) => {
        const violations = scanFile(filePath as string).filter((v) => v.category === 'radius');
        if (violations.length > 0) {
          const details = violations
            .map((v) => `  Line ${v.line}: "${v.match}"`)
            .join('\n');
          expect.fail(
            `Found ${violations.length} radius violation(s) in ${_relPath}:\n${details}`
          );
        }
      }
    );

    it.each(ALL_IN_SCOPE_FILES.map((f) => [path.relative(SRC_DIR, f), f]))(
      '%s has no forbidden gray color utilities',
      (_relPath, filePath) => {
        const violations = scanFile(filePath as string).filter((v) => v.category === 'color');
        if (violations.length > 0) {
          const details = violations
            .map((v) => `  Line ${v.line}: "${v.match}"`)
            .join('\n');
          expect.fail(
            `Found ${violations.length} gray color violation(s) in ${_relPath}:\n${details}`
          );
        }
      }
    );

    it.each(ALL_IN_SCOPE_FILES.map((f) => [path.relative(SRC_DIR, f), f]))(
      '%s has no literal box-shadow values',
      (_relPath, filePath) => {
        const violations = scanFile(filePath as string).filter((v) => v.category === 'shadow');
        if (violations.length > 0) {
          const details = violations
            .map((v) => `  Line ${v.line}: "${v.match}"`)
            .join('\n');
          expect.fail(
            `Found ${violations.length} shadow violation(s) in ${_relPath}:\n${details}`
          );
        }
      }
    );
  });
});
