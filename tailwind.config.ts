import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── New Royal Purple palette ──────────────────────────────────────────
        purple: {
          50:  "#EEEDFE",
          100: "#CECBF6",
          200: "#AFA9EC",
          400: "#7F77DD",
          600: "#534AB7",
          800: "#3C3489",
          900: "#26215C",
        },
        // ── Primary now maps to purple-600 (backward-compat for tool pages) ──
        primary: {
          DEFAULT: "#534AB7",
          50:  "#EEEDFE",
          100: "#CECBF6",
          200: "#AFA9EC",
          300: "#9F98E4",
          400: "#7F77DD",
          500: "#6760CA",
          600: "#534AB7",
          700: "#3C3489",
          800: "#3C3489",
          900: "#26215C",
        },
        // ── Gold ─────────────────────────────────────────────────────────────
        gold: {
          DEFAULT: "#C9A84C",
          400: "#C9A84C",
          500: "#B8973A",
          50:  "#FBF5E6",
          100: "#F4E4B8",
          200: "#EDD389",
          300: "#E6C25A",
          600: "#9A7A2E",
          700: "#7C6125",
          800: "#5E491C",
          900: "#403213",
        },
        // ── Surface / Background ─────────────────────────────────────────────
        surface: "#F5F3FF",
        background: "#F5F3FF",       // backward-compat alias
        // ── Text colors ──────────────────────────────────────────────────────
        dark: "#26215C",             // purple-900 — replaces old navy
        muted: "#7F77DD",            // purple-400
        // ── Footer / dark sections ────────────────────────────────────────────
        "dark-navy": "#1A1630",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",                // upgraded from 8px
      },
      boxShadow: {
        card: "0 1px 4px 0 rgba(83,74,183,0.06), 0 1px 2px -1px rgba(83,74,183,0.04)",
        "card-hover": "0 8px 24px 0 rgba(83,74,183,0.12), 0 2px 8px -1px rgba(83,74,183,0.08)",
        gold: "0 4px 14px 0 rgba(201,168,76,0.30)",
      },
    },
  },
  plugins: [],
};
export default config;
