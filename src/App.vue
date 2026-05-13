<template>
  <div
    id="app"
    class="app"
    :class="{ 'app--testnet': isTestnet, 'app--light': theme === 'light' }"
  >
    <div
      class="grain"
      aria-hidden="true"
    />
    <TestnetStripe v-if="isTestnet" />
    <CopyToast />
    <TopBar
      :chain="chain"
      :is-testnet="isTestnet"
      :theme="theme"
      @toggle-theme="toggleTheme"
      @toggle-testnet="isTestnet = !isTestnet"
      @toggle-chain="toggleChain"
    />
    <main class="container">
      <Hero />
      <Keypair
        :chain="chain"
        :is-testnet="isTestnet"
        :show-private-key="showPrivateKey"
        @toggle-show-private-key="showPrivateKey = !showPrivateKey"
      />
      <Multisig
        :chain="chain"
        :is-testnet="isTestnet"
      />
      <CoinControl
        :chain="chain"
        :is-testnet="isTestnet"
      />
      <BuildTx
        :chain="chain"
        :is-testnet="isTestnet"
      />
      <DecodeTx
        :chain="chain"
        :is-testnet="isTestnet"
      />
      <SignTx
        :chain="chain"
        :is-testnet="isTestnet"
        :show-private-key="showPrivateKey"
        @toggle-show-private-key="showPrivateKey = !showPrivateKey"
      />
      <FinaliseTx
        :chain="chain"
        :is-testnet="isTestnet"
      />
      <SubmitTx
        :chain="chain"
        :is-testnet="isTestnet"
      />
      <Foot />
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue';
import TopBar from './components/TopBar.vue';
import TestnetStripe from './components/TestnetStripe.vue';
import CopyToast from './components/CopyToast.vue';
import Hero from './components/Hero.vue';
import Keypair from './components/Keypair.vue';
import Multisig from './components/Multisig.vue';
import CoinControl, { type CoinControlState } from './components/CoinControl.vue';
import BuildTx from './components/BuildTx.vue';
import DecodeTx from './components/DecodeTx.vue';
import SignTx from './components/SignTx.vue';
import FinaliseTx from './components/FinaliseTx.vue';
import SubmitTx from './components/SubmitTx.vue';
import Foot from './components/Foot.vue';
import type { Chain } from './composables/network';
import { loadFromStorage as loadUtxoCache } from './composables/utxoCache';

interface Data {
  chain: Chain;
  isTestnet: boolean;
  theme: 'dark' | 'light';
  showPrivateKey: boolean;
  coinControl: CoinControlState;
}

export default defineComponent({
  name: 'App',
  components: {
    TopBar,
    TestnetStripe,
    CopyToast,
    Hero,
    Keypair,
    Multisig,
    CoinControl,
    BuildTx,
    DecodeTx,
    SignTx,
    FinaliseTx,
    SubmitTx,
    Foot,
  },
  provide() {
    return { coinControl: this.coinControl };
  },
  data(): Data {
    return {
      chain: 'flux',
      isTestnet: false,
      theme: 'dark',
      showPrivateKey: false,
      coinControl: reactive<CoinControlState>({
        address: '',
        utxos: [],
        selected: [],
        errorMsg: '',
        currentPage: 1,
        getrows: [],
        numpages: 0,
        show: false,
        selectedValueSats: 0,
        selectedValueAmount: 0,
        loading: false,
      }),
    };
  },
  mounted(): void {
    try {
      const t = localStorage.getItem('fluxmultisig:theme');
      if (t === 'light' || t === 'dark') this.theme = t;
    } catch (e) {
      console.log('Failed to load theme:', e);
    }
    loadUtxoCache();
  },
  methods: {
    toggleTheme(): void {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('fluxmultisig:theme', this.theme);
      } catch (e) {
        console.log('Failed to save theme:', e);
      }
    },
    toggleChain(): void {
      this.chain = this.chain === 'flux' ? 'bitcoin' : 'flux';
    },
  },
});
</script>

