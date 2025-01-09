/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'flip-in': 'flipIn 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in',
        blob: "blob 7s infinite",
        'fade-in': "fade-in 0.3s ease-out",
        'float-slow': 'float 8s ease-in-out infinite',
        'float-medium': 'float 6s ease-in-out infinite',
        'float-fast': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        flipIn: {
          '0%': { 
            transform: 'rotateY(-180deg)',
            opacity: '0'
          },
          '100%': { 
            transform: 'rotateY(0)',
            opacity: '1'
          },
        },
        slideIn: {
          '0%': { 
            transform: 'translateX(-100%)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translateX(0)',
            opacity: '1'
          },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      colors: {
        gold: '#D4AF37',
        cream: '#FFFDD0',
        brown: {
          100: '#F5F0E6',
          800: '#5C4033',
        },
        amber: {
          600: '#D97706',
        },
      },
    },
  },
  plugins: [
    
  ],
}


