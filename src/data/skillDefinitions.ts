/**
 * Skill Definitions for ShuttleCoach
 * 60 unique skills distributed across 6 categories (10 per category)
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import type { SkillCategory, SkillScore } from '../types';

/* ============================================================================
   SKILL SCORE LABELS
   ============================================================================ */

/**
 * Semantic labels for the 0-4 skill score scale.
 * 0 = Not tested/unable, 1 = Beginner, 2 = Intermediate, 3 = Advanced, 4 = Professional
 */
export const SCORE_LABELS: Record<SkillScore, string> = {
  0: 'Not Tested',
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Professional',
};

/* ============================================================================
   SKILL DEFINITION TYPE
   ============================================================================ */

export interface SkillDefinition {
  id: string;
  name: string;
  category: SkillCategory;
}

/* ============================================================================
   SKILL DEFINITIONS — 60 skills across 6 categories
   ============================================================================ */

function buildSkills(category: SkillCategory, names: string[]): SkillDefinition[] {
  return names.map((name, index) => ({
    id: `${category}-${String(index + 1).padStart(2, '0')}`,
    name,
    category,
  }));
}

const FOREHAND_SKILLS = buildSkills('forehand', [
  'Clear',
  'Drop',
  'Smash',
  'Drive',
  'Net Shot',
  'Lift',
  'Cross Drop',
  'Slice',
  'Push',
  'Tap',
]);

const BACKHAND_SKILLS = buildSkills('backhand', [
  'Clear',
  'Drop',
  'Smash',
  'Drive',
  'Net Shot',
  'Lift',
  'Cross Drop',
  'Slice',
  'Push',
  'Tap',
]);

const RETURN_SKILLS = buildSkills('return', [
  'Short Return',
  'Deep Return',
  'Cross Return',
  'Fast Return',
  'Slow Return',
  'Attacking Return',
  'Defensive Return',
  'Flick Return',
  'Push Return',
  'Drive Return',
]);

const SERVICE_SKILLS = buildSkills('service', [
  'High Serve',
  'Low Serve',
  'Flick Serve',
  'Drive Serve',
  'Slice Serve',
  'Jump Serve',
  'Fastball Serve',
  'Deceptive Serve',
  'Side Service',
  'Midcourt Serve',
]);

const OVERHEAD_SKILLS = buildSkills('overhead', [
  'Smash',
  'Clear',
  'Drop',
  'Drive',
  'Lob',
  'Cross Smash',
  'Kill Shot',
  'Flat Drive',
  'Angled Smash',
  'Block Smash',
]);

const RALLY_SKILLS = buildSkills('rally', [
  'Rally Control',
  'Attack Placement',
  'Defensive Positioning',
  'Court Movement',
  'Shot Selection',
  'Tempo Control',
  'Momentum Building',
  'Under Pressure',
  'Endurance',
  'Mental Resilience',
]);

/**
 * All 60 skill definitions grouped by category.
 * Each category contains exactly 10 skills with unique IDs.
 */
export const SKILL_DEFINITIONS_STRUCTURED: Record<SkillCategory, SkillDefinition[]> = {
  forehand: FOREHAND_SKILLS,
  backhand: BACKHAND_SKILLS,
  return: RETURN_SKILLS,
  service: SERVICE_SKILLS,
  overhead: OVERHEAD_SKILLS,
  rally: RALLY_SKILLS,
};

/**
 * Flat array of all 60 skill definitions for iteration/lookup.
 */
export const ALL_SKILLS: SkillDefinition[] = [
  ...FOREHAND_SKILLS,
  ...BACKHAND_SKILLS,
  ...RETURN_SKILLS,
  ...SERVICE_SKILLS,
  ...OVERHEAD_SKILLS,
  ...RALLY_SKILLS,
];

/**
 * All skill categories in display order.
 */
export const SKILL_CATEGORIES: SkillCategory[] = [
  'forehand',
  'backhand',
  'return',
  'service',
  'overhead',
  'rally',
];
