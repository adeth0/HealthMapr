import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#000510",
          surface: "#0A0F1E",
          border: "rgba(255,255,255,0.09)",
          glass: "rgba(255,255,255,0.05)",
        },
        signal: {
          green: "#30D158",
          amber: "#FFD60A",
          red: "#FF453A",
          blue: "#0A84FF",
          purple: "#BF5AF2",
          teal: "#64D2FF",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"Inter"',
          '"Segoe UI"',
          "sans-serif",
        ],
      },
      backdropBlur: {
        xs: "4px",
        glass: "40px",
      },
      animation: {
        "fade-in": "fadeIn 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        "slide-up": "slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        "slide-up-sm": "slideUpSm 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        "blob": "blob 12s infinite ease-in-out",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
        "shimmer": "shimmer 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUpSm: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        blob: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      screens: {
        xs: "390px",
      },
    },
  },
  plugins: [],
};

export default config;
