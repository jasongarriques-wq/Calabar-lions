import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        calabar: {
          green: {
            50: "#eefbf2",
            100: "#d6f5df",
            200: "#a9e8bd",
            300: "#75d595",
            400: "#43bd6e",
            500: "#1f9d4f",
            600: "#137c3d",
            700: "#0e6230",
            800: "#0c4d28",
            900: "#0a3f23",
            950: "#042414",
          },
          gold: {
            50: "#fdf9eb",
            100: "#faf0c4",
            200: "#f3df87",
            300: "#ecc846",
            400: "#e5b423",
            500: "#d4af37",
            600: "#a8821f",
            700: "#7c5e1b",
            800: "#5a4216",
            900: "#3e2e10",
          },
          ink: "#0b0f0c",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
        display: ["ui-serif", "Georgia", "serif"],
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;
