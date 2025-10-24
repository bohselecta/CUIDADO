import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: { 
    extend: {
      colors: {
        tuscan: {
          clay: "#C58A63",
          sand: "#E0B892",
          stone: "#8A6B58",
          olive: "#6B7A5F",
          dusk:  "#2B2A28",
        },
        cuidado: {
          bronze: "#C58A63",
          obsidian: "#1A1816",
          iron: "#2D2C29",
          teal: "#5ED2C0",
          white: "#F3EFEA",
          amber: "#D7A03F",
        }
      },
      fontFamily: {
        display: ["'DM Serif Display'", "serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        'deep': '0 2px 40px rgba(197,138,99,0.15)',
        'glow': '0 0 20px rgba(94,210,192,0.25)',
      },
      backgroundImage: {
        'cuidado-gradient': 'linear-gradient(145deg, #1A1816 0%, #2D2C29 100%)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4,0,0.2,1)',
      },
      transitionDuration: {
        'smooth': '400ms',
      }
    }
  },
  plugins: []
} satisfies Config;
