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
          50: "#fefcf0",
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
        // Gruvbox blue — links, interactive, CTAs, focus rings
        accent: {
          50: "#e8f4f6",
          100: "#c8dfe4",
          200: "#97c5cf",
          300: "#6aabb9",
          400: "#458588",
          500: "#076678",
          600: "#065a6b",
          700: "#054d5c",
          800: "#04404d",
          900: "#03333e",
          950: "#022730",
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
