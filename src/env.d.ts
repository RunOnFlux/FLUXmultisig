/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type */
  const component: DefineComponent<{}, {}, any>;
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type */
  export default component;
}

// bitgo-utxo-lib (zelcore fork) ships no type declarations. The library
// surface we use is small but very dynamic — typing it precisely would be
// a project of its own. Declare the whole module as `any` so call sites can
// at least narrow at the point of use.
declare module 'bitgo-utxo-lib' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lib: any;
  export default lib;
}
