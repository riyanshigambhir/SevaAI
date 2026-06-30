/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy:    "#0A0F1E",
        surface: "#111827",
        elevated:"#1C2333",
        primary: "#51A2D4",
        violet:  "#7E3FFF",
        success: "#10B981",
        danger:  "#EF4444",
      },
      boxShadow: {
        glow:   "0 0 16px rgba(81,162,212,0.3)",
        "glow-v":"0 0 16px rgba(126,63,255,0.25)",
      }
    },
  },
  plugins: [],
}
