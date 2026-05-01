/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // tailwind will now apply dark mode to any element with class="dark"
  theme: {
    extend: {},
  },
  plugins: [],
};
