/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#F7F3EC',
        charcoal: '#241F1C',
        espresso: '#2D2420',
        gold: {
          DEFAULT: '#B08D57',
          light: '#D4B896',
          dark: '#8A6D3F'
        },
        taupe: '#C9BBA8',
        beige: '#EFE7DA'
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      letterSpacing: {
        widest2: '0.35em'
      },
      transitionTimingFunction: {
        luxury: 'cubic-bezier(0.16, 1, 0.3, 1)'
      }
    }
  },
  plugins: []
};
