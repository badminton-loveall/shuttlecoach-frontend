import React, { useState, useEffect } from 'react';
import type { User } from '../types';

/**
 * EditCoachModal Component
 * Modal dialog for editing an existing assistant coach
 * 
 * Features:
 * - Form fields: name (required), username (required), email (optional), specialization (optional), profilePhoto (optional)
 * - Pre-fills form with existing coach data
 * - Validates required fields
 * - Submits updated coach data
 * - Closes modal on success or cancel
 */

export interface EditCoachFormData {
  name: string;
  username: string;
  email?: string;
  specialization?: string;
  profilePhoto?: string;
}

interface EditCoachModalProps {
  isOpen: boolean;
  coach: User | null;
  onClose: () => void;
  onSubmit: (coachId: string, coachData: EditCoachFormData) => Promise<void>;
}

export const EditCoachModal: React.FC<EditCoachModalProps> = ({
  isOpen,
  coach,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [specialization, setSpecialization] = useState<string>('');
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens with coach data
  useEffect(() => {
    if (isOpen && coach) {
      setName(coach.name || '');
      setUsername(coach.username || '');
      setEmail(coach.email || '');
      setSpecialization(coach.specialization || '');
      setProfilePhoto(coach.profilePhoto || '');
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, coach]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Optional email validation - only validate if provided
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !coach) {
      return;
    }

    setIsSubmitting(true);

    try {
      const coachData: EditCoachFormData = {
        name: name.trim(),
        username: username.trim(),
        email: email.trim() || undefined,
        specialization: specialization.trim() || undefined,
        profilePhoto: profilePhoto.trim() || undefined,
      };

      await onSubmit(coach.id, coachData);
      onClose();
    } catch (error) {
      console.error('Error updating coach data:', error);
      setErrors({ submit: 'Failed to update coach. Please try again.' });
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen || !coach) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Edit Assistant Coach</h2>
            <p className="modal-subtitle">Update coach information for {coach.name}</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={handleCancel} disabled={isSubmitting}>✕</button>
        </div>

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
              <label htmlFor="coach-username" className="form-label">Username <span className="form-required">*</span></label>
              <input type="text" id="coach-username" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="Login username (min 3 characters)"
                className={`form-input ${errors.username ? 'form-input-error' : ''}`} disabled={isSubmitting} />
              {errors.username && <span className="form-error-text">{errors.username}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="coach-email" className="form-label">Email <span className="form-optional">(optional)</span></label>
              <input type="text" id="coach-email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className={`form-input ${errors.email ? 'form-input-error' : ''}`} disabled={isSubmitting} />
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
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Coach'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCoachModal;
