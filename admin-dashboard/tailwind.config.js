/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { poppins: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"] },
      colors: {
        brand: {
          red: "#FF1A1A",
          reddark: "#C4130F",
          bg: "#0A0A0A",
          panel: "#121212",
          card: "#161616",
          border: "#262626",
        },
      },
    },
  },
  plugins: [],
};
