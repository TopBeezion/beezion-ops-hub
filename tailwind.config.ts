import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0d0d0f',
        surface: '#16171c',
        surface2: '#1e1f26',
        border: '#2a2b35',
        text: '#e8e9ef',
        muted: '#6b7280',
        accent: '#f5a623',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
