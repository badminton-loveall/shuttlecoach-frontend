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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Edit Assistant Coach
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Update coach information for {coach.name}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4">
              {/* Submit Error */}
              {errors.submit && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">{errors.submit}</p>
                </div>
              )}

              {/* Name */}
              <div>
                <label htmlFor="coach-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="coach-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                    errors.name
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Username */}
              <div>
                <label htmlFor="coach-username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="coach-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Login username (min 3 characters)"
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                    errors.username
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="coach-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                  <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="coach-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                    errors.email
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Specialization */}
              <div>
                <label htmlFor="coach-specialization" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Specialization
                  <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="coach-specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g., Doubles Training, Footwork & Movement"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>

              {/* Profile Photo */}
              <div>
                <label htmlFor="coach-photo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile Photo URL
                  <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="coach-photo"
                  value={profilePhoto}
                  onChange={(e) => setProfilePhoto(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-gray-900 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Update Coach'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditCoachModal;
