import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../utils/apiClient';
import '../styles/pages.css';

/**
 * JoinBatchPage Component
 * Public route (/join/:token) opened from a batch invite link a head coach shared.
 * The student fills in their details; the request waits for head coach approval, after
 * which they're added to the batch and receive a welcome email with login details.
 */

interface InviteInfo {
  batchName: string;
  centerName: string;
  centerLogoUrl: string | null;
  slots: Array<{ dayOfWeek: string; startTime: string; durationHours: number }>;
}

interface FormState {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  contactPhone: string;
  email: string;
  guardianName: string;
  guardianPhone: string;
  skillLevel: string;
  medicalConditions: string;
  notes: string;
}

type FormErrors = Partial<Record<keyof FormState | 'general', string>>;

const PHONE_REGEX = /^\+?[\d\s\-()]{10,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialForm: FormState = {
  fullName: '',
  dateOfBirth: '',
  gender: '',
  contactPhone: '',
  email: '',
  guardianName: '',
  guardianPhone: '',
  skillLevel: 'Beginner',
  medicalConditions: '',
  notes: '',
};

const ageFrom = (dob: string): number | null => {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
};

const formatTime = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
};

export const JoinBatchPage: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'invalid'>('loading');
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    apiClient
      .get(`/public/batch-invites/${encodeURIComponent(token)}`)
      .then((r) => {
        setInvite(r.data);
        setLoadState('ready');
      })
      .catch(() => setLoadState('invalid'));
  }, [token]);

  const age = ageFrom(form.dateOfBirth);
  const isMinor = age !== null && age < 18;

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (form.fullName.trim().length < 2) e.fullName = 'Please enter your full name';
    if (!form.dateOfBirth) e.dateOfBirth = 'Date of birth is required';
    else if (new Date(form.dateOfBirth) > new Date()) e.dateOfBirth = 'Date of birth cannot be in the future';
    if (!form.gender) e.gender = 'Please select a gender';
    if (!PHONE_REGEX.test(form.contactPhone)) e.contactPhone = 'Enter a valid phone number';
    if (!EMAIL_REGEX.test(form.email.trim())) e.email = 'Enter a valid email address';
    if (isMinor) {
      if (form.guardianName.trim().length < 2) e.guardianName = 'Guardian name is required for students under 18';
      if (!PHONE_REGEX.test(form.guardianPhone)) e.guardianPhone = 'Enter a valid guardian phone number';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});
    try {
      await apiClient.post(`/public/batch-invites/${encodeURIComponent(token)}/requests`, {
        fullName: form.fullName.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        contactPhone: form.contactPhone.trim(),
        email: form.email.trim(),
        guardianName: isMinor ? form.guardianName.trim() : '',
        guardianPhone: isMinor ? form.guardianPhone.trim() : '',
        skillLevel: form.skillLevel,
        medicalConditions: form.medicalConditions.trim(),
        notes: form.notes.trim(),
      });
      setIsSuccess(true);
    } catch (error: unknown) {
      const data = (error as { response?: { data?: { error?: string; details?: Array<{ message: string }> } } })
        ?.response?.data;
      setErrors({
        general: data?.details?.[0]?.message || data?.error || 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = (
    name: keyof FormState,
    label: string,
    input: React.ReactNode,
    required = false
  ) => (
    <div className="reset-password-page__form-group">
      <label htmlFor={`join-${name}`} className={`label-base ${required ? 'label-base--required' : ''}`}>
        {label}
      </label>
      {input}
      {errors[name] && <span className="error-text">{errors[name]}</span>}
    </div>
  );

  const inputClass = (name: keyof FormState) => `input-base ${errors[name] ? 'input-base--error' : ''}`;

  return (
    <div
      className="page-container reset-password-page"
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div className="reset-password-page__card">
        {loadState === 'loading' && <p className="reset-password-page__subtitle">Loading…</p>}

        {loadState === 'invalid' && (
          <div className="reset-password-page__header">
            <h1 className="reset-password-page__title">Invite link not valid</h1>
            <p className="reset-password-page__subtitle">
              This invite link is invalid or has been reset. Please ask your coach for a new link.
            </p>
          </div>
        )}

        {loadState === 'ready' && invite && (
          <>
            <div className="reset-password-page__header">
              {invite.centerLogoUrl && (
                <img
                  src={invite.centerLogoUrl}
                  alt={invite.centerName}
                  style={{ height: 48, marginBottom: 'var(--space-md)' }}
                />
              )}
              <h1 className="reset-password-page__title">Join {invite.batchName}</h1>
              <p className="reset-password-page__subtitle">
                {invite.centerName}
                {invite.slots.length > 0 && (
                  <>
                    <br />
                    {invite.slots
                      .map((s) => `${s.dayOfWeek} ${formatTime(s.startTime)} (${s.durationHours}h)`)
                      .join(' · ')}
                  </>
                )}
              </p>
            </div>

            {isSuccess ? (
              <div className="alert-base alert--success" role="alert">
                <div className="alert-base__content">
                  <div className="alert-base__title">Request sent!</div>
                  <div>
                    The head coach will review your request. Once approved, you'll get an email at{' '}
                    <strong>{form.email.trim()}</strong> with your login details.
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="reset-password-page__form" noValidate>
                {errors.general && (
                  <div className="alert-base alert--danger" role="alert">
                    <div className="alert-base__content">
                      <div className="alert-base__title">{errors.general}</div>
                    </div>
                  </div>
                )}

                {field('fullName', 'Full name', (
                  <input
                    id="join-fullName"
                    className={inputClass('fullName')}
                    value={form.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    maxLength={100}
                    autoComplete="name"
                    disabled={isSubmitting}
                  />
                ), true)}

                {field('dateOfBirth', 'Date of birth', (
                  <input
                    id="join-dateOfBirth"
                    type="date"
                    className={inputClass('dateOfBirth')}
                    value={form.dateOfBirth}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    disabled={isSubmitting}
                  />
                ), true)}

                {field('gender', 'Gender', (
                  <select
                    id="join-gender"
                    className={inputClass('gender')}
                    value={form.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">Select…</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ), true)}

                {field('contactPhone', 'Phone number', (
                  <input
                    id="join-contactPhone"
                    type="tel"
                    className={inputClass('contactPhone')}
                    value={form.contactPhone}
                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                    autoComplete="tel"
                    disabled={isSubmitting}
                  />
                ), true)}

                {field('email', 'Email', (
                  <input
                    id="join-email"
                    type="email"
                    className={inputClass('email')}
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    autoComplete="email"
                    disabled={isSubmitting}
                  />
                ), true)}

                {isMinor && (
                  <>
                    {field('guardianName', 'Parent / guardian name', (
                      <input
                        id="join-guardianName"
                        className={inputClass('guardianName')}
                        value={form.guardianName}
                        onChange={(e) => handleChange('guardianName', e.target.value)}
                        disabled={isSubmitting}
                      />
                    ), true)}
                    {field('guardianPhone', 'Parent / guardian phone', (
                      <input
                        id="join-guardianPhone"
                        type="tel"
                        className={inputClass('guardianPhone')}
                        value={form.guardianPhone}
                        onChange={(e) => handleChange('guardianPhone', e.target.value)}
                        disabled={isSubmitting}
                      />
                    ), true)}
                  </>
                )}

                {field('skillLevel', 'Playing level', (
                  <select
                    id="join-skillLevel"
                    className={inputClass('skillLevel')}
                    value={form.skillLevel}
                    onChange={(e) => handleChange('skillLevel', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Professional">Professional</option>
                  </select>
                ))}

                {field('medicalConditions', 'Medical conditions (if any)', (
                  <input
                    id="join-medicalConditions"
                    className={inputClass('medicalConditions')}
                    value={form.medicalConditions}
                    onChange={(e) => handleChange('medicalConditions', e.target.value)}
                    maxLength={500}
                    disabled={isSubmitting}
                  />
                ))}

                {field('notes', 'Message for the coach (optional)', (
                  <textarea
                    id="join-notes"
                    className={inputClass('notes')}
                    value={form.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    maxLength={500}
                    rows={2}
                    disabled={isSubmitting}
                  />
                ))}

                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending…' : 'Request to join'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default JoinBatchPage;
