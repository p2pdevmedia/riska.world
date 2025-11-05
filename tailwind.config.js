/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./src/styles/**/*.{css,scss}"
  ],
  theme: {
    extend: {
      colors: {
        night: {
          950: "#020617",
          900: "#0f172a",
          800: "#1e293b"
        },
        aurora: {
          500: "#38bdf8",
          600: "#0ea5e9",
          700: "#0284c7"
        }
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 45px rgba(14, 165, 233, 0.35)"
      }
    }
  },
  plugins: []
};
