/** @type {import('tailwindcss').Config} */
const cv = (v) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Legacy semantic tokens (kept so Day 6–9 pages don't break) ──
        primary: {
          DEFAULT: '#5B5CF0',
          hover:   '#4F50D8',
          light:   '#EEF2FF',
          dark:    '#3B3CC4',
        },
        success: { DEFAULT: '#10B981', light: '#D1FAE5', soft: 'rgba(16, 185, 129, 0.12)' },
        warning: { DEFAULT: '#F59E0B', light: '#FEF3C7', soft: 'rgba(245, 158, 11, 0.12)' },
        danger:  { DEFAULT: '#EF4444', light: '#FEE2E2', soft: 'rgba(239, 68, 68, 0.12)' },
        info:    { DEFAULT: '#38BDF8', light: '#E0F2FE', soft: 'rgba(56, 189, 248, 0.12)' },
        spend:   { DEFAULT: '#64748B' },

        surface: {
          DEFAULT:        '#FFFFFF',
          muted:          '#F8FAFC',
          dark:           '#1A233A',
          'dark-muted':   '#081028',
          'dark-elevated':'#121B32',
          'dark-sidebar': '#17233D',
        },

        text: {
          primary:          '#0F172A',
          secondary:        '#334155',
          muted:            '#64748B',
          'dark-primary':   '#F5F7FF',
          'dark-secondary': '#CBD5E1',
          'dark-muted':     '#94A3B8',
          // ── New theme-aware tokens (CSS-var driven) ──
          dim:    cv('--c-text-dim'),
          faint:  cv('--c-text-faint'),
        },

        border: {
          DEFAULT:        '#E2E8F0',
          strong:         '#CBD5E1',
          dark:           '#1F2A44',
          'dark-strong':  '#2D3956',
        },

        chart: {
          1: '#5B5CF0', 2: '#10B981', 3: '#F59E0B',
          4: '#EC4899', 5: '#06B6D4', 6: '#8B5CF6',
        },

        // ── New design tokens that swap with the theme via CSS vars ──
        bg:      cv('--c-bg'),
        bg2:     cv('--c-bg2'),
        card:    cv('--c-card'),
        sidebar: cv('--c-sidebar'),
        line:    'var(--c-line)',
        line2:   'var(--c-line2)',
        hover:   'var(--c-hover)',
        track:   'var(--c-track)',
        accent: {
          DEFAULT: '#5B5CF0',
          soft:    'rgba(91, 92, 240, 0.12)',
          mid:     'rgba(91, 92, 240, 0.22)',
        },
        pink: { DEFAULT: '#EC4899', soft: 'rgba(236, 72, 153, 0.12)' },
        textc: cv('--c-text'),
      },
      borderRadius: {
        card: '1.25rem', // 20px
        '2xl': '1.25rem', // override default 16 → 20 per design spec
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        pop:  'var(--shadow-pop)',
        glow: '0 0 0 1px rgba(91, 92, 240, 0.35), 0 14px 30px -10px rgba(91, 92, 240, 0.45)',
        'card-hover':       '0 4px 12px -2px rgba(8, 16, 40, 0.08)',
        'card-hover-dark':  '0 4px 16px -2px rgba(0, 0, 0, 0.4)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease-out both',
      },
    },
  },
  plugins: [],
}
