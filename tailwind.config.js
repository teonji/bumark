module.exports = {
  mode: 'jit',
  purge: {
    content: ['./src/**/*.{vue,js,ts,jsx,tsx}'],
    safelist: [
      'bg-gray-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-green-500',
      'bg-blue-500',
      'bg-indigo-500',
      'bg-purple-500',
      'bg-pink-500',
    ],
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    fontFamily: {
      display: [
        'Poppins',
        'sans-serif'
      ],
    },
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
