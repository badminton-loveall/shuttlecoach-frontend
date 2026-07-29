import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { AccessDeniedPage } from './AccessDeniedPage';

describe('AccessDeniedPage', () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <AccessDeniedPage />
      </MemoryRouter>
    );

  it('renders the access denied heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /access denied/i })).toBeInTheDocument();
  });

  it('renders the permission message', () => {
    renderPage();
    expect(screen.getByText(/you do not have permission to access this page/i)).toBeInTheDocument();
  });

  it('renders a link back to login', () => {
    renderPage();
    const link = screen.getByRole('link', { name: /return to login/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });

  it('applies page-container class to root element', () => {
    const { container } = renderPage();
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass('page-container');
    expect(root).toHaveClass('access-denied-page');
  });

  it('renders the access denied icon', () => {
    renderPage();
    expect(screen.getByText('⛔')).toBeInTheDocument();
  });
});
