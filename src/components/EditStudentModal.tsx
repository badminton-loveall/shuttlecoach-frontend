import React, { useCallback, useMemo, useState } from 'react';
import type { Student } from '../types';
import { EnrollStudentModal, type EnrollStudentFormData } from './EnrollStudentModal';
import { useStudentEnrollments } from '../hooks/useStudentEnrollments';
import { useCoaches } from '../hooks/useCoaches';
import { getChangedFields, classifyError } from '../utils/studentProfileUtils';
import apiClient from '../utils/apiClient';

/**
 * EditStudentModal Component
 * Reuses EnrollStudentModal (the same tabbed form used to enroll a new student) in edit mode,
 * pre-filled from the student's personal info and active enrollment — so personal details and
 * enrollment (batch timing, curriculum, coach, start date, fee) are edited in one place instead
 * of two separate flows.
 */

export interface EditStudentModalProps {
  isOpen: boolean;
  student: Student;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  student,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { coaches } = useCoaches();
  const { activeEnrollment } = useStudentEnrollments(student.id);

  const initialData: Partial<EnrollStudentFormData> = useMemo(() => ({
    fullName: student.fullName,
    dateOfBirth: student.dateOfBirth,
    gender: student.gender,
    contactPhone: student.contactPhone,
    email: student.email || '',
    guardianName: student.guardianName || '',
    guardianPhone: student.guardianPhone || '',
    baidNumber: student.baidNumber || '',
    skillLevel: student.skillLevel,
    assignedCoachId: activeEnrollment?.coachId || student.assignedCoachId || '',
    batchTimeTemplateId: activeEnrollment?.batchTimeTemplateId || '',
    curriculumId: activeEnrollment?.curriculumId || '',
    // No active enrollment yet ("Set up enrollment" case) — default to today, matching
    // EnrollStudentModal's own create-mode default, so the field's displayed value and its
    // underlying state agree (an empty string here would look like today but fail validation).
    startDate: activeEnrollment?.startDate || new Date().toISOString().slice(0, 10),
    monthlyFee: activeEnrollment?.monthlyFee ?? undefined,
  }), [student, activeEnrollment]);

  const handleSubmit = useCallback(async (data: EnrollStudentFormData) => {
    setError(null);

    const updatedFields: Partial<Student> = {
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      contactPhone: data.contactPhone,
      email: data.email || undefined,
      guardianName: data.guardianName || undefined,
      guardianPhone: data.guardianPhone || undefined,
      baidNumber: data.baidNumber || undefined,
      skillLevel: data.skillLevel,
    };
    const changedFields = getChangedFields(student, updatedFields);

    // Enrollment tab changed from the current active enrollment? Saving a new enrollment ends
    // the old one and starts a fresh one (same semantics as EnrollmentSection's "Change
    // enrollment"), so only do it when something in that tab actually moved.
    const enrollmentChanged =
      (data.batchTimeTemplateId || '') !== (activeEnrollment?.batchTimeTemplateId || '') ||
      (data.curriculumId || '') !== (activeEnrollment?.curriculumId || '') ||
      (data.assignedCoachId || '') !== (activeEnrollment?.coachId || '') ||
      (data.startDate || '') !== (activeEnrollment?.startDate || '') ||
      (data.monthlyFee ?? null) !== (activeEnrollment?.monthlyFee ?? null);

    setIsSubmitting(true);
    try {
      if (Object.keys(changedFields).length > 0) {
        await apiClient.patch(`/students/${student.id}`, changedFields);
      }

      if (data.startDate && enrollmentChanged) {
        await apiClient.post(`/students/${student.id}/enrollments`, {
          batchTimeTemplateId: data.batchTimeTemplateId || null,
          curriculumId: data.curriculumId || null,
          coachId: data.assignedCoachId || null,
          startDate: data.startDate,
          monthlyFee: data.monthlyFee ?? null,
        });
      }

      setIsSubmitting(false);
      onSuccess();
    } catch (err: unknown) {
      const classified = classifyError(err);
      setError(classified.message);
      setIsSubmitting(false);
      throw err;
    }
  }, [student, activeEnrollment, onSuccess]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  }, [isSubmitting, onClose]);

  return (
    <EnrollStudentModal
      isOpen={isOpen}
      mode="edit"
      initialData={initialData}
      onClose={handleClose}
      onSubmit={handleSubmit}
      coaches={coaches}
      error={error}
    />
  );
};

export default EditStudentModal;
