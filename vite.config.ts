import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/components/layout/AppLayout.tsx',
        './src/components/layout/Sidebar.tsx',
        './src/components/layout/Topbar.tsx',
      ],
    },
    proxy: {
      '/crm-api': {
        target: 'http://127.0.0.1:3333',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/crm-api/, ''),
      },
    },
  },
})
