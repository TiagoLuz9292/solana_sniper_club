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
        brand: {
          DEFAULT: "#7c3aed",
          light: "#a78bfa",
        },
        surface: {
          DEFAULT: "#0f0f14",
          card: "#16161f",
          border: "#22222e",
        },
      },
    },
  },
  plugins: [],
};
export default config;
