module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        smoke: 'rgba(255,255,255,0.15)',
        ice: '#e0f7ff',
      },
      backdropBlur: {
        xs: '2px',
        md: '8px',
      },
      borderRadius: {
        xl: '1.25rem',
      },
    },
  },
  plugins: [],
};