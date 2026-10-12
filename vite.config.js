import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' so the build runs from any folder (and as a published artifact)
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 2500, assetsInlineLimit: 0 },
})
