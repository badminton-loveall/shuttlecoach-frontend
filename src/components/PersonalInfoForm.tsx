import React, { useState, useMemo, useCallback } from 'react';
import type { Student, Gender } from '../types';
import { calculateAge, calculateBMI } from '../utils/studentUtils';
import './PersonalInfoForm.css';

/**
 * PersonalInfoForm
 * Displays and allows editing of student personal information.
 * Includes required fields (full name, DOB, gender, contact phone)
 * and optional fields (email, BAID, batch, photo, guardian info, blood group,
 * medical conditions, emergency contact, height, weight).
 * Computes age from DOB and BMI from height/weight automatically.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

export interface PersonalInfoFormProps {
  student: Student;
  isEditing?: boolean;
  onSave?: (updatedStudent: Partial<Student>) => void;
  onCancel?: () => void;
}

interface FormData {
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  contactPhone: string;
  email: string;
  guardianName: string;
  guardianPhone: string;
  baidNumber: string;
  batchId: string;
  height: string;
  weight: string;
  bloodGroup: string;
  medicalConditions: string;
  emergencyContact: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const formatDateForInput = (date: Date): string => {
  if (!date || isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const validatePhone = (phone: string): boolean => {
  if (!phone) return true;
  const phoneRegex = /^\+?[\d\s-]{10,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

const validateEmail = (email: string): boolean => {
  if (!email) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  // DOB cannot be in the future
  return date <= new Date();
};

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  student,
  isEditing = false,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<FormData>({
    fullName: student.fullName || '',
    dateOfBirth: formatDateForInput(student.dateOfBirth),
    gender: student.gender || 'Male',
    contactPhone: student.contactPhone || '',
    email: student.email || '',
    guardianName: student.guardianName || '',
    guardianPhone: student.guardianPhone || '',
    baidNumber: student.baidNumber || '',
    batchId: student.batchId || '',
    height: student.height ? String(student.height) : '',
    weight: student.weight ? String(student.weight) : '',
    bloodGroup: student.bloodGroup || '',
    medicalConditions: student.medicalConditions || '',
    emergencyContact: student.emergencyContact || '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Compute age from DOB
  const computedAge = useMemo(() => {
    if (!formData.dateOfBirth) return null;
    const dob = new Date(formData.dateOfBirth);
    if (isNaN(dob.getTime())) return null;
    return calculateAge(dob);
  }, [formData.dateOfBirth]);

  // Compute BMI from height and weight
  const computedBMI = useMemo(() => {
    const height = parseFloat(formData.height);
    const weight = parseFloat(formData.weight);
    if (!height || !weight || height <= 0 || weight <= 0) return null;
    return calculateBMI(height, weight);
  }, [formData.height, formData.weight]);

  // Whether guardian fields are required (student under 18)
  const isUnder18 = useMemo(() => {
    return computedAge !== null && computedAge < 18;
  }, [computedAge]);

  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};

    // Required field validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else if (!validateDate(formData.dateOfBirth)) {
      newErrors.dateOfBirth = 'Invalid date or future date';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'Contact phone is required';
    } else if (!validatePhone(formData.contactPhone)) {
      newErrors.contactPhone = 'Invalid phone format (10-15 digits)';
    }

    // Guardian fields required if under 18
    if (isUnder18) {
      if (!formData.guardianName.trim()) {
        newErrors.guardianName = 'Guardian name is required for students under 18';
      }
      if (!formData.guardianPhone.trim()) {
        newErrors.guardianPhone = 'Guardian phone is required for students under 18';
      } else if (!validatePhone(formData.guardianPhone)) {
        newErrors.guardianPhone = 'Invalid phone format (10-15 digits)';
      }
    }

    // Optional field validation
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.guardianPhone && !isUnder18 && !validatePhone(formData.guardianPhone)) {
      newErrors.guardianPhone = 'Invalid phone format (10-15 digits)';
    }

    return newErrors;
  }, [formData, isUnder18]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (onSave) {
      const updatedData: Partial<Student> = {
        fullName: formData.fullName.trim(),
        dateOfBirth: new Date(formData.dateOfBirth),
        gender: formData.gender,
        contactPhone: formData.contactPhone.trim(),
        email: formData.email.trim() || undefined,
        guardianName: formData.guardianName.trim() || undefined,
        guardianPhone: formData.guardianPhone.trim() || undefined,
        baidNumber: formData.baidNumber.trim() || undefined,
        batchId: formData.batchId.trim() || undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        bloodGroup: formData.bloodGroup || undefined,
        medicalConditions: formData.medicalConditions.trim() || undefined,
        emergencyContact: formData.emergencyContact.trim() || undefined,
      };
      onSave(updatedData);
    }
  };

  // Read-only display mode
  if (!isEditing) {
    return (
      <div className="personal-info-form" data-testid="personal-info-form">
        <h2 className="form-section-title">Personal Information</h2>

        <div className="form-grid">
          <div className="form-field">
            <span className="field-label">Full Name</span>
            <span className="field-value">{student.fullName}</span>
          </div>

          <div className="form-field">
            <span className="field-label">Date of Birth</span>
            <span className="field-value">{student.dateOfBirth.toLocaleDateString()}</span>
          </div>

          <div className="form-field">
            <span className="field-label">Age</span>
            <span className="field-value computed-value" data-testid="computed-age">
              {calculateAge(student.dateOfBirth)} years
            </span>
          </div>

          <div className="form-field">
            <span className="field-label">Gender</span>
            <span className="field-value">{student.gender}</span>
          </div>

          <div className="form-field">
            <span className="field-label">Contact Phone</span>
            <span className="field-value">{student.contactPhone}</span>
          </div>

          {student.email && (
            <div className="form-field">
              <span className="field-label">Email</span>
              <span className="field-value">{student.email}</span>
            </div>
          )}

          {student.baidNumber && (
            <div className="form-field">
              <span className="field-label">BAID Number</span>
              <span className="field-value">{student.baidNumber}</span>
            </div>
          )}

          {student.batchId && (
            <div className="form-field">
              <span className="field-label">Batch</span>
              <span className="field-value">{student.batchId}</span>
            </div>
          )}

          {student.guardianName && (
            <div className="form-field">
              <span className="field-label">Guardian Name</span>
              <span className="field-value">{student.guardianName}</span>
            </div>
          )}

          {student.guardianPhone && (
            <div className="form-field">
              <span className="field-label">Guardian Phone</span>
              <span className="field-value">{student.guardianPhone}</span>
            </div>
          )}

          {student.height && (
            <div className="form-field">
              <span className="field-label">Height</span>
              <span className="field-value">{student.height} cm</span>
            </div>
          )}

          {student.weight && (
            <div className="form-field">
              <span className="field-label">Weight</span>
              <span className="field-value">{student.weight} kg</span>
            </div>
          )}

          {student.height && student.weight && (
            <div className="form-field">
              <span className="field-label">BMI</span>
              <span className="field-value computed-value" data-testid="computed-bmi">
                {calculateBMI(student.height!, student.weight!)}
              </span>
            </div>
          )}

          {student.bloodGroup && (
            <div className="form-field">
              <span className="field-label">Blood Group</span>
              <span className="field-value">{student.bloodGroup}</span>
            </div>
          )}

          {student.medicalConditions && (
            <div className="form-field form-field-full">
              <span className="field-label">Medical Conditions</span>
              <span className="field-value">{student.medicalConditions}</span>
            </div>
          )}

          {student.emergencyContact && (
            <div className="form-field">
              <span className="field-label">Emergency Contact</span>
              <span className="field-value">{student.emergencyContact}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Editing mode
  return (
    <form
      className="personal-info-form personal-info-form-editing"
      onSubmit={handleSubmit}
      data-testid="personal-info-form"
      noValidate
    >
      <h2 className="form-section-title">Personal Information</h2>

      {/* Required Fields Section */}
      <fieldset className="form-fieldset">
        <legend className="form-legend">Required Information</legend>
        <div className="form-grid">
          <div className={`form-field ${errors.fullName ? 'form-field-error' : ''}`}>
            <label className="field-label" htmlFor="fullName">
              Full Name <span className="required-marker">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              className="field-input"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Enter full name"
              required
              aria-required="true"
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            />
            {errors.fullName && (
              <span className="field-error" id="fullName-error" role="alert">
                {errors.fullName}
              </span>
            )}
          </div>

          <div className={`form-field ${errors.dateOfBirth ? 'form-field-error' : ''}`}>
            <label className="field-label" htmlFor="dateOfBirth">
              Date of Birth <span className="required-marker">*</span>
            </label>
            <input
              id="dateOfBirth"
              type="date"
              className="field-input"
              value={formData.dateOfBirth}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              required
              aria-required="true"
              aria-invalid={!!errors.dateOfBirth}
              aria-describedby={errors.dateOfBirth ? 'dateOfBirth-error' : undefined}
            />
            {errors.dateOfBirth && (
              <span className="field-error" id="dateOfBirth-error" role="alert">
                {errors.dateOfBirth}
              </span>
            )}
            {computedAge !== null && (
              <span className="field-computed" data-testid="computed-age">
                Age: {computedAge} years
              </span>
            )}
          </div>

          <div className={`form-field ${errors.gender ? 'form-field-error' : ''}`}>
            <label className="field-label" htmlFor="gender">
              Gender <span className="required-marker">*</span>
            </label>
            <select
              id="gender"
              className="field-input field-select"
              value={formData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              required
              aria-required="true"
              aria-invalid={!!errors.gender}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && (
              <span className="field-error" role="alert">
                {errors.gender}
              </span>
            )}
          </div>

          <div className={`form-field ${errors.contactPhone ? 'form-field-error' : ''}`}>
            <label className="field-label" htmlFor="contactPhone">
              Contact Phone <span className="required-marker">*</span>
            </label>
            <input
              id="contactPhone"
              type="tel"
              className="field-input"
              value={formData.contactPhone}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              placeholder="Enter phone number"
              required
              aria-required="true"
              aria-invalid={!!errors.contactPhone}
              aria-describedby={errors.contactPhone ? 'contactPhone-error' : undefined}
            />
            {errors.contactPhone && (
              <span className="field-error" id="contactPhone-error" role="alert">
                {errors.contactPhone}
              </span>
            )}
          </div>
        </div>
      </fieldset>

      {/* Guardian Fields (required if under 18) */}
      {isUnder18 && (
        <fieldset className="form-fieldset">
          <legend className="form-legend">
            Guardian Information <span className="required-note">(required — student is under 18)</span>
          </legend>
          <div className="form-grid">
            <div className={`form-field ${errors.guardianName ? 'form-field-error' : ''}`}>
              <label className="field-label" htmlFor="guardianName">
                Guardian Name <span className="required-marker">*</span>
              </label>
              <input
                id="guardianName"
                type="text"
                className="field-input"
                value={formData.guardianName}
                onChange={(e) => handleChange('guardianName', e.target.value)}
                placeholder="Enter guardian name"
                required
                aria-required="true"
                aria-invalid={!!errors.guardianName}
                aria-describedby={errors.guardianName ? 'guardianName-error' : undefined}
              />
              {errors.guardianName && (
                <span className="field-error" id="guardianName-error" role="alert">
                  {errors.guardianName}
                </span>
              )}
            </div>

            <div className={`form-field ${errors.guardianPhone ? 'form-field-error' : ''}`}>
              <label className="field-label" htmlFor="guardianPhone">
                Guardian Phone <span className="required-marker">*</span>
              </label>
              <input
                id="guardianPhone"
                type="tel"
                className="field-input"
                value={formData.guardianPhone}
                onChange={(e) => handleChange('guardianPhone', e.target.value)}
                placeholder="Enter guardian phone"
                required
                aria-required="true"
                aria-invalid={!!errors.guardianPhone}
                aria-describedby={errors.guardianPhone ? 'guardianPhone-error' : undefined}
              />
              {errors.guardianPhone && (
                <span className="field-error" id="guardianPhone-error" role="alert">
                  {errors.guardianPhone}
                </span>
              )}
            </div>
          </div>
        </fieldset>
      )}

      {/* Optional Fields Section */}
      <fieldset className="form-fieldset">
        <legend className="form-legend">Optional Information</legend>
        <div className="form-grid">
          <div className={`form-field ${errors.email ? 'form-field-error' : ''}`}>
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="field-input"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Enter email address"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <span className="field-error" id="email-error" role="alert">
                {errors.email}
              </span>
            )}
          </div>

          <div className="form-field">
            <label className="field-label" htmlFor="baidNumber">
              BAID Number
            </label>
            <input
              id="baidNumber"
              type="text"
              className="field-input"
              value={formData.baidNumber}
              onChange={(e) => handleChange('baidNumber', e.target.value)}
              placeholder="Enter BAID registration number"
            />
          </div>

          <div className="form-field">
            <label className="field-label" htmlFor="batchId">
              Batch
            </label>
            <input
              id="batchId"
              type="text"
              className="field-input"
              value={formData.batchId}
              onChange={(e) => handleChange('batchId', e.target.value)}
              placeholder="Enter batch ID"
            />
          </div>

          <div className="form-field">
            <label className="field-label" htmlFor="bloodGroup">
              Blood Group
            </label>
            <select
              id="bloodGroup"
              className="field-input field-select"
              value={formData.bloodGroup}
              onChange={(e) => handleChange('bloodGroup', e.target.value)}
            >
              <option value="">Select blood group</option>
              {BLOOD_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="field-label" htmlFor="height">
              Height (cm)
            </label>
            <input
              id="height"
              type="number"
              className="field-input"
              value={formData.height}
              onChange={(e) => handleChange('height', e.target.value)}
              placeholder="Enter height in cm"
              min="50"
              max="250"
            />
          </div>

          <div className="form-field">
            <label className="field-label" htmlFor="weight">
              Weight (kg)
            </label>
            <input
              id="weight"
              type="number"
              className="field-input"
              value={formData.weight}
              onChange={(e) => handleChange('weight', e.target.value)}
              placeholder="Enter weight in kg"
              min="10"
              max="200"
            />
          </div>

          {computedBMI !== null && (
            <div className="form-field">
              <span className="field-label">BMI (computed)</span>
              <span className="field-computed-display" data-testid="computed-bmi">
                {computedBMI}
              </span>
            </div>
          )}

          <div className="form-field">
            <label className="field-label" htmlFor="emergencyContact">
              Emergency Contact
            </label>
            <input
              id="emergencyContact"
              type="tel"
              className="field-input"
              value={formData.emergencyContact}
              onChange={(e) => handleChange('emergencyContact', e.target.value)}
              placeholder="Enter emergency contact number"
            />
          </div>

          {!isUnder18 && (
            <>
              <div className="form-field">
                <label className="field-label" htmlFor="guardianNameOpt">
                  Guardian Name
                </label>
                <input
                  id="guardianNameOpt"
                  type="text"
                  className="field-input"
                  value={formData.guardianName}
                  onChange={(e) => handleChange('guardianName', e.target.value)}
                  placeholder="Enter guardian name"
                />
              </div>

              <div className={`form-field ${errors.guardianPhone ? 'form-field-error' : ''}`}>
                <label className="field-label" htmlFor="guardianPhoneOpt">
                  Guardian Phone
                </label>
                <input
                  id="guardianPhoneOpt"
                  type="tel"
                  className="field-input"
                  value={formData.guardianPhone}
                  onChange={(e) => handleChange('guardianPhone', e.target.value)}
                  placeholder="Enter guardian phone"
                  aria-invalid={!!errors.guardianPhone}
                  aria-describedby={errors.guardianPhone ? 'guardianPhoneOpt-error' : undefined}
                />
                {errors.guardianPhone && (
                  <span className="field-error" id="guardianPhoneOpt-error" role="alert">
                    {errors.guardianPhone}
                  </span>
                )}
              </div>
            </>
          )}

          <div className="form-field form-field-full">
            <label className="field-label" htmlFor="medicalConditions">
              Medical Conditions
            </label>
            <textarea
              id="medicalConditions"
              className="field-input field-textarea"
              value={formData.medicalConditions}
              onChange={(e) => handleChange('medicalConditions', e.target.value)}
              placeholder="Enter any medical conditions or allergies"
              rows={3}
            />
          </div>
        </div>
      </fieldset>

      {/* Form Actions */}
      <div className="form-actions">
        <button type="submit" className="form-btn form-btn-save">
          Save Changes
        </button>
        {onCancel && (
          <button type="button" className="form-btn form-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default PersonalInfoForm;
