import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import StudentListTable from '../components/StudentListTable';
import EnrollStudentModal, { type EnrollStudentFormData } from '../components/EnrollStudentModal';
import CollapsibleFilterPanel from '../components/CollapsibleFilterPanel';
import CoachListTable from '../components/CoachListTable';
import AddCoachModal, { type CoachFormData } from '../components/AddCoachModal';
import EditCoachModal, { type EditCoachFormData } from '../components/EditCoachModal';
import DeleteCoachConfirmDialog from '../components/DeleteCoachConfirmDialog';
import AssignmentPanel from '../components/AssignmentPanel';
import { useStudents } from '../hooks/useStudents';
import { useCoaches } from '../hooks/useCoaches';
import type { User, Student, Batch } from '../types';
import apiClient from '../utils/apiClient';
import _USERS_DATA from '../data/users.json';
import { useBatches } from '@/hooks/useBatches';

const USERS_DATA = _USERS_DATA as Array<{
  id: string; username: string; role: string; name: string;
  email: string | null; profilePhoto: string | null;
  specialization: string | null; createdAt: string; lastActive: string;
}>;

/* ============================================================
   STUDENTS PAGE
   ============================================================ */
export const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [filters, setFilters] = useState({ batch: '', skillLevel: '', coach: '' });

  const { students, loading, error, createStudent, refetch } = useStudents({
    batch: filters.batch || undefined,
    coach: filters.coach || undefined,
    search: searchTerm || undefined,
  });

  const { batches: batchList, getBatchName } = useBatches();

  const [batches, setBatches] = useState<Batch[]>([]);
  useEffect(() => {
    setBatches(batchList);
  }, [batchList]);

  const [coachUsers, setCoachUsers] = useState<User[]>([]);
  useEffect(() => {
    apiClient.get('/coaches')
      .then((r) => {
        const d = Array.isArray(r.data) ? r.data : (r.data.coaches || []);
        setCoachUsers(d.map((u: Record<string, unknown>) => ({
          ...u,
          createdAt: new Date(u.createdAt as string),
          lastActive: new Date(u.lastActive as string),
        })) as User[]);
      })
      .catch(() => {
        try {
          setCoachUsers(USERS_DATA.map((u) => ({
            ...u, createdAt: new Date(u.createdAt), lastActive: new Date(u.lastActive),
          })) as unknown as User[]);
        } catch { setCoachUsers([]); }
      });
  }, []);

  const batchOptions = useMemo(() => batches.map((b) => ({ value: b.id, label: b.name })), [batches]);
  const coachOptions = useMemo(() =>
    coachUsers.filter((u) => u.role === 'ASSISTANT_COACH').map((u) => ({ value: u.id, label: u.name || 'Unknown' })),
  [coachUsers]);

  const filteredStudents = useMemo(() =>
    filters.skillLevel ? students.filter((s) => s.skillLevel === filters.skillLevel) : students,
  [students, filters.skillLevel]);

  const handleFilterChange = useCallback((f: typeof filters) => setFilters(f), []);

  const handleEnrollSubmit = async (data: EnrollStudentFormData) => {
    const newStudent = await createStudent({
      fullName: data.fullName, dateOfBirth: data.dateOfBirth,
      gender: data.gender, contactPhone: data.contactPhone,
      email: data.email, guardianName: data.guardianName,
      guardianPhone: data.guardianPhone, baidNumber: data.baidNumber,
      batchId: data.batchId, skillLevel: data.skillLevel,
      assignedCoachId: data.assignedCoachId || undefined,
      strengths: [], weaknesses: [],
    });

    // Establish the student's own journey — template/curriculum/coach/start date —
    // right at enrollment time, anchored to their joining date.
    if (data.startDate) {
      try {
        await apiClient.post(`/students/${newStudent.id}/enrollments`, {
          batchTimeTemplateId: data.batchTimeTemplateId || null,
          curriculumId: data.curriculumId || null,
          coachId: data.assignedCoachId || null,
          startDate: data.startDate,
          monthlyFee: data.monthlyFee ?? null,
        });
      } catch (err) {
        console.error('Failed to create initial enrollment:', err);
      }
    }

    setIsEnrollModalOpen(false);
    await refetch();
  };

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Students</h1>
              <p className="page-header-subtitle">Manage and enroll students in the academy</p>
            </div>
            <div className="page-header-actions">
              <CollapsibleFilterPanel
                activeFilterCount={
                  (filters.batch ? 1 : 0) + (filters.skillLevel ? 1 : 0) +
                  (filters.coach ? 1 : 0) + (searchTerm ? 1 : 0)
                }
              >
                <div className="filter-panel-inner">
                  <div className="filter-panel-search">
                    <input
                      type="text"
                      placeholder="Search by name, BAID, or batch..."
                      className="filter-search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select value={filters.batch} onChange={(e) => handleFilterChange({ ...filters, batch: e.target.value })} className="filter-dropdown">
                    <option value="">All Batches</option>
                    {batchOptions.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                  <select value={filters.skillLevel} onChange={(e) => handleFilterChange({ ...filters, skillLevel: e.target.value })} className="filter-dropdown">
                    <option value="">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Professional">Professional</option>
                  </select>
                  <select value={filters.coach} onChange={(e) => handleFilterChange({ ...filters, coach: e.target.value })} className="filter-dropdown">
                    <option value="">All Coaches</option>
                    {coachOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <div className="filter-results">
                    <span className="filter-count">{filteredStudents.length} of {students.length} students</span>
                  </div>
                </div>
              </CollapsibleFilterPanel>
              <button onClick={() => setIsEnrollModalOpen(true)} className="btn-create-fee">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                Enroll Student
              </button>
            </div>
          </div>

          {error && (
            <div className="p-md" style={{ backgroundColor: 'var(--feedback-danger-light)', border: '1px solid var(--color-danger-light)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)' }}>
              <p className="text-small" style={{ color: 'var(--color-danger-text)' }}>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="card" style={{ padding: 'var(--space-xl)' }}>
              <div className="animate-pulse flex flex-col" style={{ gap: 'var(--space-md)' }}>
                <div className="h-4 rounded w-3/4" style={{ backgroundColor: 'var(--border-default)' }} />
                <div className="h-4 rounded" style={{ backgroundColor: 'var(--border-default)' }} />
                <div className="h-4 rounded w-5/6" style={{ backgroundColor: 'var(--border-default)' }} />
              </div>
            </div>
          ) : (
            <StudentListTable
              students={filteredStudents}
              coaches={coachUsers}
              onStudentClick={(id) => navigate(`/student/${id}`)}
              getBatchName={getBatchName}
            />
          )}

          <EnrollStudentModal
            isOpen={isEnrollModalOpen}
            onClose={() => setIsEnrollModalOpen(false)}
            onSubmit={handleEnrollSubmit}
            batches={batchOptions.map((b) => ({ id: b.value, name: b.label }))}
            coaches={coachOptions.map((c) => ({ id: c.value, name: c.label }))}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

/* ============================================================
   COACHES PAGE
   ============================================================ */
export const CoachesPage: React.FC = () => {
  const { coaches: rawCoaches, loading: coachesLoading, error: coachesError, createCoach, refetch: refetchCoaches } = useCoaches();
  const { students, loading: studentsLoading, refetch: refetchStudents } = useStudents();

  const [batches, setBatches] = useState<Batch[]>([]);
  useEffect(() => {
    apiClient.get<Batch[]>('/batches')
      .then((r) => setBatches(r.data.map((b) => ({ ...b, createdAt: new Date(b.createdAt) }))))
      .catch(() => setBatches([]));
  }, []);

  const [feeAccessOverrides, setFeeAccessOverrides] = useState<Record<string, boolean>>({});
  const coaches = rawCoaches.map((c) => ({ ...c, canAccessFees: feeAccessOverrides[c.id] ?? c.canAccessFees }));
  useEffect(() => { setFeeAccessOverrides({}); }, [rawCoaches]);

  const [isAddCoachOpen, setIsAddCoachOpen] = useState(false);
  const [isEditCoachOpen, setIsEditCoachOpen] = useState(false);
  const [isDeleteCoachOpen, setIsDeleteCoachOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<User | null>(null);
  const [coachToEdit, setCoachToEdit] = useState<User | null>(null);
  const [coachToDelete, setCoachToDelete] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (coachesError) setError(coachesError); }, [coachesError]);

  const loading = coachesLoading || studentsLoading;

  const handleAddCoach = async (data: CoachFormData) => {
    await createCoach({ username: data.username, password: data.password, name: data.name, email: data.email, profilePhoto: data.profilePhoto, specialization: data.specialization, seniorCoachId: data.seniorCoachId });
    setIsAddCoachOpen(false);
  };

  const handleEditCoachSubmit = async (coachId: string, data: EditCoachFormData) => {
    await apiClient.patch(`/coaches/${coachId}`, data);
    await refetchCoaches();
    if (selectedCoach?.id === coachId) setSelectedCoach(coaches.find((c) => c.id === coachId) ?? null);
    setIsEditCoachOpen(false);
    setCoachToEdit(null);
  };

  const handleDeleteCoachConfirm = async (coachId: string) => {
    await apiClient.delete(`/coaches/${coachId}`);
    await Promise.all([refetchCoaches(), refetchStudents()]);
    if (selectedCoach?.id === coachId) setSelectedCoach(null);
    setIsDeleteCoachOpen(false);
    setCoachToDelete(null);
  };

  const getDeleteStats = (c: User | null) => ({
    batchCount: batches.filter((b) => b.assignedCoachId === c?.id).length,
    studentCount: students.filter((s) => s.assignedCoachId === c?.id).length,
  });

  const handleAssignmentChange = async (_s: Student[], _b: Batch[]) => {
    await Promise.all([refetchCoaches(), refetchStudents()]);
  };

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Coaches</h1>
              <p className="page-header-subtitle">Manage assistant coaches and their assignments</p>
            </div>
            <button onClick={() => setIsAddCoachOpen(true)} className="btn-create-fee">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
              Add Coach
            </button>
          </div>

          {error && (
            <div className="p-md" style={{ backgroundColor: 'var(--feedback-danger-light)', border: '1px solid var(--color-danger-light)', borderRadius: 'var(--radius-md)' }}>
              <p className="text-small" style={{ color: 'var(--color-danger-text)' }}>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="card" style={{ padding: 'var(--space-xl)' }}>
              <div className="animate-pulse flex flex-col" style={{ gap: 'var(--space-md)' }}>
                <div className="h-4 rounded w-3/4" style={{ backgroundColor: 'var(--border-default)' }} />
                <div className="h-4 rounded" style={{ backgroundColor: 'var(--border-default)' }} />
                <div className="h-4 rounded w-5/6" style={{ backgroundColor: 'var(--border-default)' }} />
              </div>
            </div>
          ) : (
            <>
              <CoachListTable
                coaches={coaches}
                students={students}
                batches={batches}
                selectedCoachId={selectedCoach?.id}
                onCoachSelect={(c) => setSelectedCoach(c.id === selectedCoach?.id ? null : c)}
                onEditCoach={(c) => { setCoachToEdit(c); setIsEditCoachOpen(true); }}
                onDeleteCoach={(c) => { setCoachToDelete(c); setIsDeleteCoachOpen(true); }}
                onFeeAccessToggle={(id, val) => setFeeAccessOverrides((prev) => ({ ...prev, [id]: val }))}
              />
              <AssignmentPanel
                selectedCoach={selectedCoach}
                students={students}
                batches={batches}
                onAssignmentChange={handleAssignmentChange}
              />
            </>
          )}

          <AddCoachModal isOpen={isAddCoachOpen} onClose={() => setIsAddCoachOpen(false)} onSubmit={handleAddCoach} coaches={coaches} />
          <EditCoachModal
            isOpen={isEditCoachOpen}
            coach={coachToEdit}
            onClose={() => { setIsEditCoachOpen(false); setCoachToEdit(null); }}
            onSubmit={handleEditCoachSubmit}
          />
          <DeleteCoachConfirmDialog
            isOpen={isDeleteCoachOpen}
            coach={coachToDelete}
            assignedBatchCount={getDeleteStats(coachToDelete).batchCount}
            assignedStudentCount={getDeleteStats(coachToDelete).studentCount}
            onClose={() => { setIsDeleteCoachOpen(false); setCoachToDelete(null); }}
            onConfirm={handleDeleteCoachConfirm}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

// Default export for backwards compat (used by App.tsx as UsersPage)
export default StudentsPage;
