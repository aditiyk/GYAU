/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg1: '#FFFBF0', // Cream background
        bg2: '#F0F8F6', // Soft mint inner backgrounds
        accent: {
          mint: '#A2E4D5',
          lavender: '#E2D9F3',
          pink: '#FFB7B2',
          primary: '#85d1c2', 
        },
        text: {
          dark: '#4A4A4A',
          light: '#8B8B8B',
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px', // 24px cards as requested
      }
    },
  },
  plugins: [],
}
