/**
 * LoveAll Application Type Definitions
 * Core types for the entire application
 */

/* ============================================================================
   USER & AUTHENTICATION TYPES
   ============================================================================ */

export type UserRole = 'ADMIN' | 'HEAD_COACH' | 'ASSISTANT_COACH' | 'STUDENT';

export interface User {
  id: string;
  username: string;
  passwordHash?: string; // Only on backend
  role: UserRole;
  name: string;
  email?: string;
  profilePhoto?: string;
  phone?: string; // For coaches
  specialization?: string; // For coaches
  qualifications?: string; // For coaches
  certifications?: string; // For coaches
  bio?: string; // For coaches
  canAccessFees?: boolean; // Fee access permission (returned by GET /api/coaches)
  createdAt: Date;
  lastActive: Date;
}

export interface AuthContext {
  user: User | null;
  role: UserRole | null;
  centerId: string | null; // null for ADMIN users
  canAccessFees: boolean;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string, centerSlug?: string) => Promise<void>;
  logout: () => void;
  // Multi-center membership fields
  memberships: CenterMembership[];
  activeCenterId: string | null;
  activeRole: UserRole | null;
  switchCenter: (centerId: string) => void;
}

/* ============================================================================
   MULTI-CENTER MEMBERSHIP TYPES
   ============================================================================ */

export interface CenterMembership {
  centerId: string;
  centerName: string;
  role: UserRole;
  canAccessFees: boolean;
}

export interface SlugChangeRequest {
  id: string;
  centerId: string;
  centerName?: string;
  requestedSlug: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedBy: string;
  createdAt: string;
}

/* ============================================================================
   CENTER TYPES
   ============================================================================ */

export interface CenterPublicInfo {
  name: string;
  logoUrl: string | null;
  slug: string;
}

