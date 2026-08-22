import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          emerald: "#10A879",
          emeraldDark: "#087F5B",
          text: "#17201D",
          muted: "#68736F",
          bg: "#F8FAF9"
        }
      },
      fontFamily: {
        thai: ["var(--font-noto-sans-thai)", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;