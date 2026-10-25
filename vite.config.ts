import { defineConfig } from 'vite'
import { holocron } from '@holocron.so/vite'

import { stripPromptPlugin } from './scripts/strip-prompt.mjs'

export default defineConfig({
  clearScreen: false,
  plugins: [holocron({ pagesDir: './src' }), stripPromptPlugin()],
})
