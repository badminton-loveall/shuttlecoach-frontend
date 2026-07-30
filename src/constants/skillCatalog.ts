/**
 * Skill Catalog for the Skill Progression Tracker
 * 
 * 61 badminton skills organized in 5 categories.
 * Used across heatmap, timeline, and score recording components.
 * 
 * Requirements: 6.1, 14.2
 */

// ─── Skill Score Types ───────────────────────────────────────────────────────

/** Score scale: 0 = Don't Know, 1 = Beginner, 2 = Intermediate, 3 = Advanced, 4 = Pro */
export type SkillScore = 0 | 1 | 2 | 3 | 4;

/** The 5 skill categories for the progression tracker */
export type SkillCategory = 'service' | 'serviceReturn' | 'forehand' | 'roundHead' | 'backhand';

// ─── Data Model Types ────────────────────────────────────────────────────────

/** A per-week, per-student, per-skill score record */
export interface WeeklySkillScore {
  id: string;
  studentId: string;
  weekNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  cycleKey: string;
  skillId: string;
  skillName: string;
  category: SkillCategory;
  score: SkillScore;
  recordedBy: string;
  recordedAt: Date;
}

/** Aggregated view model for heatmap rendering */
export interface SkillScoreMatrix {
  studentId: string;
  cycleKey?: string;
  weeks: string[];
  categories: SkillCategoryGroup[];
}

/** A group of skills within a single category */
export interface SkillCategoryGroup {
  categoryId: SkillCategory;
  categoryLabel: string;
  skills: SkillRow[];
}

/** A single skill row in the heatmap */
export interface SkillRow {
  skillId: string;
  skillName: string;
  scores: (SkillScore | null)[];
  latestScore: SkillScore | null;
}

// ─── Skill Catalog Entry ─────────────────────────────────────────────────────

export interface SkillEntry {
  id: string;
  name: string;
}

export interface SkillCategoryDefinition {
  label: string;
  skills: readonly SkillEntry[];
}

// ─── SKILL_CATALOG ───────────────────────────────────────────────────────────

