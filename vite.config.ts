import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: "./",  // 🚨重要: Power Apps デプロイ必須設定
  server: {
    host: "::",
    port: 3000,  // Power SDK requires port 3000
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: ['@microsoft/power-apps'],
      output: {
        // ファイル名を固定してPower Apps Code Appsでの参照を安定化
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  },
})