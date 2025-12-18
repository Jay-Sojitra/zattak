/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
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
        // Dark theme specific colors
        'dark-primary': '#000000',
        'dark-secondary': '#111111',
        'dark-tertiary': '#1A1A1A',
        'dark-text-primary': '#FFFFFF',
        'dark-text-secondary': '#9CA3AF',
      },
      animation: {
        'fadeIn': 'fadeIn 0.6s ease-out',
        'slideUp': 'slideUp 0.6s ease-out',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
