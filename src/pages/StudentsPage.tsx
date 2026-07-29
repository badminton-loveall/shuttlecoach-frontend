import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import StudentGrid from '../components/StudentGrid';
import EnrollStudentModal, { type EnrollStudentFormData } from '../components/EnrollStudentModal';
import CollapsibleFilterPanel from '../components/CollapsibleFilterPanel';
import { useStudents } from '../hooks/useStudents';
import type { User, Batch } from '../types';
import apiClient from '../utils/apiClient';
import USERS_DATA from '../data/users.json';

/**
 * StudentsPage
 * Lists and manages students for Head Coach and Assistant Coach
 * Requirements: 2.3, 2.4, 24.1-24.7
 */

export const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    batch: '',
    skillLevel: '',
    coach: '',
  });

  // Fetch students from API
  const { students, loading, error, createStudent, refetch } = useStudents({
    batch: filters.batch || undefined,
    coach: filters.coach || undefined,
    search: searchTerm || undefined,
  });

  // Fetch batches from API for dropdown and filters
  const [batches, setBatches] = useState<Batch[]>([]);
  useEffect(() => {
    const loadBatches = async () => {
      try {
        const response = await apiClient.get('/batches');
        const batchData = response.data.batches || response.data;
        setBatches(Array.isArray(batchData) ? batchData : []);
      } catch {
        setBatches([]);
      }
    };
    void loadBatches();
  }, []);

  // Fetch coaches from API (real UUIDs required for validation)
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    const loadCoaches = async () => {
      try {
        const response = await apiClient.get('/coaches');
        // API returns array directly: [{id, name, ...}, ...]
        const coachData = Array.isArray(response.data) ? response.data : (response.data.coaches || []);
        const parsed = coachData.map((u: Record<string, unknown>) => ({
          ...u,
          createdAt: new Date(u.createdAt as string),
          lastActive: new Date(u.lastActive as string),
        })) as User[];
        setUsers(parsed);
      } catch {
        // Fallback to static data if API unavailable
        try {
          const fallback = Array.isArray(USERS_DATA) ? USERS_DATA.map((u) => ({
            ...u,
            createdAt: new Date(u.createdAt as string),
            lastActive: new Date(u.lastActive as string),
          })) as unknown as User[] : [];
          setUsers(fallback);
        } catch {
          setUsers([]);
        }
      }
    };
    void loadCoaches();
  }, []);

  // Get batch options from API data
  const batchOptions = useMemo(() => {
    return batches.map(batch => ({ value: batch.id, label: batch.name }));
  }, [batches]);

  // Get coach options
  const coachOptions = useMemo(() => {
    return users
      .filter(u => u.role === 'ASSISTANT_COACH')
      .map(u => ({ value: u.id, label: u.name || 'Unknown Coach' }));
  }, [users]);

  // Client-side skill level filter (API doesn't filter by skill level)
  const filteredStudents = useMemo(() => {
    if (!filters.skillLevel) return students;
    return students.filter(s => s.skillLevel === filters.skillLevel);
  }, [students, filters.skillLevel]);

  const handleStudentClick = (studentId: string) => {
    navigate(`/student/${studentId}`);
  };

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
  }, []);

  // Enrollment modal options
  const enrollmentBatchOptions = useMemo(() =>
    batchOptions.map(b => ({ id: b.value, name: b.label })),
  [batchOptions]);

  const enrollmentCoachOptions = useMemo(() =>
    coachOptions.map(c => ({ id: c.value, name: c.label })),
  [coachOptions]);

  // Handle enroll — calls API to persist
  const handleEnrollSubmit = async (studentData: EnrollStudentFormData) => {
    try {
      await createStudent({
        fullName:        studentData.fullName,
        dateOfBirth:     studentData.dateOfBirth,
        gender:          studentData.gender,
        contactPhone:    studentData.contactPhone,
        email:           studentData.email,
        guardianName:    studentData.guardianName,
        guardianPhone:   studentData.guardianPhone,
        baidNumber:      studentData.baidNumber,
        batchId:         studentData.batchId,
        skillLevel:      studentData.skillLevel,
        assignedCoachId: studentData.assignedCoachId,
        strengths:       [],
        weaknesses:      [],
      });
      setIsEnrollModalOpen(false);
      await refetch();
    } catch (err) {
      console.error('Failed to enroll student:', err);
      throw err; // Re-throw so modal handles field-level errors
    }
  };

  return (
    <DashboardLayout>
      <div className="hc-dashboard">
        <div className="hc-dashboard-content">
          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-header-title">All Students</h1>
              <p className="page-header-subtitle">Manage and enroll students in the academy</p>
            </div>
            <div className="page-header-actions">
              <CollapsibleFilterPanel activeFilterCount={(filters.batch ? 1 : 0) + (filters.skillLevel ? 1 : 0) + (filters.coach ? 1 : 0) + (searchTerm ? 1 : 0)}>
                <div className="filter-panel-inner">
                  <div className="filter-panel-search">
                    <input type="text" placeholder="Search by name, BAID, or batch..." className="filter-search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>

                  <select value={filters.batch} onChange={(e) => handleFilterChange({ ...filters, batch: e.target.value })} className="filter-dropdown" title="Filter by batch">
                    <option value="">All Batches</option>
                    {batchOptions.map((batch) => (<option key={batch.value} value={batch.value}>{batch.label}</option>))}
                  </select>

                  <select value={filters.skillLevel} onChange={(e) => handleFilterChange({ ...filters, skillLevel: e.target.value })} className="filter-dropdown" title="Filter by skill level">
                    <option value="">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Professional">Professional</option>
                  </select>

                  <select value={filters.coach} onChange={(e) => handleFilterChange({ ...filters, coach: e.target.value })} className="filter-dropdown" title="Filter by coach">
                    <option value="">All Coaches</option>
                    {coachOptions.map((coach) => (<option key={coach.value} value={coach.value}>{coach.label}</option>))}
                  </select>

                  <div className="filter-results">
                    <span className="filter-count">{filteredStudents.length} of {students.length} students</span>
                  </div>
                </div>
              </CollapsibleFilterPanel>
              <button
                onClick={() => setIsEnrollModalOpen(true)}
                className="btn-create-fee"
                title="Enroll new student"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Enroll New Student
              </button>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="p-md" style={{ backgroundColor: 'var(--feedback-danger-light)', border: '1px solid var(--color-danger-light)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)' }}>
              <p className="text-small" style={{ color: 'var(--color-danger-text)' }}>{error}</p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex-center" style={{ paddingTop: 'var(--space-3xl)', paddingBottom: 'var(--space-3xl)' }}>
              <div className="animate-spin" style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-pill)', borderBottom: '2px solid var(--color-primary)' }}></div>
            </div>
          )}

          {/* Students Grid */}
          {!loading && (
            <StudentGrid
              students={filteredStudents}
              onStudentClick={handleStudentClick}
            />
          )}
        </div>

        {/* Enroll Student Modal */}
        <EnrollStudentModal
          isOpen={isEnrollModalOpen}
          onClose={() => { setIsEnrollModalOpen(false); }}
          onSubmit={handleEnrollSubmit}
          batches={enrollmentBatchOptions}
          coaches={enrollmentCoachOptions}
        />
      </div>
    </DashboardLayout>
  );
};

export default StudentsPage;
