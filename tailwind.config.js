/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Electric Lime (WCAG AA compliant with dark text)
        primary: {
          DEFAULT: '#B8E135',
          50: '#F5FCDF',
          100: '#EBF9C4',
          200: '#DDF591',
          300: '#CFF05E',
          400: '#C1EC2B',
          500: '#B8E135',
          600: '#9AC61A',
          700: '#779A15',
          800: '#546E0F',
          900: '#30410A',
        },
        'electric-lime': '#B8E135',
        
        // Neutral - Cool Slate (Full palette for light and dark modes)
        slate: {
          50: '#F8FAFB',
          100: '#F1F4F6',
          200: '#E4E9EC',
          300: '#D1D9DE',
          400: '#9CA8B3',
          500: '#6B7885',
          600: '#4A5662',
          700: '#333D47',
          800: '#1F262E',
          900: '#131820',
          950: '#0A0D11',
        },
        
        // Semantic Colors (WCAG AA compliant)
        success: {
          DEFAULT: '#22C55E',
          light: '#86EFAC',
          dark: '#16A34A',
          bg: '#F0FDF4',
          text: '#166534',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FCD34D',
          dark: '#D97706',
          bg: '#FFFBEB',
          text: '#92400E',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#FCA5A5',
          dark: '#DC2626',
          bg: '#FEF2F2',
          text: '#991B1B',
        },
        info: {
          DEFAULT: '#3B82F6',
          light: '#93C5FD',
          dark: '#2563EB',
          bg: '#EFF6FF',
          text: '#1E40AF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Design system scale: 12, 16, 18, 24, 36, 42, 64
        display: ['64px', { lineHeight: '1.1', fontWeight: '700' }],
        h1: ['42px', { lineHeight: '1.2', fontWeight: '700' }],
        h2: ['36px', { lineHeight: '1.2', fontWeight: '600' }],
        h3: ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        h4: ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        body: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        small: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        label: ['12px', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' }],
      },
      spacing: {
        // Design system scale: 2, 4, 8, 12, 16, 18, 24, 36, 42, 64
        '0.5': '2px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '4.5': '18px',
        '6': '24px',
        '9': '36px',
        '10.5': '42px',
        '16': '64px',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '20px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0, 0, 0, 0.07)',
        float: '0 8px 32px rgba(0, 0, 0, 0.14)',
        focus: '0 0 0 3px rgba(184, 225, 53, 0.3)',
        'focus-danger': '0 0 0 3px rgba(239, 68, 68, 0.3)',
        'focus-info': '0 0 0 3px rgba(59, 130, 246, 0.3)',
        overlay: '0 12px 24px rgba(0, 0, 0, 0.15)',
      },
      maxWidth: {
        'content': '1400px',
        'narrow': '768px',
        'wide': '1600px',
      },
    },
  },
  plugins: [],
}
