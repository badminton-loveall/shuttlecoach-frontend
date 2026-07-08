import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import StudentGrid from '../components/StudentGrid';
import EnrollStudentModal, { type EnrollStudentFormData } from '../components/EnrollStudentModal';
import CollapsibleFilterPanel from '../components/CollapsibleFilterPanel';
import { useAuth } from '../contexts/AuthContext';
import STUDENTS_DATA from '../data/students.json';
import USERS_DATA from '../data/users.json';
import type { Student, User } from '../types';

/**
 * StudentsPage
 * Lists and manages students for Head Coach and Assistant Coach
 * Requirements: 2.3, 2.4, 24.1-24.7
 * 
 * Currently uses mock JSON data. Will be migrated to API in production.
 */

export const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  useAuth(); // auth context reserved for future use
  const [searchTerm, setSearchTerm] = useState('');
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    batch: '',
    skillLevel: '',
    coach: '',
  });
  const [localStudents, setLocalStudents] = useState<Student[]>([]);

  // Parse mock students data
  const students: Student[] = useMemo(() => {
    try {
      const baseStudents = Array.isArray(STUDENTS_DATA) ? STUDENTS_DATA.map((s) => ({
        ...s,
        dateOfBirth: new Date(s.dateOfBirth as string),
        createdAt: new Date(s.createdAt as string),
        updatedAt: new Date(s.updatedAt as string),
      })) as unknown as Student[] : [];
      return localStudents.length > 0 ? [...baseStudents, ...localStudents] : baseStudents;
    } catch {
      return localStudents;
    }
  }, [localStudents]);

  // Parse mock users data (for coach names)
  const users: User[] = useMemo(() => {
    try {
      return Array.isArray(USERS_DATA) ? USERS_DATA.map((u) => ({
        ...u,
        createdAt: new Date(u.createdAt as string),
        lastActive: new Date(u.lastActive as string),
      })) as unknown as User[] : [];
    } catch {
      return [];
    }
  }, []);

  // Get batch options for filters and enrollment modal
  const batchOptions = useMemo(() => {
    const batchIds = new Set(students.map(s => s.batchId).filter(Boolean) as string[]);
    const filterBatches = Array.from(batchIds).map(batchId => ({
      value: batchId,
      label: batchId || 'Unknown',
    }));
    return filterBatches;
  }, [students]);

  // Get coach options for filters and enrollment modal
  const coachOptions = useMemo(() => {
    return users
      .filter(u => u.role === 'ASSISTANT_COACH')
      .map(u => ({
        value: u.id,
        label: u.name || 'Unknown Coach',
      }));
  }, [users]);

  // Apply search and filter logic
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // Search filter (name, BAID, batch)
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const nameMatch = s.fullName.toLowerCase().includes(query);
        const baidMatch = s.baidNumber?.toLowerCase().includes(query);
        const batchMatch = (s.batchId || '').toLowerCase().includes(query);
        
        if (!nameMatch && !baidMatch && !batchMatch) {
          return false;
        }
      }

      // Batch filter
      if (filters.batch && s.batchId !== filters.batch) {
        return false;
      }

      // Skill level filter
      if (filters.skillLevel && s.skillLevel !== filters.skillLevel) {
        return false;
      }

      // Coach filter
      if (filters.coach && s.assignedCoachId !== filters.coach) {
        return false;
      }

      return true;
    });
  }, [students, searchTerm, filters]);

  const handleStudentClick = (studentId: string) => {
    navigate(`/student/${studentId}`);
  };

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
  }, []);

  // Get batch and coach options for enrollment modal
  const enrollmentBatchOptions = useMemo(() => {
    return batchOptions.map(batch => ({
      id: batch.value,
      name: batch.label,
    }));
  }, [batchOptions]);

  const enrollmentCoachOptions = useMemo(() => {
    return coachOptions.map(coach => ({
      id: coach.value,
      name: coach.label,
    }));
  }, [coachOptions]);

  // Handle enroll student submission
  const handleEnrollSubmit = (studentData: EnrollStudentFormData) => {
    const newStudent: Student = {
      id: `student-${Date.now()}`,
      fullName: studentData.fullName,
      dateOfBirth: studentData.dateOfBirth,
      age: Math.floor((new Date().getTime() - studentData.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
      gender: studentData.gender,
      contactPhone: studentData.contactPhone,
      email: studentData.email,
      guardianName: studentData.guardianName,
      guardianPhone: studentData.guardianPhone,
      baidNumber: studentData.baidNumber,
      batchId: studentData.batchId,
      skillLevel: studentData.skillLevel,
      assignedCoachId: studentData.assignedCoachId,
      profilePhoto: undefined,
      strengths: [],
      weaknesses: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setLocalStudents([...localStudents, newStudent]);
    setIsEnrollModalOpen(false);
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

          {/* Students Grid */}
          <StudentGrid
            students={filteredStudents}
            onStudentClick={handleStudentClick}
          />
        </div>

        {/* Enroll Student Modal */}
        <EnrollStudentModal
          isOpen={isEnrollModalOpen}
          onClose={() => setIsEnrollModalOpen(false)}
          onSubmit={handleEnrollSubmit}
          batches={enrollmentBatchOptions}
          coaches={enrollmentCoachOptions}
        />
      </div>
    </DashboardLayout>
  );
};

export default StudentsPage;
