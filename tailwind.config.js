/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/react-app/index.html", "./src/react-app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#05070D",
        "bg-raise": "#0A0F1A",
        card: "#0D1420",
        "card-border": "rgba(255,255,255,0.08)",
        blue: {
          DEFAULT: "#2196F3",
          deep: "#1976D2",
        },
        text: {
          DEFAULT: "#FFFFFF",
          secondary: "#94A3B8",
          dim: "#64748B",
        },
        success: "#4ADE80",
      },
      borderRadius: {
        card: "16px",
        button: "12px",
        pill: "999px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
