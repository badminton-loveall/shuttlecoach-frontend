import React, { useState } from 'react';
import type { Gender, SkillLevel } from '../types';
import './EnrollStudentModal.css';

interface EnrollStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (studentData: EnrollStudentFormData) => void;
  batches: Array<{ id: string; name: string }>;
  coaches: Array<{ id: string; name: string }>;
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
}

export const EnrollStudentModal: React.FC<EnrollStudentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  batches,
  coaches,
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

    if (!formData.guardianName || !formData.guardianName.trim()) {
      newErrors.guardianName = 'Guardian name is required';
    }

    if (!formData.guardianPhone || !formData.guardianPhone.trim()) {
      newErrors.guardianPhone = 'Guardian phone is required';
    } else if (formData.guardianPhone && !/^\d{10}$/.test(formData.guardianPhone.replace(/\D/g, ''))) {
      newErrors.guardianPhone = 'Guardian phone must be 10 digits';
    }

    if (!formData.batchId) {
      newErrors.batchId = 'Please select a batch';
    }

    if (!formData.assignedCoachId) {
      newErrors.assignedCoachId = 'Please assign a coach';
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
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      onSubmit(formData);

      // Reset form
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
    } catch (error) {
      setErrors({ submit: 'Failed to enroll student. Please try again.' });
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content modal-content--large" onClick={(e) => e.stopPropagation()}>
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
          {/* General error */}
          {errors.submit && (
            <div className="form-error-banner">{errors.submit}</div>
          )}

          {/* Basic Information Section */}
          <div className="form-section">
            <div className="form-section-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
              </svg>
              <h3 className="form-section-title">Basic Information</h3>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fullName" className="form-label">
                  Full Name *
                </label>
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
                <label htmlFor="dateOfBirth" className="form-label">
                  Date of Birth *
                </label>
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
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender" className="form-label">
                  Gender *
                </label>
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
                <label htmlFor="baidNumber" className="form-label">
                  BAID Number (optional)
                </label>
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
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="form-section">
            <div className="form-section-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <h3 className="form-section-title">Contact Information</h3>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contactPhone" className="form-label">
                  Student Phone *
                </label>
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
                <label htmlFor="email" className="form-label">
                  Email (optional)
                </label>
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
            </div>
          </div>

          {/* Guardian Information Section */}
          <div className="form-section">
            <div className="form-section-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M16 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM9 7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
              </svg>
              <h3 className="form-section-title">Guardian Information</h3>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="guardianName" className="form-label">
                  Guardian Name *
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
                  Guardian Phone *
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
            </div>
          </div>

          {/* Academy Information Section */}
          <div className="form-section">
            <div className="form-section-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6m0 0v6m0-6H2m0 0v6m0-6V10m0 0l10-7 10 7" />
              </svg>
              <h3 className="form-section-title">Academy Information</h3>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="batchId" className="form-label">
                  Batch *
                </label>
                <select
                  id="batchId"
                  value={formData.batchId}
                  onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                  className={`form-input ${errors.batchId ? 'form-input-error' : ''}`}
                  disabled={isSubmitting}
                >
                  <option value="">Select a batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
                {errors.batchId && <span className="form-error-text">{errors.batchId}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="skillLevel" className="form-label">
                  Initial Skill Level *
                </label>
                <select
                  id="skillLevel"
                  value={formData.skillLevel}
                  onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value as SkillLevel })}
                  className="form-input"
                  disabled={isSubmitting}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Professional">Professional</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="assignedCoachId" className="form-label">
                Assign Coach *
              </label>
              <select
                id="assignedCoachId"
                value={formData.assignedCoachId}
                onChange={(e) => setFormData({ ...formData, assignedCoachId: e.target.value })}
                className={`form-input ${errors.assignedCoachId ? 'form-input-error' : ''}`}
                disabled={isSubmitting}
              >
                <option value="">Select a coach</option>
                {coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.name}
                  </option>
                ))}
              </select>
              {errors.assignedCoachId && <span className="form-error-text">{errors.assignedCoachId}</span>}
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
