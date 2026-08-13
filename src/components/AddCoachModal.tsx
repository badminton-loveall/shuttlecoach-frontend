import React, { useState, useEffect } from 'react';
import type { User } from '../types';

/**
 * AddCoachModal Component
 * Modal dialog for adding a new coach (head coach or assistant coach)
 * Requirements: 1.1, 1.3, 15.3, 15.4, 15.5
 * 
 * Features:
 * - Form fields: name (required), username (required), password (required), specialization (optional), profilePhoto (optional), seniorCoachId (optional)
 * - Validates required fields
 * - Submits form data to create new coach
 * - Closes modal on success or cancel
 */

export interface CoachFormData {
  name: string;
  username: string;
  password?: string;
  email?: string;
  specialization?: string;
  profilePhoto?: string;
  seniorCoachId?: string;
}

interface AddCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (coachData: CoachFormData) => Promise<void>;
  coaches?: User[];
}

export const AddCoachModal: React.FC<AddCoachModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  coaches = [],
}) => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [specialization, setSpecialization] = useState<string>('');
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [seniorCoachId, setSeniorCoachId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setSpecialization('');
      setProfilePhoto('');
      setSeniorCoachId('');
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const coachData: CoachFormData = {
        name: name.trim(),
        username: email.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        specialization: specialization.trim() || undefined,
        profilePhoto: profilePhoto.trim() || undefined,
        seniorCoachId: seniorCoachId || undefined,
      };

      await onSubmit(coachData);
      onClose();
    } catch (error) {
      console.error('Error submitting coach data:', error);
      setErrors({ submit: 'Failed to add coach. Please try again.' });
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Add Coach</h2>
            <p className="modal-subtitle">Create a new coach account</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={handleCancel} disabled={isSubmitting}>✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-form-body">
            {errors.submit && <div className="form-error-banner">{errors.submit}</div>}

            <div className="form-group">
              <label htmlFor="coach-name" className="form-label">Name <span className="form-required">*</span></label>
              <input type="text" id="coach-name" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className={`form-input ${errors.name ? 'form-input-error' : ''}`} disabled={isSubmitting} />
              {errors.name && <span className="form-error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="coach-email" className="form-label">Email <span className="form-required">*</span></label>
              <input type="email" id="coach-email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="coach@example.com"
                className={`form-input ${errors.email ? 'form-input-error' : ''}`} disabled={isSubmitting} />
              <span className="form-hint">This will be used as the login username</span>
              {errors.email && <span className="form-error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="coach-specialization" className="form-label">Specialization <span className="form-optional">(optional)</span></label>
              <input type="text" id="coach-specialization" value={specialization} onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g., Doubles Training, Footwork & Movement"
                className="form-input" disabled={isSubmitting} />
            </div>

            <div className="form-group">
              <label htmlFor="coach-photo" className="form-label">Profile Photo URL <span className="form-optional">(optional)</span></label>
              <input type="text" id="coach-photo" value={profilePhoto} onChange={(e) => setProfilePhoto(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="form-input" disabled={isSubmitting} />
            </div>

            <div className="form-group">
              <label htmlFor="coach-senior" className="form-label">Senior Coach <span className="form-optional">(optional)</span></label>
              <select
                id="coach-senior"
                value={seniorCoachId}
                onChange={(e) => setSeniorCoachId(e.target.value)}
                className="form-input"
                disabled={isSubmitting}
              >
                <option value="">— None (Top-level coach) —</option>
                {[...coaches].sort((a, b) => a.name.localeCompare(b.name)).map(coach => (
                  <option key={coach.id} value={coach.id}>{coach.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Coach'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCoachModal;
