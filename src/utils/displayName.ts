/**
 * resolveAttributionName
 *
 * Some historical records (e.g. SkillAssessment.recordedBy) were written
 * with the acting user's email instead of their display name. When the
 * stored value matches the currently signed-in user's email/username, show
 * their actual name instead. Never guess a name from an email we can't
 * match — the raw value is returned unchanged in that case.
 */
import type { User } from '../types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function resolveAttributionName(
  value: string | null | undefined,
  currentUser?: User | null
): string {
  if (!value) return value ?? '';
  if (!EMAIL_PATTERN.test(value.trim())) return value;

  if (currentUser?.name) {
    const candidates = [currentUser.email, currentUser.username]
      .filter((v): v is string => Boolean(v))
      .map((v) => v.toLowerCase());
    if (candidates.includes(value.trim().toLowerCase())) {
      return currentUser.name;
    }
  }

  return value;
}

/**
 * toTitleCase
 *
 * Capitalizes the first letter of each space-separated word and lowercases
 * the rest — display-only formatting for names stored however they were
 * originally typed ("archana", "JOHN SMITH", ...), without touching the
 * underlying data (unlike email, name casing has no functional meaning, so
 * there's nothing to normalize on write — this is purely cosmetic).
 */
export function toTitleCase(name: string | null | undefined): string {
  if (!name) return name ?? '';
  return name
    .trim()
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(' ');
}
