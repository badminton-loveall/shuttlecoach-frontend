import React, { createContext, useCallback, useContext, useState } from 'react';
import { Toast } from '../components/Toast';

/* eslint-disable react-refresh/only-export-components */

/**
 * ToastContext
 * Provides toast notification functionality throughout the application.
 * Follows the same context + provider + hook pattern as AuthContext.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

export interface ToastOptions {
  message: string;
  type: 'success' | 'error';
  duration?: number; // default 3000ms
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextInterface {
  showToast: (options: ToastOptions) => void;
}

// Create the Toast Context
export const ToastContext = createContext<ToastContextInterface | undefined>(undefined);

/**
 * ToastProvider component
 * Wraps the application and provides toast notification context.
 * Renders the toast container at root level for all notifications.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((options: ToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast: ToastItem = {
      ...options,
      id,
      duration: options.duration ?? 3000,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value: ToastContextInterface = {
    showToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast container - fixed, top-right corner */}
      <div
        className="pointer-events-none fixed top-4 right-4 flex flex-col gap-2"
        style={{ zIndex: 'var(--z-toast, 1100)' }}
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onDismiss={dismissToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/**
 * useToast hook
 * Custom hook to access toast notification context throughout the application.
 * Must be used within ToastProvider.
 */
export const useToast = (): ToastContextInterface => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
};
