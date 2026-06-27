/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-dark': '#0a0a0f',
        'cyber-blue': '#00f0ff',
        'cyber-pink': '#ff00ff',
        'cyber-purple': '#bf00ff',
        'cyber-yellow': '#f0ff00',
        'cyber-green': '#00ff88',
        'cyber-orange': '#ff6600',
        'neon-blue': '#00d4ff',
        'neon-pink': '#ff0080',
        'neon-purple': '#8000ff',
      },
      fontFamily: {
        'cyber': ['"Orbitron"', '"Rajdhani"', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'neon-glow': 'neon-glow 2s ease-in-out infinite',
        'flicker': 'flicker 0.5s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        'neon-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 5px #00f0ff, 0 0 10px #00f0ff, 0 0 20px #00f0ff',
            textShadow: '0 0 5px #00f0ff, 0 0 10px #00f0ff'
          },
          '50%': { 
            boxShadow: '0 0 10px #00f0ff, 0 0 20px #00f0ff, 0 0 40px #00f0ff',
            textShadow: '0 0 10px #00f0ff, 0 0 20px #00f0ff, 0 0 30px #00f0ff'
          },
        },
        'flicker': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      }
    },
  },
  plugins: [],
}
