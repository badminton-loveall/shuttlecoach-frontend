import { describe, it, expect } from 'vitest';
import {
  validateProfileForm,
  validateExpenseForm,
  isValidationPassed,
  getFirstError,
  ValidationErrors,
  ProfileFormData,
  ExpenseFormData,
} from './validation';

describe('validateProfileForm', () => {
  describe('name field validation', () => {
    it('returns error when name is empty', () => {
      const formData: ProfileFormData = {
        name: '',
        email: 'coach@example.com',
      };
      const errors = validateProfileForm(formData);
      expect(errors.name).toBe('Name is required');
    });

    it('returns error when name is only whitespace', () => {
      const formData: ProfileFormData = {
        name: '   ',
        email: 'coach@example.com',
      };
      const errors = validateProfileForm(formData);
      expect(errors.name).toBe('Name is required');
    });

    it('returns error when name is less than 2 characters', () => {
      const formData: ProfileFormData = {
        name: 'A',
        email: 'coach@example.com',
      };
      const errors = validateProfileForm(formData);
      expect(errors.name).toBe('Name must be at least 2 characters');
    });

    it('returns error when name exceeds 100 characters', () => {
      const formData: ProfileFormData = {
        name: 'A'.repeat(101),
        email: 'coach@example.com',
      };
      const errors = validateProfileForm(formData);
      expect(errors.name).toBe('Name must not exceed 100 characters');
    });

    it('passes validation with valid name', () => {
      const formData: ProfileFormData = {
        name: 'John Coach',
        email: 'coach@example.com',
      };
      const errors = validateProfileForm(formData);
      expect(errors.name).toBeUndefined();
    });

    it('passes validation with name at max length (100)', () => {
      const formData: ProfileFormData = {
        name: 'A'.repeat(100),
        email: 'coach@example.com',
      };
      const errors = validateProfileForm(formData);
      expect(errors.name).toBeUndefined();
    });
  });

  describe('email field validation', () => {
    it('passes validation with valid email', () => {
      const formData: ProfileFormData = {
        name: 'John Coach',
        email: 'coach@example.com',
      };
      const errors = validateProfileForm(formData);
      expect(errors.email).toBeUndefined();
    });

    it('returns error for invalid email format (no @)', () => {
      const formData: ProfileFormData = {
        name: 'John Coach',
        email: 'coachexample.com',
      };
      const errors = validateProfileForm(formData);
      expect(errors.email).toBe('Invalid email format');
    });

    it('returns error for invalid email format (no domain)', () => {
      const formData: ProfileFormData = {
        name: 'John Coach',
        email: 'coach@',
      };
      const errors = validateProfileForm(formData);
      expect(errors.email).toBe('Invalid email format');
    });

    it('returns error for email exceeding 255 characters', () => {
      const formData: ProfileFormData = {
        name: 'John Coach',
        email: 'a'.repeat(250) + '@example.com',
      };
      const errors = validateProfileForm(formData);
      expect(errors.email).toBe('Email must not exceed 255 characters');
    });

    it('passes validation with empty email', () => {
      const formData: ProfileFormData = {
        name: 'John Coach',
        email: '',
      };
      const errors = validateProfileForm(formData);
      expect(errors.email).toBeUndefined();
    });
  });

  describe('optional fields validation', () => {
    it('passes validation with all optional fields empty', () => {
      const formData: ProfileFormData = {
        name: 'John Coach',
        email: 'coach@example.com',
        phone: '',
        specialization: '',
      };
      const errors = validateProfileForm(formData);
      expect(errors.phone).toBeUndefined();
      expect(errors.specialization).toBeUndefined();
    });

    it('returns error when phone exceeds 20 characters', () => {
      const formData: ProfileFormData = {
        name: 'John Coach',
        email: 'coach@example.com',
        phone: '1'.repeat(21),
      };
      const errors = validateProfileForm(formData);
      expect(errors.phone).toBe('Phone must not exceed 20 characters');
    });

    it('returns error when qualifications exceed 500 characters', () => {
      const formData: ProfileFormData = {
        name: 'John Coach',
        email: 'coach@example.com',
        qualifications: 'A'.repeat(501),
      };
      const errors = validateProfileForm(formData);
      expect(errors.qualifications).toBe('Qualifications must not exceed 500 characters');
    });

    it('returns error when bio exceeds 1000 characters', () => {
      const formData: ProfileFormData = {
        name: 'John Coach',
        email: 'coach@example.com',
        bio: 'A'.repeat(1001),
      };
      const errors = validateProfileForm(formData);
      expect(errors.bio).toBe('Bio must not exceed 1000 characters');
    });
  });

  describe('multiple errors', () => {
    it('returns multiple errors for invalid form', () => {
      const formData: ProfileFormData = {
        name: '',
        email: 'invalid-email',
        phone: '1'.repeat(25),
      };
      const errors = validateProfileForm(formData);
      expect(errors.name).toBeDefined();
      expect(errors.email).toBeDefined();
      expect(errors.phone).toBeDefined();
      expect(Object.keys(errors).length).toBe(3);
    });
  });
});

