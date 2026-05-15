/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f4ff",
          100: "#e5ecff",
          200: "#d0daff",
          300: "#b0bfff",
          400: "#8b9cff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        secondary: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
        },
      },
      animation: {
        "pulse-soft": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "bounce-soft": "bounceSoft 2s infinite",
        "shimmer": "shimmer 2s infinite",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      boxShadow: {
        "sm-soft": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "md-soft": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        "lg-soft": "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        "xl-soft": "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        "glow-primary": "0 0 20px rgba(99, 102, 241, 0.3)",
        "glow-secondary": "0 0 20px rgba(168, 85, 247, 0.3)",
      },
    },
  },
  plugins: [],
}
