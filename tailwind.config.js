/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Instrument Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#f7f7f8',
          100: '#ececee',
          200: '#d5d6db',
          300: '#b0b2bc',
          400: '#858896',
          500: '#676a7a',
          600: '#525463',
          700: '#43444f',
          800: '#3a3b43',
          900: '#32333a',
          950: '#1c1c21',
        },
        brass: {
          400: '#c9a962',
          500: '#b8923d',
          600: '#9a7629',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 17, 21, 0.04), 0 8px 24px rgba(15, 17, 21, 0.06)',
        lift: '0 4px 12px rgba(15, 17, 21, 0.08), 0 24px 48px rgba(15, 17, 21, 0.06)',
      },
    },
  },
  plugins: [],
};
