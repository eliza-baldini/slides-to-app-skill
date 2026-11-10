import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Relative base keeps the build portable (local preview now, GitHub Pages later).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
