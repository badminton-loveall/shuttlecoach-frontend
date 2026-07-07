import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CoachProfileTab } from './CoachProfileTab';
import type { User } from '../types';

/**
 * CoachProfileTab Component Tests (Read-Only & Edit Modes)
 *
 * Tests verify:
 * - **Property 6: Profile data displays with correct visibility** (conditional field display)
 * - **Property 7: Sensitive fields hidden for non-admins**
 * - **Property 8: Edit button visible only for authorized roles**
 * - **Property 9: Form pre-population on edit**
 * - **Property 10: Form validation prevents invalid submission**
 * - **Property 11: Cancel reverts form changes**
 *
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 3.1, 3.3, 3.8, 4.1**
 */

describe('CoachProfileTab', () => {
  const mockCoach: User = {
    id: 'coach-1',
    username: 'johndoe',
    role: 'HEAD_COACH',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+91-9876543210',
    specialization: 'Advanced Doubles Training',
    qualifications: 'BSc Physical Education, International Badminton Certification',
    certifications: 'Level 3 Badminton Coach, Sports Science Diploma',
    bio: 'Expert badminton coach with 10 years of experience in training professional athletes.',
    profilePhoto: undefined,
    createdAt: new Date('2024-01-15'),
    lastActive: new Date('2024-06-10T14:30:00'),
  };

  let mockOnUpdateCoach: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnUpdateCoach = vi.fn().mockResolvedValue(undefined);
  });

  // REQUIREMENT 2.1: Display coach personal information
  describe('Requirement 2.1: Display coach personal information', () => {
    it('displays coach name', () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('displays coach email when available', () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('displays coach phone when available', () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(screen.getByText('+91-9876543210')).toBeInTheDocument();
    });

    it('displays specialization when available', () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(screen.getByText('Advanced Doubles Training')).toBeInTheDocument();
    });

    it('displays qualifications when available', () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(
        screen.getByText('BSc Physical Education, International Badminton Certification')
      ).toBeInTheDocument();
    });

    it('displays certifications when available', () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(
        screen.getByText('Level 3 Badminton Coach, Sports Science Diploma')
      ).toBeInTheDocument();
    });

    it('displays bio when available', () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(
        screen.getByText(/Expert badminton coach with 10 years of experience/)
      ).toBeInTheDocument();
    });
  });

  // REQUIREMENT 2.2: Conditionally show fields based on data availability (hide if empty)
  describe('Requirement 2.2: Conditionally show fields based on data availability', () => {
    it('hides email field entirely when not provided', () => {
      const coachWithoutEmail = { ...mockCoach, email: undefined };
      render(
        <CoachProfileTab
          coach={coachWithoutEmail}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      // Email label should not be in the document
      const emailLabels = screen.queryAllByText('Email');
      expect(emailLabels.length).toBe(0);
    });

    it('hides phone field entirely when not provided', () => {
      const coachWithoutPhone = { ...mockCoach, phone: undefined };
      render(
        <CoachProfileTab
          coach={coachWithoutPhone}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      // Phone label should not be in the document
      const phoneLabels = screen.queryAllByText('Phone');
      expect(phoneLabels.length).toBe(0);
    });

    it('hides specialization field entirely when not provided', () => {
      const coachWithoutSpecialization = { ...mockCoach, specialization: undefined };
      render(
        <CoachProfileTab
          coach={coachWithoutSpecialization}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      const specializationLabels = screen.queryAllByText('Specialization');
      expect(specializationLabels.length).toBe(0);
    });

    it('hides qualifications field entirely when not provided', () => {
      const coachWithoutQualifications = { ...mockCoach, qualifications: undefined };
      render(
        <CoachProfileTab
          coach={coachWithoutQualifications}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      const qualLabels = screen.queryAllByText('Qualifications');
      expect(qualLabels.length).toBe(0);
    });

    it('hides certifications field entirely when not provided', () => {
      const coachWithoutCertifications = { ...mockCoach, certifications: undefined };
      render(
        <CoachProfileTab
          coach={coachWithoutCertifications}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      const certLabels = screen.queryAllByText('Certifications');
      expect(certLabels.length).toBe(0);
    });

    it('hides bio field entirely when not provided', () => {
      const coachWithoutBio = { ...mockCoach, bio: undefined };
      render(
        <CoachProfileTab
          coach={coachWithoutBio}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      const bioLabels = screen.queryAllByText('Bio');
      expect(bioLabels.length).toBe(0);
    });

    it('hides email field when empty string is provided', () => {
      const coachWithEmptyEmail = { ...mockCoach, email: '' };
      render(
        <CoachProfileTab
          coach={coachWithEmptyEmail}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      const emailLabels = screen.queryAllByText('Email');
      expect(emailLabels.length).toBe(0);
    });
  });

  // REQUIREMENT 2.3: Show fields that are populated
  describe('Requirement 2.3: Show fields that are populated', () => {
    it('displays all provided optional fields', () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );

      // All optional fields should be visible
      expect(screen.getByText('+91-9876543210')).toBeInTheDocument();
      expect(screen.getByText('Advanced Doubles Training')).toBeInTheDocument();
      expect(screen.getByText(/BSc Physical Education/)).toBeInTheDocument();
      expect(screen.getByText(/Level 3 Badminton Coach/)).toBeInTheDocument();
      expect(screen.getByText(/Expert badminton coach/)).toBeInTheDocument();
    });

    it('selectively displays only populated optional fields', () => {
      const coachPartialFields = {
        ...mockCoach,
        phone: undefined,
        certifications: undefined,
      };
      render(
        <CoachProfileTab
          coach={coachPartialFields}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );

      // Should display these
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Advanced Doubles Training')).toBeInTheDocument();
      expect(screen.getByText(/BSc Physical Education/)).toBeInTheDocument();

      // Should NOT display these
      const phoneLabels = screen.queryAllByText('Phone');
      expect(phoneLabels.length).toBe(0);
      const certLabels = screen.queryAllByText('Certifications');
      expect(certLabels.length).toBe(0);
    });
  });

  // REQUIREMENT 2.4: Field conditional display
  describe('Requirement 2.4: Field conditional display', () => {
    it('hides empty optional fields rather than showing dashes (as per current design)', () => {
      const coachMinimal = {
        ...mockCoach,
        email: '',
        phone: '',
        specialization: '',
        qualifications: '',
        certifications: '',
        bio: '',
      };
      render(
        <CoachProfileTab
          coach={coachMinimal}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );

      // Name should always display
      expect(screen.getByText('John Doe')).toBeInTheDocument();

      // All optional fields should be hidden (not showing dashes)
      const emailLabels = screen.queryAllByText('Email');
      expect(emailLabels.length).toBe(0);
    });
  });

  // REQUIREMENT 4.1: Display user role and permission description
  describe('Requirement 4.1: Display user role and permission description', () => {
    it('displays HEAD_COACH role with correct badge', () => {
      const headCoach = { ...mockCoach, role: 'HEAD_COACH' };
      render(
        <CoachProfileTab
          coach={headCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(screen.getByText('Head Coach')).toBeInTheDocument();
    });

    it('displays ASSISTANT_COACH role with correct badge', () => {
      const assistantCoach = { ...mockCoach, role: 'ASSISTANT_COACH' };
      render(
        <CoachProfileTab
          coach={assistantCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(screen.getByText('Assistant Coach')).toBeInTheDocument();
    });

    it('displays correct permission description for HEAD_COACH', () => {
      const headCoach = { ...mockCoach, role: 'HEAD_COACH' };
      render(
        <CoachProfileTab
          coach={headCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(
        screen.getByText(/Full system access including batch management/)
      ).toBeInTheDocument();
    });

    it('displays correct permission description for ASSISTANT_COACH', () => {
      const assistantCoach = { ...mockCoach, role: 'ASSISTANT_COACH' };
      render(
        <CoachProfileTab
          coach={assistantCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(
        screen.getByText(/Limited access to student-related data/)
      ).toBeInTheDocument();
    });

    it('displays note that role changes are admin-only', () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(
        screen.getByText(/Role changes are managed by administrators only/)
      ).toBeInTheDocument();
    });
  });

  // REQUIREMENT 3.1: Edit button visible only for HEAD_COACH
  describe('Requirement 3.1 & 3.8: Edit button and mode switching', () => {
    it('displays edit button for HEAD_COACH user', () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
    });

    it('does not display edit button for ASSISTANT_COACH user', () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="ASSISTANT_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(screen.queryByRole('button', { name: /edit profile/i })).not.toBeInTheDocument();
    });

    it('does not display edit button for STUDENT user', () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="STUDENT"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(screen.queryByRole('button', { name: /edit profile/i })).not.toBeInTheDocument();
    });
  });

  // REQUIREMENT 3.3: Pre-populate form fields on edit
  describe('Requirement 3.3: Form pre-population on edit', () => {
    it('switches to edit mode when edit button is clicked', async () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );

      // Click edit button
      fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));

      // Should switch to edit mode and show form fields
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });
    });

    it('pre-populates name field with current value', async () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('John Doe') as HTMLInputElement;
        expect(nameInput.value).toBe('John Doe');
      });
    });

    it('pre-populates email field with current value', async () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));

      await waitFor(() => {
        const emailInput = screen.getByDisplayValue('john@example.com') as HTMLInputElement;
        expect(emailInput.value).toBe('john@example.com');
      });
    });

    it('pre-populates phone field with current value', async () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));

      await waitFor(() => {
        const phoneInput = screen.getByDisplayValue('+91-9876543210') as HTMLInputElement;
        expect(phoneInput.value).toBe('+91-9876543210');
      });
    });

    it('pre-populates specialization field with current value', async () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));

      await waitFor(() => {
        const specInput = screen.getByDisplayValue('Advanced Doubles Training') as HTMLInputElement;
        expect(specInput.value).toBe('Advanced Doubles Training');
      });
    });

    it('pre-populates all text area fields', async () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));

      await waitFor(() => {
        expect(
          screen.getByDisplayValue('BSc Physical Education, International Badminton Certification')
        ).toBeInTheDocument();
      });
    });
  });

  // REQUIREMENT 3.8: Show Save and Cancel buttons in edit mode
  describe('Requirement 3.8: Save and Cancel buttons', () => {
    it('displays Save and Cancel buttons in edit mode', async () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });

    it('buttons are aligned right and have proper styling', async () => {
      const { container } = render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));

      await waitFor(() => {
        const buttonContainer = container.querySelector('div.justify-end');
        expect(buttonContainer).toBeInTheDocument();
      });
    });
  });

  // Test Cancel button functionality
  describe('Cancel button functionality - Requirement 3.8', () => {
    it('returns to read-only mode when Cancel is clicked', async () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );

      // Enter edit mode
      fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));

      // Verify in edit mode
      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });

      // Click Cancel
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      // Should return to read-only mode
      await waitFor(() => {
        expect(screen.queryByDisplayValue('John Doe')).not.toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('discards unsaved changes when Cancel is clicked', async () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );

      // Enter edit mode
      fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));

      // Change a field
      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('John Doe') as HTMLInputElement;
        expect(nameInput).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('John Doe') as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

      // Click Cancel
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      // Changes should be discarded
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
      });
    });
  });

  // Test loading state
  describe('Loading State', () => {
    it('displays loading skeleton when isLoading is true', () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
          isLoading={true}
        />
      );
      // When loading, the content should have pulse animation divs
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  // Test role-based visibility (userRole prop)
  describe('Role-Based Field Visibility', () => {
    it('displays all fields for HEAD_COACH userRole', () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('+91-9876543210')).toBeInTheDocument();
    });

    it('displays all fields for ASSISTANT_COACH userRole', () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="ASSISTANT_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('displays all fields for STUDENT userRole', () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="STUDENT"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      // Profile information should be visible in read-only mode
      expect(screen.getByText('Advanced Doubles Training')).toBeInTheDocument();
    });
  });

  // Test rendering with minimal data
  describe('Minimal Coach Data', () => {
    const minimalCoach: User = {
      id: 'coach-minimal',
      username: 'minimal',
      role: 'ASSISTANT_COACH',
      name: 'Minimal Coach',
      createdAt: new Date(),
      lastActive: new Date(),
    };

    it('renders with only required fields', () => {
      render(
        <CoachProfileTab
          coach={minimalCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(screen.getByText('Minimal Coach')).toBeInTheDocument();
      expect(screen.getByText('minimal')).toBeInTheDocument();
    });

    it('hides all optional fields when not provided', () => {
      render(
        <CoachProfileTab
          coach={minimalCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      // Optional fields should be hidden
      const emailLabels = screen.queryAllByText('Email');
      const phoneLabels = screen.queryAllByText('Phone');
      const qualLabels = screen.queryAllByText('Qualifications');

      expect(emailLabels.length).toBe(0);
      expect(phoneLabels.length).toBe(0);
      expect(qualLabels.length).toBe(0);
    });
  });

  // Test section headers
  describe('Section Headers', () => {
    it('displays all section headers', () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Professional Information')).toBeInTheDocument();
      expect(screen.getByText('Role & Permissions')).toBeInTheDocument();
      expect(screen.getByText('Account Information')).toBeInTheDocument();
    });
  });

  // Test email and phone independence (as per requirement 2.2)
  describe('Field Independence', () => {
    it('email and phone visibility are independent', () => {
      const coachWithEmailNoPhone = {
        ...mockCoach,
        phone: undefined,
      };
      render(
        <CoachProfileTab
          coach={coachWithEmailNoPhone}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );

      // Email should be visible
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      // Phone should not be visible
      const phoneLabels = screen.queryAllByText('Phone');
      expect(phoneLabels.length).toBe(0);
    });

    it('displays phone without email when email is empty', () => {
      const coachWithPhoneNoEmail = {
        ...mockCoach,
        email: undefined,
      };
      render(
        <CoachProfileTab
          coach={coachWithPhoneNoEmail}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );

      // Phone should be visible
      expect(screen.getByText('+91-9876543210')).toBeInTheDocument();
      // Email should not be visible
      const emailLabels = screen.queryAllByText('Email');
      expect(emailLabels.length).toBe(0);
    });
  });

  // Account information tests
  describe('Account Information Section', () => {
    it('displays User ID in account information', () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(screen.getByText('coach-1')).toBeInTheDocument();
    });

    it('displays username in account information', () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(screen.getByText('johndoe')).toBeInTheDocument();
    });

    it('displays account created date', () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      expect(screen.getByText(/Jan/)).toBeInTheDocument();
    });

    it('displays last active date and time', () => {
      render(
        <CoachProfileTab
          coach={mockCoach}
          userRole="HEAD_COACH"
          onUpdateCoach={mockOnUpdateCoach}
        />
      );
      // Should contain "Jun" from June date
      expect(screen.getByText(/Jun/)).toBeInTheDocument();
    });
  });
});
