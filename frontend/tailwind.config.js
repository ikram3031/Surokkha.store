/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Serif Bengali"', '"Hind Siliguri"', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        heading: ['"Noto Serif Bengali"', '"Plus Jakarta Sans"', 'Inter', 'serif'],
        serif: ['"Noto Serif Bengali"', 'serif'],
        bengali: ['"Noto Serif Bengali"', '"Hind Siliguri"', 'serif'],
      },
      colors: {
        brand: {
          50: '#FFF1F2',   // softest blush
          100: '#FFE4E6',  // light rose tint
          200: '#FECDD3',  // accent pastel pink
          300: '#FDA4AF',
          600: '#E11D48',
          700: '#BE123C',  // rich berry rose (primary interactive)
          800: '#9F1239',  // deep rose (primary brand)
          900: '#881337',  // luxury velvet rose
          950: '#4C0519',  // dark slate berry
        }
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      dropShadow: {
        'xs': '0 1px 1px rgba(0, 0, 0, 0.05)',
      },
      spacing: {
        '4.5': '1.125rem',
        '22': '5.5rem',
      },
      animation: {
        'marquee': 'marquee 85s linear infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
