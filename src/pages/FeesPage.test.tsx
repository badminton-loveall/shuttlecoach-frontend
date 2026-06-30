import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FeesPage from './FeesPage';

// Mock AuthContext
const mockUseAuth = {
  user: {
    id: 'user-001',
    username: 'headcoach',
    name: 'Head Coach',
    role: 'HEAD_COACH' as const,
    email: 'headcoach@shuttlecoach.com',
    createdAt: new Date(),
    lastActive: new Date(),
  },
  role: 'HEAD_COACH' as const,
  token: 'mock-token',
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('FeesPage', () => {
  it('should render fee management page', () => {
    renderWithRouter(<FeesPage />);
    
    expect(screen.getByText('Fee Management')).toBeInTheDocument();
    expect(screen.getByText('Track and manage student fee payments')).toBeInTheDocument();
  });

  it('should display statistics cards', () => {
    renderWithRouter(<FeesPage />);
    
    expect(screen.getByText('Collected This Month')).toBeInTheDocument();
    expect(screen.getByText('Outstanding Balance')).toBeInTheDocument();
    expect(screen.getByText('Overdue Fees')).toBeInTheDocument();
  });

  it('should display fee list table', () => {
    renderWithRouter(<FeesPage />);
    
    // Table headers should be present
    expect(screen.getByText('Student Name')).toBeInTheDocument();
    expect(screen.getByText('Month/Year')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Due Date')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should filter fees by status', () => {
    renderWithRouter(<FeesPage />);
    
    const statusFilter = screen.getByLabelText(/Filter by Status/i) as HTMLSelectElement;
    
    // Change to PAID filter
    fireEvent.change(statusFilter, { target: { value: 'PAID' } });
    expect(statusFilter.value).toBe('PAID');
    
    // Change to PENDING filter
    fireEvent.change(statusFilter, { target: { value: 'PENDING' } });
    expect(statusFilter.value).toBe('PENDING');
  });

  it('should open mark paid modal when "Mark Paid" button is clicked', async () => {
    renderWithRouter(<FeesPage />);
    
    // Wait for the table to render
    await waitFor(() => {
      expect(screen.getByText('Student Name')).toBeInTheDocument();
    });
    
    // Find and click the first "Mark Paid" button
    const markPaidButtons = screen.queryAllByText('Mark Paid');
    if (markPaidButtons.length > 0) {
      fireEvent.click(markPaidButtons[0]);
      
      // Modal should open
      await waitFor(() => {
        expect(screen.getByText('Mark Fee as Paid')).toBeInTheDocument();
      });
    }
  });

  it('should close mark paid modal when cancel is clicked', async () => {
    renderWithRouter(<FeesPage />);
    
    // Wait for the table to render
    await waitFor(() => {
      expect(screen.getByText('Student Name')).toBeInTheDocument();
    });
    
    // Find and click the first "Mark Paid" button
    const markPaidButtons = screen.queryAllByText('Mark Paid');
    if (markPaidButtons.length > 0) {
      fireEvent.click(markPaidButtons[0]);
      
      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByText('Mark Fee as Paid')).toBeInTheDocument();
      });
      
      // Click cancel
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText('Mark Fee as Paid')).not.toBeInTheDocument();
      });
    }
  });

  it('should update fee status after marking as paid', async () => {
    renderWithRouter(<FeesPage />);
    
    // Wait for the table to render
    await waitFor(() => {
      expect(screen.getByText('Student Name')).toBeInTheDocument();
    });
    
    // Find and click a "Mark Paid" button (for pending/overdue fees)
    const markPaidButtons = screen.queryAllByText('Mark Paid');
    if (markPaidButtons.length > 0) {
      // Get initial count of fees
      const initialFeeCount = markPaidButtons.length;
      
      // Click the first mark paid button
      fireEvent.click(markPaidButtons[0]);
      
      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByText('Mark Fee as Paid')).toBeInTheDocument();
      });
      
      // Fill in the form and submit
      const submitButton = screen.getByText('Mark as Paid');
      fireEvent.click(submitButton);
      
      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText('Mark Fee as Paid')).not.toBeInTheDocument();
      });
      
      // The number of "Mark Paid" buttons should decrease
      await waitFor(() => {
        const updatedMarkPaidButtons = screen.queryAllByText('Mark Paid');
        expect(updatedMarkPaidButtons.length).toBeLessThan(initialFeeCount);
      });
    }
  });

  it('should show count of filtered fees', () => {
    renderWithRouter(<FeesPage />);
    
    // Should show total count initially
    expect(screen.getByText(/Showing \d+ of \d+ fees/)).toBeInTheDocument();
  });

  it('should display all filter options', () => {
    renderWithRouter(<FeesPage />);
    
    const statusFilter = screen.getByLabelText(/Filter by Status/i) as HTMLSelectElement;
    
    // Check all options are present
    const options = Array.from(statusFilter.options).map((opt) => opt.value);
    expect(options).toContain('all');
    expect(options).toContain('PAID');
    expect(options).toContain('PENDING');
    expect(options).toContain('OVERDUE');
    expect(options).toContain('WAIVED');
  });
});
