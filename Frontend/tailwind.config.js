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
        'rootstock-dark': '#1A1A1A',
        'rootstock-gray': '#2A2A2A',
        'rootstock-light': '#F5F5F5',
        'rif-primary': '#00D4FF',
        'rif-secondary': '#0099CC',
        'rif-accent': '#FF6B35',
      }
    },
  },
  plugins: [],
}
