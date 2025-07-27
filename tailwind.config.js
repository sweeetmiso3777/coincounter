/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',       // your app folder
    './components/**/*.{js,ts,jsx,tsx}', // your components
    './lib/**/*.{js,ts,jsx,tsx}',        // utilities if any
    './node_modules/@shadcn/ui/**/*.{js,ts,jsx,tsx}', // ShadCN UI components
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('tailwindcss-animate'), // ShadCN animation plugin
  ],
}
