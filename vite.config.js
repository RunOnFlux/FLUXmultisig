import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/FLUXmultisig/' : '/',
  plugins: [
    vue(),
    nodePolyfills({
      globals: {
        Buffer: true,
        process: true,
        global: true,
      },
      protocolImports: true,
    }),
  ],
  server: {
    port: 8080,
    strictPort: false,
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      // bitgo-utxo-lib's typeforce checks rely on constructor names at
      // runtime. esbuild's default minifier renames classes to BigInteger$N,
      // ECPair$N, etc. and breaks them. Preserve the names through terser.
      mangle: {
        reserved: [
          'Buffer',
          'BigInteger',
          'Point',
          'ECPubKey',
          'ECKey',
          'sha512_asm',
          'asm',
          'ECPair',
          'HDNode',
          'BigNumber',
        ],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // bitgo-utxo-lib + its crypto deps dominate the bundle; isolate
          // them in a vendor chunk that's cached separately from app code.
          'vendor-bitgo': ['bitgo-utxo-lib'],
        },
      },
    },
  },
}));
