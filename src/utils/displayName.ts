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
