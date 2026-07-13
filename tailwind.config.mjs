/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf8',
          100: '#d1faf0',
          200: '#a7f3e0',
          300: '#6ee7cb',
          400: '#34d3b4',
          500: '#14b8a0',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e'
        },
        ink: '#0c1222'
      },
      boxShadow: {
        soft: '0 8px 30px rgb(12 18 34 / 0.08)',
        lift: '0 20px 50px rgb(12 18 34 / 0.12)'
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem'
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif']
      },
      animation: {
        'fade-up': 'nx-fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'nx-fade-in 0.25s ease both'
      },
      keyframes: {
        'nx-fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'none' }
        },
        'nx-fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        }
      }
    }
  },
  plugins: []
}
