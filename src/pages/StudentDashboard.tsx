import React, { useMemo } from 'react';
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
import feesData from '../data/fees.json';
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

// Mapping of user IDs to student IDs
// In Phase 7, this will be handled by the backend API
const USER_TO_STUDENT_MAP: Record<string, string> = {
  'user-004': 'student-001',
  'user-005': 'student-002',
};

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  // Get the student ID for the current user
  const studentId = user?.id ? USER_TO_STUDENT_MAP[user.id] : null;

  // Get current cycle key and week number
  const currentCycleKey = useMemo(() => generateCycleKey(), []);
  const currentWeekNumber = useMemo(() => getCurrentWeekInCycle(), []);

  // Load student data
  const student = useMemo<Student | null>(() => {
    if (!studentId) return null;

    const studentRecord = studentsData.find((s) => s.id === studentId);
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
  }, [studentId]);

  // Load batch information
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

  // Load and filter fees for the current student
  const studentFees = useMemo(() => {
    if (!studentId) return [];

    // Load fees from JSON and convert date strings to Date objects
    const rawFees = feesData.map((fee) => ({
      ...fee,
      dueDate: new Date(fee.dueDate),
      paidDate: fee.paidDate ? new Date(fee.paidDate) : undefined,
      createdAt: new Date(fee.createdAt),
      updatedAt: new Date(fee.updatedAt),
    })) as FeeRecord[];

    // Filter fees by student ID
    const filtered = rawFees.filter((fee) => fee.studentId === studentId);

    // Compute current statuses (auto-detect OVERDUE)
    const withStatuses = computeAllFeeStatuses(filtered);

    // Sort in reverse chronological order (most recent first)
    return withStatuses.sort((a, b) => {
      const dateA = new Date(a.monthYear).getTime();
      const dateB = new Date(b.monthYear).getTime();
      return dateB - dateA;
    });
  }, [studentId]);

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
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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

  if (!user || !studentId || !student) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-gray-500 dark:text-gray-400">Unable to load student data</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Welcome Banner with Name and Photo */}
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 rounded-lg shadow-md p-6 border-l-4 border-primary">
            <div className="flex items-center gap-6">
              {/* Profile Photo */}
              <div className="flex-shrink-0">
                {student.profilePhoto ? (
                  <img
                    src={student.profilePhoto}
                    alt={student.fullName}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-lg">
                    <span className="text-3xl font-bold text-primary">
                      {student.fullName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Welcome Text */}
              <div>
                <h1 className="text-[36px] font-bold text-gray-900 dark:text-gray-100 mb-2 leading-tight">
                  Welcome back, {student.fullName}!
                </h1>
                <p className="text-gray-700 dark:text-gray-300 text-lg">
                  Keep up the great work! Here's your training overview.
                </p>
              </div>
            </div>
          </div>

          {/* Personal Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Current Skill Level Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Skill Level
              </p>
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {student.skillLevel}
            </p>
          </div>

            {/* Next Assessment Due Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Next Assessment
              </p>
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {nextAssessmentDue ? formatDate(nextAssessmentDue) : 'Not scheduled'}
            </p>
          </div>

            {/* Outstanding Fee Balance Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Fee Balance
              </p>
              <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(outstandingBalance)}
            </p>
            {outstandingBalance > 0 && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Payment due</p>
            )}
          </div>

            {/* Current Batch and Coach Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Batch & Coach
              </p>
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
              {batch?.name || 'No batch assigned'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Coach: {assignedCoach?.name || 'Not assigned'}
              </p>
            </div>
          </div>

          {/* Read-only Profile Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-[24px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
              My Profile
            </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Full Name</p>
              <p className="text-base text-gray-900 dark:text-gray-100">{student.fullName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Age</p>
              <p className="text-base text-gray-900 dark:text-gray-100">{calculateAge(student.dateOfBirth)} years</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Gender</p>
              <p className="text-base text-gray-900 dark:text-gray-100">{student.gender}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Contact Phone</p>
              <p className="text-base text-gray-900 dark:text-gray-100">{student.contactPhone}</p>
            </div>
            {student.email && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Email</p>
                <p className="text-base text-gray-900 dark:text-gray-100">{student.email}</p>
              </div>
            )}
            {student.baidNumber && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">BAID Number</p>
                <p className="text-base text-gray-900 dark:text-gray-100">{student.baidNumber}</p>
              </div>
            )}
            {student.guardianName && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Guardian Name</p>
                <p className="text-base text-gray-900 dark:text-gray-100">{student.guardianName}</p>
              </div>
            )}
            {student.guardianPhone && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Guardian Phone</p>
                <p className="text-base text-gray-900 dark:text-gray-100">{student.guardianPhone}</p>
              </div>
            )}
            {student.bloodGroup && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Blood Group</p>
                <p className="text-base text-gray-900 dark:text-gray-100">{student.bloodGroup}</p>
              </div>
            )}
            {student.height && student.weight && (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Height</p>
                  <p className="text-base text-gray-900 dark:text-gray-100">{student.height} cm</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Weight</p>
                  <p className="text-base text-gray-900 dark:text-gray-100">{student.weight} kg</p>
                </div>
                {student.bmi && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">BMI</p>
                    <p className="text-base text-gray-900 dark:text-gray-100">{student.bmi}</p>
                  </div>
                )}
              </>
            )}
            {student.emergencyContact && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Emergency Contact</p>
                <p className="text-base text-gray-900 dark:text-gray-100">{student.emergencyContact}</p>
              </div>
            )}
            {student.medicalConditions && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Medical Conditions</p>
                <p className="text-base text-gray-900 dark:text-gray-100">{student.medicalConditions}</p>
              </div>
            )}
          </div>
        </div>

          {/* Most Recent Skill Assessment Radar Chart */}
          {mostRecentAssessment && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-[24px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Latest Skill Assessment
              </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Recorded on {formatDate(mostRecentAssessment.recordedAt)} by {mostRecentAssessment.recordedBy}
            </p>
              <SkillRadarChart scores={mostRecentAssessment.scores} />
            </div>
          )}

          {/* Coach Feedback Section */}
          {student.coachFeedback && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-[24px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Coach Feedback
              </h2>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-gray-800 dark:text-gray-200">{student.coachFeedback}</p>
            </div>
          </div>
        )}

          {/* Strengths and Weaknesses */}
          {(student.strengths.length > 0 || student.weaknesses.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {student.strengths.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h2 className="text-[24px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Strengths
                  </h2>
                <div className="flex flex-wrap gap-2">
                  {student.strengths.map((strength, index) => (
                    <span
                      key={index}
                      className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
            )}

              {student.weaknesses.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h2 className="text-[24px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Areas to Improve
                  </h2>
                <div className="flex flex-wrap gap-2">
                  {student.weaknesses.map((weakness, index) => (
                    <span
                      key={index}
                      className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium"
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
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg shadow-md p-6 border-l-4 border-primary">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-[24px] font-semibold text-gray-900 dark:text-gray-100">
                    Week {currentWeekNumber} Training Focus
                  </h2>
                <span className="bg-primary text-slate-900 px-3 py-1 rounded-full text-sm font-semibold">
                  Current Week
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentCycleKey}
              </p>
            </div>

            {/* Focus Area */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Focus Area
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-base">
                {currentWeekPlan.focusArea}
              </p>
            </div>

            {/* Training Objective */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                This Week's Objective
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-base">
                {currentWeekPlan.objective}
              </p>
            </div>

            {/* Drills */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Assigned Drills
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {currentWeekPlan.drills.map((drill) => (
                  <div
                    key={drill.id}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                        {drill.name}
                      </h4>
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs font-medium">
                        {drill.category}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center border-l-4 border-gray-300 dark:border-gray-600">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Curriculum Plan Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your coach hasn't assigned a training plan for this cycle yet.
              </p>
            </div>
          )}

          {/* Outstanding Balance Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Outstanding Balance
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {formatCurrency(outstandingBalance)}
              </p>
            </div>
            {outstandingBalance > 0 && (
              <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium">
                Payment Due
              </div>
            )}
            {outstandingBalance === 0 && (
              <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                All Paid
              </div>
            )}
          </div>
        </div>

          {/* Fee History Section */}
          <div>
            <h2 className="text-[24px] font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Fee History
            </h2>

          {studentFees.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No fee records found</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Month/Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Paid Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {studentFees.map((fee) => (
                      <tr key={fee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatMonthYear(fee.monthYear)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">
                          {formatCurrency(fee.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClasses(fee.status)}`}
                          >
                            {fee.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
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
