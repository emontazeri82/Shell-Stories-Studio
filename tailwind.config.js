/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Merriweather', 'ui-sans-serif', 'system-ui'],
        title: ['Josefin Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


