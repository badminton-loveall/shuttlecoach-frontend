import React from 'react';
import './StudentScheduleCalendar.css';

interface MonthNavigatorProps {
  year: number;
  month: number; // 0-indexed
  onPrev: () => void;
  onNext: () => void;
}

const MonthNavigator: React.FC<MonthNavigatorProps> = ({
  year,
  month,
  onPrev,
  onNext,
}) => {
  const label = new Date(year, month).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="month-navigator">
      <button
        className="month-navigator__btn"
        onClick={onPrev}
        aria-label="Previous month"
        type="button"
      >
        ‹
      </button>
      <span className="month-navigator__label">{label}</span>
      <button
        className="month-navigator__btn"
        onClick={onNext}
        aria-label="Next month"
        type="button"
      >
        ›
      </button>
    </div>
  );
};

export default MonthNavigator;
