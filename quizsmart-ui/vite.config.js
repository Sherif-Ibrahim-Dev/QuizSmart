import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,      // تثبيت البورت على 5173
    strictPort: true // لو البورت ده مشغول، ما يفتحش واحد تاني (يطلعلك تنبيه)
  }
})