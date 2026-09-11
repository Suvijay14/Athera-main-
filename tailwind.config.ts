import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          base: '#fbf9f5',
          sunken: '#eae5dc',
        },
        surface: {
          paper: '#ffffff',
          vellum: '#faf8f5',
          container: '#f1eee7',
          'container-high': '#ebe8e1',
        },
        ink: {
          primary: '#221f1d',
          secondary: '#423d38',
          muted: '#696259',
          faint: '#8c8377',
        },
        terracotta: {
          DEFAULT: '#b85d3f',
          soft: '#c86a4b',
          light: 'rgba(184, 93, 63, 0.1)',
        },
        sage: {
          DEFAULT: '#4e644c',
          light: 'rgba(78, 100, 76, 0.1)',
        },
        ochre: {
          DEFAULT: '#c49746',
          light: 'rgba(196, 151, 70, 0.12)',
        },
        slate: {
          stone: '#5c6f84',
          light: 'rgba(92, 111, 132, 0.1)',
        },
        border: {
          delicate: '#e6e1d6',
          subtle: '#ded7c9',
        },
      },
      fontFamily: {
        newsreader: ['Newsreader', 'Georgia', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(40,30,20,0.04), 0 4px 12px rgba(40,30,20,0.02)',
        float: '0 4px 16px rgba(40,30,20,0.06), 0 1px 2px rgba(40,30,20,0.03)',
        modal: '0 12px 32px rgba(40,30,20,0.08), 0 2px 6px rgba(40,30,20,0.04)',
      },
    },
  },
  plugins: [],
}

export default config
