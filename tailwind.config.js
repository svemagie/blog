import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./*.njk",
    "./content/**/*.md",
    "./docs/**/*.md",
    "./.interface-design/**/*.md",
    "./_includes/**/*.njk",
    "./_includes/**/*.md",
    "./js/**/*.js",
    "./lib/**/*.js",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Gruvbox-inspired warm cream/brown — surfaces, text, structure
        surface: {
          50: "#fffef5",
          100: "#f2e5bc",
          200: "#d5c4a1",
          300: "#bdae93",
          400: "#a89984",
          500: "#7c6f64",
          600: "#665c54",
          700: "#504945",
          800: "#3c3836",
          900: "#282828",
          950: "#1d2021",
        },
        // Gruvbox yellow — links, interactive, CTAs, focus rings
        accent: {
          50: "#fdf8e1",
          100: "#faefc0",
          200: "#f5db7a",
          300: "#efc843",
          400: "#d79921",
          500: "#b57614",
          600: "#926208",
          700: "#7a5207",
          800: "#634306",
          900: "#4d3505",
          950: "#3a2804",
        },
      },
      fontFamily: {
        serif: [
          '"Lora"',
          '"Iowan Old Style"',
          '"Palatino Linotype"',
          '"URW Palladio L"',
          "P052",
          "serif",
        ],
        sans: [
          '"Inter"',
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SF Mono",
          "Monaco",
          "Cascadia Code",
          "monospace",
        ],
      },
      maxWidth: {
        content: "720px",
        wide: "1200px",
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            "--tw-prose-links": theme("colors.accent.500"),
            maxWidth: "none",
          },
        },
        lg: {
          css: {
            fontSize: "1.175rem",
            lineHeight: "1.8",
          },
        },
        invert: {
          css: {
            "--tw-prose-links": theme("colors.accent.400"),
          },
        },
      }),
    },
  },
  plugins: [typography],
};
