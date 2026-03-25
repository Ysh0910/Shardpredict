/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Chakra Petch', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      colors: {
        base:     '#080C14',
        surface:  '#0E1420',
        elevated: '#141C2E',
        yes:      '#00E676',
        no:       '#FF3D57',
        gold:     '#FFB800',
        primary:  '#5B6EF5',
        border:   'rgba(91,110,245,0.15)',
        secondary:'#8892A4',
      },
      boxShadow: {
        'glow-yes':     '0 0 20px rgba(0,230,118,0.25)',
        'glow-no':      '0 0 20px rgba(255,61,87,0.25)',
        'glow-primary': '0 0 30px rgba(91,110,245,0.4)',
        'glow-gold':    '0 0 20px rgba(255,184,0,0.3)',
      },
    },
  },
  plugins: [],
};