describe('validateExpenseForm', () => {
  describe('type field validation', () => {
    it('returns error when type is empty', () => {
      const formData: ExpenseFormData = {
        type: '',
        amount: 100,
        date: new Date(),
        description: 'Test expense',
      };
      const errors = validateExpenseForm(formData);
      expect(errors.type).toBe('Expense type is required');
    });

    it('passes validation with valid type', () => {
      const formData: ExpenseFormData = {
        type: 'SHUTTLE',
        amount: 100,
        date: new Date(),
        description: 'Test expense',
      };
      const errors = validateExpenseForm(formData);
      expect(errors.type).toBeUndefined();
    });
  });

  describe('amount field validation', () => {
    it('returns error when amount is 0', () => {
      const formData: ExpenseFormData = {
        type: 'SHUTTLE',
        amount: 0,
        date: new Date(),
        description: 'Test expense',
      };
      const errors = validateExpenseForm(formData);
      expect(errors.amount).toBe('Amount must be greater than 0');
    });

    it('returns error when amount is negative', () => {
      const formData: ExpenseFormData = {
        type: 'SHUTTLE',
        amount: -50,
        date: new Date(),
        description: 'Test expense',
      };
      const errors = validateExpenseForm(formData);
      expect(errors.amount).toBe('Amount must be greater than 0');
    });

    it('returns error when amount is empty', () => {
      const formData: ExpenseFormData = {
        type: 'SHUTTLE',
        amount: '',
        date: new Date(),
        description: 'Test expense',
      };
      const errors = validateExpenseForm(formData);
      expect(errors.amount).toBe('Amount must be greater than 0');
    });

    it('returns error when amount is NaN', () => {
      const formData: ExpenseFormData = {
        type: 'SHUTTLE',
        amount: 'invalid',
        date: new Date(),
        description: 'Test expense',
      };
      const errors = validateExpenseForm(formData);
      expect(errors.amount).toBe('Amount must be a valid number');
    });

    it('returns error when amount exceeds 999,999.99', () => {
      const formData: ExpenseFormData = {
        type: 'SHUTTLE',
        amount: 1000000,
        date: new Date(),
        description: 'Test expense',
      };
      const errors = validateExpenseForm(formData);
      expect(errors.amount).toBe('Amount must not exceed 999,999.99');
    });

    it('passes validation with valid decimal amount', () => {
      const formData: ExpenseFormData = {
        type: 'SHUTTLE',
        amount: 99.99,
        date: new Date(),
        description: 'Test expense',
      };
      const errors = validateExpenseForm(formData);
      expect(errors.amount).toBeUndefined();
    });

    it('passes validation with string amount', () => {
      const formData: ExpenseFormData = {
        type: 'SHUTTLE',
        amount: '150.50',
        date: new Date(),
        description: 'Test expense',
      };
      const errors = validateExpenseForm(formData);
      expect(errors.amount).toBeUndefined();
    });
  });

  describe('date field validation', () => {
    it('returns error when date is empty', () => {
      const formData: ExpenseFormData = {
        type: 'SHUTTLE',
        amount: 100,
        date: '',
        description: 'Test expense',
      };
      const errors = validateExpenseForm(formData);
      expect(errors.date).toBe('Date is required');
    });

    it('returns error when date is in the future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const formData: ExpenseFormData = {
        type: 'SHUTTLE',
        amount: 100,
        date: futureDate,
        description: 'Test expense',
      };
      const errors = validateExpenseForm(formData);
      expect(errors.date).toBe('Date cannot be in the future');
    });

    it('returns error for invalid date format', () => {
      const formData: ExpenseFormData = {
        type: 'SHUTTLE',
        amount: 100,
        date: 'invalid-date',
        description: 'Test expense',
      };
      const errors = validateExpenseForm(formData);
      expect(errors.date).toBe('Invalid date format');
    });

    it('passes validation with today date', () => {
      const today = new Date();
      const formData: ExpenseFormData = {
        type: 'SHUTTLE',
        amount: 100,
        date: today,
        description: 'Test expense',
      };
      const errors = validateExpenseForm(formData);
      expect(errors.date).toBeUndefined();
    });

    it('passes validation with past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const formData: ExpenseFormData = {
        type: 'SHUTTLE',
        amount: 100,
        date: pastDate,
        description: 'Test expense',
      };
      const errors = validateExpenseForm(formData);
      expect(errors.date).toBeUndefined();
    });

    it('passes validation with ISO date string', () => {
      const today = new Date().toISOString().split('T')[0];
      const formData: ExpenseFormData = {
        type: 'SHUTTLE',
        amount: 100,
        date: today,
        description: 'Test expense',
      };
      const errors = validateExpenseForm(formData);
      expect(errors.date).toBeUndefined();
    });
  });

  describe('description field validation', () => {
    it('returns error when description is empty', () => {
      const formData: ExpenseFormData = {
        type: 'SHUTTLE',
        amount: 100,
        date: new Date(),
        description: '',
      };
      const errors = validateExpenseForm(formData);
      expect(errors.description).toBe('Description is required');
    });

    it('returns error when description is only whitespace', () => {
      const formData: ExpenseFormData = {
        type: 'SHUTTLE',
        amount: 100,
        date: new Date(),
        description: '   ',
      };
      const errors = validateExpenseForm(formData);
      expect(errors.description).toBe('Description is required');
    });

    it('returns error when description exceeds 500 characters', () => {
      const formData: ExpenseFormData = {
        type: 'SHUTTLE',
        amount: 100,
        date: new Date(),
        description: 'A'.repeat(501),
      };
      const errors = validateExpenseForm(formData);
      expect(errors.description).toBe('Description must not exceed 500 characters');
    });

    it('passes validation with valid description', () => {
      const formData: ExpenseFormData = {
        type: 'SHUTTLE',
        amount: 100,
        date: new Date(),
        description: 'Shuttle service for practice',
      };
      const errors = validateExpenseForm(formData);
      expect(errors.description).toBeUndefined();
    });
  });

  describe('all expense types', () => {
    const validFormData: Omit<ExpenseFormData, 'type'> = {
      amount: 100,
      date: new Date(),
      description: 'Test',
    };

    it.each(['SHUTTLE', 'SUPPLIES', 'TRAVEL', 'OTHER'] as const)(
      'passes validation with type %s',
      (type) => {
        const formData: ExpenseFormData = {
          ...validFormData,
          type,
        };
        const errors = validateExpenseForm(formData);
        expect(errors.type).toBeUndefined();
      }
    );
  });

  describe('multiple errors', () => {
    it('returns multiple errors for invalid expense form', () => {
      const formData: ExpenseFormData = {
        type: '',
        amount: 0,
        date: '',
        description: '',
      };
      const errors = validateExpenseForm(formData);
      expect(errors.type).toBeDefined();
      expect(errors.amount).toBeDefined();
      expect(errors.date).toBeDefined();
      expect(errors.description).toBeDefined();
      expect(Object.keys(errors).length).toBe(4);
    });
  });
});

describe('Helper functions', () => {
  describe('isValidationPassed', () => {
    it('returns true when no errors', () => {
      const errors: ValidationErrors = {};
      expect(isValidationPassed(errors)).toBe(true);
    });

    it('returns false when errors exist', () => {
      const errors: ValidationErrors = { name: 'Required' };
      expect(isValidationPassed(errors)).toBe(false);
    });

    it('returns false with multiple errors', () => {
      const errors: ValidationErrors = {
        name: 'Required',
        email: 'Invalid format',
      };
      expect(isValidationPassed(errors)).toBe(false);
    });
  });

  describe('getFirstError', () => {
    it('returns empty string when no errors', () => {
      const errors: ValidationErrors = {};
      expect(getFirstError(errors)).toBe('');
    });

    it('returns first error message', () => {
      const errors: ValidationErrors = { name: 'Name is required' };
      expect(getFirstError(errors)).toBe('Name is required');
    });

    it('returns first error from multiple errors', () => {
      const errors: ValidationErrors = {
        name: 'Name is required',
        email: 'Invalid email',
      };
      const firstError = getFirstError(errors);
      expect(firstError).toBeDefined();
      expect(['Name is required', 'Invalid email']).toContain(firstError);
    });
  });
});
