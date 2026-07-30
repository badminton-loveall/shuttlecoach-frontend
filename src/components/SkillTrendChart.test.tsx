import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkillTrendChart } from './SkillTrendChart';
import type { StudentTrendReport } from '../types';

// Mock ResponsiveContainer (jsdom renders SVG with zero dimensions)
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 600, height: 300 }}>
        {children}
      </div>
    ),
  };
});

function buildReport(options?: {
  cycles?: number;
  includeCorrelation?: boolean;
  correlationValue?: number;
}): StudentTrendReport {
  const cycles = options?.cycles ?? 4;
  const cycleLabels = ['Jan-Feb 2025', 'Mar-Apr 2025', 'May-Jun 2025', 'Jul-Aug 2025', 'Sep-Oct 2025'];

  const dataPoints = Array.from({ length: cycles }, (_, i) => ({
    cycleKey: cycleLabels[i] || `Cycle ${i + 1}`,
    attendancePercentage: 70 + i * 5,
    avgSkillScore: 2.0 + i * 0.4,
  }));

  const report: StudentTrendReport = {
    studentId: 'student-1',
    dataPoints,
  };

  if (options?.includeCorrelation) {
    report.correlationCoefficient = options?.correlationValue ?? 0.85;
  }

  return report;
}

describe('SkillTrendChart', () => {
  it('renders empty state when report is null', () => {
    render(<SkillTrendChart report={null} />);
    expect(screen.getByTestId('skill-trend-chart')).toBeInTheDocument();
    expect(screen.getByText('Attendance vs Skill Trend')).toBeInTheDocument();
    expect(screen.getByText(/No trend data available yet/)).toBeInTheDocument();
  });

  it('renders empty state when report has no data points', () => {
    const report: StudentTrendReport = {
      studentId: 'student-1',
      dataPoints: [],
    };
    render(<SkillTrendChart report={report} />);
    expect(screen.getByText(/No trend data available yet/)).toBeInTheDocument();
  });

  it('renders chart with data points', () => {
    const report = buildReport({ cycles: 3 });
    render(<SkillTrendChart report={report} />);

    expect(screen.getByTestId('skill-trend-chart')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.queryByText(/No trend data available yet/)).not.toBeInTheDocument();
  });

  it('displays correlation coefficient when available', () => {
    const report = buildReport({ cycles: 4, includeCorrelation: true, correlationValue: 0.85 });
    render(<SkillTrendChart report={report} />);

    const correlationDisplay = screen.getByTestId('correlation-display');
    expect(correlationDisplay).toBeInTheDocument();
    expect(correlationDisplay).toHaveTextContent('0.85');
    expect(correlationDisplay).toHaveTextContent('Strong positive');
  });

  it('displays moderate positive correlation label', () => {
    const report = buildReport({ cycles: 4, includeCorrelation: true, correlationValue: 0.55 });
    render(<SkillTrendChart report={report} />);

    expect(screen.getByTestId('correlation-display')).toHaveTextContent('Moderate positive');
  });

  it('displays weak positive correlation label', () => {
    const report = buildReport({ cycles: 4, includeCorrelation: true, correlationValue: 0.25 });
    render(<SkillTrendChart report={report} />);

    expect(screen.getByTestId('correlation-display')).toHaveTextContent('Weak positive');
  });

  it('displays no correlation label for very low values', () => {
    const report = buildReport({ cycles: 4, includeCorrelation: true, correlationValue: 0.1 });
    render(<SkillTrendChart report={report} />);

    expect(screen.getByTestId('correlation-display')).toHaveTextContent('No correlation');
  });

  it('displays strong negative correlation label', () => {
    const report = buildReport({ cycles: 4, includeCorrelation: true, correlationValue: -0.8 });
    render(<SkillTrendChart report={report} />);

    expect(screen.getByTestId('correlation-display')).toHaveTextContent('Strong negative');
  });

  it('shows insufficient cycles notice when < 3 cycles and no correlation', () => {
    const report = buildReport({ cycles: 2 });
    render(<SkillTrendChart report={report} />);

    expect(screen.getByTestId('insufficient-cycles-notice')).toBeInTheDocument();
    expect(screen.getByText(/Correlation requires 3\+ cycles/)).toBeInTheDocument();
  });

  it('does not show insufficient notice when 3+ cycles exist but no correlation provided', () => {
    // This case: 3+ cycles but server didn't compute correlation (maybe API didn't return it)
    const report = buildReport({ cycles: 3 });
    // correlationCoefficient is undefined, dataPoints.length >= 3
    render(<SkillTrendChart report={report} />);

    // The notice should not show since we have >= 3 data points
    expect(screen.queryByTestId('insufficient-cycles-notice')).not.toBeInTheDocument();
  });

  it('renders data summary footer with correct values', () => {
    const report: StudentTrendReport = {
      studentId: 'student-1',
      dataPoints: [
        { cycleKey: 'Jan-Feb 2025', attendancePercentage: 80, avgSkillScore: 2.5 },
        { cycleKey: 'Mar-Apr 2025', attendancePercentage: 90, avgSkillScore: 3.0 },
      ],
    };
    render(<SkillTrendChart report={report} />);

    // Cycles count
    expect(screen.getByText('2')).toBeInTheDocument();
    // Avg attendance: (80 + 90) / 2 = 85.0%
    expect(screen.getByText('85.0%')).toBeInTheDocument();
    // Avg skill score: (2.5 + 3.0) / 2 = 2.75
    expect(screen.getByText('2.75')).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    const report = buildReport({ cycles: 3 });
    const { container } = render(<SkillTrendChart report={report} className="mt-4" />);
    const chart = container.querySelector('[data-testid="skill-trend-chart"]');
    expect(chart?.className).toContain('mt-4');
  });
});