<style>
/* design tokens */
:root {
  --bg: #0b0c0a;
  --bg-elev: #131512;
  --surface: #181a17;
  --surface-2: #1f221e;
  --border: #2a2d28;
  --border-strong: #3b3f39;
  --text: #ece9df;
  --text-dim: #8e8b81;
  --text-faint: #5a5854;
  --accent: #c8ff3d;
  --accent-deep: #9bc92a;
  --accent-glow: rgba(200, 255, 61, 0.18);
  --danger: #ff5c3a;
  --warn: #ffb84d;
  --font-serif: 'Instrument Serif', Georgia, 'Times New Roman', serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Consolas, monospace;
  --radius: 2px;
  --radius-pill: 999px;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}

::selection {
  background: var(--accent);
  color: var(--bg);
}

.app {
  position: relative;
  min-height: 100vh;
  isolation: isolate;
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%, var(--accent-glow), transparent 70%),
    var(--bg);
}

.app--testnet {
  --accent: #ffb84d;
  --accent-deep: #d99422;
  --accent-glow: rgba(255, 184, 77, 0.16);
}

.app--light {
  --bg: #faf7ee;
  --bg-elev: #f1eee5;
  --surface: #e8e5dc;
  --surface-2: #ddd9cf;
  --border: #cfcabc;
  --border-strong: #a8a394;
  --text: #1a1916;
  --text-dim: #5e5b54;
  --text-faint: #94918a;
  --accent: #5a8c20;
  --accent-deep: #3d6814;
  --accent-glow: rgba(90, 140, 32, 0.16);
  --danger: #c93b1d;
  --warn: #a86510;
}

.app--light.app--testnet {
  --accent: #a86510;
  --accent-deep: #7a4a09;
  --accent-glow: rgba(168, 101, 16, 0.16);
}

/* grain overlay */
.grain {
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 100;
  opacity: 0.07;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  background-size: 220px 220px;
}

.app--light .grain {
  opacity: 0.04;
  mix-blend-mode: multiply;
}

/* testnet warning stripe */
.testnet-stripe {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 28px;
  z-index: 60;
  pointer-events: none;
  background: var(--warn);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a1916;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  box-shadow: 0 2px 16px color-mix(in srgb, var(--warn) 50%, transparent);
  animation: stripe-in 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.testnet-stripe__txt {
  display: inline-flex;
  align-items: center;
  gap: 14px;
}

.testnet-stripe__mark {
  font-size: 10px;
  line-height: 1;
  letter-spacing: 0;
  animation: stripe-pulse 1.8s ease-in-out infinite;
}

.testnet-stripe__mark:last-child {
  animation-delay: 0.9s;
}

@keyframes stripe-in {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}

@keyframes stripe-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* shift topbar down when stripe is visible */
.app--testnet { padding-top: 28px; }
.app--testnet .topbar { top: 28px; }

@media (max-width: 540px) {
  .testnet-stripe { font-size: 10px; letter-spacing: 0.14em; }
}

/* copy toast */
.copy-toast {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 200;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  background: var(--bg-elev);
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
  box-shadow:
    0 8px 28px rgba(0, 0, 0, 0.4),
    0 0 0 1px color-mix(in srgb, var(--accent) 14%, transparent),
    0 0 24px color-mix(in srgb, var(--accent) 30%, transparent);
}

.copy-toast__check {
  font-size: 14px;
  line-height: 1;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* topbar */
.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}

.topbar__inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 16px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.topbar__brand {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.topbar__mark {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.16em;
  color: var(--text);
}

.topbar__slash { color: var(--text-faint); letter-spacing: 0.04em; }

.topbar__sub {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 19px;
  color: var(--text-dim);
}

.topbar__toggles {
  display: flex;
  gap: 8px;
}

/* pill toggle */
.pill {
  appearance: none;
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 7px 14px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: border-color 0.15s, background 0.15s, transform 0.05s;
}

.pill:hover {
  border-color: var(--text-dim);
  background: var(--surface-2);
}

.pill:active { transform: translateY(1px); }

.pill__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent-glow);
  display: inline-block;
}

