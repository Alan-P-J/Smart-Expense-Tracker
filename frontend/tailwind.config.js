/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#4F46E5', light: '#EEEDFE', dark: '#3730A3' },
        success: { DEFAULT: '#1D9E75', light: '#E1F5EE' },
        warning: { DEFAULT: '#EF9F27', light: '#FAEEDA' },
        danger:  { DEFAULT: '#E24B4A', light: '#FCEBEB' },
        surface: { DEFAULT: '#FFFFFF', dark: '#111827' },
        muted:   { DEFAULT: '#6B7280', dark: '#9CA3AF' },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
