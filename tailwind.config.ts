// import { frostedThemePlugin } from "@whop/react/tailwind";

// export default { plugins: [frostedThemePlugin()] };

// tailwind.config.ts

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // We can add custom theme properties here later if needed
    },
  },
  plugins: [], // This is now empty, resolving the error
};

export default config;