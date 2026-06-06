/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#e6f5f5',
          100: '#b3e0e0',
          200: '#80cccc',
          300: '#4db8b8',
          400: '#26a6a6',
          500: '#0d9494',
          600: '#0d6e6e',
          700: '#0a5c5c',
          800: '#074a4a',
          900: '#043838',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['DM Serif Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
