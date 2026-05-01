import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
  build: {
    rollupOptions: {
      external: [
        '@mediapipe/hands',
        '@mediapipe/camera_utils',
        '@mediapipe/drawing_utils',
        '@mediapipe/holistic',
        '@mediapipe/pose',
        '@mediapipe/face_mesh',
      ],
    },
  },
})
