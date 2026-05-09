import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d9ecff',
          200: '#bbdfff',
          300: '#8bcaff',
          400: '#54acff',
          500: '#2d8cff',
          600: '#176ef5',
          700: '#1357e0',
          800: '#1648b5',
          900: '#18408e',
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
