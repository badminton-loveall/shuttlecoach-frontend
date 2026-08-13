/**
 * Supported sports for the drill marketplace
 * Used for drill categorization and center sport configuration
 * Requirements: 2.2
 */

export type Sport = 'badminton' | 'tennis' | 'table_tennis' | 'squash';

export const SUPPORTED_SPORTS: Sport[] = ['badminton', 'tennis', 'table_tennis', 'squash'];

/** Display labels for each sport */
export const SPORT_LABELS: Record<Sport, string> = {
  badminton: 'Badminton',
  tennis: 'Tennis',
  table_tennis: 'Table Tennis',
  squash: 'Squash',
};
