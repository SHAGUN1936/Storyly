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
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Premium neutrals — deep black to inky
        ink: {
          950: '#06070C',
          900: '#0B0F19',
          800: '#111827',
          700: '#161B2C',
          600: '#1F2540',
          500: '#262C46',
        },
        // Primary brand — fuchsia/violet luminous
        brand: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7C3AED',
          800: '#6B21A8',
          900: '#581C87',
        },
        // Neon cyan accent
        neon: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
        },
        // Aurora purples
        aurora: {
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
        },
        // Legacy aliases to keep older components working
        peach: {
          400: '#FB7185',
          500: '#F43F5E',
        },
        sunset: {
          400: '#FB923C',
          500: '#F97316',
        },
        mint: {
          400: '#34D399',
          500: '#10B981',
        },
        sky2: {
          400: '#38BDF8',
          500: '#0EA5E9',
        },
        dark: {
          950: '#06070C',
          900: '#0B0F19',
          800: '#111827',
          700: '#161B2C',
          600: '#1F2540',
        },
      },
      backgroundImage: {
        'aurora':
          'conic-gradient(from 180deg at 50% 50%, #06B6D4 0deg, #7C3AED 120deg, #A855F7 240deg, #06B6D4 360deg)',
        'aurora-soft':
          'radial-gradient(60% 50% at 30% 20%, rgba(124,58,237,0.35) 0%, transparent 60%), radial-gradient(50% 50% at 80% 60%, rgba(6,182,212,0.30) 0%, transparent 60%), radial-gradient(40% 40% at 40% 90%, rgba(168,85,247,0.25) 0%, transparent 60%)',
        'gz-grad':
          'linear-gradient(120deg, #06B6D4 0%, #7C3AED 50%, #A855F7 100%)',
        'gz-grad-warm':
          'linear-gradient(120deg, #F472B6 0%, #A855F7 50%, #06B6D4 100%)',
        'glass-shine':
          'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 50%)',
        'story-ring':
          'conic-gradient(from 210deg, #06B6D4, #7C3AED, #A855F7, #F472B6, #06B6D4)',
        'soft-grad':
          'linear-gradient(135deg, #1F2540 0%, #0B0F19 100%)',
        'mesh':
          'radial-gradient(at 20% 10%, rgba(124,58,237,0.18) 0%, transparent 40%), radial-gradient(at 80% 0%, rgba(6,182,212,0.16) 0%, transparent 40%), radial-gradient(at 0% 90%, rgba(168,85,247,0.16) 0%, transparent 40%), radial-gradient(at 100% 100%, rgba(244,114,182,0.12) 0%, transparent 40%)',
        'grid':
          'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
        'shimmer': '200% 100%',
      },
      boxShadow: {
        // Premium neon glows
        'pop': '0 24px 70px -20px rgba(124,58,237,0.55), 0 0 0 1px rgba(168,85,247,0.20)',
        'popSoft': '0 16px 50px -20px rgba(0,0,0,0.55)',
        'glow-brand': '0 0 40px -6px rgba(168,85,247,0.55)',
        'glow-neon': '0 0 40px -6px rgba(6,182,212,0.55)',
        'glow-warm': '0 0 40px -6px rgba(244,114,182,0.45)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.04)',
        'glass': '0 30px 80px -30px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
        'card': '0 16px 50px -28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      blur: {
        '4xl': '120px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'float':         'float 6s ease-in-out infinite',
        'float-slow':    'float 12s ease-in-out infinite',
        'shimmer':       'shimmer 2.4s linear infinite',
        'shimmer-slow':  'shimmer 6s linear infinite',
        'pop':           'pop 0.45s cubic-bezier(0.34,1.56,0.64,1)',
        'pulse-soft':    'pulseSoft 3s ease-in-out infinite',
        'aurora':        'auroraSpin 18s linear infinite',
        'gradient-x':    'gradientX 8s ease infinite',
        'orbit':         'orbit 14s linear infinite',
        'fade-up':       'fadeUp 0.7s cubic-bezier(0.22,1,0.36,1)',
        'spin-slow':     'spin 6s linear infinite',
        'beam':          'beam 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0) translateX(0)' },
          '50%':     { transform: 'translateY(-12px) translateX(4px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pop: {
          '0%':   { transform: 'scale(0.85)', opacity: '0' },
          '60%':  { transform: 'scale(1.04)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%,100%': { opacity: '0.7', transform: 'scale(1)' },
          '50%':     { opacity: '1',   transform: 'scale(1.04)' },
        },
        auroraSpin: {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        gradientX: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%':     { backgroundPosition: '100% 50%' },
        },
        orbit: {
          '0%':   { transform: 'rotate(0deg) translateX(40px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(40px) rotate(-360deg)' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        beam: {
          '0%,100%': { opacity: '0.25', transform: 'translateX(-20%)' },
          '50%':     { opacity: '0.6',  transform: 'translateX(20%)' },
        },
      },
    },
  },
  plugins: [],
};
