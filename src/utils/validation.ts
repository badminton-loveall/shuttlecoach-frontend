/**
 * Validation utility functions for Coach Detail Page forms
 * Validates profile and expense forms with field-specific error messages
 */

/**
 * Validation errors object - maps field names to error messages
 */
export interface ValidationErrors {
  [field: string]: string;
}

/**
 * Profile form data interface
 */
export interface ProfileFormData {
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  qualifications?: string;
  certifications?: string;
  bio?: string;
}

/**
 * Expense form data interface
 */
export interface ExpenseFormData {
  type: 'SHUTTLE' | 'SUPPLIES' | 'TRAVEL' | 'OTHER' | '';
  amount: number | string;
  date: string | Date;
  description: string;
}

/**
 * Validates profile form data
 * Checks:
 * - Name is required and not empty
 * - Email format is valid
 * - Field lengths are within acceptable ranges
 *
 * @param formData - Profile form data to validate
 * @returns Object containing field-specific error messages (empty if valid)
 *
 * Validates: Requirement 21.1 (form validation), 3.5 (validation errors)
 */
export const validateProfileForm = (formData: ProfileFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Name validation - required field
  if (!formData.name || formData.name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  } else if (formData.name.length > 100) {
    errors.name = 'Name must not exceed 100 characters';
  }

  // Email validation - format check
  if (formData.email && formData.email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Invalid email format';
    } else if (formData.email.length > 255) {
      errors.email = 'Email must not exceed 255 characters';
    }
  }

  // Phone validation - optional field with length check
  if (formData.phone && formData.phone.trim().length > 0) {
    if (formData.phone.length > 20) {
      errors.phone = 'Phone must not exceed 20 characters';
    }
  }

  // Specialization validation - optional field with length check
  if (formData.specialization && formData.specialization.trim().length > 0) {
    if (formData.specialization.length > 100) {
      errors.specialization = 'Specialization must not exceed 100 characters';
    }
  }

  // Qualifications validation - optional field with length check
  if (formData.qualifications && formData.qualifications.trim().length > 0) {
    if (formData.qualifications.length > 500) {
      errors.qualifications = 'Qualifications must not exceed 500 characters';
    }
  }

  // Certifications validation - optional field with length check
  if (formData.certifications && formData.certifications.trim().length > 0) {
    if (formData.certifications.length > 500) {
      errors.certifications = 'Certifications must not exceed 500 characters';
    }
  }

  // Bio validation - optional field with length check
  if (formData.bio && formData.bio.trim().length > 0) {
    if (formData.bio.length > 1000) {
      errors.bio = 'Bio must not exceed 1000 characters';
    }
  }

  return errors;
};

/**
 * Validates expense form data
 * Checks:
 * - Amount is greater than 0
 * - Date is not in the future (must be today or earlier)
 * - Description is not empty
 * - Expense type is selected
 *
 * @param formData - Expense form data to validate
 * @returns Object containing field-specific error messages (empty if valid)
 *
 * Validates: Requirement 14.4 (expense validation), 3.5 (validation errors)
 */
export const validateExpenseForm = (formData: ExpenseFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Type validation - must be selected
  if (!formData.type || formData.type.trim().length === 0) {
    errors.type = 'Expense type is required';
  }

  // Amount validation - must be greater than 0
  const amount = typeof formData.amount === 'string' ? parseFloat(formData.amount) : formData.amount;
  if (!formData.amount || amount <= 0) {
    errors.amount = 'Amount must be greater than 0';
  } else if (isNaN(amount)) {
    errors.amount = 'Amount must be a valid number';
  } else if (amount > 999999.99) {
    errors.amount = 'Amount must not exceed 999,999.99';
  }

  // Date validation - must not be in the future
  if (!formData.date) {
    errors.date = 'Date is required';
  } else {
    const expenseDate = new Date(formData.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today

    if (isNaN(expenseDate.getTime())) {
      errors.date = 'Invalid date format';
    } else if (expenseDate > today) {
      errors.date = 'Date cannot be in the future';
    }
  }

  // Description validation - must not be empty
  if (!formData.description || formData.description.trim().length === 0) {
    errors.description = 'Description is required';
  } else if (formData.description.length > 500) {
    errors.description = 'Description must not exceed 500 characters';
  }

  return errors;
};

/**
 * Helper function to check if validation passed (no errors)
 * @param errors - Validation errors object
 * @returns True if no errors, false otherwise
 */
export const isValidationPassed = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length === 0;
};

/**
 * Helper function to get first error message
 * @param errors - Validation errors object
 * @returns First error message or empty string if no errors
 */
export const getFirstError = (errors: ValidationErrors): string => {
  const errorKeys = Object.keys(errors);
  return errorKeys.length > 0 ? errors[errorKeys[0]] : '';
};
