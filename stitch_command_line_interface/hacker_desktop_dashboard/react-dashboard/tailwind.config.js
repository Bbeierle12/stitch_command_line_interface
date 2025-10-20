/**** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07090B",
        "panel": "#0D1217",
        "hairline": "rgba(255,255,255,0.08)",
        "cyan": "#00E9FF",
        "ops-green": "#19FF73",
        "warn": "#FFC857",
        "danger": "#FF3B3B"
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      },
      boxShadow: {
        depth: "0 2px 24px rgba(0,0,0,0.45)"
      },
      borderRadius: {
        md: "10px"
      },
      fontSize: {
        micro: ["0.6875rem", { letterSpacing: "0.14em", textTransform: "uppercase" }]
      },
      transitionTimingFunction: {
        glide: "cubic-bezier(0.2, 0.8, 0.2, 1)"
      }
    }
  }
};
