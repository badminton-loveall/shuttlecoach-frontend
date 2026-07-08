import React, { useState, useEffect } from 'react';

/**
 * AddCoachModal Component
 * Modal dialog for adding a new assistant coach
 * Requirements: 15.3, 15.4, 15.5
 * 
 * Features:
 * - Form fields: name (required), username (required), password (required), specialization (optional), profilePhoto (optional)
 * - Validates required fields
 * - Submits form data to create new coach
 * - Closes modal on success or cancel
 */

export interface CoachFormData {
  name: string;
  username: string;
  password: string;
  email?: string;
  specialization?: string;
  profilePhoto?: string;
}

interface AddCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (coachData: CoachFormData) => Promise<void>;
}

export const AddCoachModal: React.FC<AddCoachModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [specialization, setSpecialization] = useState<string>('');
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setUsername('');
      setPassword('');
      setEmail('');
      setSpecialization('');
      setProfilePhoto('');
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

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
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.trim().length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const coachData: CoachFormData = {
        name: name.trim(),
        username: username.trim(),
        password: password.trim(),
        email: email.trim() || undefined,
        specialization: specialization.trim() || undefined,
        profilePhoto: profilePhoto.trim() || undefined,
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
    <div className="modal-overlay" onClick={handleCancel}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Add Assistant Coach</h2>
            <p className="modal-subtitle">Create a new assistant coach account</p>
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
              <label htmlFor="coach-username" className="form-label">Username <span className="form-required">*</span></label>
              <input type="text" id="coach-username" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="Login username (min 3 characters)"
                className={`form-input ${errors.username ? 'form-input-error' : ''}`} disabled={isSubmitting} />
              {errors.username && <span className="form-error-text">{errors.username}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="coach-password" className="form-label">Password <span className="form-required">*</span></label>
              <input type="password" id="coach-password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className={`form-input ${errors.password ? 'form-input-error' : ''}`} disabled={isSubmitting} />
              {errors.password && <span className="form-error-text">{errors.password}</span>}
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
              {isSubmitting ? 'Adding...' : 'Add Coach'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCoachModal;
