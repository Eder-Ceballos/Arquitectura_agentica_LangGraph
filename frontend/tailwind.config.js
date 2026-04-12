/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // Esto cubre todo dentro de src
    "./pages/**/*.{js,ts,jsx,tsx,mdx}", // Por si acaso tienes carpetas fuera de src
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
