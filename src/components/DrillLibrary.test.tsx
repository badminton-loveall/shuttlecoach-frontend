import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DrillLibrary from './DrillLibrary';

describe('DrillLibrary', () => {
  it('renders drill library title', () => {
    render(<DrillLibrary />);
    expect(screen.getByText('Drill Library')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<DrillLibrary />);
    expect(screen.getByPlaceholderText('Search drills...')).toBeInTheDocument();
  });

  it('renders category filter dropdown with 5 categories plus All', () => {
    render(<DrillLibrary />);
    const categorySelect = screen.getByRole('combobox');
    expect(categorySelect).toBeInTheDocument();

    const options = categorySelect.querySelectorAll('option');
    expect(options).toHaveLength(6); // All + 5 categories

    const optionTexts = Array.from(options).map(o => o.textContent);
    expect(optionTexts).toContain('All Categories');
    expect(optionTexts).toContain('Service');
    expect(optionTexts).toContain('Service Return');
    expect(optionTexts).toContain('Forehand (FH)');
    expect(optionTexts).toContain('Round Head');
    expect(optionTexts).toContain('Backhand (BH)');
  });

  it('displays drill items from local data', () => {
    render(<DrillLibrary />);
    expect(screen.getByText('BH Short Service')).toBeInTheDocument();
    expect(screen.getByText('Cross Drop FH')).toBeInTheDocument();
  });

  it('displays drill categories as badges', () => {
    render(<DrillLibrary />);
    const serviceBadges = screen.getAllByText('Service');
    expect(serviceBadges.length).toBeGreaterThan(0);
  });

  it('filters drills by search query', () => {
    render(<DrillLibrary />);
    const searchInput = screen.getByPlaceholderText('Search drills...');
    fireEvent.change(searchInput, { target: { value: 'BH Short' } });

    expect(screen.getByText('BH Short Service')).toBeInTheDocument();
    expect(screen.queryByText('Cross Drop FH')).not.toBeInTheDocument();
  });

  it('filters drills by category', () => {
    render(<DrillLibrary />);
    const categorySelect = screen.getByRole('combobox');
    fireEvent.change(categorySelect, { target: { value: 'Round Head' } });

    expect(screen.getByText('Cross Drop Round Head')).toBeInTheDocument();
    expect(screen.queryByText('BH Short Service')).not.toBeInTheDocument();
  });

  it('displays drag instruction', () => {
    render(<DrillLibrary />);
    expect(screen.getByText('Drag drills to weekly planners')).toBeInTheDocument();
  });

  it('shows no drills message when search returns no results', () => {
    render(<DrillLibrary />);
    const searchInput = screen.getByPlaceholderText('Search drills...');
    fireEvent.change(searchInput, { target: { value: 'nonexistentdrill12345' } });

    expect(screen.getByText('No drills found')).toBeInTheDocument();
  });
});
