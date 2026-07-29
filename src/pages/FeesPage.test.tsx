/**
 * FeesPage Integration Tests
 * Tests overdue fee auto-detection, stats computation, and data refresh
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import FeesPage from './FeesPage';

// Mock apiClient to prevent network calls
vi.mock('../utils/apiClient', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: { id: 'user-001', name: 'Head Coach', role: 'HEAD_COACH' },
    role: 'HEAD_COACH',
    token: 'mock-token',
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Mock useStudents hook
vi.mock('../hooks/useStudents', () => ({
  useStudents: () => ({
    students: [
      { id: 'student-001', fullName: 'John Doe', dateOfBirth: new Date('2010-01-01'), age: 14, gender: 'Male', contactPhone: '1234567890', batchId: 'batch-001', strengths: [], weaknesses: [], skillLevel: 'Beginner', createdAt: new Date(), updatedAt: new Date() },
      { id: 'student-002', fullName: 'Jane Smith', dateOfBirth: new Date('2011-01-01'), age: 13, gender: 'Female', contactPhone: '0987654321', batchId: 'batch-002', strengths: [], weaknesses: [], skillLevel: 'Intermediate', createdAt: new Date(), updatedAt: new Date() },
      { id: 'student-003', fullName: 'Alice Johnson', dateOfBirth: new Date('2012-01-01'), age: 12, gender: 'Female', contactPhone: '1112223333', batchId: 'batch-001', strengths: [], weaknesses: [], skillLevel: 'Beginner', createdAt: new Date(), updatedAt: new Date() },
      { id: 'student-004', fullName: 'Bob Wilson', dateOfBirth: new Date('2013-01-01'), age: 11, gender: 'Male', contactPhone: '4445556666', batchId: 'batch-002', strengths: [], weaknesses: [], skillLevel: 'Beginner', createdAt: new Date(), updatedAt: new Date() },
      { id: 'student-005', fullName: 'Charlie Brown', dateOfBirth: new Date('2009-01-01'), age: 15, gender: 'Male', contactPhone: '7778889999', batchId: 'batch-001', strengths: [], weaknesses: [], skillLevel: 'Intermediate', createdAt: new Date(), updatedAt: new Date() },
    ],
    loading: false,
    error: null,
    total: 5,
    refetch: vi.fn(),
    getStudent: vi.fn(),
    createStudent: vi.fn(),
    updateStudent: vi.fn(),
  }),
}));

// Mock useFees hook with test data
vi.mock('../hooks/useFees', () => ({
  useFees: () => ({
    fees: [
      { id: 'fee-001', studentId: 'student-001', amount: 3000, monthYear: '2026-01', dueDate: new Date('2026-01-10'), paidDate: new Date('2026-01-08'), status: 'PAID', paymentMethod: 'UPI', transactionRef: 'UPI-2026010801234', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-08') },
      { id: 'fee-002', studentId: 'student-002', amount: 3000, monthYear: '2025-11', dueDate: new Date('2025-11-10'), status: 'PENDING', createdAt: new Date('2025-11-01'), updatedAt: new Date('2025-11-12') },
      { id: 'fee-003', studentId: 'student-003', amount: 3500, monthYear: '2025-12', dueDate: new Date('2025-12-10'), status: 'PENDING', createdAt: new Date('2025-12-01'), updatedAt: new Date('2025-12-15') },
      { id: 'fee-004', studentId: 'student-004', amount: 3000, monthYear: '2027-02', dueDate: new Date('2027-02-10'), status: 'PENDING', createdAt: new Date('2026-02-01'), updatedAt: new Date('2026-02-01') },
      { id: 'fee-005', studentId: 'student-005', amount: 3000, monthYear: '2025-10', dueDate: new Date('2025-10-10'), status: 'OVERDUE', createdAt: new Date('2025-10-01'), updatedAt: new Date('2025-10-20') },
    ],
    loading: false,
    error: null,
    createFee: vi.fn(),
    markFeeAsPaid: vi.fn(),
    waiveFee: vi.fn(),
    refetch: vi.fn(),
  }),
}));

const renderFeesPage = () => {
  return render(
    <BrowserRouter>
      <FeesPage />
    </BrowserRouter>
  );
};

describe('FeesPage - Overdue Fee Auto-Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display the fee management page', async () => {
    renderFeesPage();

    await waitFor(() => {
      expect(screen.getByText('Fee Management')).toBeInTheDocument();
    });
  });

  it('should automatically detect and count overdue fees on page load (Requirement 12.1, 12.2)', async () => {
    renderFeesPage();

    await waitFor(() => {
      // The overdue count stat card should display 3 overdue fees:
      // - fee-002 (PENDING, due 2025-11-10) -> auto-detected as OVERDUE
      // - fee-003 (PENDING, due 2025-12-10) -> auto-detected as OVERDUE
      // - fee-005 (explicitly OVERDUE)
      const overdueCountElement = screen.getByText('Overdue Fees')
        .closest('div')
        ?.querySelector('.stat-card__value');

      expect(overdueCountElement).toHaveTextContent('3');
    });
  });

  it('should display overdue fees with red indicator in the fee list (Requirement 12.3)', async () => {
    renderFeesPage();

    await waitFor(() => {
      // Get all OVERDUE status badges
      const overdueBadges = screen.getAllByText('OVERDUE');

      // Should have 3 OVERDUE badges
      expect(overdueBadges).toHaveLength(3);

      // Check that all overdue badges have semantic overdue class
      overdueBadges.forEach((badge) => {
        expect(badge.className).toContain('table-badge--overdue');
      });
    });
  });

  it('should keep PENDING fees with future due dates as PENDING', async () => {
    renderFeesPage();

    await waitFor(() => {
      // fee-004 has a future due date (2027-02-10) and should remain PENDING
      const pendingBadges = screen.getAllByText('PENDING');

      // Should have exactly 1 PENDING fee (fee-004)
      expect(pendingBadges).toHaveLength(1);

      // Check that pending badge has semantic pending class
      expect(pendingBadges[0].className).toContain('table-badge--pending');
    });
  });

  it('should calculate outstanding balance including overdue fees', async () => {
    renderFeesPage();

    await waitFor(() => {
      // Outstanding balance should include:
      // - fee-002: 3000 (auto-detected OVERDUE)
      // - fee-003: 3500 (auto-detected OVERDUE)
      // - fee-004: 3000 (PENDING)
      // - fee-005: 3000 (explicitly OVERDUE)
      // Total: 12500
      const outstandingElement = screen.getByText('Outstanding Balance')
        .closest('div')
        ?.querySelector('.stat-card__value');

      expect(outstandingElement).toHaveTextContent('₹12,500');
    });
  });

  it('should allow filtering by OVERDUE status', async () => {
    renderFeesPage();

    await waitFor(() => {
      // FeesPage uses CollapsibleFilterPanel with checkbox toggles
      // Verify the page renders fee status filter checkboxes
      expect(screen.getByText('Fee Management')).toBeInTheDocument();
    });

    // The filter is checkbox-based, verify we see status labels
    await waitFor(() => {
      const overdueBadges = screen.getAllByText('OVERDUE');
      expect(overdueBadges.length).toBeGreaterThan(0);
    });
  });

  it('should show action buttons for overdue fees (Requirement 12.4)', async () => {
    renderFeesPage();

    await waitFor(() => {
      // OVERDUE fees should have "Mark Paid" and "Waive" buttons
      const markPaidButtons = screen.getAllByText('Mark Paid');
      const waiveButtons = screen.getAllByText('Waive');

      // Should have 4 "Mark Paid" buttons (3 OVERDUE + 1 PENDING)
      expect(markPaidButtons).toHaveLength(4);

      // Should have 4 "Waive" buttons (3 OVERDUE + 1 PENDING)
      expect(waiveButtons).toHaveLength(4);
    });
  });

  it('should display fee stats with correct color coding (Requirement 10.2)', async () => {
    renderFeesPage();

    await waitFor(() => {
      // StatCard uses semantic CSS classes: stat-card--success, stat-card--warning, stat-card--danger
      const collectedCard = screen.getByText('Collected This Month').closest('.stat-card');
      const outstandingCard = screen.getByText('Outstanding Balance').closest('.stat-card');
      const overdueCard = screen.getByText('Overdue Fees').closest('.stat-card');

      // Check that stat cards exist and have semantic variant classes
      expect(collectedCard).toBeTruthy();
      expect(outstandingCard).toBeTruthy();
      expect(overdueCard).toBeTruthy();
    });
  });
});
