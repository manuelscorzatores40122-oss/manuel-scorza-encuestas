import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f7ea',
          100: '#dff0cc',
          200: '#bde599',
          300: '#8fd160',
          400: '#67bd39',
          500: '#4a8f2c',
          600: '#3c7424',
          700: '#2d5a1b',
          800: '#1f3d12',
          900: '#152a0c',
        },
        warm: {
          50: '#fff8ed',
          100: '#ffefd4',
          200: '#ffdaa9',
          300: '#ffbf72',
          400: '#ff9a3a',
          500: '#ff7d14',
          600: '#f0610a',
          700: '#c7480b',
          800: '#9e3911',
          900: '#7f3112',
        },
        risk: {
          low: '#16a34a',
          mid: '#eab308',
          high: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
