import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/markets': 'http://localhost:5000',
      '/users':   'http://localhost:5000',
    },
  },
  // In production, VITE_API_URL is set to your Render backend URL
  // All fetch('/markets') calls work in dev via proxy above
  // In prod they need to be absolute — see src/api.js
});
