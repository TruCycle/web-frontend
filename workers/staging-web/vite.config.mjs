import { mergeConfig } from 'vite'
import baseConfig from '../../vite.config.ts'

// Never read .env, .env.local or mode-specific env files for a review build.
// scripts/build-staging.mjs supplies the complete browser-variable allowlist.
export default mergeConfig(baseConfig, {
  envDir: false,
  build: {
    outDir: 'dist-staging',
    emptyOutDir: true,
  },
})
