import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

// Re-create __dirname manually for ES Modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), 
    },
  },
  // 👇 CORS error bypass karne ke liye Proxy server setup
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001', 
        changeOrigin: true,
      }
    }
  }
})