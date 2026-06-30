import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrainingTab } from './TrainingTab';
import type { Student } from '../types';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
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

describe('TrainingTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Display - All roles', () => {
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
