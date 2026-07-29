import React, { useEffect, useState } from 'react';

/**
 * Toast Component
 * Renders an individual toast notification with auto-dismiss and animations.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

export interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error';
  duration?: number;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type,
  duration = 3000,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation on mount
    const showTimeout = setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss after duration
    const dismissTimeout = setTimeout(() => {
      setIsVisible(false);
      // Wait for exit animation before removing
      setTimeout(() => onDismiss(id), 300);
    }, duration);

    return () => {
      clearTimeout(showTimeout);
      clearTimeout(dismissTimeout);
    };
  }, [id, duration, onDismiss]);

  const baseClasses =
    'pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg transition-all duration-300 ease-in-out';

  const typeClasses =
    type === 'success'
      ? 'bg-green-600 text-white'
      : 'bg-red-600 text-white';

  const visibilityClasses = isVisible
    ? 'translate-x-0 opacity-100'
    : 'translate-x-full opacity-0';

  return (
    <div
      className={`${baseClasses} ${typeClasses} ${visibilityClasses}`}
      role="alert"
      aria-live="assertive"
    >
      {/* Icon */}
      <span className="flex-shrink-0 text-lg">
        {type === 'success' ? '✓' : '✕'}
      </span>

      {/* Message */}
      <p className="flex-1 text-sm font-medium">{message}</p>

      {/* Dismiss button */}
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onDismiss(id), 300);
        }}
        className="flex-shrink-0 rounded p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Dismiss notification"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
