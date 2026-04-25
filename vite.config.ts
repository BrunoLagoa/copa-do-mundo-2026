import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/copa-do-mundo-2026/',
  plugins: [react()],
})
