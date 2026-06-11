/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cafe: {
          ink: '#1f2421',
          cream: '#fffaf0',
          oat: '#f2eadb',
          amber: '#b7791f',
          copper: '#a44f2f',
          sage: '#58705a',
          forest: '#22352b',
        },
      },
      boxShadow: {
        soft: '0 18px 45px rgba(31, 36, 33, 0.12)',
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