.pill__dot--accent { background: var(--accent); }
.pill--warn { border-color: var(--warn); color: var(--warn); }
.pill--warn .pill__dot { background: var(--warn); box-shadow: 0 0 8px color-mix(in srgb, var(--warn) 40%, transparent); }

.pill__glyph {
  font-size: 13px;
  line-height: 1;
  display: inline-block;
  color: var(--text-dim);
}

.pill--theme { letter-spacing: 0.14em; }

/* container */
.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 64px 32px 96px;
  position: relative;
}

/* hero */
.hero {
  margin-bottom: 64px;
  padding-bottom: 40px;
  border-bottom: 1px solid var(--border);
  animation: rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

.hero__title {
  font-family: var(--font-serif);
  font-weight: 400;
  font-size: clamp(36px, 5.5vw, 72px);
  line-height: 0.95;
  letter-spacing: -0.02em;
  margin: 0 0 20px;
  color: var(--text);
}

.hero__title em {
  font-style: italic;
  color: var(--accent);
  transition: color 0.3s;
}

.hero__lede {
  font-family: var(--font-mono);
  color: var(--text-dim);
  max-width: 560px;
  font-size: 15px;
  line-height: 1.6;
  margin: 0;
}

/* panel */
.panel {
  margin-bottom: 88px;
  position: relative;
  animation: rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

.panel:nth-of-type(1) { animation-delay: 0.05s; }
.panel:nth-of-type(2) { animation-delay: 0.12s; }
.panel:nth-of-type(3) { animation-delay: 0.18s; }
.panel:nth-of-type(4) { animation-delay: 0.24s; }
.panel:nth-of-type(5) { animation-delay: 0.30s; }
.panel:nth-of-type(6) { animation-delay: 0.36s; }
.panel:nth-of-type(7) { animation-delay: 0.42s; }
.panel:nth-of-type(8) { animation-delay: 0.48s; }

.panel__head {
  display: flex;
  align-items: flex-start;
  gap: 32px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border);
}

.panel__num {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 64px;
  line-height: 0.85;
  color: var(--accent);
  font-weight: 400;
  letter-spacing: -0.02em;
  flex-shrink: 0;
  min-width: 84px;
  transition: color 0.3s;
}

.panel__title {
  font-family: var(--font-serif);
  font-weight: 400;
  font-size: 32px;
  line-height: 1.1;
  letter-spacing: -0.01em;
  margin: 0;
  padding-top: 8px;
  color: var(--text);
}

.panel__desc {
  font-family: var(--font-mono);
  color: var(--text-dim);
  font-size: 13px;
  max-width: 640px;
  margin: 0 0 24px;
  padding-left: 116px;
}

.panel__body {
  padding-left: 116px;
}

@keyframes rise {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* field/input */
.field { margin-bottom: 16px; }

.field--inline {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.field__label {
  display: block;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 6px;
}

.field--inline .field__label { margin-bottom: 0; }

.field__hint {
  text-transform: none;
  letter-spacing: normal;
  font-size: 11px;
  color: var(--text-faint);
  margin-left: 8px;
}

.field__error {
  margin-top: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--danger);
  letter-spacing: 0.04em;
}

/* sign-side signature status display */
.sig-status {
  margin: 12px 0;
  padding: 12px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius);
}

.sig-status__head {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 8px;
}

.sig-status__row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 3px 0;
  flex-wrap: wrap;
}

.sig-status__label {
  color: var(--text-faint);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 10px;
  min-width: 44px;
}

.sig-status__count {
  color: var(--text-dim);
  font-feature-settings: "tnum";
}

