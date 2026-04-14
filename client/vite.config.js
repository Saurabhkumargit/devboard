import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://devboard-production-d06c.up.railway.app',
        changeOrigin: true,
      }
    }
  }
})
