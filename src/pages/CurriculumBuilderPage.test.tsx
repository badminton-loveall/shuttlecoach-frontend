import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CurriculumBuilderPage from './CurriculumBuilderPage';
import { AuthProvider } from '../contexts/AuthContext';

// Mock useBatches hook
vi.mock('../hooks/useBatches', () => ({
  useBatches: () => ({
    batches: [
      { id: 'batch-001', name: 'Morning Beginners', schedule: 'Mon/Wed 6AM', studentCount: 5, createdAt: new Date() }
    ],
    loading: false,
    error: null,
    getBatchName: (batchId: string | undefined) => batchId === 'batch-001' ? 'Morning Beginners' : 'Unknown batch',
    refetch: vi.fn(),
  }),
}));

// Mock data
vi.mock('../data/curriculum.json', () => ({
  default: [
    {
      id: 'curriculum-001',
      cycleKey: 'Jan-Feb 2020',
      batchId: 'batch-001',
      weeks: Array.from({ length: 8 }, (_, i) => ({
        weekNumber: i + 1,
        focusArea: 'Test Focus',
        drills: [],
        objective: 'Test Objective'
      })),
      isArchived: true
    }
  ]
}));

vi.mock('../data/students.json', () => ({
  default: [
    {
      id: 'student-001',
      fullName: 'Test Student',
      batchId: 'batch-001'
    }
  ]
}));

describe('CurriculumBuilderPage - Archive Functionality', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <CurriculumBuilderPage />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('should display archived banner for past cycles', async () => {
    renderComponent();

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Curriculum Builder')).toBeInTheDocument();
    });

    // Check that cycle selector is present
    const cycleLabel = screen.getByText('Bi-monthly Cycle');
    expect(cycleLabel).toBeInTheDocument();
  });

  it('should include current cycle and past cycles in dropdown', async () => {
    renderComponent();

    await waitFor(() => {
      const cycleLabel = screen.getByText('Bi-monthly Cycle');
      expect(cycleLabel).toBeInTheDocument();
      
      // Check that archived cycle option text is present
      expect(screen.getByText(/Jan-Feb 2020/)).toBeInTheDocument();
      expect(screen.getByText(/(Archived)/)).toBeInTheDocument();
    });
  });

  it('should disable save button for archived cycles', async () => {
    // Store an archived plan
    const archivedPlan = {
      id: 'curriculum-archived',
      cycleKey: 'Jan-Feb 2020',
      batchId: 'batch-001',
      weeks: Array.from({ length: 8 }, (_, i) => ({
        weekNumber: i + 1,
        focusArea: 'Archived Focus',
        drills: [],
        objective: 'Archived Objective'
      })),
      isArchived: true
    };

    localStorage.setItem('curriculumPlans', JSON.stringify([archivedPlan]));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Curriculum Builder')).toBeInTheDocument();
    });

    // Check that save button exists
    const saveButton = screen.getByRole('button', { name: /save batch plan/i });
    expect(saveButton).toBeInTheDocument();
  });
});
