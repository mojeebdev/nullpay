import type { Config } from 'tailwindcss'
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: { '01':'#050508','02':'#0C0C12','03':'#14141C','04':'#1E1E28','05':'#2C2C3A' },
        accent: '#6C63FF',
        ink: { primary:'#F0F0F8', secondary:'#8A8A9A', tertiary:'#4A4A5A' },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body:    ['Lato', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
