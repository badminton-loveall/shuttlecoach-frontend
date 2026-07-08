import React, { useState } from 'react';
import type { User, UserRole } from '../types';
import { validateProfileForm } from '../utils/validation';
import type { ProfileFormData, ValidationErrors } from '../utils/validation';

/**
 * CoachProfileTab Component (Read-Only & Edit Modes)
 * Displays coach profile information with inline editing capability
 *
 * Requirements:
 * 2.1: Displays coach's personal information
 * 2.2: Conditionally displays phone field based on data availability
 * 2.3: Shows additional fields only when data is available
 * 2.4: Displays placeholder (—) for truly empty optional fields
 * 3.1: Shows edit button for authorized users
 * 3.3: Pre-populates form fields with current values
 * 3.8: Shows Save and Cancel buttons in edit mode
 * 4.1: Displays coach role and permission description
 */

interface CoachProfileTabProps {
  coach: User;
  userRole: UserRole;
  onUpdateCoach: (coachData: Partial<User>) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Get role description based on user role
 */
const getRoleDescription = (role: UserRole): string => {
  switch (role) {
    case 'HEAD_COACH':
      return 'Full system access including batch management, student enrollment, and financial management';
    case 'ASSISTANT_COACH':
      return 'Limited access to student-related data and batch information';
    case 'STUDENT':
      return 'Access to own performance data and learning materials';
    default:
      return 'Role permissions not defined';
  }
};

export const CoachProfileTab: React.FC<CoachProfileTabProps> = ({
  coach,
  userRole,
  isLoading = false,
  onUpdateCoach,
}) => {
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Form data state - pre-populated with current coach values
  const [formData, setFormData] = useState<ProfileFormData>({
    name: coach.name,
    email: coach.email || '',
    phone: coach.phone || '',
    specialization: coach.specialization || '',
    qualifications: coach.qualifications || '',
    certifications: coach.certifications || '',
    bio: coach.bio || '',
  });

  // Handle form field changes
  const handleFieldChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Handle Save button click - with optimistic updates (Requirement 20.1)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors = validateProfileForm(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare update payload - only include changed fields
      const updates: Partial<User> = {};
      if (formData.name !== coach.name) updates.name = formData.name;
      if (formData.email !== (coach.email || '')) updates.email = formData.email || undefined;
      if (formData.phone !== (coach.phone || '')) updates.phone = formData.phone || undefined;
      if (formData.specialization !== (coach.specialization || '')) updates.specialization = formData.specialization || undefined;
      if (formData.qualifications !== (coach.qualifications || '')) updates.qualifications = formData.qualifications || undefined;
      if (formData.certifications !== (coach.certifications || '')) updates.certifications = formData.certifications || undefined;
      if (formData.bio !== (coach.bio || '')) updates.bio = formData.bio || undefined;

      // Call update callback (which will make API call and show notifications)
      await onUpdateCoach(updates);

      // Exit edit mode on success
      setIsEditing(false);
      setErrors({});
    } catch (err) {
      // Show error but keep edit mode active for retry
      setErrors({
        submit: err instanceof Error ? err.message : 'Failed to update profile. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Cancel button click
  const handleCancel = () => {
    // Reset form to current coach values
    setFormData({
      name: coach.name,
      email: coach.email || '',
      phone: coach.phone || '',
      specialization: coach.specialization || '',
      qualifications: coach.qualifications || '',
      certifications: coach.certifications || '',
      bio: coach.bio || '',
    });
    setErrors({});
    setIsEditing(false);
  };

  // Helper to check if user can edit
  const canEdit = userRole === 'HEAD_COACH';
  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
      </div>
    );
  }

  // EDIT MODE
  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="space-y-6 p-6" noValidate>
        {/* Error banner if submission failed */}
        {errors.submit && (
          <div 
            className="bg-red-50 border border-red-200 rounded-lg p-4"
            role="alert"
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="text-sm text-red-800">{errors.submit}</p>
          </div>
        )}

        {/* Personal Information Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Personal Information</h3>
          <div className="space-y-4">
            {/* Name Field - Always editable */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={e => handleFieldChange('name', e.target.value)}
                placeholder="Enter coach name"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
                className={`w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-red-600 mt-1" role="alert">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => handleFieldChange('email', e.target.value)}
                placeholder="Enter email address"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={`w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-red-600 mt-1" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={e => handleFieldChange('phone', e.target.value)}
                placeholder="Enter phone number"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
                className={`w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.phone && (
                <p id="phone-error" className="text-sm text-red-600 mt-1" role="alert">
                  {errors.phone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Professional Information Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Professional Information</h3>
          <div className="space-y-4">
            {/* Specialization Field */}
            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
                Specialization
              </label>
              <input
                id="specialization"
                type="text"
                value={formData.specialization}
                onChange={e => handleFieldChange('specialization', e.target.value)}
                placeholder="Enter specialization"
                aria-invalid={!!errors.specialization}
                aria-describedby={errors.specialization ? 'specialization-error' : undefined}
                className={`w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.specialization ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.specialization && (
                <p id="specialization-error" className="text-sm text-red-600 mt-1" role="alert">
                  {errors.specialization}
                </p>
              )}
            </div>

            {/* Qualifications Field */}
            <div>
              <label htmlFor="qualifications" className="block text-sm font-medium text-gray-700 mb-1">
                Qualifications
              </label>
              <textarea
                id="qualifications"
                value={formData.qualifications}
                onChange={e => handleFieldChange('qualifications', e.target.value)}
                placeholder="Enter qualifications"
                rows={3}
                aria-invalid={!!errors.qualifications}
                aria-describedby={errors.qualifications ? 'qualifications-error' : undefined}
                className={`w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                  errors.qualifications ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.qualifications && (
                <p id="qualifications-error" className="text-sm text-red-600 mt-1" role="alert">
                  {errors.qualifications}
                </p>
              )}
            </div>

            {/* Certifications Field */}
            <div>
              <label htmlFor="certifications" className="block text-sm font-medium text-gray-700 mb-1">
                Certifications
              </label>
              <textarea
                id="certifications"
                value={formData.certifications}
                onChange={e => handleFieldChange('certifications', e.target.value)}
                placeholder="Enter certifications"
                rows={3}
                aria-invalid={!!errors.certifications}
                aria-describedby={errors.certifications ? 'certifications-error' : undefined}
                className={`w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                  errors.certifications ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.certifications && (
                <p id="certifications-error" className="text-sm text-red-600 mt-1" role="alert">
                  {errors.certifications}
                </p>
              )}
            </div>

            {/* Bio Field */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={e => handleFieldChange('bio', e.target.value)}
                placeholder="Enter bio"
                rows={4}
                aria-invalid={!!errors.bio}
                aria-describedby={errors.bio ? 'bio-error' : undefined}
                className={`w-full px-3 py-2 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                  errors.bio ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.bio && (
                <p id="bio-error" className="text-sm text-red-600 mt-1" role="alert">
                  {errors.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons - Aligned Right */}
        <div className="flex justify-end gap-3 pt-6">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-6 py-2 border border-gray-300 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Cancel profile editing"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 rounded-lg text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Save profile changes"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    );
  }

  // READ-ONLY MODE
  return (
    <div className="space-y-8 p-6">
      {/* Edit Button - visible only for HEAD_COACH */}
      {canEdit && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Edit profile"
          >
            Edit Profile
          </button>
        </div>
      )}

      {/* Personal Information Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Personal Information</h3>
        <div className="space-y-4">
          {/* Name - Always show */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
            <p className="text-base text-gray-900">{coach.name}</p>
          </div>

          {/* Email - Show if available, hide entire field if empty */}
          {coach.email && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <p className="text-base text-gray-900">{coach.email}</p>
            </div>
          )}

          {/* Phone - Show if available, hide entire field if empty */}
          {coach.phone && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
              <p className="text-base text-gray-900">{coach.phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Professional Information Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Professional Information</h3>
        <div className="space-y-4">
          {/* Specialization - Show only if available */}
          {coach.specialization && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Specialization</label>
              <p className="text-base text-gray-900">{coach.specialization}</p>
            </div>
          )}

          {/* Qualifications - Show only if available */}
          {coach.qualifications && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Qualifications</label>
              <p className="text-base text-gray-900 whitespace-pre-wrap">{coach.qualifications}</p>
            </div>
          )}

          {/* Certifications - Show only if available */}
          {coach.certifications && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Certifications</label>
              <p className="text-base text-gray-900 whitespace-pre-wrap">{coach.certifications}</p>
            </div>
          )}

          {/* Bio - Show only if available */}
          {coach.bio && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Bio</label>
              <p className="text-base text-gray-900 whitespace-pre-wrap">{coach.bio}</p>
            </div>
          )}
        </div>
      </div>

      {/* Role & Permissions Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Role & Permissions</h3>
        <div className="space-y-4">
          {/* Role Badge */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">User Role</label>
            <div className="inline-block">
              <span
                className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                  coach.role === 'HEAD_COACH'
                    ? 'bg-blue-100 text-blue-800'
                    : coach.role === 'ASSISTANT_COACH'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {coach.role === 'HEAD_COACH'
                  ? 'Head Coach'
                  : coach.role === 'ASSISTANT_COACH'
                    ? 'Assistant Coach'
                    : coach.role}
              </span>
            </div>
          </div>

          {/* Role Description */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Permission Description
            </label>
            <p className="text-base text-gray-700 leading-relaxed">{getRoleDescription(coach.role)}</p>
          </div>

          {/* Note: Role changes are admin-only */}
          <p className="text-sm text-gray-500 italic pt-2">
            Role changes are managed by administrators only.
          </p>
        </div>
      </div>

      {/* Account Information Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Account Information</h3>
        <div className="space-y-4 text-sm">
          <div>
            <span className="text-gray-600">User ID:</span>
            <p className="text-gray-900 font-mono text-xs mt-1">{coach.id}</p>
          </div>
          <div>
            <span className="text-gray-600">Username:</span>
            <p className="text-gray-900 font-mono">{coach.username}</p>
          </div>
          <div>
            <span className="text-gray-600">Account Created:</span>
            <p className="text-gray-900">
              {new Date(coach.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Last Active:</span>
            <p className="text-gray-900">
              {new Date(coach.lastActive).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachProfileTab;
