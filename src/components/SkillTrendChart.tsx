import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { StudentTrendReport, TrendDataPoint } from '../types';

/**
 * SkillTrendChart
 * Dual-axis line chart displaying attendance percentage (left axis) and
 * average skill score (right axis) across training cycles.
 * Shows the correlation coefficient between the two metrics when available
 * (requires >= 3 completed cycles).
 *
 * Requirements: 9.2, 9.3, 9.4
 */

interface SkillTrendChartProps {
  /** Student trend report containing per-cycle data points and optional correlation */
  report: StudentTrendReport | null;
  /** Optional className for custom styling on the container */
  className?: string;
}

/**
 * Format the correlation coefficient with an interpretation label.
 */
function getCorrelationLabel(coefficient: number): { text: string; color: string } {
  const abs = Math.abs(coefficient);
  if (abs >= 0.7) {
    return {
      text: coefficient > 0 ? 'Strong positive' : 'Strong negative',
      color: coefficient > 0 ? 'var(--color-success)' : 'var(--color-danger)',
    };
  }
  if (abs >= 0.4) {
    return {
      text: coefficient > 0 ? 'Moderate positive' : 'Moderate negative',
      color: coefficient > 0 ? 'var(--color-success)' : 'var(--color-warning)',
    };
  }
  if (abs >= 0.2) {
    return {
      text: coefficient > 0 ? 'Weak positive' : 'Weak negative',
      color: 'var(--color-warning)',
    };
  }
  return { text: 'No correlation', color: 'var(--text-tertiary)' };
}

export const SkillTrendChart: React.FC<SkillTrendChartProps> = ({ report, className = '' }) => {
  if (!report || report.dataPoints.length === 0) {
    return (
      <div
        className={`card ${className}`}
        style={{ border: '1px solid var(--border-default)' }}
        data-testid="skill-trend-chart"
      >
        <h3 style={{ marginBottom: 'var(--space-md)', marginTop: 0, fontSize: 'var(--font-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
          Attendance vs Skill Trend
        </h3>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
          No trend data available yet. Data will appear after completing at least one training cycle.
        </p>
      </div>
    );
  }

  const { dataPoints, correlationCoefficient } = report;

  // Compute axis domains
  const maxAttendance = Math.min(
    100,
    Math.max(...dataPoints.map((d: TrendDataPoint) => d.attendancePercentage), 100)
  );
  const maxSkillScore = Math.max(...dataPoints.map((d: TrendDataPoint) => d.avgSkillScore), 4);

  const correlationInfo = correlationCoefficient !== undefined
    ? getCorrelationLabel(correlationCoefficient)
    : null;

  return (
    <div
      className={`card ${className}`}
      style={{ border: '1px solid var(--border-default)' }}
      data-testid="skill-trend-chart"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" style={{ marginBottom: 'var(--space-md)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
          Attendance vs Skill Trend
        </h3>

        {correlationInfo && correlationCoefficient !== undefined && (
          <div className="flex items-center gap-2" style={{ fontSize: 'var(--font-sm)' }} data-testid="correlation-display">
            <span style={{ color: 'var(--text-secondary)' }}>Correlation:</span>
            <span style={{ fontWeight: 'var(--weight-medium)', color: correlationInfo.color }}>
              {correlationCoefficient.toFixed(2)}
            </span>
            <span style={{ fontSize: 'var(--font-xs)', color: correlationInfo.color }}>
              ({correlationInfo.text})
            </span>
          </div>
        )}

        {correlationCoefficient === undefined && dataPoints.length < 3 && (
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }} data-testid="insufficient-cycles-notice">
            Correlation requires 3+ cycles of data
          </p>
        )}
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dataPoints}
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
            <XAxis
              dataKey="cycleKey"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--border-strong)' }}
              tickLine={{ stroke: 'var(--border-strong)' }}
            />
            {/* Left Y-axis: Attendance Percentage (0-100%) */}
            <YAxis
              yAxisId="attendance"
              orientation="left"
              domain={[0, maxAttendance]}
              tickCount={6}
              tick={{ fill: 'var(--color-success)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--color-success)' }}
              tickLine={{ stroke: 'var(--color-success)' }}
              label={{
                value: 'Attendance %',
                angle: -90,
                position: 'insideLeft',
                offset: -4,
                style: { fill: 'var(--color-success)', fontSize: 11 },
              }}
            />
            {/* Right Y-axis: Skill Score (0-max) */}
            <YAxis
              yAxisId="skill"
              orientation="right"
              domain={[0, Math.ceil(maxSkillScore)]}
              tickCount={5}
              tick={{ fill: 'var(--color-info)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--color-info)' }}
              tickLine={{ stroke: 'var(--color-info)' }}
              label={{
                value: 'Skill Score',
                angle: 90,
                position: 'insideRight',
                offset: -4,
                style: { fill: 'var(--color-info)', fontSize: 11 },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
              }}
              labelStyle={{ color: 'var(--text-primary)' }}
              formatter={(value: any, name: any) => {
                const v = Number(value);
                if (name === 'Attendance %') return [`${v.toFixed(1)}%`, name];
                return [v.toFixed(2), name];
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '8px' }} />
            <Line
              yAxisId="attendance"
              type="monotone"
              dataKey="attendancePercentage"
              name="Attendance %"
              stroke="var(--color-success)"
              strokeWidth={2}
              dot={{ r: 4, fill: 'var(--color-success)' }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="skill"
              type="monotone"
              dataKey="avgSkillScore"
              name="Skill Score"
              stroke="var(--color-info)"
              strokeWidth={2}
              dot={{ r: 4, fill: 'var(--color-info)' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Data summary footer */}
      <div
        className="flex flex-wrap gap-4"
        style={{ marginTop: 'var(--space-md)', borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-sm)', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}
      >
        <span>
          Cycles: <span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>{dataPoints.length}</span>
        </span>
        <span>
          Avg Attendance:{' '}
          <span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--color-success)' }}>
            {(dataPoints.reduce((sum: number, d: TrendDataPoint) => sum + d.attendancePercentage, 0) / dataPoints.length).toFixed(1)}%
          </span>
        </span>
        <span>
          Avg Skill Score:{' '}
          <span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--color-info)' }}>
            {(dataPoints.reduce((sum: number, d: TrendDataPoint) => sum + d.avgSkillScore, 0) / dataPoints.length).toFixed(2)}
          </span>
        </span>
      </div>
    </div>
  );
};
