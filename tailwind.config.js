/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Passos da escala 4px que o Tailwind não gera por padrão, usados para
      // alinhar verticalmente as colunas de semifinal/final no chaveamento
      // espelhado (Simulador): a Final recua ~meia-altura para centralizar com
      // os cards das semifinais.
      spacing: {
        88: '22rem',   // 352px — offset base da Final (centraliza com a semi)
        91: '22.75rem', // 364px — idem no md
        104: '26rem',  // 416px — idem no md
        112: '28rem',  // 448px — offset (md) das semifinais
      },
    },
  },
  plugins: [],
}