.sig-status__count strong {
  color: var(--text);
  font-weight: 700;
}

.sig-status__hint {
  color: var(--warn);
  font-size: 11px;
  letter-spacing: 0.04em;
}

.sig-status__complete {
  color: var(--accent);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 700;
}

.sig-status__err {
  color: var(--danger);
  font-size: 11px;
}

/* field head: label + optional inline action (e.g. import) */
.field__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 6px;
}

.field__head .field__label { margin-bottom: 0; }

/* link-style action button — used inline next to field labels */
.link-btn {
  appearance: none;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-dim);
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  transition: color 0.15s;
}

.link-btn:hover { color: var(--accent); }

.link-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.link-btn:disabled:hover { color: var(--text-dim); }

.link-btn__glyph {
  font-size: 12px;
  letter-spacing: 0;
  line-height: 1;
  transform: translateY(1px);
}

.link-btn__ext {
  color: var(--text-faint);
  letter-spacing: 0.04em;
  text-transform: none;
  font-size: 10px;
}

/* saved redeem-script library card */
.lib {
  margin-top: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius);
  overflow: hidden;
  animation: lib-in 0.32s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

@keyframes lib-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.lib__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 9px 14px;
  border-bottom: 1px solid var(--border);
  background:
    linear-gradient(
      to right,
      color-mix(in srgb, var(--accent) 6%, transparent),
      transparent 60%
    );
}

.lib__title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.lib__bar {
  display: inline-block;
  width: 14px;
  height: 1px;
  background: var(--accent);
  box-shadow: 0 0 6px var(--accent-glow);
}

.lib__count {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-faint);
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
}

.lib__count strong {
  color: var(--text);
  font-feature-settings: "tnum";
  font-weight: 700;
}

.lib__count-unit { color: var(--text-faint); }

.lib__empty {
  padding: 14px 16px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-faint);
  font-style: italic;
  display: flex;
  gap: 8px;
}

.lib__empty-mark {
  color: var(--accent);
  font-style: normal;
  letter-spacing: 0;
}

.lib__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.lib__row {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 12px;
  padding: 9px 14px;
  cursor: pointer;
  border-bottom: 1px dashed var(--border);
  transition: background 0.12s, padding 0.12s;
  outline: none;
}

.lib__row:last-child { border-bottom: none; }

.lib__row:hover,
.lib__row:focus-visible {
  background: color-mix(in srgb, var(--accent) 4%, var(--surface));
}

.lib__row:focus-visible {
  box-shadow: inset 2px 0 0 var(--accent);
}

.lib__row--active {
  background: color-mix(in srgb, var(--accent) 9%, var(--surface));
}

.lib__row--active:hover {
  background: color-mix(in srgb, var(--accent) 11%, var(--surface));
}

.lib__mark {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-faint);
  flex-shrink: 0;
  transition: background 0.15s, box-shadow 0.15s, transform 0.15s;
}

.lib__row:hover .lib__mark,
.lib__row:focus-visible .lib__mark { background: var(--text-dim); }

.lib__row--active .lib__mark {
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent-glow);
  transform: scale(1.15);
}

.lib__label {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.lib__row--active .lib__label {
  color: var(--accent);
  font-weight: 600;
}

.lib__addr {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-faint);
  letter-spacing: 0.04em;
  font-feature-settings: "tnum";
}

.lib__addr--bare { font-style: italic; }

.lib__del {
  appearance: none;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1;
  width: 22px;
  height: 22px;
  padding: 0;
  border-radius: var(--radius);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s, border-color 0.15s, background 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.lib__row:hover .lib__del,
.lib__row:focus-within .lib__del { opacity: 1; }

.lib__del:hover {
  color: var(--danger);
  border-color: color-mix(in srgb, var(--danger) 40%, transparent);
  background: color-mix(in srgb, var(--danger) 8%, transparent);
}

.lib__foot {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 14px;
  border-top: 1px solid var(--border);
  background: var(--bg-elev);
}

.lib__save {
  appearance: none;
  background: transparent;
  border: 1px dashed var(--border-strong);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 6px 12px;
  border-radius: var(--radius);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: border-color 0.15s, color 0.15s, background 0.15s, transform 0.05s;
}

.lib__save:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
  border-style: solid;
}

