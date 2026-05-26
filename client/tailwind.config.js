/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Clash Display', 'Outfit', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        sunset: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
        peach: {
          400: '#fb7185',
          500: '#f43f5e',
        },
        mint: {
          400: '#34d399',
          500: '#10b981',
        },
        sky2: {
          400: '#38bdf8',
          500: '#0ea5e9',
        },
        dark: {
          900: '#0f0f12',
          800: '#18181c',
          700: '#222228',
          600: '#2d2d35',
        },
      },
      backgroundImage: {
        'gz-grad': 'linear-gradient(135deg,#f97316 0%,#f43f5e 35%,#d946ef 65%,#7c3aed 100%)',
        'story-ring': 'conic-gradient(from 210deg, #fb7185, #f97316, #f43f5e, #d946ef, #7c3aed, #fb7185)',
        'soft-grad': 'linear-gradient(135deg,#fde68a 0%,#fbcfe8 45%,#ddd6fe 100%)',
      },
      boxShadow: {
        pop: '0 18px 60px -20px rgba(217,70,239,0.45)',
        popSoft: '0 14px 40px -18px rgba(15,23,42,0.18)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.4s linear infinite',
        'pop': 'pop 0.4s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pop: {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '60%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
