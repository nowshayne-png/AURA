/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f6f8f4',
          100: '#e9f0e4',
          200: '#d4e1cb',
          300: '#b4caa3',
          400: '#87a96b',
          500: '#749157',
          600: '#5c7344',
          700: '#495a37',
          800: '#3c482f',
          900: '#333d29',
        },
        beige: {
          50: '#fefcf7',
          100: '#fdf7ed',
          200: '#faecd0',
          300: '#f5dda8',
          400: '#edc574',
          500: '#e6ad4c',
          600: '#d89537',
          700: '#b4762e',
          800: '#915e2b',
          900: '#764e26',
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'slideIn': 'slideIn 0.5s ease-out',
        'fadeIn': 'fadeIn 0.3s ease-out',
        'bloom': 'bloom 0.6s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(180deg)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        bloom: {
          '0%': { transform: 'scale(0.8)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
};