.lib__save:active:not(:disabled) { transform: translateY(1px); }

.lib__save:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.lib__save-glyph {
  color: var(--accent);
  font-size: 13px;
  line-height: 1;
  letter-spacing: 0;
}

.lib__save:disabled .lib__save-glyph { color: var(--text-faint); }

.lib__hint {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-faint);
  font-style: italic;
  letter-spacing: 0.04em;
}

/* export button row */
.export-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

/* tx size readout (single and multi) */
.tx-size {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-dim);
}

.tx-size--multi {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  margin-bottom: 10px;
  padding: 6px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.tx-size--multi strong {
  color: var(--text);
  font-weight: 700;
  font-feature-settings: "tnum";
}

.tx-size__val {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-dim);
  font-feature-settings: "tnum";
}

.tx-size__val--warn,
.tx-size__warn {
  color: var(--warn);
  font-weight: 600;
}

/* progress bar (multi-tx operations) */
.progress {
  position: relative;
  height: 22px;
  margin: 16px 0 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.progress__bar {
  height: 100%;
  background-image: linear-gradient(
    45deg,
    color-mix(in srgb, var(--accent) 70%, transparent) 25%,
    var(--accent) 25%,
    var(--accent) 50%,
    color-mix(in srgb, var(--accent) 70%, transparent) 50%,
    color-mix(in srgb, var(--accent) 70%, transparent) 75%,
    var(--accent) 75%,
    var(--accent)
  );
  background-size: 16px 16px;
  animation: progress-stripes 0.8s linear infinite;
  /* No `transition: width` — at fast iteration speeds (signing phase,
     cache-warm) the bar lagged the label by hundreds of ms. Step updates
     stay in lockstep with the count. */
}

@keyframes progress-stripes {
  from { background-position: 0 0; }
  to { background-position: 16px 0; }
}

.progress__label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text);
  mix-blend-mode: difference;
  pointer-events: none;
}

.input,
.textarea {
  width: 100%;
  appearance: none;
  -webkit-appearance: none;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 13px;
  padding: 10px 12px;
  border-radius: var(--radius);
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  outline: none;
}

.input::placeholder,
.textarea::placeholder { color: var(--text-faint); }

.input:focus,
.textarea:focus {
  border-color: var(--accent);
  background: var(--surface);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.input:disabled,
.textarea:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.input--small {
  width: auto;
  max-width: 160px;
}

.textarea {
  resize: vertical;
  line-height: 1.5;
  min-height: 80px;
}

.input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-wrap .input { flex: 1; }

/* buttons */
.btn {
  appearance: none;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 10px 18px;
  border-radius: var(--radius);
  border: 1px solid var(--border-strong);
  background: transparent;
  color: var(--text);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s, transform 0.05s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.btn:hover { border-color: var(--text-dim); }
.btn:active { transform: translateY(1px); }

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn--primary {
  border-color: var(--accent);
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 5%, transparent);
}

.btn--primary:hover {
  background: var(--accent);
  color: var(--bg);
  border-color: var(--accent);
}

.btn--primary:disabled {
  background: color-mix(in srgb, var(--accent) 3%, transparent);
  color: var(--accent);
  border-color: var(--accent);
}

.btn--ghost {
  border-color: var(--border);
  color: var(--text-dim);
  font-size: 11px;
  padding: 7px 12px;
}

.btn--ghost:hover {
  color: var(--text);
  border-color: var(--text-faint);
}

.btn--micro {
  font-size: 10px;
  padding: 5px 10px;
  letter-spacing: 0.12em;
}

.btn--toggle {
  font-size: 11px;
  border-color: var(--border-strong);
  color: var(--text-dim);
}

.btn--toggle-on {
  border-color: var(--accent);
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 6%, transparent);
}

