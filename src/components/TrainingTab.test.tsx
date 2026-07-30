import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrainingTab } from './TrainingTab';
import type { Student, TrainingLog, CurriculumPlan } from '../types';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useTrainingLogs
const mockUseTrainingLogs = vi.fn();
vi.mock('../hooks/useTrainingLogs', () => ({
  useTrainingLogs: (filters: unknown) => mockUseTrainingLogs(filters),
}));

// Mock useCurriculum
const mockUseCurriculum = vi.fn();
vi.mock('../hooks/useCurriculum', () => ({
  useCurriculum: (filters: unknown) => mockUseCurriculum(filters),
}));

// Mock generateCycleKey to return a stable value for tests
vi.mock('../utils/skillUtils', () => ({
  generateCycleKey: () => 'Jan-Feb 2026',
}));

const createMockStudent = (overrides: Partial<Student> = {}): Student => ({
  id: 'student-1',
  fullName: 'Arjun Verma',
  dateOfBirth: new Date('2010-05-15'),
  age: 14,
  gender: 'Male',
  contactPhone: '9876543210',
  email: 'arjun@example.com',
  guardianName: 'Vikram Verma',
  guardianPhone: '9876543200',
  baidNumber: 'BAID-001',
  batchId: 'batch-1',
  profilePhoto: undefined,
  height: 155,
  weight: 48,
  bmi: 20.0,
  bloodGroup: 'B+',
  medicalConditions: 'None',
  emergencyContact: '9876543211',
  strengths: ['Forehand Clear', 'Net Play'],
  weaknesses: ['Backhand Drop', 'Footwork'],
  coachFeedback: 'Good progress overall. Work on backhand.',
  skillLevel: 'Intermediate',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockTrainingLogs = (): TrainingLog[] => [
  {
    id: 'log-1',
    studentId: 'student-1',
    weekNumber: 2,
    cycleKey: 'Jan-Feb 2026',
    sessionNotes: 'Good footwork drills today',
    isCompleted: true,
    recordedBy: 'Coach Sumit',
    recordedAt: new Date('2026-01-15T10:00:00Z'),
  },
  {
    id: 'log-2',
    studentId: 'student-1',
    weekNumber: 1,
    cycleKey: 'Jan-Feb 2026',
    sessionNotes: 'First session of the cycle',
    isCompleted: false,
    recordedBy: 'Coach Sumit',
    recordedAt: new Date('2026-01-08T10:00:00Z'),
  },
  {
    id: 'log-3',
    studentId: 'student-1',
    weekNumber: 8,
    cycleKey: 'Nov-Dec 2025',
    sessionNotes: 'Last session of previous cycle',
    isCompleted: true,
    recordedBy: 'Coach Priya',
    recordedAt: new Date('2025-12-20T10:00:00Z'),
  },
];

const createMockCurriculumPlan = (): CurriculumPlan => ({
  id: 'plan-1',
  cycleKey: 'Jan-Feb 2026',
  studentId: 'student-1',
  weeks: [
    { weekNumber: 1, focusArea: 'Footwork Basics', drills: [], objective: 'Build foundation' },
    { weekNumber: 2, focusArea: 'Service Training', drills: [], objective: 'Improve serve accuracy' },
    { weekNumber: 3, focusArea: 'Net Shot Practice', drills: [], objective: 'Master net shots' },
    { weekNumber: 4, focusArea: 'Rally Endurance', drills: [], objective: 'Build stamina' },
    { weekNumber: 5, focusArea: 'Smash & Drop', drills: [], objective: 'Power shots' },
    { weekNumber: 6, focusArea: 'Doubles Strategy', drills: [], objective: 'Partner coordination' },
    { weekNumber: 7, focusArea: 'Match Simulation', drills: [], objective: 'Game scenarios' },
    { weekNumber: 8, focusArea: 'Assessment Prep', drills: [], objective: 'Review all skills' },
  ],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  isArchived: false,
});

describe('TrainingTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default hook mocks (no data, not loading)
    mockUseTrainingLogs.mockReturnValue({
      logs: [],
      loading: false,
      error: null,
      createLog: vi.fn(),
      refetch: vi.fn(),
    });
    mockUseCurriculum.mockReturnValue({
      plans: [],
      loading: false,
      error: null,
      createPlan: vi.fn(),
      updatePlan: vi.fn(),
      cloneBatchPlan: vi.fn(),
      refetch: vi.fn(),
    });
  });

  describe('Training Logs - Loading, Error, Empty states', () => {
    it('shows loading spinner while training logs are loading', () => {
      mockUseAuth.mockReturnValue({ role: 'HEAD_COACH' });
      mockUseTrainingLogs.mockReturnValue({
        logs: [],
        loading: true,
        error: null,
        createLog: vi.fn(),
        refetch: vi.fn(),
      });
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      expect(screen.getByTestId('training-logs-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading training logs...')).toBeInTheDocument();
    });

    it('shows error message when training logs fail to load', () => {
      mockUseAuth.mockReturnValue({ role: 'HEAD_COACH' });
      mockUseTrainingLogs.mockReturnValue({
        logs: [],
        loading: false,
        error: 'Failed to load training logs. Please try again.',
        createLog: vi.fn(),
        refetch: vi.fn(),
      });
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      expect(screen.getByTestId('training-logs-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load training logs. Please try again.')).toBeInTheDocument();
    });

    it('shows empty state when no training logs exist', () => {
      mockUseAuth.mockReturnValue({ role: 'HEAD_COACH' });
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      expect(screen.getByTestId('training-logs-empty')).toBeInTheDocument();
      expect(screen.getByText('No training logs recorded yet for this student.')).toBeInTheDocument();
    });
  });

  describe('Training Logs - Data display', () => {
    it('displays logs grouped by cycle with current cycle highlighted', () => {
      mockUseAuth.mockReturnValue({ role: 'HEAD_COACH' });
      mockUseTrainingLogs.mockReturnValue({
        logs: createMockTrainingLogs(),
        loading: false,
        error: null,
        createLog: vi.fn(),
        refetch: vi.fn(),
      });
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      // Current cycle group should have highlight badge
      expect(screen.getByTestId('current-cycle-badge')).toBeInTheDocument();
      expect(screen.getByText('Current')).toBeInTheDocument();

      // Both cycles should be visible
      expect(screen.getByTestId('cycle-group-Jan-Feb 2026')).toBeInTheDocument();
      expect(screen.getByTestId('cycle-group-Nov-Dec 2025')).toBeInTheDocument();
    });

    it('displays training log notes', () => {
      mockUseAuth.mockReturnValue({ role: 'HEAD_COACH' });
      mockUseTrainingLogs.mockReturnValue({
        logs: createMockTrainingLogs(),
        loading: false,
        error: null,
        createLog: vi.fn(),
        refetch: vi.fn(),
      });
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      expect(screen.getByText('Good footwork drills today')).toBeInTheDocument();
      expect(screen.getByText('First session of the cycle')).toBeInTheDocument();
      expect(screen.getByText('Last session of previous cycle')).toBeInTheDocument();
    });

    it('calls useTrainingLogs with the student ID', () => {
      mockUseAuth.mockReturnValue({ role: 'HEAD_COACH' });
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      expect(mockUseTrainingLogs).toHaveBeenCalledWith({ studentId: 'student-1' });
    });
  });

  describe('Curriculum - Loading, Error, Empty states', () => {
    it('shows loading spinner while curriculum is loading', () => {
      mockUseAuth.mockReturnValue({ role: 'HEAD_COACH' });
      mockUseCurriculum.mockReturnValue({
        plans: [],
        loading: true,
        error: null,
        createPlan: vi.fn(),
        updatePlan: vi.fn(),
        cloneBatchPlan: vi.fn(),
        refetch: vi.fn(),
      });
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      expect(screen.getByTestId('curriculum-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading curriculum...')).toBeInTheDocument();
    });

    it('shows error message when curriculum fails to load', () => {
      mockUseAuth.mockReturnValue({ role: 'HEAD_COACH' });
      mockUseCurriculum.mockReturnValue({
        plans: [],
        loading: false,
        error: 'Failed to load curriculum plans. Please try again.',
        createPlan: vi.fn(),
        updatePlan: vi.fn(),
        cloneBatchPlan: vi.fn(),
        refetch: vi.fn(),
      });
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      expect(screen.getByTestId('curriculum-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load curriculum plans. Please try again.')).toBeInTheDocument();
    });

    it('shows empty state when no curriculum plan exists for current cycle', () => {
      mockUseAuth.mockReturnValue({ role: 'HEAD_COACH' });
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      expect(screen.getByTestId('curriculum-empty')).toBeInTheDocument();
      expect(screen.getByText(/No curriculum plan found for the current cycle/)).toBeInTheDocument();
    });

    it('calls useCurriculum with the student ID', () => {
      mockUseAuth.mockReturnValue({ role: 'HEAD_COACH' });
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      expect(mockUseCurriculum).toHaveBeenCalledWith({ studentId: 'student-1' });
    });
  });

  describe('Curriculum - Data display', () => {
    it('displays active curriculum plan summary', () => {
      mockUseAuth.mockReturnValue({ role: 'HEAD_COACH' });
      mockUseCurriculum.mockReturnValue({
        plans: [createMockCurriculumPlan()],
        loading: false,
        error: null,
        createPlan: vi.fn(),
        updatePlan: vi.fn(),
        cloneBatchPlan: vi.fn(),
        refetch: vi.fn(),
      });
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      expect(screen.getByTestId('curriculum-plan')).toBeInTheDocument();
      expect(screen.getByText('Jan-Feb 2026 Plan')).toBeInTheDocument();
      expect(screen.getByText('8 weeks planned')).toBeInTheDocument();
      // First 4 weeks shown
      expect(screen.getByText('Footwork Basics')).toBeInTheDocument();
      expect(screen.getByText('Service Training')).toBeInTheDocument();
      expect(screen.getByText('Net Shot Practice')).toBeInTheDocument();
      expect(screen.getByText('Rally Endurance')).toBeInTheDocument();
      // Should show "+4 more weeks"
      expect(screen.getByText('+4 more weeks')).toBeInTheDocument();
    });
  });

  describe('Display - All roles (strengths/weaknesses/feedback)', () => {
    it('renders strengths as green tags', () => {
      mockUseAuth.mockReturnValue({ role: 'STUDENT' });
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      const tags = screen.getAllByTestId('strength-tag');
      expect(tags).toHaveLength(2);
      expect(tags[0]).toHaveTextContent('Forehand Clear');
      expect(tags[1]).toHaveTextContent('Net Play');
      expect(tags[0]).toHaveClass('tag-strength');
    });

    it('renders weaknesses as red tags', () => {
      mockUseAuth.mockReturnValue({ role: 'STUDENT' });
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      const tags = screen.getAllByTestId('weakness-tag');
      expect(tags).toHaveLength(2);
      expect(tags[0]).toHaveTextContent('Backhand Drop');
      expect(tags[1]).toHaveTextContent('Footwork');
      expect(tags[0]).toHaveClass('tag-weakness');
    });

    it('displays coach feedback text', () => {
      mockUseAuth.mockReturnValue({ role: 'STUDENT' });
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      expect(screen.getByText('Good progress overall. Work on backhand.')).toBeInTheDocument();
    });

    it('shows empty state when no strengths exist', () => {
      mockUseAuth.mockReturnValue({ role: 'STUDENT' });
      const student = createMockStudent({ strengths: [] });
      render(<TrainingTab student={student} />);

      expect(screen.getByText('No strengths added yet')).toBeInTheDocument();
    });

    it('shows empty state when no weaknesses exist', () => {
      mockUseAuth.mockReturnValue({ role: 'STUDENT' });
      const student = createMockStudent({ weaknesses: [] });
      render(<TrainingTab student={student} />);

      expect(screen.getByText('No weaknesses added yet')).toBeInTheDocument();
    });

    it('shows placeholder when no coach feedback exists', () => {
      mockUseAuth.mockReturnValue({ role: 'STUDENT' });
      const student = createMockStudent({ coachFeedback: undefined });
      render(<TrainingTab student={student} />);

      expect(screen.getByText('No feedback available yet.')).toBeInTheDocument();
    });
  });

  describe('Student role - read only', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ role: 'STUDENT' });
    });

    it('does not show add strength input', () => {
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      expect(screen.queryByTestId('add-strength-input')).not.toBeInTheDocument();
    });

    it('does not show add weakness input', () => {
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      expect(screen.queryByTestId('add-weakness-input')).not.toBeInTheDocument();
    });

    it('does not show remove buttons on tags', () => {
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      expect(screen.queryByLabelText(/Remove strength/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Remove weakness/)).not.toBeInTheDocument();
    });

    it('displays feedback as read-only text', () => {
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      expect(screen.getByTestId('coach-feedback-readonly')).toBeInTheDocument();
      expect(screen.queryByTestId('coach-feedback-textarea')).not.toBeInTheDocument();
    });
  });

  describe('HEAD_COACH role - editable', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ role: 'HEAD_COACH' });
    });

    it('shows add strength input', () => {
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      expect(screen.getByTestId('add-strength-input')).toBeInTheDocument();
    });

    it('shows add weakness input', () => {
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      expect(screen.getByTestId('add-weakness-input')).toBeInTheDocument();
    });

    it('adds a new strength tag', () => {
      const onUpdate = vi.fn();
      const student = createMockStudent();
      render(<TrainingTab student={student} onUpdateStrengths={onUpdate} />);

      const input = screen.getByLabelText('New strength');
      fireEvent.change(input, { target: { value: 'Smash' } });
      fireEvent.click(screen.getAllByText('Add')[0]);

      expect(screen.getByText('Smash')).toBeInTheDocument();
      expect(onUpdate).toHaveBeenCalledWith(['Forehand Clear', 'Net Play', 'Smash']);
    });

    it('adds a new strength tag via Enter key', () => {
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      const input = screen.getByLabelText('New strength');
      fireEvent.change(input, { target: { value: 'Drive' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(screen.getByText('Drive')).toBeInTheDocument();
    });

    it('does not add duplicate strength', () => {
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      const input = screen.getByLabelText('New strength');
      fireEvent.change(input, { target: { value: 'Forehand Clear' } });
      fireEvent.click(screen.getAllByText('Add')[0]);

      const tags = screen.getAllByTestId('strength-tag');
      expect(tags).toHaveLength(2); // Still only 2
    });

    it('does not add empty strength', () => {
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      const input = screen.getByLabelText('New strength');
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(screen.getAllByText('Add')[0]);

      const tags = screen.getAllByTestId('strength-tag');
      expect(tags).toHaveLength(2);
    });

    it('removes a strength tag', () => {
      const onUpdate = vi.fn();
      const student = createMockStudent();
      render(<TrainingTab student={student} onUpdateStrengths={onUpdate} />);

      fireEvent.click(screen.getByLabelText('Remove strength: Forehand Clear'));

      expect(screen.queryByText('Forehand Clear')).not.toBeInTheDocument();
      expect(onUpdate).toHaveBeenCalledWith(['Net Play']);
    });

    it('adds a new weakness tag', () => {
      const onUpdate = vi.fn();
      const student = createMockStudent();
      render(<TrainingTab student={student} onUpdateWeaknesses={onUpdate} />);

      const input = screen.getByLabelText('New weakness');
      fireEvent.change(input, { target: { value: 'Stamina' } });
      fireEvent.click(screen.getAllByText('Add')[1]);

      expect(screen.getByText('Stamina')).toBeInTheDocument();
      expect(onUpdate).toHaveBeenCalledWith(['Backhand Drop', 'Footwork', 'Stamina']);
    });

    it('removes a weakness tag', () => {
      const onUpdate = vi.fn();
      const student = createMockStudent();
      render(<TrainingTab student={student} onUpdateWeaknesses={onUpdate} />);

      fireEvent.click(screen.getByLabelText('Remove weakness: Footwork'));

      expect(screen.queryByText('Footwork')).not.toBeInTheDocument();
      expect(onUpdate).toHaveBeenCalledWith(['Backhand Drop']);
    });

    it('shows editable textarea for coach feedback', () => {
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      const textarea = screen.getByTestId('coach-feedback-textarea');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue('Good progress overall. Work on backhand.');
    });

    it('updates feedback on change', () => {
      const onUpdate = vi.fn();
      const student = createMockStudent();
      render(<TrainingTab student={student} onUpdateFeedback={onUpdate} />);

      const textarea = screen.getByTestId('coach-feedback-textarea');
      fireEvent.change(textarea, { target: { value: 'Updated feedback' } });

      expect(textarea).toHaveValue('Updated feedback');
      expect(onUpdate).toHaveBeenCalledWith('Updated feedback');
    });

    it('shows remove buttons on tags', () => {
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      expect(screen.getByLabelText('Remove strength: Forehand Clear')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove weakness: Backhand Drop')).toBeInTheDocument();
    });
  });

  describe('ASSISTANT_COACH role - editable', () => {
    it('has same editing capabilities as HEAD_COACH', () => {
      mockUseAuth.mockReturnValue({ role: 'ASSISTANT_COACH' });
      const student = createMockStudent();
      render(<TrainingTab student={student} />);

      expect(screen.getByTestId('add-strength-input')).toBeInTheDocument();
      expect(screen.getByTestId('add-weakness-input')).toBeInTheDocument();
      expect(screen.getByTestId('coach-feedback-textarea')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove strength: Forehand Clear')).toBeInTheDocument();
    });
  });
});
