/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dfa: {
          s0: '#3B82F6', // S0 Order Placed (Blue)
          s1: '#8B5CF6', // S1 Order Confirmed (Purple)
          s2: '#F59E0B', // S2 Processing (Amber)
          s3: '#06B6D4', // S3 Shipped (Cyan)
          s4: '#EC4899', // S4 Out for Delivery (Pink)
          s5: '#10B981', // S5 Delivered (Green - Final)
          s6: '#EF4444'  // S6 Cancelled (Red - Terminal)
        }
      }
    },
  },
  plugins: [],
}