.btn__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-faint);
  display: inline-block;
  transition: background 0.15s, box-shadow 0.15s;
}

.btn--toggle-on .btn__dot {
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent-glow);
}

.actions {
  display: flex;
  gap: 12px;
  margin: 20px 0;
  flex-wrap: wrap;
}

.actions--row {
  margin: 12px 0;
}

/* loading dots */
.dots::after {
  content: '';
  display: inline-block;
  letter-spacing: 0.1em;
  width: 1.4em;
  text-align: left;
  animation: dots 1.4s steps(4, end) infinite;
}

@keyframes dots {
  0%, 20% { content: ''; }
  40% { content: '.'; }
  60% { content: '..'; }
  80%, 100% { content: '...'; }
}

/* checkbox */
.cb {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border: 1px solid var(--border-strong);
  background: var(--bg-elev);
  cursor: pointer;
  position: relative;
  margin: 0;
  border-radius: 1px;
  flex-shrink: 0;
  transition: border-color 0.15s, background 0.15s;
}

.cb:hover { border-color: var(--text-dim); }

.cb:checked {
  border-color: var(--accent);
  background: var(--accent);
}

.cb:checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 9px;
  border: solid var(--bg);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.cb:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.check {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 6px 0;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
  line-height: 1.4;
}

.check em {
  font-style: normal;
  color: var(--text-dim);
  font-size: 12px;
}

.check-inline {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
  flex-wrap: wrap;
}

/* advanced panel */
.advanced {
  border: 1px solid var(--border);
  background: var(--surface);
  padding: 18px 22px;
  margin: 12px 0 24px;
  border-radius: var(--radius);
  position: relative;
  overflow: hidden;
}

.advanced::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--accent);
  transition: background 0.3s;
}

.advanced--inline { margin-top: 0; }

.advanced__head {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-faint);
  margin-bottom: 12px;
}

.advanced__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* key/value display */
.kv {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 24px;
  border-top: 1px solid var(--border);
}

.kv__row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.kv__label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-dim);
  min-width: 110px;
  flex-shrink: 0;
}

.kv__val {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text);
  word-break: break-all;
  overflow-wrap: anywhere;
  min-width: 0;
  background: transparent;
  padding: 0;
}

/* alerts */
.alert {
  margin: 16px 0;
  padding: 12px 16px;
  border-radius: var(--radius);
  font-family: var(--font-mono);
  font-size: 13px;
  border-left: 3px solid;
  line-height: 1.5;
}

.alert--err {
  border-color: var(--danger);
  background: color-mix(in srgb, var(--danger) 8%, transparent);
  color: var(--danger);
}

.alert--ok {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 6%, transparent);
  color: var(--accent);
}

/* table */
.table-wrap {
  overflow-x: auto;
  margin: 20px 0 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: 12px;
}

.table thead th {
  text-align: left;
  background: var(--bg-elev);
  color: var(--text-faint);
  font-weight: 500;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
}

.table tbody td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  vertical-align: middle;
}

.table tbody tr:last-child td { border-bottom: none; }
.table tbody tr:hover td { background: color-mix(in srgb, var(--accent) 4%, transparent); }

.td-clip {
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* amount groups (UTXO summary) */
.amount-groups {
  margin: 16px 0;
  padding: 14px 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius);
}

.amount-groups__head {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 10px;
}

.amount-groups__hint {
  color: var(--text-faint);
  letter-spacing: 0.06em;
  text-transform: none;
}

.amount-groups__list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.amount-groups__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-elev);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.amount-groups__count {
  font-weight: 700;
  color: var(--accent);
}

.amount-groups__times {
  color: var(--text-faint);
  font-size: 11px;
}

.amount-groups__amt { color: var(--text); }

