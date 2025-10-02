

import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  plugins: [
    vue(),
    legacy(),
    tailwindcss()
  ],
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue')) return 'vendor-vue';
            if (id.includes('@ionic')) return 'vendor-ionic';
            if (id.includes('axios')) return 'vendor-axios';
            if (id.includes('@fortawesome')) return 'vendor-icons';
            return 'vendor';
          }
        }
      }
    }
  },
  css: {
    devSourcemap: true
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {


  target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false
      },

      '/ws': {
  target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        ws: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
