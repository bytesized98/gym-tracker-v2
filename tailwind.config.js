/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#080808",
        surface: { DEFAULT: "#111111", 2: "#181818", 3: "#202020", 4: "#282828" },
        line: { DEFAULT: "rgba(255,255,255,0.06)", 2: "rgba(255,255,255,0.11)", 3: "rgba(255,255,255,0.18)" },
        ink: { DEFAULT: "#EFEFEF", 2: "#999999", 3: "#555555", 4: "#333333" },
        accent: { DEFAULT: "#22C880", bg: "rgba(34,200,128,0.08)", border: "rgba(34,200,128,0.22)" },
        danger: { DEFAULT: "#FF5A52", bg: "rgba(255,90,82,0.08)" },
        warn: { DEFAULT: "#F5C842", bg: "rgba(245,200,66,0.08)" }
      },
      borderRadius: {
        card: "14px",
        md2: "9px",
        sm2: "6px"
      }
    }
  },
  plugins: []
};
