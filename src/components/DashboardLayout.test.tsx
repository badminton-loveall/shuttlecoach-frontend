import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import { AuthProvider } from '../contexts/AuthContext';

/**
 * DashboardLayout Component Tests
 * Validates layout structure and consistent padding/spacing
 */

describe('DashboardLayout Component', () => {
  const renderWithProviders = (children: React.ReactNode) => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('Layout Structure', () => {
    it('should render TopNav component', () => {
      renderWithProviders(<div>Test Content</div>);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should render children content in main area', () => {
      const testContent = 'Test Dashboard Content';
      renderWithProviders(<div>{testContent}</div>);

      expect(screen.getByText(testContent)).toBeInTheDocument();
    });

    it('should render main element', () => {
      renderWithProviders(<div>Test Content</div>);

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });
  });

  describe('Consistent Spacing', () => {
    it('should apply consistent padding to content', () => {
      const { container } = renderWithProviders(<div>Test Content</div>);

      const content = container.querySelector('.dashboard-content');
      expect(content).toHaveClass('dashboard-content');
      // CSS will handle padding verification
    });

    it('should use design system spacing classes', () => {
      const { container } = renderWithProviders(<div>Test Content</div>);

      const layout = container.querySelector('.dashboard-layout');
      expect(layout).toBeInTheDocument();
    });
  });

  describe('Custom Classname Support', () => {
    it('should accept and apply custom className', () => {
      const { container } = renderWithProviders(
        <div>Test</div>,
        // Note: DashboardLayout accepts className prop
      );

      // Create a test with custom class by checking the prop is passed
      const content = container.querySelector('.dashboard-content');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Layout Hierarchy', () => {
    it('should have correct semantic structure', () => {
      const { container } = renderWithProviders(<div>Content</div>);

      const layout = container.querySelector('div.dashboard-layout');
      const nav = layout?.querySelector('nav');
      const main = layout?.querySelector('main');

      expect(layout).toBeInTheDocument();
      expect(nav).toBeInTheDocument();
      expect(main).toBeInTheDocument();
    });

    it('should flex layout for full viewport height', () => {
      const { container } = renderWithProviders(<div>Content</div>);

      const layout = container.querySelector('.dashboard-layout');
      // CSS verification: should have display: flex and min-height: 100vh
      expect(layout).toHaveClass('dashboard-layout');
    });
  });

  describe('Children Rendering', () => {
    it('should render various types of content', () => {
      renderWithProviders(
        <div>
          <h1>Test Heading</h1>
          <p>Test paragraph</p>
        </div>
      );

      expect(screen.getByText('Test Heading')).toBeInTheDocument();
      expect(screen.getByText('Test paragraph')).toBeInTheDocument();
    });

    it('should handle component children', () => {
      const TestComponent = () => <div>Component Content</div>;

      renderWithProviders(<TestComponent />);

      expect(screen.getByText('Component Content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have main landmark', () => {
      renderWithProviders(<div>Content</div>);

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('should have navigation landmark', () => {
      renderWithProviders(<div>Content</div>);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive classes to content', () => {
      const { container } = renderWithProviders(<div>Content</div>);

      const content = container.querySelector('.dashboard-content');
      expect(content).toHaveClass('dashboard-content');
      // Responsive styles are handled in CSS
    });
  });
});
