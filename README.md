# FLUX // Multisig

In-browser tool for multi-signature operations on Flux and Bitcoin: keypair
generation, M-of-N address derivation, transaction construction, signing,
finalization, and broadcast.

## Stack

- Vue 3 (Options API) + Vite + TypeScript
- `bitgo-utxo-lib` (zelcore fork, pinned commit) for tx primitives
- `axios` for explorer / blockbook API calls
- No router, no state library. App shell is `src/App.vue`; each tool
  (Keypair, Multisig, BuildTx, SignTx, DecodeTx, FinaliseTx, SubmitTx,
  CoinControl, …) lives in its own component under `src/components/`.
  Shared logic sits in `src/composables/` and `src/utils.ts`.

## Layout

```
src/
  App.vue              # shell + tab routing
  main.ts              # Vue entrypoint
  utils.ts             # shared helpers (network defs, encoding, etc.)
  env.d.ts             # ambient types for bitgo-utxo-lib / Vue SFCs
  components/          # one .vue per tool (BuildTx, SignTx, …)
  composables/         # reusable .ts modules (utxoCache, network, …)
  __tests__/           # Vitest unit tests
```

## Local development

```
yarn install
yarn dev         # Vite dev server at http://localhost:8080
yarn build       # Production build to dist/
yarn preview     # Serve the production build locally
yarn test        # Run Vitest once
yarn test:watch  # Vitest in watch mode
yarn typecheck   # vue-tsc --noEmit (type-check .ts + .vue)
yarn lint        # ESLint over .js, .ts, .vue
```

The dev server hot-reloads on any file under `src/`.

## Branch model

| Branch | Role |
|---|---|
| `production` | Source of truth. All feature work targets this branch via PR. Pushing here triggers a Pages deploy via GitHub Actions. |
| feature branches | Short-lived. Cut from `production`, merged back via PR. |
| `master` | Historical only. Used to hold compiled `dist/` artifacts before we switched to Pages-from-Actions; can be archived or deleted. |

## Workflow: updating the app

1. **Branch off `production`**: `git checkout production && git pull && git checkout -b your-feature`
2. **Edit** the relevant component under `src/components/` (or its supporting composable / util). `yarn dev` for live reload.
3. **Test locally**: `yarn dev` for manual verification, `yarn typecheck` to catch type errors, `yarn build` to confirm the prod bundle compiles, and `yarn test` for the unit tests.
4. **PR into `production`**.
5. **Merge**. The Pages deploy runs automatically — no manual master step.

## Deploy

GitHub Pages is wired via Actions (`.github/workflows/deploy.yml`). Every push
to `production` triggers a workflow that:

1. checks out the source
2. runs `yarn install --frozen-lockfile`
3. runs `yarn build`
4. uploads `dist/` as a Pages artifact
5. calls `actions/deploy-pages@v4` to publish it

**Repo prerequisite:** In **Settings → Pages**, *Build and deployment → Source*
must be set to **GitHub Actions** (not "Deploy from a branch"). One-time setup.

The deployed site is at `https://runonflux.github.io/FLUXmultisig/`. The
`base: '/FLUXmultisig/'` in `vite.config.js` keeps asset paths correct under
that subpath.

Manual deploy: trigger the workflow from the **Actions** tab via *Run workflow*.

Vite output layout (for reference):

```
dist/
  index.html
  favicon.ico
  assets/
    index-HASH.css
    index-HASH.js
    vendor-bitgo-HASH.js
```

## Configuration

- `vite.config.js` — build config; `base` is path prefix, polyfills enabled for
  Buffer / process / global (needed by `bitgo-utxo-lib` in the browser).
- `tsconfig.json` — TypeScript config (extends `@vue/tsconfig`); `vue-tsc`
  drives `yarn typecheck`.
- `eslint.config.js` — ESLint flat config; `@eslint/js` recommended +
  `typescript-eslint` recommended + `eslint-plugin-vue` (flat/recommended) +
  `eslint-plugin-import-x`.

## Persisted local state

The app reads/writes a few `localStorage` keys to make repeated use less painful:

| Key | Purpose |
|---|---|
| `fluxmultisig:theme` | dark / light preference |
| `fluxmultisig:multisigSetup` | pubkeys + threshold so F5 doesn't wipe them |
| `fluxmultisig:utxoCache` | UTXO satoshi values keyed by `txid+vout`, with a 12-hour TTL — speeds up sign when reusing data from build, or co-signing soon after |

Clearing browser storage clears these.
