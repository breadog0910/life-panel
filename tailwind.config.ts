import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e3f2fd",
          100: "#bbdefb",
          200: "#90caf9",
          300: "#64b5f6",
          400: "#42a5f5",
          500: "#2196f3",
          600: "#1e88e5",
          700: "#1976d2",
          800: "#1565c0",
          900: "#0d47a1",
        },
        accent: {
          50: "#fffde7",
          100: "#fff9c4",
          200: "#fff176",
          300: "#ffe082",
        },
        surface: {
          bg: "#f5f9ff",
          card: "#ffffff",
          border: "#e3f2fd",
        },
        text: {
          primary: "#1a3a5c",
          secondary: "#5c8dc9",
          muted: "#90a4ae",
        },
      },
      borderRadius: {
        card: "12px",
        button: "8px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
