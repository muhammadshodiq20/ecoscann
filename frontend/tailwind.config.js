/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        eco: {
          50:  '#E1F5EE',
          100: '#C2EDD9',
          200: '#9FE1CB',
          300: '#5DCAA5',
          400: '#2DD4BF',
          500: '#1D9E75',
          600: '#1D9E75',
          700: '#085041',
          800: '#063D32',
          900: '#042B22',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    }
  },
  plugins: []
}
