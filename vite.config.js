import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// bitgo-utxo-lib uses `typeforce` for runtime type checks; typeforce
// identifies types by `constructor.name`. When Rollup bundles bitgo-utxo-lib's
// CommonJS modules it deduplicates top-level identifiers across files,
// producing `BigInteger$9`, `ECPair$3`, etc. The runtime check then sees
// "BigInteger$9" instead of "BigInteger" and throws.
//
// We can't rename the identifiers back at the source level — there are
// `var BigInteger = bigi` aliases later in the same scope, and merging them
// produces redeclaration errors under SES (Secure ECMAScript, used by
// MetaMask et al). So instead, leave the renamed identifiers alone and
// override the `.name` property of each constructor at the end of the
// bundle. typeforce reads `.name`; setting it via defineProperty fixes the
// check without touching identifier scopes.
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
  const namesPattern = CRYPTO_CLASS_NAMES.join('|');
  // Match the renamed function declarations (e.g. `function BigInteger$9(`)
  const declPattern = new RegExp(`function\\s+(${namesPattern})(\\$\\d+)\\(`, 'g');
  return {
    name: 'preserve-crypto-class-names',
    generateBundle(_options, bundle) {
      for (const fileName of Object.keys(bundle)) {
        const chunk = bundle[fileName];
        if (chunk.type !== 'chunk' || !fileName.endsWith('.js')) continue;
        declPattern.lastIndex = 0;
        const fixes = [];
        let match = declPattern.exec(chunk.code);
        while (match !== null) {
          fixes.push({ renamed: match[1] + match[2], base: match[1] });
          match = declPattern.exec(chunk.code);
        }
        if (fixes.length) {
          const calls = fixes
            .map(({ renamed, base }) => `try{Object.defineProperty(${renamed},"name",{value:"${base}",configurable:true})}catch(_){};`)
            .join('');
          // eslint-disable-next-line no-param-reassign
          chunk.code += `\n;(function(){${calls}})();\n`;
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
      // typeforce reads constructor.name at runtime; keep terser from
      // renaming declared functions/classes that survive Rollup.
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
      keep_classnames: true,
      keep_fnames: true,
    },
    rollupOptions: {
      output: {
        // bitgo-utxo-lib + its crypto deps dominate the bundle; isolate
        // them in a vendor chunk that's cached separately from app code.
        manualChunks(id) {
          if (id.includes('node_modules/bitgo-utxo-lib')) return 'vendor-bitgo';
          return undefined;
        },
      },
      plugins: [preserveCryptoClassNames()],
    },
  },
}));
