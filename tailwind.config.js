/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        campo: { DEFAULT: '#2f6b2f', claro: '#e8f0e3', oscuro: '#1e4a22' },
        bosque: { DEFAULT: '#1b4332', claro: '#d8f3dc', medio: '#2d6a4f', suave: '#95d5b2' },
        tierra: { DEFAULT: '#7f4f24', clara: '#ede0d4', media: '#b08968', oscura: '#5c3a1e' },
        arena: { DEFAULT: '#e7d8b7' },
        humus: { DEFAULT: '#1e150e', profundo: '#130c07', suave: '#2b2016' },
        crema: { DEFAULT: '#faf6ef' },
        selva: { DEFAULT: '#134B42', oscuro: '#0d332c', profundo: '#0a2520' },
        calendula: { DEFAULT: '#EEA83B' },
        terracota: { DEFAULT: '#CA763B' },
        salvia: { DEFAULT: '#80917D' },
        hoja: { DEFAULT: '#AEBA8A' },
        sol: { DEFAULT: '#f4a261', claro: '#fef3c7', intenso: '#e76f51' },
        cielo: { DEFAULT: '#a8dadc', claro: '#f1faee' },
        crema: { DEFAULT: '#fefae0', oscuro: '#faedcd' },
        vivo: { DEFAULT: '#8dc63f', oscuro: '#55a630', claro: '#d9ed92' },
      },
      fontFamily: {
        campo: ['"Nunito"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', '"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Fraunces"', '"Georgia"', '"Times New Roman"', 'serif'],
      },
      boxShadow: {
        campo: '0 8px 24px -8px rgba(27, 67, 50, 0.35)',
        tarjeta: '0 4px 16px -4px rgba(127, 79, 36, 0.25)',
      },
      minWidth: { botonCampo: '44px' },
      minHeight: { botonCampo: '44px' }
    }
  },
  plugins: []
};
