import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#3a1f2b",
        blossom: {
          50: "#fff5f8",
          100: "#ffe3ec",
          200: "#fcc6d6",
          300: "#f7a3bc",
          400: "#ef7ea2",
          500: "#e35c8a",
          600: "#c84473",
          700: "#a3325c",
          800: "#7a2244",
        },
      },
      boxShadow: {
        soft: "0 4px 20px -8px rgba(227,92,138,0.18)",
      },
    },
  },
  plugins: [],
} satisfies Config;
