import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

/* eslint-disable react-refresh/only-export-components */

/**
 * ThemeContext
 * Lets the user explicitly pick Light / Dark / System, overriding the OS
 * `prefers-color-scheme` setting. The choice is applied as a `data-theme`
 * attribute on <html>, which theme-light.css / theme-dark.css key off of,
 * and persisted to localStorage so it survives reloads.
 * Follows the same context + provider + hook pattern as AuthContext/ToastContext.
 */

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextInterface {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
}

const STORAGE_KEY = 'shuttlecoach-theme';

export const ThemeContext = createContext<ThemeContextInterface | undefined>(undefined);

const getSystemTheme = (): ResolvedTheme =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const readStoredTheme = (): ThemePreference => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage unavailable (private mode, etc.) — fall back to system.
  }
  return 'system';
};

const applyTheme = (resolved: ResolvedTheme, theme: ThemePreference) => {
  const root = document.documentElement;
  // Only stamp an explicit attribute for a deliberate choice; "system" means
  // "no override", letting the @media(prefers-color-scheme) fallback in
  // theme-dark.css decide (and follow the OS live if it changes).
  if (theme === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
  root.style.colorScheme = resolved;
};

/**
 * ThemeProvider component
 * Wraps the application and provides theme-preference context. Applied
 * outermost (in App.tsx, above AuthProvider) since theme shouldn't depend
 * on auth state.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemePreference>(readStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    theme === 'system' ? getSystemTheme() : theme
  );

  useEffect(() => {
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    setResolvedTheme(resolved);
    applyTheme(resolved, theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const resolved = getSystemTheme();
      setResolvedTheme(resolved);
      applyTheme(resolved, 'system');
    };
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable — theme choice just won't persist across reloads.
    }
  }, []);

  const value: ThemeContextInterface = { theme, resolvedTheme, setTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/**
 * useTheme hook
 * Custom hook to access theme-preference context throughout the application.
 * Must be used within ThemeProvider.
 */
export const useTheme = (): ThemeContextInterface => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};
