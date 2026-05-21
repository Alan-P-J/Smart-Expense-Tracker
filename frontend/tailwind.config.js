/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5', // indigo-600
          hover:   '#4338CA', // indigo-700 (not 800)
          light:   '#EEF2FF', // indigo-50
          dark:    '#3730A3', // indigo-800 (dark mode active)
        },
        success: { DEFAULT: '#1D9E75', light: '#E1F5EE' },
        warning: { DEFAULT: '#EF9F27', light: '#FAEEDA' },
        danger:  { DEFAULT: '#E24B4A', light: '#FCEBEB' },
        info:    { DEFAULT: '#0EA5E9', light: '#E0F2FE' }, // sky-500
        spend:   { DEFAULT: '#64748B' }, // neutral slate for amounts
        surface: {
          DEFAULT:      '#FFFFFF', // cards, modals (light)
          muted:        '#F8FAFC', // slate-50 — page background (light)
          dark:         '#1E293B', // slate-800 — cards, modals (dark) — lifted +1 step
          'dark-muted': '#0F172A', // slate-900 — page background (dark) — lifted +1 step
        },

        // ─── Text (slate scale, light + dark) ───────────────────────
        text: {
          primary:          '#0F172A', // slate-900 — headings, body
          secondary:        '#334155', // slate-700 — sub-headings
          muted:            '#64748B', // slate-500 — captions, placeholders
          'dark-primary':   '#F8FAFC', // slate-50
          'dark-secondary': '#CBD5E1', // slate-300
          'dark-muted':     '#94A3B8', // slate-400
        },

        // ─── Borders / dividers ─────────────────────────────────────
        border: {
          DEFAULT:      '#E2E8F0', // slate-200 — subtle separators
          strong:       '#CBD5E1', // slate-300 — inputs, table grids
          dark:         '#334155', // slate-700 — subtle (dark mode) — lifted +1 step
          'dark-strong':'#475569', // slate-600 — inputs (dark mode) — lifted +1 step
        },

        // ─── Chart palette (Recharts series colours) ────────────────
        // Class names: text-chart-1, bg-chart-2, stroke-chart-3 …
        chart: {
          1: '#4F46E5', // indigo  (matches primary)
          2: '#1D9E75', // emerald (matches success)
          3: '#EF9F27', // amber   (matches warning)
          4: '#E24B4A', // red     (matches danger)
          5: '#0EA5E9', // sky     (matches info)
          6: '#8B5CF6', // violet  (companion hue, no semantic role)
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
