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
    sourcemap: true,
  },
}));
