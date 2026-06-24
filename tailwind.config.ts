import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#b08d57',
          light: '#c9a96e',
          dark: '#8a6d3f',
        },
        beige: {
          DEFAULT: '#e9dcc6',
          light: '#f5efe4',
          dark: '#d4c4a8',
        },
        stone: {
          DEFAULT: '#1a1713',
          light: '#2c2825',
          mid: '#6b6460',
          pale: '#a8a4a0',
        },
        cream: '#faf8f4',
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans: ['var(--font-jost)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.3em',
      },
      boxShadow: {
        luxury: '0 4px 40px rgba(26, 23, 19, 0.08)',
        card: '0 2px 20px rgba(26, 23, 19, 0.06)',
      },
    },
  },
  plugins: [],
}

export default config
