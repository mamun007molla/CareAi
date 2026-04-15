/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:       "#0d1117",
        surface:  "#161b22",
        surface2: "#1c232d",
        "surface-border": "#2a3441",
        accent:   { DEFAULT: "#4ade80", cyan: "#22d3ee", amber: "#f59e0b", red: "#f87171" },
        muted:    "#8b949e",
      },
      animation: {
        "fade-in":  "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp: { "0%": { transform: "translateY(14px)", opacity: 0 }, "100%": { transform: "translateY(0)", opacity: 1 } },
      },
    },
  },
  plugins: [],
};
