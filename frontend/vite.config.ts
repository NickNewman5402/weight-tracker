import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig
({
  plugins: [react()],
  server: {
    proxy: {
      // anything starting with /api goes to your backend on 5000
      "/api": "http://localhost:5000",
    },
  },
})


