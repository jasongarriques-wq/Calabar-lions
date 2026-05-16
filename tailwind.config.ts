import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        lion: {
          50: "#fff8eb",
          100: "#feecc7",
          200: "#fdd789",
          300: "#fbbb4b",
          400: "#f9a124",
          500: "#e67e0b",
          600: "#bf5c06",
          700: "#984009",
          800: "#7c330e",
          900: "#682a0f",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
