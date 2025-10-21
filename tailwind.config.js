/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",    // include if you use /app
    "./src/**/*.{js,ts,jsx,tsx}",    // include if code is under /src
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-merriweather)', 'ui-sans-serif', 'system-ui'],
        title: ['var(--font-josefin)', 'sans-serif'],
        poppins: ['var(--font-poppins)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
        playfair: ['var(--font-playfair)', 'serif'],
        quicksand: ['var(--font-quicksand)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};



