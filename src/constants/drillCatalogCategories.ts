/**
 * Drill catalog categories — the free-text `category` field stored on every
 * `drills` row (Footwork, Service, Net Play, …). This is a different concept
 * from `drillCategories.ts`'s 5-item skill taxonomy (used for curriculum/
 * skill-tracking) and from a drill *set's* categories (`drill_set_categories`,
 * the arbitrary per-set section names a coach types in the set builder, e.g.
 * "Category 1") — those stay separate concepts on purpose.
 *
 * There's no backend table for this list; `drills.category` is just a string
 * column. So "one source of truth" here means: every screen that offers a
 * category dropdown for a drill computes it the same way, via
 * getDrillCategoryOptions() — the fixed defaults below, unioned with
 * whatever category values already exist on the drills currently loaded on
 * that screen. That's what makes a category created anywhere (including a
 * set-builder category name that got used when creating a drill inline)
 * show up as a selectable option everywhere else, instead of each screen's
 * dropdown drifting out of sync with its own hardcoded list.
 */

export const DEFAULT_DRILL_CATALOG_CATEGORIES = [
  'Fundamentals',
  'Footwork',
  'Stroke Practice',
  'Combination Drills',
  'Net Play',
  'Service',
  'Return',
  'Defense',
  'Rally',
  'Match Practice',
];

/**
 * Builds the option list for a drill-category dropdown: the fixed defaults
 * above, plus every distinct category actually in use on `drills`, plus any
 * `extra` values that must be present even if nothing uses them yet (e.g.
 * a value a form has just been pre-filled with). Alphabetical, deduped.
 */
export function getDrillCategoryOptions(
  drills: Array<{ category?: string | null }>,
  extra: Array<string | null | undefined> = []
): string[] {
  const values = new Set<string>(DEFAULT_DRILL_CATALOG_CATEGORIES);
  for (const d of drills) {
    if (d.category) values.add(d.category);
  }
  for (const e of extra) {
    if (e) values.add(e);
  }
  return Array.from(values).sort((a, b) => a.localeCompare(b));
}
