/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#b3c5da',
          300: '#8ca8c8',
          400: '#668bb6',
          500: '#406ea4',
          600: '#2d5083',
          700: '#1a3262',
          800: '#0d1b31',
          900: '#050a0f',
        },
        electric: {
          50: '#e0f2fe',
          100: '#b6e3fd',
          200: '#7dd3fc',
          300: '#38bdf8',
          400: '#0ea5e9',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#051e3e',
        }
      },
      animation: {
        'float': 'float 8s ease-in-out infinite',
        'slideIn': 'slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'fadeIn': 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'bloom': 'bloom 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'glow': 'glow 2s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        slideIn: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        bloom: {
          '0%': { transform: 'scale(0.8)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)' },
          '50%': { boxShadow: '0 0 30px rgba(6, 182, 212, 0.8)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(135deg, #0d1b31 0%, #1a3262 50%, #2d5083 100%)',
        'gradient-electric': 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #38bdf8 100%)',
        'gradient-hero': 'linear-gradient(135deg, #050a0f 0%, #0d1b31 30%, #1a3262 70%, #0284c7 100%)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
};