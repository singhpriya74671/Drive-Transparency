/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Automotive Interior palette
        brand: {
          bg:      "#1C1C1C",
          card:    "#272727",
          surface: "#323232",
          primary: "#DDD0C8",
          text:    "#F0EBE5",
          muted:   "#8C8480",
          border:  "#3D3D3D",
          success: "#4CAF7D",
          warning: "#D4935E",
          danger:  "#CF5C5C",
        },
      },
      fontFamily: {
        display: ["'DM Sans'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
