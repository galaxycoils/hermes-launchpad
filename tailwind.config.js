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
        background: "#06060e",
        foreground: "#fff",
        // Oracle Terminal Design System Palette
        void: "#06060e",
        obsidian: "#0d0d1a",
        pulse: "#00ff66",
        bleed: "#ff3344",
        sol: "#ffb800",
        iris: {
          DEFAULT: "#7c6aff",
          start: "#7c6aff",
          end: "#00e5ff",
        },
        // Backward-compatible aliases
        pump: "#00ff66",
        dump: "#ff3344",
        hermes: "#a855f7",
        gold: "#ffb800",
        surface: "#0d0d1a",
        elevated: "#111118",
        oracle: "#00e5ff",
        primary: { DEFAULT: "#00ff66", foreground: "#000" },
        secondary: { DEFAULT: "#1a1a1a", foreground: "#fff" },
        muted: { DEFAULT: "#1a1a1a", foreground: "#aaa" },
        accent: { DEFAULT: "#7c6aff", foreground: "#fff" },
        popover: { DEFAULT: "#0d0d1a", foreground: "#fff" },
        card: { DEFAULT: "#0d0d1a", foreground: "#fff" },
      },
      borderRadius: {
        "2xl": "1rem",
        xl: ".75rem",
        lg: ".5rem",
        md: ".375rem",
        sm: ".25rem",
      },
      fontFamily: {
        display: ["Space Grotesk Variable", "Space Grotesk", "sans-serif"],
        body: ["Inter Variable", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        lore: ["Instrument Serif", "Georgia", "serif"],
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
        "float-bob": {
          "0%, 100%": { transform: "translateY(0px) scale(1)" },
          "50%": { transform: "translateY(-6px) scale(1.05)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "fly-in": {
          "0%": { opacity: "0", transform: "translateY(16px) scale(0.95)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down .2s ease-out",
        "accordion-up": "accordion-up .2s ease-out",
        shimmer: "shimmer 1.5s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "float-bob": "float-bob 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "fly-in": "fly-in 0.4s ease-out forwards",
        marquee: "marquee 25s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
