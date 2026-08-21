import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwind()],
  server: {
    port: 5173,
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.app', '.ngrok.io'],
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
