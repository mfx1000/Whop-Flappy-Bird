// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ["var(--font-pixel)"], // Use the CSS variable
        sans: ["var(--font-inter)"],
      },
      backgroundImage: {
        'flappy-bg': "url('/sprites/background-day.png')",
      }
    },
  },
  plugins: [],
};

export default config;