export const SKILL_CATALOG: Record<SkillCategory, SkillCategoryDefinition> = {
  service: {
    label: 'Service',
    skills: [
      { id: 'bh-short-service', name: 'BH Short Service' },
      { id: 'bh-flick-service', name: 'BH Flick Service' },
      { id: 'fh-short-service', name: 'FH Short Service' },
      { id: 'fh-long-service', name: 'FH Long Service' },
      { id: 'fh-flick-service', name: 'FH Flick Service' },
    ],
  },
  serviceReturn: {
    label: 'Service Return',
    skills: [
      { id: 'sr-str-keep', name: 'Service Return STR Keep' },
      { id: 'sr-cross-keep', name: 'Service Return Cross Keep' },
      { id: 'sr-str-push', name: 'Service Return STR Push' },
      { id: 'sr-cross-push', name: 'Service Return Cross Push' },
      { id: 'sr-str-lift', name: 'Service Return STR Lift' },
      { id: 'sr-cross-lift', name: 'Service Return Cross Lift' },
    ],
  },
  forehand: {
    label: 'Forehand (FH)',
    skills: [
      { id: 'cross-drop-fh', name: 'Cross Drop FH' },
      { id: 'straight-drop-fh', name: 'Straight Drop FH' },
      { id: 'straight-smash-fh', name: 'Straight Smash FH' },
      { id: 'cross-smash-fh', name: 'Cross Smash FH' },
      { id: 'straight-drive-fh', name: 'Straight Drive FH' },
      { id: 'cross-drive-fh', name: 'Cross Drive FH' },
      { id: 'reverse-slice-str-fh', name: 'Reverse Slice Straight FH' },
      { id: 'forward-slice-str-fh', name: 'Forward Slice Straight FH' },
      { id: 'forward-slice-cross-fh', name: 'Forward Slice Cross FH' },
      { id: 'straight-defence-fh', name: 'Straight Defence FH' },
      { id: 'cross-defence-fh', name: 'Cross Defence FH' },
      { id: 'straight-keep-fh', name: 'Straight Keep FH' },
      { id: 'cross-keep-fh', name: 'Cross Keep FH' },
      { id: 'lift-straight-fh', name: 'Lift Straight FH' },
      { id: 'lift-cross-fh', name: 'Lift Cross FH' },
      { id: 'toss-straight-fh', name: 'Toss Straight FH' },
      { id: 'toss-cross-fh', name: 'Toss Cross FH' },
      { id: 'dribble-keep-io-fh-1', name: 'Dribble keep I/O FH (1)' },
      { id: 'dribble-keep-io-fh-2', name: 'Dribble keep I/O FH (2)' },
    ],
  },
  roundHead: {
    label: 'Round Head',
    skills: [
      { id: 'cross-drop-rh', name: 'Cross Drop Round Head' },
      { id: 'straight-drop-rh', name: 'Straight Drop Round Head' },
      { id: 'straight-smash-rh', name: 'Straight Smash Round Head' },
      { id: 'cross-smash-rh', name: 'Cross Smash Round Head' },
      { id: 'straight-drive-rh', name: 'Straight Drive Round Head' },
      { id: 'cross-drive-rh', name: 'Cross Drive Round Head' },
      { id: 'reverse-slice-str-rh', name: 'Reverse Slice Straight Round Head' },
      { id: 'forward-slice-str-rh', name: 'Forward Slice Straight Round Head' },
      { id: 'reverse-slice-cross-rh', name: 'Reverse Slice Cross Round Head' },
    ],
  },
  backhand: {
    label: 'Backhand (BH)',
    skills: [
      { id: 'straight-defence-bh', name: 'Straight Defence BH' },
      { id: 'cross-defence-bh', name: 'Cross Defence BH' },
      { id: 'straight-keep-bh', name: 'Straight Keep BH' },
      { id: 'cross-keep-bh', name: 'Cross Keep BH' },
      { id: 'lift-straight-bh', name: 'Lift Straight BH' },
      { id: 'lift-cross-bh', name: 'Lift Cross BH' },
      { id: 'toss-straight-bh', name: 'Toss Straight BH' },
      { id: 'toss-cross-bh', name: 'Toss Cross BH' },
      { id: 'dribble-keep-io-bh-1', name: 'Dribble keep I/O BH (1)' },
      { id: 'dribble-keep-io-bh-2', name: 'Dribble keep I/O BH (2)' },
      { id: 'bh-straight-toss', name: 'Back hand Straight Toss' },
      { id: 'bh-straight-drop', name: 'Back hand Straight Drop' },
      { id: 'bh-cross-drop', name: 'Back hand Cross Drop' },
      { id: 'bh-cross-toss', name: 'Back hand Cross Toss' },
      { id: 'straight-smash-bh', name: 'Straight Smash BH' },
      { id: 'cross-smash-bh', name: 'Cross Smash BH' },
      { id: 'straight-drive-bh', name: 'Straight Drive BH' },
      { id: 'cross-drive-bh', name: 'Cross Drive BH' },
      { id: 'reverse-slice-str-bh', name: 'Reverse Slice Straight BH' },
      { id: 'forward-slice-str-bh', name: 'Forward Slice Straight BH' },
      { id: 'forward-slice-cross-bh', name: 'Forward Slice Cross BH' },
      { id: 'reverse-slice-cross-bh', name: 'Reverse Slice Cross BH' },
    ],
  },
} as const;

// ─── Utility: Flatten all skill IDs ──────────────────────────────────────────

/** All valid skill IDs from the catalog */
export const ALL_SKILL_IDS: string[] = Object.values(SKILL_CATALOG).flatMap(
  (category) => category.skills.map((skill) => skill.id)
);

/** Total number of skills in the catalog */
export const TOTAL_SKILLS = ALL_SKILL_IDS.length; // 61
