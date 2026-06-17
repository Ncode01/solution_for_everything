/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rccs: {
          navy: '#0f172a',
          dark: '#1e293b',
          mid: '#334155',
          blue: '#3b82f6',
          accent: '#60a5fa',
          light: '#f8fafc',
        }
      }
    },
  },
  plugins: [],
}
