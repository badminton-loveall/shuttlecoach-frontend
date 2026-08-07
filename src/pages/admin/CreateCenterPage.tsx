import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../utils/apiClient';
import type { Center } from '../../types';
import './CreateCenterPage.css';

/**
 * CreateCenterPage
 * Form for creating a new coaching center.
 * On success: navigates to /admin/centers.
 *
 * Requirements: 2.2, 2.3
 */

interface CreateCenterForm {
  name: string;
  location: string;
  contactPhone: string;
  contactEmail: string;
  logoUrl: string;
  planType: string;
}

const INITIAL_FORM: CreateCenterForm = {
  name: '',
  location: '',
  contactPhone: '',
  contactEmail: '',
  logoUrl: '',
  planType: 'basic',
};

export const CreateCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateCenterForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateCenterForm, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreateCenterForm, string>> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Center name is required';
    } else if (form.name.trim().length > 100) {
      newErrors.name = 'Center name must be 100 characters or fewer';
    }

    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    if (form.contactPhone && !/^[+\d\s()-]{0,20}$/.test(form.contactPhone)) {
      newErrors.contactPhone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof CreateCenterForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (serverError) {
      setServerError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setIsSubmitting(true);
      setServerError(null);

      const payload: Partial<Center> = {
        name: form.name.trim(),
        location: form.location.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        logoUrl: form.logoUrl.trim() || undefined,
        planType: form.planType || undefined,
      };

      await apiClient.post('/admin/centers', payload);
      navigate('/admin/centers');
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { error?: string } } }).response?.data?.error
      ) {
        setServerError(
          (err as { response: { data: { error: string } } }).response.data.error
        );
      } else {
        const message =
          err instanceof Error ? err.message : 'Failed to create center';
        setServerError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/centers');
  };

  return (
    <div className="create-center-page">
      <div className="create-center-page__header">
        <h1 className="create-center-page__title">Create Center</h1>
        <p className="create-center-page__subtitle">
          Add a new coaching center to the platform
        </p>
      </div>

      {serverError && (
        <div className="create-center-page__server-error">
          <p>{serverError}</p>
        </div>
      )}

      <form className="create-center-page__form" onSubmit={handleSubmit} noValidate>
        {/* Name */}
        <div className="create-center-page__field">
          <label className="create-center-page__label" htmlFor="center-name">
            Center Name <span className="create-center-page__required">*</span>
          </label>
          <input
            id="center-name"
            className={`create-center-page__input ${errors.name ? 'create-center-page__input--error' : ''}`}
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. ShuttleCoach Downtown"
            maxLength={100}
            required
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'center-name-error' : undefined}
          />
          {errors.name && (
            <span id="center-name-error" className="create-center-page__error-text">
              {errors.name}
            </span>
          )}
        </div>

        {/* Location */}
        <div className="create-center-page__field">
          <label className="create-center-page__label" htmlFor="center-location">
            Location
          </label>
          <input
            id="center-location"
            className="create-center-page__input"
            type="text"
            value={form.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="e.g. 123 Sports Avenue, Bangalore"
            maxLength={200}
          />
        </div>

        {/* Contact Phone */}
        <div className="create-center-page__field">
          <label className="create-center-page__label" htmlFor="center-phone">
            Contact Phone
          </label>
          <input
            id="center-phone"
            className={`create-center-page__input ${errors.contactPhone ? 'create-center-page__input--error' : ''}`}
            type="tel"
            value={form.contactPhone}
            onChange={(e) => handleChange('contactPhone', e.target.value)}
            placeholder="e.g. +91 98765 43210"
            maxLength={20}
            aria-invalid={!!errors.contactPhone}
            aria-describedby={errors.contactPhone ? 'center-phone-error' : undefined}
          />
          {errors.contactPhone && (
            <span id="center-phone-error" className="create-center-page__error-text">
              {errors.contactPhone}
            </span>
          )}
        </div>

        {/* Contact Email */}
        <div className="create-center-page__field">
          <label className="create-center-page__label" htmlFor="center-email">
            Contact Email
          </label>
          <input
            id="center-email"
            className={`create-center-page__input ${errors.contactEmail ? 'create-center-page__input--error' : ''}`}
            type="email"
            value={form.contactEmail}
            onChange={(e) => handleChange('contactEmail', e.target.value)}
            placeholder="e.g. contact@center.com"
            maxLength={100}
            aria-invalid={!!errors.contactEmail}
            aria-describedby={errors.contactEmail ? 'center-email-error' : undefined}
          />
          {errors.contactEmail && (
            <span id="center-email-error" className="create-center-page__error-text">
              {errors.contactEmail}
            </span>
          )}
        </div>

        {/* Logo URL */}
        <div className="create-center-page__field">
          <label className="create-center-page__label" htmlFor="center-logo">
            Logo URL
          </label>
          <input
            id="center-logo"
            className="create-center-page__input"
            type="url"
            value={form.logoUrl}
            onChange={(e) => handleChange('logoUrl', e.target.value)}
            placeholder="e.g. https://example.com/logo.png"
          />
        </div>

        {/* Plan Type */}
        <div className="create-center-page__field">
          <label className="create-center-page__label" htmlFor="center-plan">
            Plan Type
          </label>
          <select
            id="center-plan"
            className="create-center-page__select"
            value={form.planType}
            onChange={(e) => handleChange('planType', e.target.value)}
          >
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        {/* Form Actions */}
        <div className="create-center-page__actions">
          <button
            type="button"
            className="create-center-page__cancel-btn"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="create-center-page__submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Center'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCenterPage;
