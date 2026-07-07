import React, { useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import StudentGrid from '../components/StudentGrid';
import SearchInput from '../components/SearchInput';
import FilterBar from '../components/FilterBar';
import FeeAlerts from '../components/FeeAlerts';
import RecentActivity from '../components/RecentActivity';
import type { FilterValues } from '../components/FilterBar';
import { useAuth } from '../contexts/AuthContext';
import { calculateDashboardStats } from '../utils/dashboardUtils';
import { getOverdueFeesByStudent } from '../utils/feeUtils';
import { generateActivityFeed } from '../utils/activityUtils';
import STUDENTS_DATA from '../data/students.json';
import FEES_DATA from '../data/fees.json';
import SKILL_ASSESSMENTS_DATA from '../data/skillAssessments.json';
import TRAINING_LOGS_DATA from '../data/trainingLogs.json';
import type { Student, FeeRecord, SkillAssessment, TrainingLog } from '../types';
import '../styles/pages.css';

/**
 * AssistantCoachDashboard Page
 * Displays assistant coach dashboard with scoped data showing only assigned students
 * Shows: total assigned students, BAID-registered count (scoped), average progress (scoped)
 * Hides batch count card (Assistant Coaches don't manage batches directly)
 * Includes search and filter functionality with URL query parameter persistence
 * Pure CSS implementation using design tokens
 */

// Map raw JSON data to proper Student type with parsed dates
const parseStudents = (data: unknown): Student[] => {
  const studentArray = data as Array<Record<string, unknown>>;
  return studentArray.map((s) => ({
    ...(s as unknown as Student),
    dateOfBirth: new Date(s.dateOfBirth as string),
    createdAt: new Date(s.createdAt as string),
    updatedAt: new Date(s.updatedAt as string),
  }));
};

// Parse fees with proper date types
const parseFees = (data: unknown): FeeRecord[] => {
  const feeArray = data as Array<Record<string, unknown>>;
  return feeArray.map((f) => ({
    ...(f as unknown as FeeRecord),
    dueDate: new Date(f.dueDate as string),
    paidDate: f.paidDate ? new Date(f.paidDate as string) : undefined,
    createdAt: new Date(f.createdAt as string),
    updatedAt: new Date(f.updatedAt as string),
  }));
};

// Parse skill assessments with proper date types
const parseAssessments = (data: unknown): SkillAssessment[] => {
  const assessmentArray = data as Array<Record<string, unknown>>;
  return assessmentArray.map((a) => ({
    ...(a as unknown as SkillAssessment),
    recordedAt: new Date(a.recordedAt as string),
  }));
};

// Parse training logs with proper date types
const parseTrainingLogs = (data: unknown): TrainingLog[] => {
  const logArray = data as Array<Record<string, unknown>>;
  return logArray.map((l) => ({
    ...(l as unknown as TrainingLog),
    recordedAt: new Date(l.recordedAt as string),
  }));
};

// Extract batch options from student data
const getBatchOptions = (students: Student[]) => {
  const batchIds = new Set<string>();
  students.forEach((s) => {
    if (s.batchId) batchIds.add(s.batchId);
  });
  return Array.from(batchIds)
    .sort()
    .map((id) => ({
      value: id,
      label: `Batch ${id.split('-')[1]}`,
    }));
};

// Filter and search students
const filterStudents = (
  students: Student[],
  searchQuery: string,
  filters: FilterValues
): Student[] => {
  return students.filter((student) => {
    // Search: match against name, BAID, and batch (case insensitive)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = student.fullName.toLowerCase().includes(query);
      const baidMatch = student.baidNumber?.toLowerCase().includes(query) ?? false;
      const batchMatch = student.batchId?.toLowerCase().includes(query) ?? false;
      if (!nameMatch && !baidMatch && !batchMatch) {
        return false;
      }
    }

    // Filter by batch (AND operation)
    if (filters.batch && student.batchId !== filters.batch) {
      return false;
    }

    // Filter by skill level (AND operation)
    if (filters.skillLevel && student.skillLevel !== filters.skillLevel) {
      return false;
    }

    return true;
  });
};

