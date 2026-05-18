/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      colors: {
        ink: {
          50: "#f0f0f5",
          100: "#e0e0eb",
          200: "#c1c1d6",
          300: "#9999bb",
          400: "#7070a0",
          500: "#4a4a80",
          600: "#383870",
          700: "#282860",
          800: "#181840",
          900: "#0e0e28",
          950: "#07071a",
        },
        pulse: {
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
        },
        ember: {
          400: "#fb923c",
          500: "#f97316",
        },
        jade: {
          400: "#34d399",
          500: "#10b981",
        },
        rose: {
          400: "#fb7185",
          500: "#f43f5e",
        },
      },
      animation: {
        "slide-in": "slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-up": "fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        pulse_slow: "pulse 3s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
        flicker: "flicker 2s ease-in-out infinite",
      },
      keyframes: {
        slideIn: { from: { opacity: 0, transform: "translateX(-16px)" }, to: { opacity: 1, transform: "translateX(0)" } },
        fadeUp: { from: { opacity: 0, transform: "translateY(16px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        flicker: { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.6 } },
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)",
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
      backgroundSize: {
        grid: "32px 32px",
      },
      boxShadow: {
        "glow-pulse": "0 0 20px rgba(99,102,241,0.3)",
        "glow-jade": "0 0 20px rgba(16,185,129,0.3)",
        "glow-rose": "0 0 20px rgba(244,63,94,0.3)",
        "card": "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
      },
    },
  },
  plugins: [],
};
