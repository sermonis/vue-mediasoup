/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./resources/**/*.{vue,js,css,svg}",
  ],
  theme: {
    extend: {
      backgroundSize: {
        'video': '60%',
      },
      spacing: {
        'videos-sm': 'calc(100vh - 3rem - 3rem)',
        'videos-md': 'calc(100vh - 5rem - 3rem)',
        '1/10': '10%',
        '3/10': '30%',
        '7/10': '70%',
        '9/10': '90%',
      },
    },
  },
  plugins: [],
}

