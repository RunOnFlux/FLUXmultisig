import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// bitgo-utxo-lib uses `typeforce` for runtime type checks. typeforce
// identifies types by `constructor.name` and `.name`. When Rollup bundles
// bitgo-utxo-lib's CommonJS modules it has to deduplicate top-level
// identifiers across files, producing `BigInteger$9`, `ECPair$1`, `Point$2`,
// etc. The base names are then unavailable and the typeforce checks fail
// with "Expected property '1' of type BigInteger, got BigInteger$9".
//
// All of the `$N` variants are aliases of a single underlying class — they
// were renamed only for scope collision avoidance, not because there are
// multiple distinct implementations. Safe to collapse back to the base name
// after Rollup has finished its work.
const CRYPTO_CLASS_NAMES = [
  'BigInteger',
  'ECPair',
  'Point',
  'ECCurveFp',
  'ECPubKey',
  'ECKey',
  'HDNode',
];

function preserveCryptoClassNames() {
  const pattern = new RegExp(
    `\\b(${CRYPTO_CLASS_NAMES.join('|')})\\$\\d+\\b`,
    'g',
  );
  return {
    name: 'preserve-crypto-class-names',
    generateBundle(_options, bundle) {
      for (const fileName of Object.keys(bundle)) {
        const chunk = bundle[fileName];
        if (chunk.type === 'chunk' && fileName.endsWith('.js')) {
          chunk.code = chunk.code.replace(pattern, '$1');
        }
      }
    },
  };
}

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
      // runtime. Preserve them through terser as well.
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
      // Keep declared function and class names so typeforce sees them.
      keep_classnames: true,
      keep_fnames: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // bitgo-utxo-lib + its crypto deps dominate the bundle; isolate
          // them in a vendor chunk that's cached separately from app code.
          'vendor-bitgo': ['bitgo-utxo-lib'],
        },
      },
      plugins: [preserveCryptoClassNames()],
    },
  },
}));
