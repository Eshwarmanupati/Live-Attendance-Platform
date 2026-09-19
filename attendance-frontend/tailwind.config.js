/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["DM Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        ink: {
          50: "#f0f0f5",
          100: "#e0e0eb",
          200: "#c1c1d6",
          300: "#a5a5c4",
          // Raised from the original values: the old ink-400/500 greys sat
          // under a 4.5:1 contrast ratio on the near-black background.
          400: "#8b8bb0",
          500: "#6a6a98",
          600: "#454580",
          700: "#2d2d68",
          800: "#1b1b47",
          900: "#0e0e28",
          950: "#07071a",
        },
        pulse: { 200: "#c7d2fe", 300: "#a5b4fc", 400: "#818cf8", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca" },
        ember: { 300: "#fdba74", 400: "#fb923c", 500: "#f97316" },
        jade: { 300: "#6ee7b7", 400: "#34d399", 500: "#10b981", 600: "#059669" },
        rose: { 300: "#fda4af", 400: "#fb7185", 500: "#f43f5e" },
      },
      animation: {
        "slide-in": "slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-up": "fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        pulse_slow: "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        slideIn: {
          from: { opacity: 0, transform: "translateX(-16px)" },
          to: { opacity: 1, transform: "translateX(0)" },
        },
        fadeUp: {
          from: { opacity: 0, transform: "translateY(12px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      },
      boxShadow: {
        "glow-pulse": "0 0 20px rgba(99,102,241,0.25)",
        "glow-jade": "0 0 20px rgba(16,185,129,0.25)",
        card: "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
      },
    },
  },
  plugins: [],
};
