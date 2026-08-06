/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))", input: "hsl(var(--input))", ring: "#00ff66",
        background: "#000", foreground: "#fff", pump: "#00ff66", dump: "#ff3b30", hermes: "#a855f7",
        primary: { DEFAULT: "#00ff66", foreground: "#000" }, secondary: { DEFAULT: "#1a1a1a", foreground: "#fff" },
        muted: { DEFAULT: "#1a1a1a", foreground: "#aaa" }, accent: { DEFAULT: "#a855f7", foreground: "#fff" },
        popover: { DEFAULT: "#111", foreground: "#fff" }, card: { DEFAULT: "#111", foreground: "#fff" },
      },
      borderRadius: { xl: ".75rem", lg: ".5rem", md: ".375rem", sm: ".25rem" },
      fontFamily: { mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"] },
      keyframes: { "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } }, "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } } },
      animation: { "accordion-down": "accordion-down .2s ease-out", "accordion-up": "accordion-up .2s ease-out" },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
