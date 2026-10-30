/**
 * LoveAll chart palette.
 *
 * Chart libraries set colors as SVG attributes, which can't read CSS custom
 * properties, so these are concrete values. Series colors are mid-tones that
 * stay visible on both the ivory (light) and Court Green-black (dark) surfaces.
 */
export const CHART_COLORS = {
  axis: '#857B66',
  grid: '#A89D86',
  /** Ordered series palette: court, info, amber, gold, danger, olive, teal, plum, slate, rust */
  series: ['#3F8463', '#4A7FA8', '#C08A3E', '#B8975A', '#C0605A', '#8FAE3A', '#5E9A90', '#8C6A8E', '#7A8C99', '#B9744A'],
} as const;

/** Skill-level colors, matching the skill badges (info, warning, gold, success). */
export const SKILL_LEVEL_COLORS = {
  Beginner: '#4A7FA8',
  Intermediate: '#C08A3E',
  Advanced: '#B8975A',
  Professional: '#3F8463',
} as const;
