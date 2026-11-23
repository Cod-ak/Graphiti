import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        gh: {
          bg: "#0d1117",
          card: "#161b22",
          border: "#30363d",
          text: "#f0f6fc",
          muted: "#8b949e",
          accent: "#58a6ff",
          green0: "#161b22",
          green1: "#0e4429",
          green2: "#006d32",
          green3: "#26a641",
          green4: "#39d353",
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
