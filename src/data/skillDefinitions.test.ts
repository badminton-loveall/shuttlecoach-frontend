import { describe, it, expect } from 'vitest';
import {
  SKILL_DEFINITIONS_STRUCTURED,
  ALL_SKILLS,
  SKILL_CATEGORIES,
  SCORE_LABELS,
} from './skillDefinitions';

describe('SKILL_DEFINITIONS_STRUCTURED', () => {
  it('has exactly 6 categories', () => {
    expect(Object.keys(SKILL_DEFINITIONS_STRUCTURED)).toHaveLength(6);
  });

  it('contains the correct category names', () => {
    const categories = Object.keys(SKILL_DEFINITIONS_STRUCTURED);
    expect(categories).toContain('forehand');
    expect(categories).toContain('backhand');
    expect(categories).toContain('return');
    expect(categories).toContain('service');
    expect(categories).toContain('overhead');
    expect(categories).toContain('rally');
  });

  it('has exactly 10 skills per category', () => {
    for (const category of SKILL_CATEGORIES) {
      expect(SKILL_DEFINITIONS_STRUCTURED[category]).toHaveLength(10);
    }
  });

  it('has 60 total skills', () => {
    const totalSkills = Object.values(SKILL_DEFINITIONS_STRUCTURED).reduce(
      (sum, skills) => sum + skills.length,
      0
    );
    expect(totalSkills).toBe(60);
  });

  it('each skill has id, name, and category fields', () => {
    for (const category of SKILL_CATEGORIES) {
      for (const skill of SKILL_DEFINITIONS_STRUCTURED[category]) {
        expect(skill).toHaveProperty('id');
        expect(skill).toHaveProperty('name');
        expect(skill).toHaveProperty('category');
        expect(skill.category).toBe(category);
        expect(skill.id).toBeTruthy();
        expect(skill.name).toBeTruthy();
      }
    }
  });
});

describe('ALL_SKILLS', () => {
  it('contains exactly 60 skills', () => {
    expect(ALL_SKILLS).toHaveLength(60);
  });

  it('all skill IDs are unique', () => {
    const ids = ALL_SKILLS.map((skill) => skill.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(60);
  });

  it('skill IDs follow the expected format (category-NN)', () => {
    for (const skill of ALL_SKILLS) {
      expect(skill.id).toMatch(/^(forehand|backhand|return|service|overhead|rally)-\d{2}$/);
    }
  });
});

describe('SCORE_LABELS', () => {
  it('defines labels for scores 0 through 4', () => {
    expect(SCORE_LABELS[0]).toBe('Not Tested');
    expect(SCORE_LABELS[1]).toBe('Beginner');
    expect(SCORE_LABELS[2]).toBe('Intermediate');
    expect(SCORE_LABELS[3]).toBe('Advanced');
    expect(SCORE_LABELS[4]).toBe('Professional');
  });

  it('has exactly 5 labels', () => {
    expect(Object.keys(SCORE_LABELS)).toHaveLength(5);
  });
});

describe('SKILL_CATEGORIES', () => {
  it('has 6 categories in correct order', () => {
    expect(SKILL_CATEGORIES).toEqual([
      'forehand',
      'backhand',
      'return',
      'service',
      'overhead',
      'rally',
    ]);
  });
});
