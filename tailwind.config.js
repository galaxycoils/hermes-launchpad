/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "#00ff66",
        background: "#000",
        foreground: "#fff",
        pump: "#00ff66",
        dump: "#ff3b30",
        hermes: "#a855f7",
        primary: { DEFAULT: "#00ff66", foreground: "#000" },
        secondary: { DEFAULT: "#1a1a1a", foreground: "#fff" },
        muted: { DEFAULT: "#1a1a1a", foreground: "#aaa" },
        accent: { DEFAULT: "#a855f7", foreground: "#fff" },
        popover: { DEFAULT: "#111", foreground: "#fff" },
        card: { DEFAULT: "#111", foreground: "#fff" },
        surface: "#0a0a0f",
        elevated: "#111118",
        oracle: "#22d3ee",
        gold: "#ffd60a",
      },
      borderRadius: {
        xl: ".75rem",
        lg: ".5rem",
        md: ".375rem",
        sm: ".25rem",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "fly-in": {
          "0%": { opacity: "0", transform: "translateY(16px) scale(0.9)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down .2s ease-out",
        "accordion-up": "accordion-up .2s ease-out",
        shimmer: "shimmer 1.5s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "fly-in": "fly-in 0.4s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
