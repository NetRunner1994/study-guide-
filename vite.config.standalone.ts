import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { viteSingleFile } from 'vite-plugin-singlefile'

/**
 * Builds one self-contained HTML file that runs straight from the filesystem —
 * no server, no install, just open it. Everything (JS, CSS, icons, the whole
 * question bank) is inlined, and the script is emitted as a classic IIFE so it
 * works over file://, where module scripts are blocked by CORS.
 */
export default defineConfig({
  base: './',
  define: { __STANDALONE__: 'true' },
  plugins: [
    react(),
    {
      /* A single file has no sibling manifest or icon files, so drop those
         links and carry the favicon inline as a data URI. */
      name: 'inline-external-links',
      transformIndexHtml(html: string) {
        const svg = readFileSync('public/icons/icon.svg', 'utf8')
        const favicon = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
        return html
          .replace(/\s*<link rel="(manifest|apple-touch-icon)"[^>]*>/g, '')
          .replace('./icons/icon.svg', favicon)
      },
    },
    viteSingleFile({ useRecommendedBuildConfig: false }),
  ],
  build: {
    outDir: 'dist-standalone',
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    target: 'es2020',
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
        assetFileNames: 'app.[ext]',
      },
    },
  },
})
