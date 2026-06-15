import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep navy — main brand
        navy: {
          50:  "#F0F4FF",
          100: "#E0E8FF",
          200: "#C2D0F5",
          300: "#94AAEA",
          400: "#6080DC",
          500: "#3B5BCC",
          600: "#2A42A8",
          700: "#1F3088",
          800: "#0D1840",
          900: "#0A1220",
          950: "#050A14",
        },
        // Primary = deep navy
        primary: {
          DEFAULT: "#0D1840",
          50:  "#F0F4FF",
          100: "#E0E8FF",
          200: "#C2D0F5",
          300: "#94AAEA",
          400: "#6080DC",
          500: "#3B5BCC",
          600: "#2A42A8",
          700: "#1F3088",
          800: "#0D1840",
          900: "#070E28",
        },
        // Gold accent — kept from brand
        gold: {
          DEFAULT: "#C9A84C",
          50:  "#FBF5E6",
          100: "#F5E9C4",
          200: "#EDCE8A",
          300: "#E5B452",
          400: "#C9A84C",
          500: "#B8973A",
          600: "#9A7A2E",
          700: "#7C6125",
        },
        dark:        "#0A1628",
        muted:       "#6B7A9C",
        background:  "#EEF2FF",
        surface:     "#F8FAFF",
        "dark-navy": "#050A14",
      },
      fontFamily: {
        sans: [
          "-apple-system", "BlinkMacSystemFont",
          "Inter", "Segoe UI", "system-ui", "sans-serif",
        ],
      },
      borderRadius: {
        card: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      boxShadow: {
        card:        "0 1px 3px rgba(10,22,64,0.06), 0 1px 2px rgba(10,22,64,0.04)",
        "card-hover":"0 8px 32px rgba(10,22,64,0.12), 0 2px 8px rgba(10,22,64,0.08)",
        glass:       "0 8px 32px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.1)",
        "glass-lg":  "0 24px 64px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.12)",
        gold:        "0 4px 24px rgba(201,168,76,0.30)",
        "gold-lg":   "0 8px 40px rgba(201,168,76,0.45)",
        glow:        "0 0 40px rgba(201,168,76,0.15)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.6s ease-out both",
        "fade-in":    "fadeIn 0.5s ease-out both",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in":   "scaleIn 0.2s ease-out",
        "float":      "float 4s ease-in-out infinite",
        "glow-pulse": "glowPulse 2.5s ease-in-out infinite",
        "spin-slow":  "spin 3s linear infinite",
      },
      keyframes: {
        fadeInUp:  { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        fadeIn:    { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideDown: { "0%": { opacity: "0", transform: "translateY(-8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        scaleIn:   { "0%": { opacity: "0", transform: "scale(0.95)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        float:     { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        glowPulse: { "0%,100%": { boxShadow: "0 0 20px rgba(201,168,76,0.25)" }, "50%": { boxShadow: "0 0 50px rgba(201,168,76,0.55)" } },
      },
      transitionDuration: { "400": "400ms" },
    },
  },
  plugins: [],
};
export default config;
