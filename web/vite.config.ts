import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    // Allow ngrok hosts for backend access
    // Update the specific ngrok URL when it changes
    allowedHosts: [
      '7790ba431c70.ngrok-free.app',
      '.ngrok-free.app', // Allow all ngrok-free.app subdomains
      '.ngrok.io', // Allow all ngrok.io subdomains
    ],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})

