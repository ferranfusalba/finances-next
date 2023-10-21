import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      minWidth: {
        "10rem": "10rem",
      },
      height: {
        "full-main": "calc(100vh - 156px)", // 156 = 64 TopBar + 44 Accounts Top Menu + 48 TabBar
      },
      minHeight: {
        "top-bar": "2.75rem",
      },
    },
  },
  plugins: [],
};
export default config;
