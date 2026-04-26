import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  // Assurer que les assets SVG/PNG sont correctement inclus en production
  assetsInclude: ['**/*.svg', '**/*.png'],
  build: {
    assetsInlineLimit: 0, // Ne pas inliner les assets pour éviter les problèmes
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  base: './', // Chemins relatifs pour Tauri
})
