/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        saffron: '#E8650A',
        gold: '#C8920A',
        cream: '#FDF8F0',
        deep: '#4A1B0C',
        muted: '#8B6914',
        border: '#F0D080',
      },
      fontFamily: {
        hindi: ['Tiro Devanagari Hindi', 'serif'],
        display: ['Playfair Display', 'serif'],
        body: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
