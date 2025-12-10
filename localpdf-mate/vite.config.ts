import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-lib': ['pdf-lib'],
          'vendor': ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'jszip']
        }
      }
    }
  }
})