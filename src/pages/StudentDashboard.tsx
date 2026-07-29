import React, { useMemo, useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { SkillRadarChart } from '../components/SkillRadarChart';
import type { 
  FeeRecord, 
  FeeStatus, 
  CurriculumPlan, 
  WeekPlan, 
  Student, 
  SkillAssessment,
  Batch,
  User
} from '../types';
import { computeAllFeeStatuses } from '../utils/feeUtils';
import { generateCycleKey } from '../utils/skillUtils';
import { getCurrentWeekInCycle } from '../utils/dateUtils';
import { calculateAge } from '../utils/studentUtils';
import apiClient from '../utils/apiClient';
import curriculumData from '../data/curriculum.json';
import studentsData from '../data/students.json';
import skillAssessmentsData from '../data/skillAssessments.json';
import batchesData from '../data/batches.json';
import usersData from '../data/users.json';

/**
 * StudentDashboard Page
 * Displays student dashboard with personal stats, fee history, and current week curriculum
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 14.1, 14.2, 14.3, 14.4, 21.1, 21.2, 21.3, 21.4, 21.5
 */

/**
 * Resolve the student record for the authenticated user.
 * Matches the user to a student by name or email.
 * TODO: Migrate to API when backend adds STUDENT role support on GET /students
 */
function resolveStudentForUser(user: { id: string; name: string; email?: string }): Student | null {
  // Try matching by name (case-insensitive)
  let studentRecord = studentsData.find(
    (s) => s.fullName.toLowerCase() === user.name.toLowerCase()
  );

  // Try matching by email if name didn't match
  if (!studentRecord && user.email) {
    studentRecord = studentsData.find(
      (s) => s.email && s.email.toLowerCase() === user.email!.toLowerCase()
    );
  }

  if (!studentRecord) return null;

  return {
    ...studentRecord,
    dateOfBirth: new Date(studentRecord.dateOfBirth),
    createdAt: new Date(studentRecord.createdAt),
    updatedAt: new Date(studentRecord.updatedAt),
    batchId: studentRecord.batchId || undefined,
    assignedCoachId: studentRecord.assignedCoachId || undefined,
    profilePhoto: studentRecord.profilePhoto || undefined,
  } as Student;
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  // State for API-fetched student (used when local resolution fails)
  const [apiStudent, setApiStudent] = useState<Student | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);

  // Resolve student from local data using name/email matching
  // TODO: Replace with API call when backend adds STUDENT role support on GET /students
  const localStudent = useMemo<Student | null>(() => {
    if (!user) return null;
    return resolveStudentForUser(user);
  }, [user]);

  // If local resolution fails, try fetching from API
  useEffect(() => {
    if (localStudent || !user) return;

    let cancelled = false;

    const fetchStudentFromApi = async () => {
      try {
        setStudentLoading(true);
        setStudentError(null);
        // Try GET /students?search=<user.name> to find the student record
        const response = await apiClient.get('/students', {
          params: { search: user.name },
        });

        if (cancelled) return;

        const students = response.data?.students ?? response.data;
        if (Array.isArray(students) && students.length > 0) {
          const raw = students[0] as Record<string, unknown>;
          setApiStudent({
            ...raw,
            dateOfBirth: new Date(raw.dateOfBirth as string),
            createdAt: new Date(raw.createdAt as string),
            updatedAt: new Date(raw.updatedAt as string),
          } as Student);
        } else {
          setStudentError('Unable to load student data');
        }
      } catch {
        if (cancelled) return;
        // API might not support STUDENT role - show graceful error
        setStudentError('Unable to load student data');
      } finally {
        if (!cancelled) {
          setStudentLoading(false);
        }
      }
    };

    void fetchStudentFromApi();

    return () => {
      cancelled = true;
    };
  }, [localStudent, user]);

  // Use local student if found, otherwise API student
  const student = localStudent ?? apiStudent;
  const studentId = student?.id ?? null;

  // Get current cycle key and week number
  const currentCycleKey = useMemo(() => generateCycleKey(), []);
  const currentWeekNumber = useMemo(() => getCurrentWeekInCycle(), []);

  // Fetch fees from API (GET /fees filters for STUDENT role automatically)
  const [studentFees, setStudentFees] = useState<(FeeRecord & { status: FeeStatus })[]>([]);
  const [feesLoading, setFeesLoading] = useState(true);
  const [feesError, setFeesError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setFeesLoading(false);
      return;
    }

    let cancelled = false;

    const fetchFees = async () => {
      try {
        setFeesLoading(true);
        setFeesError(null);
        const response = await apiClient.get<FeeRecord[]>('/fees', {
          params: { studentId },
        });

        if (cancelled) return;

        // Parse dates and compute statuses
        const rawFees = response.data.map((fee) => ({
          ...fee,
          dueDate: new Date(fee.dueDate),
          paidDate: fee.paidDate ? new Date(fee.paidDate) : undefined,
          createdAt: new Date(fee.createdAt),
          updatedAt: new Date(fee.updatedAt),
        })) as FeeRecord[];

        const withStatuses = computeAllFeeStatuses(rawFees);

        // Sort in reverse chronological order (most recent first)
        const sorted = withStatuses.sort((a, b) => {
          const dateA = new Date(a.monthYear).getTime();
          const dateB = new Date(b.monthYear).getTime();
          return dateB - dateA;
        });

        setStudentFees(sorted);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to fetch fees from API:', err);
        setFeesError('Failed to load fee data. Please try again.');
      } finally {
        if (!cancelled) {
          setFeesLoading(false);
        }
      }
    };

    void fetchFees();

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  // Load batch information (from local JSON - no separate batch API for students)
  // TODO: Migrate to API when batch endpoint supports STUDENT role
  const batch = useMemo<Batch | null>(() => {
    if (!student?.batchId) return null;

    const batchRecord = batchesData.find((b) => b.id === student.batchId);
    if (!batchRecord) return null;

    return {
      ...batchRecord,
      createdAt: new Date(batchRecord.createdAt),
      assignedCoachId: batchRecord.assignedCoachId || undefined,
    } as Batch;
  }, [student]);

  // Load assigned coach information
  const assignedCoach = useMemo<User | null>(() => {
    if (!student?.assignedCoachId) return null;

    const coachRecord = usersData.find((u) => u.id === student.assignedCoachId);
    if (!coachRecord) return null;

    return {
      ...coachRecord,
      createdAt: new Date(coachRecord.createdAt),
      lastActive: new Date(coachRecord.lastActive),
      email: coachRecord.email || undefined,
      profilePhoto: coachRecord.profilePhoto || undefined,
      specialization: coachRecord.specialization || undefined,
    } as User;
  }, [student]);

  // Load most recent skill assessment
  const mostRecentAssessment = useMemo<SkillAssessment | null>(() => {
    if (!studentId) return null;

    const assessments = skillAssessmentsData
      .filter((a) => a.studentId === studentId)
      .map((a) => ({
        ...a,
        recordedAt: new Date(a.recordedAt),
      })) as SkillAssessment[];

    if (assessments.length === 0) return null;

    // Sort by recorded date (most recent first)
    assessments.sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());

    return assessments[0];
  }, [studentId]);

  // Calculate next assessment due date (60 days after last assessment)
  const nextAssessmentDue = useMemo<Date | null>(() => {
    if (!mostRecentAssessment) return null;

    const nextDue = new Date(mostRecentAssessment.recordedAt);
    nextDue.setDate(nextDue.getDate() + 60);
    return nextDue;
  }, [mostRecentAssessment]);

  // Load student's curriculum plan for current cycle
  const currentCurriculumPlan = useMemo(() => {
    if (!studentId) return null;

    // Load curriculum plans from JSON and convert date strings
    const plans = curriculumData.map((plan) => ({
      ...plan,
      createdAt: new Date(plan.createdAt),
      updatedAt: new Date(plan.updatedAt),
      batchId: plan.batchId || undefined,
      studentId: plan.studentId || undefined,
      sourceBatchPlanId: plan.sourceBatchPlanId || undefined,
    })) as CurriculumPlan[];

    // Find the student's individual plan for the current cycle
    const studentPlan = plans.find(
      (plan) =>
        plan.studentId === studentId &&
        plan.cycleKey === currentCycleKey &&
        !plan.isArchived
    );

    return studentPlan || null;
  }, [studentId, currentCycleKey]);

  // Get the current week's plan
  const currentWeekPlan = useMemo<WeekPlan | null>(() => {
    if (!currentCurriculumPlan) return null;

    return (
      currentCurriculumPlan.weeks.find(
        (week) => week.weekNumber === currentWeekNumber
      ) || null
    );
  }, [currentCurriculumPlan, currentWeekNumber]);

  // Load and filter fees for the current student (from API - see useEffect above)
  // Fee data is now fetched via apiClient.get('/fees') with studentId param

  // Calculate total outstanding balance (PENDING + OVERDUE)
  const outstandingBalance = useMemo(() => {
    return studentFees
      .filter((fee) => fee.status === 'PENDING' || fee.status === 'OVERDUE')
      .reduce((sum, fee) => sum + fee.amount, 0);
  }, [studentFees]);

  // Get status badge classes
  const getStatusBadgeClasses = (status: FeeStatus): string => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'WAIVED':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  // Format date
  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Format month/year for display
  const formatMonthYear = (monthYear: string): string => {
    const [year, month] = monthYear.split('-');
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div style={{ padding: 'var(--space-lg)' }}>
          <p style={{ color: 'var(--text-tertiary)' }}>Please log in to view your dashboard</p>
        </div>
      </DashboardLayout>
    );
  }

  if (studentLoading) {
    return (
      <DashboardLayout>
        <div style={{ padding: 'var(--space-lg)' }}>
          <p style={{ color: 'var(--text-tertiary)' }}>Loading student data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div style={{ padding: 'var(--space-lg)' }}>
          <p style={{ color: 'var(--text-tertiary)' }}>{studentError || 'Unable to load student data'}</p>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)', marginTop: 'var(--space-sm)' }}>
            Please contact your coach if this issue persists.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">
          {/* Welcome Banner with Name and Photo */}
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 shadow-md border-l-4 border-primary" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)' }}>
            <div className="flex items-center" style={{ gap: 'var(--space-lg)' }}>
              {/* Profile Photo */}
              <div className="flex-shrink-0">
                {student.profilePhoto ? (
                  <img
                    src={student.profilePhoto}
                    alt={student.fullName}
                    className="w-24 h-24 rounded-full object-cover shadow-lg"
                    style={{ border: '4px solid var(--surface-elevated)', borderColor: 'var(--surface-elevated)' }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center shadow-lg" style={{ border: '4px solid var(--surface-elevated)' }}>
                    <span className="text-3xl font-bold text-primary">
                      {student.fullName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Welcome Text */}
              <div>
                <h1 className="text-[36px] font-bold leading-tight" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
                  Welcome back, {student.fullName}!
                </h1>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                  Keep up the great work! Here's your training overview.
                </p>
              </div>
            </div>
          </div>

          {/* Personal Stat Cards */}
          <div className="card-grid">
            {/* Current Skill Level Card */}
            <div className="shadow-md border-l-4 border-blue-500" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', backgroundColor: 'var(--surface-card)' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-sm)' }}>
              <p className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Skill Level
              </p>
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {student.skillLevel}
            </p>
          </div>

            {/* Next Assessment Due Card */}
            <div className="shadow-md border-l-4 border-purple-500" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', backgroundColor: 'var(--surface-card)' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-sm)' }}>
              <p className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Next Assessment
              </p>
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {nextAssessmentDue ? formatDate(nextAssessmentDue) : 'Not scheduled'}
            </p>
          </div>

            {/* Outstanding Fee Balance Card */}
            <div className="shadow-md border-l-4 border-yellow-500" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', backgroundColor: 'var(--surface-card)' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-sm)' }}>
              <p className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Fee Balance
              </p>
              <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(outstandingBalance)}
            </p>
            {outstandingBalance > 0 && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400" style={{ marginTop: 'var(--space-xs)' }}>Payment due</p>
            )}
          </div>

            {/* Current Batch and Coach Card */}
            <div className="shadow-md border-l-4 border-green-500" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', backgroundColor: 'var(--surface-card)' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-sm)' }}>
              <p className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Batch & Coach
              </p>
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>
              {batch?.name || 'No batch assigned'}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Coach: {assignedCoach?.name || 'Not assigned'}
              </p>
            </div>
          </div>

          {/* Read-only Profile Section */}
          <div className="shadow-md" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', backgroundColor: 'var(--surface-card)' }}>
            <h2 className="text-[24px] font-semibold" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
              My Profile
            </h2>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--space-lg)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Full Name</p>
              <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.fullName}</p>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Age</p>
              <p className="text-base" style={{ color: 'var(--text-primary)' }}>{calculateAge(student.dateOfBirth)} years</p>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Gender</p>
              <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.gender}</p>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Contact Phone</p>
              <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.contactPhone}</p>
            </div>
            {student.email && (
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Email</p>
                <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.email}</p>
              </div>
            )}
            {student.baidNumber && (
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>BAID Number</p>
                <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.baidNumber}</p>
              </div>
            )}
            {student.guardianName && (
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Guardian Name</p>
                <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.guardianName}</p>
              </div>
            )}
            {student.guardianPhone && (
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Guardian Phone</p>
                <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.guardianPhone}</p>
              </div>
            )}
            {student.bloodGroup && (
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Blood Group</p>
                <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.bloodGroup}</p>
              </div>
            )}
            {student.height && student.weight && (
              <>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Height</p>
                  <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.height} cm</p>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Weight</p>
                  <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.weight} kg</p>
                </div>
                {student.bmi && (
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>BMI</p>
                    <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.bmi}</p>
                  </div>
                )}
              </>
            )}
            {student.emergencyContact && (
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Emergency Contact</p>
                <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.emergencyContact}</p>
              </div>
            )}
            {student.medicalConditions && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Medical Conditions</p>
                <p className="text-base" style={{ color: 'var(--text-primary)' }}>{student.medicalConditions}</p>
              </div>
            )}
          </div>
        </div>

          {/* Most Recent Skill Assessment Radar Chart */}
          {mostRecentAssessment && (
            <div className="shadow-md" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', backgroundColor: 'var(--surface-card)' }}>
              <h2 className="text-[24px] font-semibold" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
                Latest Skill Assessment
              </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
              Recorded on {formatDate(mostRecentAssessment.recordedAt)} by {mostRecentAssessment.recordedBy}
            </p>
              <SkillRadarChart scores={mostRecentAssessment.scores} />
            </div>
          )}

          {/* Coach Feedback Section */}
          {student.coachFeedback && (
            <div className="shadow-md" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', backgroundColor: 'var(--surface-card)' }}>
              <h2 className="text-[24px] font-semibold" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
                Coach Feedback
              </h2>
            <div style={{ backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
              <p style={{ color: 'var(--text-primary)' }}>{student.coachFeedback}</p>
            </div>
          </div>
        )}

          {/* Strengths and Weaknesses */}
          {(student.strengths.length > 0 || student.weaknesses.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 'var(--space-lg)' }}>
              {student.strengths.length > 0 && (
                <div className="shadow-md" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', backgroundColor: 'var(--surface-card)' }}>
                  <h2 className="text-[24px] font-semibold" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
                    Strengths
                  </h2>
                <div className="flex flex-wrap" style={{ gap: 'var(--space-xs)' }}>
                  {student.strengths.map((strength, index) => (
                    <span
                      key={index}
                      className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-medium"
                      style={{ padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-pill)' }}
                    >
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
            )}

              {student.weaknesses.length > 0 && (
                <div className="shadow-md" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', backgroundColor: 'var(--surface-card)' }}>
                  <h2 className="text-[24px] font-semibold" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
                    Areas to Improve
                  </h2>
                <div className="flex flex-wrap" style={{ gap: 'var(--space-xs)' }}>
                  {student.weaknesses.map((weakness, index) => (
                    <span
                      key={index}
                      className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm font-medium"
                      style={{ padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-pill)' }}
                    >
                      {weakness}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

          {/* Current Week Curriculum Section */}
          {currentWeekPlan && (
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 shadow-md border-l-4 border-primary" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)' }}>
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-sm)' }}>
                  <h2 className="text-[24px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Week {currentWeekNumber} Training Focus
                  </h2>
                <span className="bg-primary text-slate-900 text-sm font-semibold" style={{ padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-pill)' }}>
                  Current Week
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {currentCycleKey}
              </p>
            </div>

            {/* Focus Area */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
                Focus Area
              </h3>
              <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
                {currentWeekPlan.focusArea}
              </p>
            </div>

            {/* Training Objective */}
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
                This Week's Objective
              </h3>
              <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
                {currentWeekPlan.objective}
              </p>
            </div>

            {/* Drills */}
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
                Assigned Drills
              </h3>
              <div className="grid grid-cols-1" style={{ gap: 'var(--space-md)' }}>
                {currentWeekPlan.drills.map((drill) => (
                  <div
                    key={drill.id}
                    className="shadow-sm"
                    style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-card)' }}
                  >
                    <div className="flex items-start justify-between" style={{ marginBottom: 'var(--space-sm)' }}>
                      <h4 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                        {drill.name}
                      </h4>
                      <span className="text-xs font-medium" style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--text-secondary)', padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-sm)' }}>
                        {drill.category}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {drill.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

          {/* No Curriculum Message */}
          {!currentWeekPlan && (
            <div className="shadow-md text-center border-l-4" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-xl)', borderLeftColor: 'var(--border-default)', backgroundColor: 'var(--surface-card)' }}>
            <svg
              className="mx-auto h-12 w-12" style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
              No Curriculum Plan Available
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Your coach hasn't assigned a training plan for this cycle yet.
              </p>
            </div>
          )}

          {/* Outstanding Balance Card */}
          <div className="shadow-md border-l-4 border-primary" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', backgroundColor: 'var(--surface-card)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                Outstanding Balance
              </p>
              <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)', marginTop: 'var(--space-sm)' }}>
                {formatCurrency(outstandingBalance)}
              </p>
            </div>
            {outstandingBalance > 0 && (
              <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm font-medium" style={{ padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-pill)' }}>
                Payment Due
              </div>
            )}
            {outstandingBalance === 0 && (
              <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-medium" style={{ padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-pill)' }}>
                All Paid
              </div>
            )}
          </div>
        </div>

          {/* Fee History Section */}
          <div>
            <h2 className="text-[24px] font-semibold" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
              Fee History
            </h2>

          {feesLoading ? (
            <div className="shadow text-center" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-xl)', backgroundColor: 'var(--surface-card)' }}>
              <p style={{ color: 'var(--text-tertiary)' }}>Loading fee records...</p>
            </div>
          ) : feesError ? (
            <div className="shadow text-center" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-xl)', backgroundColor: 'var(--surface-card)' }}>
              <p style={{ color: 'var(--text-tertiary)' }}>{feesError}</p>
            </div>
          ) : studentFees.length === 0 ? (
            <div className="shadow text-center" style={{ borderRadius: 'var(--radius-md)', padding: 'var(--space-xl)', backgroundColor: 'var(--surface-card)' }}>
              <p style={{ color: 'var(--text-tertiary)' }}>No fee records found</p>
            </div>
          ) : (
            <div className="shadow overflow-hidden" style={{ borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-card)' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: 'var(--surface-hover)' }}>
                    <tr>
                      <th className="text-left text-xs font-medium uppercase tracking-wider" style={{ padding: 'var(--space-sm) var(--space-lg)', color: 'var(--text-tertiary)' }}>
                        Month/Year
                      </th>
                      <th className="text-left text-xs font-medium uppercase tracking-wider" style={{ padding: 'var(--space-sm) var(--space-lg)', color: 'var(--text-tertiary)' }}>
                        Amount
                      </th>
                      <th className="text-left text-xs font-medium uppercase tracking-wider" style={{ padding: 'var(--space-sm) var(--space-lg)', color: 'var(--text-tertiary)' }}>
                        Status
                      </th>
                      <th className="text-left text-xs font-medium uppercase tracking-wider" style={{ padding: 'var(--space-sm) var(--space-lg)', color: 'var(--text-tertiary)' }}>
                        Paid Date
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ borderTop: '1px solid var(--border-default)', backgroundColor: 'var(--surface-card)' }}>
                    {studentFees.map((fee) => (
                      <tr key={fee.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                        <td className="whitespace-nowrap text-sm font-medium" style={{ padding: 'var(--space-md) var(--space-lg)', color: 'var(--text-primary)' }}>
                          {formatMonthYear(fee.monthYear)}
                        </td>
                        <td className="whitespace-nowrap text-sm font-medium" style={{ padding: 'var(--space-md) var(--space-lg)', color: 'var(--text-primary)' }}>
                          {formatCurrency(fee.amount)}
                        </td>
                        <td className="whitespace-nowrap" style={{ padding: 'var(--space-md) var(--space-lg)' }}>
                          <span
                            className={`inline-flex text-xs font-semibold ${getStatusBadgeClasses(fee.status)}`}
                            style={{ padding: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-pill)' }}
                          >
                            {fee.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap text-sm" style={{ padding: 'var(--space-md) var(--space-lg)', color: 'var(--text-tertiary)' }}>
                          {fee.paidDate ? formatDate(fee.paidDate) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
