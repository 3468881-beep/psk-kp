import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-onest)", "system-ui", "sans-serif"],
      },
      colors: {
        accent: "#2A6FDB",
        "accent-dark": "#1E4FA0",
        bg: "#F5F1EA",
        card: "#FFFFFF",
        border: "#E7DFD2",
        ink: "#23201B",
        muted: "#8A8175",
        sand: "#FBF4E3",
        "sand-dark": "#F6EDD9",
        money: "#8A6A2A",
        ok: "#1C7A4E",
        "ok-bg": "#E4F3EA",
        warn: "#B5791A",
        "warn-bg": "#FBF1DA",
        risk: "#C0463A",
        "risk-bg": "#FBE7E3",
      },
    },
  },
  plugins: [],
};
export default config;