.amount-groups__unit {
  color: var(--text-faint);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* pagination */
.pag {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin: 14px 0;
}

.pag__num {
  appearance: none;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 6px 10px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
  min-width: 32px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pag__num:hover:not(:disabled):not(.pag__num--gap) {
  border-color: var(--text-faint);
  color: var(--text);
}

.pag__num:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pag__num--active {
  border-color: var(--accent);
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 7%, transparent);
}

.pag__num--gap {
  border-color: transparent;
  background: transparent;
  cursor: default;
  color: var(--text-faint);
  letter-spacing: 0.1em;
  opacity: 0.7;
  padding: 6px 4px;
  min-width: 20px;
}

.pag__num--gap:disabled {
  opacity: 0.7;
}

.pag__nav {
  font-size: 16px;
  line-height: 1;
  padding: 6px 12px;
  color: var(--text);
}

.pag__count {
  margin-left: 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-faint);
  letter-spacing: 0.08em;
}

/* info list */
.info-list {
  margin: 16px 0;
  padding: 12px 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.info-list__row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 4px 0;
}

.info-list__num {
  color: var(--text-faint);
  flex-shrink: 0;
  min-width: 32px;
}

.info-list__txt {
  color: var(--text-dim);
  flex: 1;
}

/* multi-tx output */
.multi { margin-top: 24px; }

.expand {
  margin-top: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  overflow: hidden;
}

.expand__summary {
  list-style: none;
  cursor: pointer;
  padding: 14px 18px;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background 0.15s;
}

.expand__summary::-webkit-details-marker { display: none; }
.expand__summary:hover { background: var(--surface-2); }

.expand__chevron {
  font-size: 18px;
  line-height: 1;
  transition: transform 0.2s;
  color: var(--accent);
  display: inline-block;
  width: 14px;
}

.expand[open] .expand__chevron { transform: rotate(90deg); }

.expand__hint {
  color: var(--text-faint);
  margin-left: auto;
  font-size: 11px;
}

.expand__body {
  padding: 0 18px 6px;
  border-top: 1px solid var(--border);
}

.expand__body .kv__row:last-child { border-bottom: none; }

/* decode output */
.output {
  margin: 16px 0;
  padding: 16px 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.65;
  overflow-x: auto;
}

/* submit response list */
.response-list {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.response-list__row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-family: var(--font-mono);
  font-size: 13px;
  flex-wrap: wrap;
}

.response-list__label {
  color: var(--text-faint);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  min-width: 110px;
}

.response-list__status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  border: 1px solid;
}

.response-list__status--ok {
  color: var(--accent);
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 7%, transparent);
}

.response-list__status--fail {
  color: var(--danger);
  border-color: var(--danger);
  background: color-mix(in srgb, var(--danger) 8%, transparent);
}

.response-list__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.response-list__code {
  font-weight: 500;
  font-feature-settings: "tnum";
}

.response-list__row > .btn { margin-left: auto; }

/* foot */
.foot {
  margin-top: 96px;
  padding-top: 32px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-faint);
  letter-spacing: 0.04em;
  flex-wrap: wrap;
}

.foot__mark {
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--text-dim);
}

.foot__sep { color: var(--text-faint); }

/* misc */
.muted { color: var(--text-faint); }

/* responsive */
@media (max-width: 720px) {
  .container { padding: 32px 20px 64px; }
  .topbar__inner { padding: 14px 20px; }
  .topbar__sub { display: none; }
  .panel__head { gap: 16px; }
  .panel__num { font-size: 40px; min-width: 56px; }
  .panel__title { font-size: 22px; }
  .panel__desc, .panel__body { padding-left: 0; }
  .hero__title { font-size: clamp(32px, 8vw, 56px); }
  .kv__label { min-width: auto; }
  .response-list__row { flex-wrap: wrap; }
  .response-list__row > .btn { margin-left: 0; }
  .td-clip { max-width: 140px; }
}
</style>
