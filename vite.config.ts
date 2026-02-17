import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Copy Monaco editor assets to dist
const copyMonacoAssets = () => {
  return {
    name: 'copy-monaco-assets',
    writeBundle() {
      const src = path.join(
        path.dirname(require.resolve('monaco-editor/package.json')),
        'min',
        'vs'
      )
      const dest = path.join(__dirname, 'dist', 'monaco-editor', 'vs')
      if (fs.existsSync(src)) {
        fs.cpSync(src, dest, { recursive: true })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyMonacoAssets()],
  base: './',
  build: {
    chunkSizeWarningLimit: 1000,
  },
})
