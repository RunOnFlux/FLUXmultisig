# FLUX // Multisig

In-browser tool for multi-signature operations on Flux and Bitcoin: keypair
generation, M-of-N address derivation, transaction construction, signing,
finalization, and broadcast.

## Stack

- Vue 3 (Options API) + Vite
- `bitgo-utxo-lib` (zelcore fork, pinned commit) for tx primitives
- `axios` for explorer / blockbook API calls
- Single component (`src/App.vue`), no router, no state library

## Local development

```
yarn install
yarn dev      # Vite dev server at http://localhost:8080
yarn build    # Production build to dist/
yarn preview  # Serve the production build locally
yarn lint     # Run ESLint
```

The dev server hot-reloads on edits to `src/App.vue`, `vite.config.js`, etc.

## Branch model

| Branch | Role |
|---|---|
| `production` | Source of truth. All feature work targets this branch via PR. |
| `master` | **Deploy branch.** Contains the compiled `dist/` output, served by GitHub Pages. No source code lives here. |
| feature branches | Short-lived. Cut from `production`, merged back via PR. |

## Workflow: updating the app

1. **Branch off `production`**: `git checkout production && git pull && git checkout -b your-feature`
2. **Edit** `src/App.vue` (and friends). `yarn dev` for live reload.
3. **Test locally**: `yarn dev`, then `yarn build` to confirm the prod bundle compiles.
4. **PR into `production`**.
5. Once merged, **update `master`** so the published site reflects the new code (see below).

## Workflow: publishing to GitHub Pages

`master` is a build-artifact-only branch (gh-pages-style). After merging changes
into `production`, rebuild and swap master's root files with the new `dist/`.

```bash
# 1. On production with the latest merge pulled
git checkout production && git pull
yarn build

# 2. Switch to master and clean out the previous build
git checkout master
rm -rf assets css js favicon.ico index.html

# 3. Move the new dist contents to the root
mv dist/* .
rmdir dist

# 4. Commit + push
git add -A
git commit -m "rebuild: <short description>"
git push origin master
```

Vite output layout (current):

```
dist/
  index.html
  favicon.ico
  assets/
    index-HASH.css
    index-HASH.js
```

The deployed site is at `https://runonflux.github.io/FLUXmultisig/`. The
`base: '/FLUXmultisig/'` setting in `vite.config.js` ensures asset paths in
`index.html` resolve correctly under that subpath.

## Configuration

- `vite.config.js` — build config; `base` is path prefix, polyfills enabled for
  Buffer / process / global (needed by `bitgo-utxo-lib` in the browser).
- `.eslintrc.js` — ESLint rules; airbnb-base + Vue 3 recommended.

## Persisted local state

The app reads/writes a few `localStorage` keys to make repeated use less painful:

| Key | Purpose |
|---|---|
| `fluxmultisig:theme` | dark / light preference |
| `fluxmultisig:multisigSetup` | pubkeys + threshold so F5 doesn't wipe them |
| `fluxmultisig:utxoCache` | UTXO satoshi values keyed by `txid+vout`, with a 12-hour TTL — speeds up sign when reusing data from build, or co-signing soon after |

Clearing browser storage clears these.
