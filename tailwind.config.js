/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // TopicTile gradient classes (dynamic interpolation, invisible to JIT scanner)
    'from-purple-400', 'to-pink-500',
    'from-cyan-500', 'to-lime-500',
    'from-emerald-400', 'to-teal-500',
    'from-blue-400', 'to-blue-600',
    'from-green-400', 'to-green-600',
    'from-orange-400', 'to-orange-600',
    'from-purple-400', 'to-purple-600',
    'from-red-400', 'to-red-600',
    'from-yellow-400', 'to-yellow-600',
    // OnlineRetailerSection badge colors (dynamic via retailer.color)
    'bg-orange-500', 'bg-blue-600', 'bg-blue-500',
  ],
  theme: {
    extend: {
      colors: {
        // Kid-friendly bright colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontSize: {
        // Large, readable fonts for kids
        'child-xl': '1.5rem',
        'child-2xl': '2rem',
        'child-3xl': '2.5rem',
      }
    },
  },
  plugins: [],
}
