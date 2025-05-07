/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4da6ff',
          DEFAULT: '#0078d4',
          dark: '#005a9e',
        },
        secondary: {
          light: '#8cd98c',
          DEFAULT: '#4caf50',
          dark: '#3b873e',
        },
        accent: {
          light: '#ffb74d',
          DEFAULT: '#ff9800',
          dark: '#f57c00',
        },
        vacant: '#9ca3af', // gray-400
        booked: '#4ade80', // green-400
      },
    },
  },
  plugins: [],
}
