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
      color: coefficient > 0 ? 'text-green-600' : 'text-red-600',
    };
  }
  if (abs >= 0.4) {
    return {
      text: coefficient > 0 ? 'Moderate positive' : 'Moderate negative',
      color: coefficient > 0 ? 'text-green-500' : 'text-orange-500',
    };
  }
  if (abs >= 0.2) {
    return {
      text: coefficient > 0 ? 'Weak positive' : 'Weak negative',
      color: 'text-yellow-600',
    };
  }
  return { text: 'No correlation', color: 'text-gray-500' };
}

export const SkillTrendChart: React.FC<SkillTrendChartProps> = ({ report, className = '' }) => {
  if (!report || report.dataPoints.length === 0) {
    return (
      <div
        className={`rounded-lg border border-[#E4E9EC] bg-[var(--surface-card)] p-6 ${className}`}
        data-testid="skill-trend-chart"
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Attendance vs Skill Trend
        </h3>
        <p className="text-sm text-gray-500">
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
      className={`rounded-lg border border-[#E4E9EC] bg-[var(--surface-card)] p-6 ${className}`}
      data-testid="skill-trend-chart"
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Attendance vs Skill Trend
        </h3>

        {correlationInfo && correlationCoefficient !== undefined && (
          <div className="flex items-center gap-2 text-sm" data-testid="correlation-display">
            <span className="text-gray-500">Correlation:</span>
            <span className={`font-medium ${correlationInfo.color}`}>
              {correlationCoefficient.toFixed(2)}
            </span>
            <span className={`text-xs ${correlationInfo.color}`}>
              ({correlationInfo.text})
            </span>
          </div>
        )}

        {correlationCoefficient === undefined && dataPoints.length < 3 && (
          <p className="text-xs text-gray-500" data-testid="insufficient-cycles-notice">
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
            <CartesianGrid strokeDasharray="3 3" stroke="#E4E9EC" />
            <XAxis
              dataKey="cycleKey"
              tick={{ fill: '#6B7885', fontSize: 11 }}
              axisLine={{ stroke: '#D1D9DE' }}
              tickLine={{ stroke: '#D1D9DE' }}
            />
            {/* Left Y-axis: Attendance Percentage (0-100%) */}
            <YAxis
              yAxisId="attendance"
              orientation="left"
              domain={[0, maxAttendance]}
              tickCount={6}
              tick={{ fill: '#34d399', fontSize: 11 }}
              axisLine={{ stroke: '#34d399' }}
              tickLine={{ stroke: '#34d399' }}
              label={{
                value: 'Attendance %',
                angle: -90,
                position: 'insideLeft',
                offset: -4,
                style: { fill: '#34d399', fontSize: 11 },
              }}
            />
            {/* Right Y-axis: Skill Score (0-max) */}
            <YAxis
              yAxisId="skill"
              orientation="right"
              domain={[0, Math.ceil(maxSkillScore)]}
              tickCount={5}
              tick={{ fill: '#60a5fa', fontSize: 11 }}
              axisLine={{ stroke: '#60a5fa' }}
              tickLine={{ stroke: '#60a5fa' }}
              label={{
                value: 'Skill Score',
                angle: 90,
                position: 'insideRight',
                offset: -4,
                style: { fill: '#60a5fa', fontSize: 11 },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#F8FAFB',
                border: '1px solid #E4E9EC',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#0A0D11' }}
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
              stroke="#34d399"
              strokeWidth={2}
              dot={{ r: 4, fill: '#34d399' }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="skill"
              type="monotone"
              dataKey="avgSkillScore"
              name="Skill Score"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={{ r: 4, fill: '#60a5fa' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Data summary footer */}
      <div className="mt-4 flex flex-wrap gap-4 border-t border-[#E4E9EC] pt-3 text-xs text-gray-500">
        <span>
          Cycles: <span className="font-medium text-gray-800">{dataPoints.length}</span>
        </span>
        <span>
          Avg Attendance:{' '}
          <span className="font-medium text-green-600">
            {(dataPoints.reduce((sum: number, d: TrendDataPoint) => sum + d.attendancePercentage, 0) / dataPoints.length).toFixed(1)}%
          </span>
        </span>
        <span>
          Avg Skill Score:{' '}
          <span className="font-medium text-blue-600">
            {(dataPoints.reduce((sum: number, d: TrendDataPoint) => sum + d.avgSkillScore, 0) / dataPoints.length).toFixed(2)}
          </span>
        </span>
      </div>
    </div>
  );
};
