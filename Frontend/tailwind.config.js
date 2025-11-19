/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'rootstock-orange': '#FF6B35',
        'rootstock-orange-light': '#FF8C5A',
        'rootstock-orange-dark': '#E55A2B',
        'rootstock-dark': '#1A1A1A',
        'rootstock-gray': '#2A2A2A',
        'rootstock-light': '#F5F5F5',
        'rif-primary': '#FF6B35',
        'rif-secondary': '#FF8C5A',
        'rif-accent': '#E55A2B',
      }
    },
  },
  plugins: [],
}
