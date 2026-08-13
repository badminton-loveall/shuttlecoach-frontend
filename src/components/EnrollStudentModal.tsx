import React, { useState } from 'react';
import type { Gender, SkillLevel } from '../types';
import './EnrollStudentModal.css';

interface EnrollStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (studentData: EnrollStudentFormData) => void | Promise<void>;
  batches: Array<{ id: string; name: string }>;
  coaches: Array<{ id: string; name: string }>;
  error?: string | null;
}

export interface EnrollStudentFormData {
  fullName: string;
  dateOfBirth: Date;
  gender: Gender;
  contactPhone: string;
  email?: string;
  guardianName?: string;
  guardianPhone?: string;
  baidNumber?: string;
  batchId: string;
  skillLevel: SkillLevel;
  assignedCoachId: string;
  monthlyFee?: number;
}

export const EnrollStudentModal: React.FC<EnrollStudentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  batches,
  error,
}) => {
  const [formData, setFormData] = useState<EnrollStudentFormData>({
    fullName: '',
    dateOfBirth: new Date(),
    gender: 'Male',
    contactPhone: '',
    email: '',
    guardianName: '',
    guardianPhone: '',
    baidNumber: '',
    batchId: '',
    skillLevel: 'Beginner',
    assignedCoachId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'contact' | 'guardian' | 'academy'>('basic');

  // Calculate age from date of birth
  const calculateAge = (dob: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const age = calculateAge(formData.dateOfBirth);
      if (age < 5) {
        newErrors.dateOfBirth = 'Student must be at least 5 years old';
      }
      if (age > 100) {
        newErrors.dateOfBirth = 'Please enter a valid date of birth';
      }
    }

    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'Contact phone is required';
    } else if (!/^\d{10}$/.test(formData.contactPhone.replace(/\D/g, ''))) {
      newErrors.contactPhone = 'Phone number must be 10 digits';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Guardian fields required only if student is under 18
    const age = calculateAge(formData.dateOfBirth);
    if (age < 18) {
      if (!formData.guardianName || !formData.guardianName.trim()) {
        newErrors.guardianName = 'Guardian name is required for students under 18';
      }

      if (!formData.guardianPhone || !formData.guardianPhone.trim()) {
        newErrors.guardianPhone = 'Guardian phone is required for students under 18';
      } else if (!/^\d{10}$/.test(formData.guardianPhone.replace(/\D/g, ''))) {
        newErrors.guardianPhone = 'Guardian phone must be 10 digits';
      }
    } else {
      // For adults, validate phone format only if provided
      if (formData.guardianPhone && formData.guardianPhone.trim() && !/^\d{10}$/.test(formData.guardianPhone.replace(/\D/g, ''))) {
        newErrors.guardianPhone = 'Guardian phone must be 10 digits';
      }
    }

    if (!formData.batchId) {
      newErrors.batchId = 'Please select a batch';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);

      // Reset form only on success
      setFormData({
        fullName: '',
        dateOfBirth: new Date(),
        gender: 'Male',
        contactPhone: '',
        email: '',
        guardianName: '',
        guardianPhone: '',
        baidNumber: '',
        batchId: '',
        skillLevel: 'Beginner',
        assignedCoachId: '',
      });
      setErrors({});
    } catch (error: unknown) {
      // Parse field-level validation errors from API response
      const apiError = error as { response?: { data?: { details?: Array<{ field: string; message: string }>, error?: string } } };
      const details = apiError?.response?.data?.details;
      if (details && Array.isArray(details)) {
        const fieldErrors: Record<string, string> = {};
        for (const detail of details) {
          fieldErrors[detail.field] = detail.message;
        }
        setErrors(fieldErrors);

        // Navigate to the tab containing the first error
        const errorFields = details.map(d => d.field);
        if (errorFields.some(f => f === 'fullName' || f === 'dateOfBirth' || f === 'gender')) {
          setActiveSection('basic');
        } else if (errorFields.some(f => f === 'contactPhone' || f === 'email')) {
          setActiveSection('contact');
        } else if (errorFields.some(f => f === 'guardianName' || f === 'guardianPhone')) {
          setActiveSection('guardian');
        } else if (errorFields.some(f => f === 'batchId' || f === 'assignedCoachId' || f === 'skillLevel')) {
          setActiveSection('academy');
        }
      } else {
        const message = apiError?.response?.data?.error || 'Failed to enroll student. Please try again.';
        setErrors({ submit: message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    setFormData({
      fullName: '',
      dateOfBirth: new Date(),
      gender: 'Male',
      contactPhone: '',
      email: '',
      guardianName: '',
      guardianPhone: '',
      baidNumber: '',
      batchId: '',
      skillLevel: 'Beginner',
      assignedCoachId: '',
    });
    setErrors({});
    setActiveSection('basic');
    onClose();
  };

  if (!isOpen) return null;

  // Section definitions for the left nav
  const sections = [
    {
      id: 'basic' as const,
      label: 'Basic Info',
      hasError: !!(errors.fullName || errors.dateOfBirth),
    },
    {
      id: 'contact' as const,
      label: 'Contact',
      hasError: !!(errors.contactPhone || errors.email),
    },
    {
      id: 'guardian' as const,
      label: 'Guardian',
      hasError: !!(errors.guardianName || errors.guardianPhone),
    },
    {
      id: 'academy' as const,
      label: 'Academy',
      hasError: !!(errors.batchId),
    },
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-content--large">
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Enroll New Student</h2>
            <p className="modal-subtitle">Add a new student to the academy and assign them to a coach</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* External API error (from parent) */}
          {error && (
            <div className="form-error-banner">{error}</div>
          )}
          {/* General form submission error */}
          {errors.submit && (
            <div className="form-error-banner">{errors.submit}</div>
          )}

          {/* Tabbed body: left nav + right content */}
          <div className="enroll-tabbed-body">
            {/* Left: section nav — table-row style, label only */}
            <nav className="enroll-section-nav">
              {sections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSection(s.id)}
                  className={`enroll-nav-item${activeSection === s.id ? ' enroll-nav-item--active' : ''}`}
                >
                  <span className="enroll-nav-label">{s.label}</span>
                  {s.hasError && <span className="enroll-nav-error-dot" aria-label="has errors" />}
                </button>
              ))}
            </nav>

            {/* Right: active section content — single column, no extra lines */}
            <div className="enroll-section-content">

              {activeSection === 'basic' && (
                <>
                  <div className="form-group">
                    <label htmlFor="fullName" className="form-label">Full Name *</label>
                    <input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className={`form-input ${errors.fullName ? 'form-input-error' : ''}`}
                      placeholder="John Doe"
                      disabled={isSubmitting}
                    />
                    {errors.fullName && <span className="form-error-text">{errors.fullName}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="dateOfBirth" className="form-label">Date of Birth *</label>
                    <input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth.toISOString().split('T')[0]}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: new Date(e.target.value) })}
                      className={`form-input ${errors.dateOfBirth ? 'form-input-error' : ''}`}
                      disabled={isSubmitting}
                    />
                    {errors.dateOfBirth && <span className="form-error-text">{errors.dateOfBirth}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="gender" className="form-label">Gender *</label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                      className="form-input"
                      disabled={isSubmitting}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="baidNumber" className="form-label">BAID Number <span className="form-optional">(optional)</span></label>
                    <input
                      id="baidNumber"
                      type="text"
                      value={formData.baidNumber || ''}
                      onChange={(e) => setFormData({ ...formData, baidNumber: e.target.value })}
                      className="form-input"
                      placeholder="BAD-XXXXXX"
                      disabled={isSubmitting}
                    />
                  </div>
                </>
              )}

              {activeSection === 'contact' && (
                <>
                  <div className="form-group">
                    <label htmlFor="contactPhone" className="form-label">Student Phone *</label>
                    <input
                      id="contactPhone"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className={`form-input ${errors.contactPhone ? 'form-input-error' : ''}`}
                      placeholder="9876543210"
                      disabled={isSubmitting}
                    />
                    {errors.contactPhone && <span className="form-error-text">{errors.contactPhone}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">Email <span className="form-optional">(optional)</span></label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                      placeholder="john@example.com"
                      disabled={isSubmitting}
                    />
                    {errors.email && <span className="form-error-text">{errors.email}</span>}
                  </div>
                </>
              )}

              {activeSection === 'guardian' && (
                <>
                  <div className="form-group">
                    <label htmlFor="guardianName" className="form-label">
                      Guardian Name {calculateAge(formData.dateOfBirth) < 18 ? '*' : <span className="form-optional">(optional)</span>}
                    </label>
                    <input
                      id="guardianName"
                      type="text"
                      value={formData.guardianName}
                      onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                      className={`form-input ${errors.guardianName ? 'form-input-error' : ''}`}
                      placeholder="Jane Doe"
                      disabled={isSubmitting}
                    />
                    {errors.guardianName && <span className="form-error-text">{errors.guardianName}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="guardianPhone" className="form-label">
                      Guardian Phone {calculateAge(formData.dateOfBirth) < 18 ? '*' : <span className="form-optional">(optional)</span>}
                    </label>
                    <input
                      id="guardianPhone"
                      type="tel"
                      value={formData.guardianPhone}
                      onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                      className={`form-input ${errors.guardianPhone ? 'form-input-error' : ''}`}
                      placeholder="9876543210"
                      disabled={isSubmitting}
                    />
                    {errors.guardianPhone && <span className="form-error-text">{errors.guardianPhone}</span>}
                  </div>
                </>
              )}

              {activeSection === 'academy' && (
                <>
                  <div className="form-group">
                    <label htmlFor="batchId" className="form-label">Batch *</label>
                    <select
                      id="batchId"
                      value={formData.batchId}
                      onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                      className={`form-input ${errors.batchId ? 'form-input-error' : ''}`}
                      disabled={isSubmitting}
                    >
                      <option value="">Select a batch</option>
                      {batches.map((batch) => (
                        <option key={batch.id} value={batch.id}>{batch.name}</option>
                      ))}
                    </select>
                    {errors.batchId && <span className="form-error-text">{errors.batchId}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="monthlyFee" className="form-label">Monthly Fee (₹)</label>
                    <input
                      id="monthlyFee"
                      type="number"
                      min="0"
                      value={formData.monthlyFee || ''}
                      onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value ? Number(e.target.value) : undefined })}
                      className="form-input"
                      placeholder="e.g. 3000"
                      disabled={isSubmitting}
                    />
                  </div>
                </>
              )}

            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enrolling...' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnrollStudentModal;