export const AssistantCoachDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read filter state from URL query parameters
  const searchQuery = searchParams.get('search') || '';
  const filters: FilterValues = {
    batch: searchParams.get('batch') || '',
    skillLevel: searchParams.get('skillLevel') || '',
    coach: '', // Not used for assistant coach
  };

  // Parse all students and filter to assigned students only
  const allStudents = useMemo(() => parseStudents(STUDENTS_DATA), []);
  
  // Filter students to show only those assigned to the current assistant coach
  const assignedStudents = useMemo(
    () => allStudents.filter((student) => student.assignedCoachId === user?.id),
    [allStudents, user?.id]
  );

  // Parse fees and filter to assigned students only
  const allFees = useMemo(() => parseFees(FEES_DATA), []);
  const assignedStudentIds = useMemo(
    () => new Set(assignedStudents.map((s) => s.id)),
    [assignedStudents]
  );
  const assignedFees = useMemo(
    () => allFees.filter((fee) => assignedStudentIds.has(fee.studentId)),
    [allFees, assignedStudentIds]
  );

  // Parse assessments and training logs, filter to assigned students
  const allAssessments = useMemo(() => parseAssessments(SKILL_ASSESSMENTS_DATA), []);
  const assignedAssessments = useMemo(
    () => allAssessments.filter((a) => assignedStudentIds.has(a.studentId)),
    [allAssessments, assignedStudentIds]
  );

  const allTrainingLogs = useMemo(() => parseTrainingLogs(TRAINING_LOGS_DATA), []);
  const assignedTrainingLogs = useMemo(
    () => allTrainingLogs.filter((l) => assignedStudentIds.has(l.studentId)),
    [allTrainingLogs, assignedStudentIds]
  );

  // Calculate overdue fees for assigned students only
  const overdueFees = useMemo(
    () => getOverdueFeesByStudent(assignedFees, assignedStudents),
    [assignedFees, assignedStudents]
  );

  // Generate recent activity feed for assigned students only
  const recentActivities = useMemo(
    () => generateActivityFeed(assignedAssessments, assignedTrainingLogs, assignedStudents, 10),
    [assignedAssessments, assignedTrainingLogs, assignedStudents]
  );

  // Calculate dashboard statistics based on assigned students only
  const stats = useMemo(() => calculateDashboardStats(assignedStudents), [assignedStudents]);

  // Get filter options from assigned students only
  const batchOptions = useMemo(() => getBatchOptions(assignedStudents), [assignedStudents]);

  // Apply search and filters to get filtered students
  const filteredStudents = useMemo(
    () => filterStudents(assignedStudents, searchQuery, filters),
    [assignedStudents, searchQuery, filters]
  );

  // Update URL params helper
  const updateSearchParams = useCallback(
    (updates: Record<string, string>) => {
      const newParams = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
      });
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Handle search change
  const handleSearchChange = useCallback(
    (value: string) => {
      updateSearchParams({ search: value });
    },
    [updateSearchParams]
  );

  // Handle filter change
  const handleFilterChange = useCallback(
    (newFilters: FilterValues) => {
      updateSearchParams({
        batch: newFilters.batch,
        skillLevel: newFilters.skillLevel,
      });
    },
    [updateSearchParams]
  );

  // Handle student card click
  const handleStudentClick = (studentId: string) => {
    navigate(`/student/${studentId}`);
  };

  return (
    <DashboardLayout>
      <div className="ac-dashboard">
        {/* Welcome Section */}
        <div className="ac-welcome">
          <h1 className="ac-welcome-title">Welcome, {user?.name}!</h1>
          <p className="ac-welcome-subtitle">Here's an overview of your assigned students</p>
        </div>

        {/* Stat Cards Grid - 3 cards for Assistant Coach (no batch count) */}
        <div className="ac-stats-grid">
          {/* Total Assigned Students */}
          <StatCard
            title="Assigned Students"
            value={stats.totalStudents}
            label="Students under your coaching"
            icon={<StudentIconSvg />}
            variant="info"
          />

          {/* BAID Registered (scoped to assigned students) */}
          <StatCard
            title="BAID Registered"
            value={`${stats.baidRegistered}/${stats.totalStudents}`}
            label={`${stats.baidPercentage}% registered`}
            icon={<BaidIconSvg />}
            variant="success"
          />

          {/* Average Progress (scoped to assigned students) */}
          <StatCard
            title="Avg Progress"
            value={stats.averageProgress}
            label={stats.averageProgressLabel.split('(')[1]?.slice(0, -1) || 'Level'}
            icon={<ProgressIconSvg />}
            variant="info"
          />
        </div>

        {/* Student Grid Section */}
        <div className="ac-section">
          <h2 className="ac-section-title">My Students</h2>

          {/* Search and Filter Controls (no coach filter) */}
          <div className="ac-search-filter-row">
            <SearchInput value={searchQuery} onChange={handleSearchChange} />
            {/* Assistant coaches don't filter by coach */}
            <FilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              batchOptions={batchOptions}
              coachOptions={[]}
            />
          </div>

          {/* Results count when filtered */}
          {(searchQuery || filters.batch || filters.skillLevel) && (
            <p className="ac-filter-results">
              Showing {filteredStudents.length} of {assignedStudents.length} students
            </p>
          )}

          <StudentGrid students={filteredStudents} onStudentClick={handleStudentClick} />
        </div>

        {/* Progressive Dashboard Features - Phase 6 (Scoped to Assigned Students) */}
        <div className="ac-overview">
          <h2 className="ac-overview-title">Dashboard Overview</h2>
          <div className="ac-overview-grid">
            {/* Fee Alerts (Assigned Students Only) */}
            <FeeAlerts 
              overdueFees={overdueFees} 
              onViewDetails={() => navigate('/fees')}
            />

            {/* Recent Activity Feed (Assigned Students Only) */}
            <RecentActivity activities={recentActivities} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Icon SVG Components (reused from HeadCoachDashboard)
const StudentIconSvg: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const BaidIconSvg: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>
    <path d="M10 17l-4-4m4-4l4 4"></path>
    <path d="M10 9l4 4m-4 4l-4-4"></path>
  </svg>
);

const ProgressIconSvg: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

export default AssistantCoachDashboard;
