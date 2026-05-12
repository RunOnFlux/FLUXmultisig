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
| `production` | Source of truth. All feature work targets this branch via PR. Pushing here triggers a Pages deploy via GitHub Actions. |
| feature branches | Short-lived. Cut from `production`, merged back via PR. |
| `master` | Historical only. Used to hold compiled `dist/` artifacts before we switched to Pages-from-Actions; can be archived or deleted. |

## Workflow: updating the app

1. **Branch off `production`**: `git checkout production && git pull && git checkout -b your-feature`
2. **Edit** `src/App.vue` (and friends). `yarn dev` for live reload.
3. **Test locally**: `yarn dev`, then `yarn build` to confirm the prod bundle compiles, then `yarn test` to confirm the unit tests pass.
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
- `.eslintrc.js` — ESLint rules; airbnb-base + Vue 3 recommended.

## Persisted local state

The app reads/writes a few `localStorage` keys to make repeated use less painful:

| Key | Purpose |
|---|---|
| `fluxmultisig:theme` | dark / light preference |
| `fluxmultisig:multisigSetup` | pubkeys + threshold so F5 doesn't wipe them |
| `fluxmultisig:utxoCache` | UTXO satoshi values keyed by `txid+vout`, with a 12-hour TTL — speeds up sign when reusing data from build, or co-signing soon after |

Clearing browser storage clears these.
