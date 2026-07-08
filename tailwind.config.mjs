/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        dental: {
          50: '#effaff',
          100: '#dcf5ff',
          200: '#b8ebff',
          300: '#7bddff',
          400: '#35c7f4',
          500: '#0eaddd',
          600: '#0189bb',
          700: '#066e97',
          800: '#0b5c7d',
          900: '#0e4c68',
          950: '#082f43'
        },
        mint: '#2fd4a8',
        ink: '#07142f'
      },
      boxShadow: {
        premium: '0 24px 80px rgba(7,20,47,0.10)',
        card: '0 16px 45px rgba(15, 23, 42, 0.08)'
      },
      borderRadius: {
        '3xl': '1.75rem'
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif']
      },
      animation: {
        'fade-up': 'df-fade-up 0.42s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'df-fade-in 0.22s ease both',
        'scale-in': 'df-scale-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) both'
      },
      keyframes: {
        'df-fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'none' }
        },
        'df-fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        'df-scale-in': {
          from: { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          to: { opacity: '1', transform: 'none' }
        }
      }
    }
  },
  plugins: []
};