export interface Center {
  id: string;
  name: string;
  slug?: string;
  location: string;
  contactPhone?: string;
  contactEmail?: string;
  logoUrl?: string;
  isActive: boolean;
  headCoachId?: string;
  headCoachEmail?: string;
  planType?: string;
  subscriptionExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

/* ============================================================================
   STUDENT TYPES
   ============================================================================ */

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional';
export type Gender = 'Male' | 'Female' | 'Other';
export type StudentStatus = 'active' | 'archived';

export interface Student {
  id: string;
  fullName: string;
  dateOfBirth: Date;
  age: number; // Computed from DOB
  gender: Gender;
  contactPhone: string;
  email?: string;
  guardianName?: string; // Required if under 18
  guardianPhone?: string; // Required if under 18
  baidNumber?: string;
  batchId?: string;
  assignedCoachId?: string;
  profilePhoto?: string;
  height?: number; // cm
  weight?: number; // kg
  bmi?: number; // Computed
  bloodGroup?: string;
  medicalConditions?: string;
  emergencyContact?: string;
  strengths: string[];
  weaknesses: string[];
  coachFeedback?: string;
  skillLevel: SkillLevel;
  status?: StudentStatus;
  archivedAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ============================================================================
   SKILL ASSESSMENT TYPES
   ============================================================================ */

export type SkillScore = 0 | 1 | 2 | 3 | 4;
export type SkillCategory = 'forehand' | 'backhand' | 'return' | 'service' | 'overhead' | 'rally';

export interface CategoryScores {
  [skillName: string]: SkillScore;
}

export interface SkillScores {
  forehand: CategoryScores;
  backhand: CategoryScores;
  return: CategoryScores;
  service: CategoryScores;
  overhead: CategoryScores;
  rally: CategoryScores;
}

export interface SkillAssessment {
  id: string;
  studentId: string;
  cycleKey: string; // "Jan-Feb 2026"
  recordedBy: string; // Coach name
  recordedAt: Date;
  scores: SkillScores;
  isLocked: boolean; // true for past cycles
}

export interface Weakness {
  skillName: string;
  category: SkillCategory;
  currentScore: SkillScore;
  trend: 'improving' | 'stable' | 'declining';
}

/* Skill Definitions: 60 skills distributed across 6 categories (10 per category) */
export const SKILL_DEFINITIONS: Record<SkillCategory, string[]> = {
  forehand: [
    'Clear',
    'Drop',
    'Smash',
    'Drive',
    'Net Shot',
    'Lift',
    'Cross Drop',
    'Slice',
    'Push',
    'Tap'
  ],
  backhand: [
    'Clear',
    'Drop',
    'Smash',
    'Drive',
    'Net Shot',
    'Lift',
    'Cross Drop',
    'Slice',
    'Push',
    'Tap'
  ],
  return: [
    'Short Return',
    'Deep Return',
    'Cross Return',
    'Fast Return',
    'Slow Return',
    'Attacking Return',
    'Defensive Return',
    'Flick Return',
    'Push Return',
    'Drive Return'
  ],
  service: [
    'High Serve',
    'Low Serve',
    'Flick Serve',
    'Drive Serve',
    'Slice Serve',
    'Jump Serve',
    'Fastball Serve',
    'Deceptive Serve',
    'Side Service',
    'Midcourt Serve'
  ],
  overhead: [
    'Smash',
    'Clear',
    'Drop',
    'Drive',
    'Lob',
    'Cross Smash',
    'Kill Shot',
    'Flat Drive',
    'Angled Smash',
    'Block Smash'
  ],
  rally: [
    'Rally Control',
    'Attack Placement',
    'Defensive Positioning',
    'Court Movement',
    'Shot Selection',
    'Tempo Control',
    'Momentum Building',
    'Under Pressure',
    'Endurance',
    'Mental Resilience'
  ]
};

/* ============================================================================
   FEE TYPES
   ============================================================================ */

export type FeeStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'WAIVED';
export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER';

export interface FeeRecord {
  id: string;
  studentId: string;
  amount: number;
  monthYear: string; // "2026-01"
  dueDate: Date;
  paidDate?: Date;
  status: FeeStatus;
  paymentMethod?: PaymentMethod;
  transactionRef?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ============================================================================
   CURRICULUM TYPES
   ============================================================================ */

/**
 * Drill - Individual training exercise with description and category
 */
export interface Drill {
  id: string;
  name: string;
  description: string;
  category: string; // e.g., "Footwork", "Stroke Practice", "Service", "Net Play"
}

/**
 * WeekPlan - Training plan for a specific week within an 8-week cycle
 */
export interface WeekPlan {
  weekNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  focusArea: string;
  drills: Drill[];
  objective: string;
}

/**
 * CurriculumPlan - 8-week training curriculum for a batch or individual student
 * 
 * CONSTRAINT: A plan must have EITHER batchId OR studentId, but NOT both.
 * - Batch plans: batchId is set, studentId is null
 * - Individual plans: studentId is set, batchId is null
 * - sourceBatchPlanId: Set when an individual plan is copied from a batch plan
 */
export interface CurriculumPlan {
  id: string;
  cycleKey: string; // "Jan-Feb 2026"
  batchId?: string; // Set for batch-level curriculum plans
  studentId?: string; // Set for individual student curriculum plans
  sourceBatchPlanId?: string; // Reference to batch plan if copied from one
  weeks: WeekPlan[]; // Must contain exactly 8 WeekPlan entries
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean; // true for past cycles
}

/* ============================================================================
   TRAINING LOG TYPES
   ============================================================================ */

export interface TrainingLog {
  id: string;
  studentId: string;
  weekNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  cycleKey: string; // "Jan-Feb 2026"
  sessionNotes: string;
  isCompleted: boolean;
  recordedBy: string;
  recordedAt: Date;
}

/* ============================================================================
   BATCH TYPES
   ============================================================================ */

export interface Batch {
  id: string;
  name: string;
  schedule: string;
  assignedCoachId?: string;
  studentCount: number;
  createdAt: Date;
}

/* ============================================================================
   EXPENSE TYPES
   ============================================================================ */

export type ExpenseType = 'SHUTTLE' | 'SUPPLIES' | 'TRAVEL' | 'OTHER';

export interface Expense {
  id: string;
  coachId: string;
  type: ExpenseType;
  amount: number;
  date: Date;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID who created it
}

/* ============================================================================
   COACH DETAIL PAGE TYPES
   ============================================================================ */

export type TabName = 'profile' | 'batches' | 'students' | 'payments';

export interface ProfileEditForm {
  name: string;
  email: string;
  phone?: string;
  specialization: string;
  qualifications?: string;
  certifications?: string;
  bio?: string;
}

export interface PaymentFilters {
  dateFrom?: Date;
  dateTo?: Date;
  student?: string;
  batch?: string;
  paymentMethod?: PaymentMethod;
  expenseType?: ExpenseType;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  periodData: Array<{
    period: 'MONTH' | 'QUARTER' | 'YEAR';
    label?: string; // Optional: "January 2026", "Q1 2026", "Year-to-Date 2026"
    income: number;
    expenses: number;
    net: number;
  }>;
}

/* ============================================================================
   FILTER & PAGINATION TYPES
   ============================================================================ */

export interface StudentFilters {
  search?: string;
  batch?: string;
  skillLevel?: SkillLevel;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationParams;
}

/* ============================================================================
   API RESPONSE TYPES
   ============================================================================ */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  status: number;
  message: string;
  details?: Record<string, unknown>;
}

/* ============================================================================
   UI COMPONENT PROPS TYPES
   ============================================================================ */

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  clickable?: boolean;
  onClick?: () => void;
}

export interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (value: string | number) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

/* ============================================================================
   FORM TYPES
   ============================================================================ */

export interface FormErrors {
  [key: string]: string | undefined;
}

export interface FormState<T> {
  data: T;
  errors: FormErrors;
  isSubmitting: boolean;
  isDirty: boolean;
}

/* ============================================================================
   API REQUEST/RESPONSE TYPES (PHASE 7)
   ============================================================================ */

export interface LoginRequest {
  email: string;
  password: string;
  centerSlug?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  role: UserRole;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CreateStudentRequest extends Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'age' | 'bmi'> {
  // age and bmi are computed on backend
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CreateFeeRequest extends Omit<FeeRecord, 'id' | 'createdAt' | 'updatedAt'> {
  // Only status should be initially PENDING
}

export interface MarkFeeAsPaidRequest {
  paidDate: Date;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  notes?: string;
}

export interface WaiveFeeRequest {
  reason: string;
}


/* ============================================================================
   ATTENDANCE & LEAVE TYPES
   ============================================================================ */

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';
export type LeaveType = 'PLANNED_LEAVE' | 'SICK_LEAVE' | 'NO_SHOW';
export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  batchId: string;
  sessionDate: string;
  status: AttendanceStatus;
  leaveType?: LeaveType;
  markedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  batchId: string;
  requestedDate: string;
  leaveType: LeaveType;
  reason?: string;
  status: LeaveRequestStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

/* ============================================================================
   SESSION SCHEDULE TYPES
   ============================================================================ */

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type EndType = 'never' | 'on_date' | 'after_count';

export interface SessionSlot {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface RecurrencePattern {
  repeatEvery: number;
  repeatUnit: 'week';
  repeatDays: DayOfWeek[];
  endType: EndType;
  endDate?: string;
  occurrenceCount?: number;
}

export interface SessionSchedule {
  id: string;
  batchId: string;
  slots: SessionSlot[];
  recurrence: RecurrencePattern;
  cycleStartDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionNote {
  id: string;
  batchId: string;
  sessionDate: string;
  noteText: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumWeekMapping {
  id: string;
  batchId: string;
  cycleKey: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
}

/* ============================================================================
   ANALYTICS TYPES
   ============================================================================ */

export interface AttendanceStats {
  studentId: string;
  studentName: string;
  totalSessions: number;
  attended: number;
  late: number;
  absent: number;
  attendancePercentage: number;
}

export interface DrillCompletionStats {
  weekNumber: number;
  focusArea: string;
  totalDrills: number;
  completedDrills: number;
  completionRate: number;
  drills: Array<{
    name: string;
    category: string;
    completed: boolean;
    notes?: string;
  }>;
}

export interface SkillImprovementDelta {
  category: string;
  startScore: number;
  endScore: number;
  delta: number;
  relatedDrills: string[];
  drillCompletionRate: number;
}

export interface TrainingEffectivenessReport {
  studentId: string;
  cycleKey: string;
  overallScore: number;
  categories: SkillImprovementDelta[];
  insufficientData: boolean;
}

export interface BatchComparisonMetric {
  batchId: string;
  batchName: string;
  avgSkillImprovement: number;
  avgAttendancePercentage: number;
  avgDrillCompletionRate: number;
}

export interface TrendDataPoint {
  cycleKey: string;
  attendancePercentage: number;
  avgSkillScore: number;
}

export interface StudentTrendReport {
  studentId: string;
  dataPoints: TrendDataPoint[];
  correlationCoefficient?: number;
}

/* ============================================================================
   CALENDAR TYPES
   ============================================================================ */

export interface CalendarEntry {
  date: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  batchId: string;
  batchName: string;
  weekNumber: number;
  focusArea: string;
  drills: string[];
  attendanceRecorded: boolean;
  coachNote?: string;
}
