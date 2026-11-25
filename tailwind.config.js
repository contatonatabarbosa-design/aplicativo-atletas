/** Paleta: verde de gramado + giz + amarelo de bandeirola. A cor `brand` vem do clube (CSS var). */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: 'rgb(var(--brand) / <alpha-value>)',
        turf: { 900: '#0e2a1c', 700: '#1c4d35', 100: '#e4ece6' },
        chalk: '#f2f4f0',
        flag: '#f0c030',
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        sans: ['Barlow', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
