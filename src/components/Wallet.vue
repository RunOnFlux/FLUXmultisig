<template>
  <section class="wallet">
    <div class="wallet__card">
      <!-- header: brand + network + live clock -->
      <div class="wallet__top">
        <div class="wallet__brand">
          <span class="wallet__brand-mark">FLUX</span>
          <span class="wallet__brand-slash">/</span>
          <span class="wallet__brand-sub">Multisig Wallet</span>
        </div>
        <div class="wallet__top-right">
          <span
            class="wallet__net"
            :class="{ 'wallet__net--testnet': isTestnet }"
          >
            <span class="wallet__net-dot" />
            {{ networkLabel }}
          </span>
        </div>
      </div>

      <!-- live clock — current local + UTC time, updates every second -->
      <div class="wallet__clock">
        <span class="wallet__clock-live">
          <span class="wallet__clock-pulse" />
          Live
        </span>
        <div class="wallet__clock-times">
          <div class="wallet__clock-local">
            {{ localTime }}
          </div>
          <div class="wallet__clock-utc">
            {{ utcTime }}
          </div>
        </div>
      </div>

      <!-- balance hero -->
      <div class="wallet__balance">
        <div class="wallet__balance-label">
          Confirmed balance
        </div>
        <div class="wallet__balance-row">
          <span class="wallet__balance-amt">{{ summary ? formatCoin(summary.balanceSats) : '—' }}</span>
          <span class="wallet__balance-unit">{{ unit }}</span>
        </div>
        <div
          v-if="summary"
          class="wallet__balance-sub"
        >
          {{ summary.balanceSats.toLocaleString() }} sats
        </div>
      </div>

      <!-- wallet actions -->
      <div class="wallet__actions">
        <button
          class="wallet__action wallet__action--send"
          :disabled="!addressValid"
          title="Start a multisig transaction from this address"
          @click="send"
        >
          <span class="wallet__action-glyph">↑</span>
          Send
        </button>
        <button
          class="wallet__action"
          :class="{ 'wallet__action--on': showReceive }"
          :disabled="!address"
          @click="toggleReceive"
        >
          <span class="wallet__action-glyph">↓</span>
          Receive
        </button>
        <button
          class="wallet__action"
          :disabled="loading || !addressValid"
          @click="refresh"
        >
          <span
            class="wallet__action-glyph"
            :class="{ 'wallet__action-glyph--spin': loading }"
          >⟳</span>
          {{ loading ? 'Syncing' : 'Sync' }}
        </button>
      </div>

      <!-- address / receive panel -->
      <div class="wallet__addr-block">
        <div class="wallet__addr-label">
          Wallet address
        </div>
        <div
          v-if="showReceive && qrDataUrl"
          class="wallet__qr"
        >
          <img
            :src="qrDataUrl"
            alt="QR code for wallet address"
            width="148"
            height="148"
          >
          <span class="wallet__qr-cap">Scan to send {{ unit }}</span>
        </div>
        <div class="wallet__addr-row">
          <code class="wallet__addr">{{ address || '— set an address below —' }}</code>
          <button
            v-if="address"
            class="btn btn--ghost btn--micro"
            @click="copyToClipboard(address)"
          >
            Copy
          </button>
          <a
            v-if="address"
            class="btn btn--ghost btn--micro"
            :href="explorerAddressUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            Explorer ↗
          </a>
        </div>
      </div>

      <!-- address input + refresh — collapses once data is loaded -->
      <div
        v-if="!summary || editing"
        class="wallet__controls"
      >
        <input
          v-model="address"
          class="input"
          placeholder="Paste the multisig address this transaction was sent from"
          spellcheck="false"
          @keyup.enter="refresh"
        >
        <button
          class="btn btn--primary"
          :disabled="loading || !addressValid"
          @click="refresh"
        >
          {{ loading ? 'Loading' : 'Refresh' }}<span
            v-if="loading"
            class="dots"
          />
        </button>
      </div>
      <div
        v-if="address && !addressValid"
        class="field__error"
      >
        Not a valid {{ chain }} {{ isTestnet ? 'testnet ' : '' }}address.
      </div>
      <div
        v-if="errorMsg"
        class="alert alert--err"
      >
        {{ errorMsg }}
      </div>
      <div
        v-if="lastUpdated && (!summary || editing)"
        class="wallet__updated"
      >
        Last refreshed {{ formatClock(lastUpdated) }}
      </div>

      <!-- recent activity -->
      <div
        v-if="summary"
        class="wallet__activity"
      >
        <div class="wallet__activity-head">
          <span>Recent activity</span>
          <span class="wallet__activity-count">{{ summary.txCount.toLocaleString() }} total tx</span>
        </div>
        <div
          v-if="!summary.txs.length"
          class="wallet__empty"
        >
          No transactions found for this address.
        </div>
        <ul
          v-else
          class="wallet__tx-list"
        >
          <li
            v-for="tx in summary.txs"
            :key="tx.txid"
            class="wallet__tx"
          >
            <span
              class="wallet__tx-dir"
              :class="tx.deltaSats >= 0 ? 'wallet__tx-dir--in' : 'wallet__tx-dir--out'"
            >{{ tx.deltaSats >= 0 ? '↓' : '↑' }}</span>
            <div class="wallet__tx-mid">
              <a
                class="wallet__tx-id"
                :href="txUrl(tx.txid)"
                target="_blank"
                rel="noopener noreferrer"
              >{{ shortTxid(tx.txid) }}</a>
              <span class="wallet__tx-time">{{ tx.time ? formatTime(tx.time) : 'unconfirmed' }}</span>
            </div>
            <div class="wallet__tx-right">
              <span
                class="wallet__tx-amt"
                :class="tx.deltaSats >= 0 ? 'wallet__tx-amt--in' : 'wallet__tx-amt--out'"
              >{{ tx.deltaSats >= 0 ? '+' : '−' }}{{ formatCoin(Math.abs(tx.deltaSats)) }}</span>
              <span class="wallet__tx-conf">{{ tx.confirmations.toLocaleString() }} conf</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, inject, type PropType } from 'vue';
import axios from 'axios';
import QRCode from 'qrcode';
import {
  addressInfoEndpoint,
  fluxTxsEndpoint,
  addressExplorerUrl,
  txExplorerUrl,
  summarizeBlockbookAddress,
  summarizeInsight,
  type Chain,
  type WalletSummary,
} from '../composables/network';
import { copyToClipboard } from '../composables/copyToast';
import { isValidAddress } from '../utils';
import type { CoinControlState } from './CoinControl.vue';

interface Data {
  address: string;
  summary: WalletSummary | null;
  loading: boolean;
  errorMsg: string;
  lastUpdated: number | null;
  now: number;
  timer: ReturnType<typeof setInterval> | null;
  showReceive: boolean;
  qrDataUrl: string;
  editing: boolean;
}

export default defineComponent({
  name: 'WalletDashboard',
  props: {
    chain: { type: String as PropType<Chain>, required: true },
    isTestnet: { type: Boolean, required: true },
  },
  setup() {
    // Reuse the address the user already pasted into Coin control, if any.
    const coinControl = inject<CoinControlState | undefined>('coinControl', undefined);
    return { coinControl };
  },
  data(): Data {
    return {
      address: '',
      summary: null,
      loading: false,
      errorMsg: '',
      lastUpdated: null,
      now: new Date().getTime(),
      timer: null,
      showReceive: true,
      qrDataUrl: '',
      editing: false,
    };
  },
  computed: {
    unit(): string {
      return this.chain === 'flux' ? 'FLUX' : 'BTC';
    },
    networkLabel(): string {
      const base = this.chain === 'flux' ? 'Flux' : 'Bitcoin';
      return this.isTestnet ? `${base} · Testnet` : `${base} · Mainnet`;
    },
    addressValid(): boolean {
      return isValidAddress(this.address, this.chain, this.isTestnet);
    },
    explorerAddressUrl(): string {
      return addressExplorerUrl(this.chain, this.isTestnet, this.address);
    },
    localTime(): string {
      return this.formatClock(this.now);
    },
    utcTime(): string {
      const d = new Date(this.now);
      const date = d.toLocaleDateString('en-GB', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
      });
      const time = d.toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC', hour12: false,
      });
      return `${date} · ${time} UTC`;
    },
  },
  watch: {
    // Switching chain/testnet invalidates a fetched summary.
    chain() { this.summary = null; this.errorMsg = ''; },
    isTestnet() { this.summary = null; this.errorMsg = ''; },
    // Keep the receive QR in sync with whatever address is loaded.
    address() { this.genQr(); },
  },
  mounted() {
    this.timer = setInterval(() => { this.now = new Date().getTime(); }, 1000);
    // Prefill from coin-control and auto-load if it's a valid address.
    const cc = this.coinControl?.address;
    if (cc && isValidAddress(cc, this.chain, this.isTestnet)) {
      this.address = cc;
      this.refresh();
    }
    this.genQr();
  },
  unmounted() {
    if (this.timer) clearInterval(this.timer);
  },
  methods: {
    copyToClipboard,
    formatCoin(sats: number): string {
      return (sats * 1e-8).toFixed(8);
    },
    formatClock(ms: number): string {
      const d = new Date(ms);
      const date = d.toLocaleDateString(undefined, {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
      });
      const time = d.toLocaleTimeString(undefined, {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      });
      return `${date} · ${time}`;
    },
    formatTime(unixSeconds: number): string {
      return this.formatClock(unixSeconds * 1000);
    },
    shortTxid(txid: string): string {
      return txid.length > 48 ? `${txid.slice(0, 28)}…${txid.slice(-16)}` : txid;
    },
    txUrl(txid: string): string {
      return txExplorerUrl(this.chain, this.isTestnet, txid);
    },
    toggleReceive(): void {
      this.showReceive = !this.showReceive;
      if (this.showReceive) this.genQr();
    },
    // Render a QR of the real address, client-side (no third-party service).
    async genQr(): Promise<void> {
      if (!this.address) { this.qrDataUrl = ''; return; }
      try {
        this.qrDataUrl = await QRCode.toDataURL(this.address, {
          margin: 1,
          width: 296,
          color: { dark: '#0b0c0a', light: '#ece9df' },
        });
      } catch (e) {
        console.log(e);
        this.qrDataUrl = '';
      }
    },
    // "Send" bootstraps the app's real multisig pipeline: point Coin control at
    // this address and scroll the user into the build flow. No fake broadcast.
    send(): void {
      if (!this.addressValid) return;
      if (this.coinControl) this.coinControl.address = this.address;
      const target = document.getElementById('coin-control');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    async refresh(): Promise<void> {
      if (!this.addressValid) return;
      this.loading = true;
      this.errorMsg = '';
      try {
        if (this.chain === 'flux') {
          const [addr, txs] = await Promise.all([
            axios.get(addressInfoEndpoint(this.chain, this.isTestnet, this.address)),
            axios.get(fluxTxsEndpoint(this.isTestnet, this.address)),
          ]);
          this.summary = summarizeInsight(addr.data, txs.data);
        } else {
          const res = await axios.get(addressInfoEndpoint(this.chain, this.isTestnet, this.address));
          this.summary = summarizeBlockbookAddress(res.data);
        }
        this.lastUpdated = new Date().getTime();
        // Collapse the manual controls into the clean wallet view once loaded.
        this.editing = false;
      } catch (e) {
        console.log(e);
        this.errorMsg = e instanceof Error ? e.message : String(e);
      } finally {
        this.loading = false;
      }
    },
  },
});
</script>

<style scoped>
.wallet {
  margin-bottom: 88px;
  animation: rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

.wallet__card {
  position: relative;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  background:
    radial-gradient(ellipse 120% 80% at 0% 0%, var(--accent-glow), transparent 55%),
    var(--surface);
  padding: 28px 32px 32px;
  overflow: hidden;
}

.wallet__card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--accent);
  box-shadow: 0 0 18px var(--accent-glow);
}

/* header */
.wallet__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.wallet__brand {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.wallet__brand-mark {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.18em;
  color: var(--text);
}

.wallet__brand-slash { color: var(--text-faint); }

.wallet__brand-sub {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 20px;
  color: var(--text-dim);
}

.wallet__net {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
  border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
  background: color-mix(in srgb, var(--accent) 7%, transparent);
  padding: 5px 12px;
  border-radius: var(--radius-pill);
}

.wallet__net--testnet { color: var(--warn); border-color: color-mix(in srgb, var(--warn) 45%, transparent); }

.wallet__net-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 8px currentColor;
}

/* live clock */
.wallet__clock {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  margin-bottom: 24px;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.wallet__clock-live {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
  flex-shrink: 0;
}

.wallet__clock-pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent-glow);
  animation: wallet-pulse 1.6s ease-in-out infinite;
}

@keyframes wallet-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.82); }
}

.wallet__clock-times { line-height: 1.35; }

.wallet__clock-local {
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.wallet__clock-utc {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-faint);
  font-variant-numeric: tabular-nums;
}

/* balance */
.wallet__balance { margin-bottom: 26px; }

.wallet__balance-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 8px;
}

.wallet__balance-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.wallet__balance-amt {
  font-family: var(--font-serif);
  font-size: clamp(40px, 7vw, 64px);
  line-height: 0.95;
  color: var(--text);
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.wallet__balance-unit {
  font-family: var(--font-mono);
  font-size: 18px;
  letter-spacing: 0.08em;
  color: var(--accent);
}

.wallet__balance-sub {
  margin-top: 6px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-faint);
  font-variant-numeric: tabular-nums;
}

/* action buttons (Send / Receive / Sync) */
.wallet__actions {
  display: flex;
  gap: 10px;
  margin-bottom: 22px;
  flex-wrap: wrap;
}

.wallet__action {
  appearance: none;
  flex: 1;
  min-width: 110px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 13px 16px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text);
  background: var(--bg-elev);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s, transform 0.05s;
}

.wallet__action:hover:not(:disabled) {
  border-color: var(--text-dim);
  background: var(--surface-2);
}

.wallet__action:active:not(:disabled) { transform: translateY(1px); }

.wallet__action:disabled { opacity: 0.45; cursor: not-allowed; }

.wallet__action--send {
  color: var(--bg);
  background: var(--accent);
  border-color: var(--accent);
}

.wallet__action--send:hover:not(:disabled) {
  background: var(--accent-deep);
  border-color: var(--accent-deep);
}

.wallet__action--on {
  color: var(--accent);
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}

.wallet__action-glyph {
  font-size: 15px;
  line-height: 1;
  display: inline-block;
}

.wallet__action-glyph--spin { animation: wallet-spin 0.9s linear infinite; }

@keyframes wallet-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* receive QR */
.wallet__qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 0 18px;
  margin-bottom: 4px;
}

.wallet__qr img {
  border: 6px solid #ece9df;
  border-radius: var(--radius);
  background: #ece9df;
  image-rendering: pixelated;
}

.wallet__qr-cap {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-faint);
}

/* address */
.wallet__addr-block {
  padding: 16px 18px;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 18px;
}

.wallet__addr-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 8px;
}

.wallet__addr-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.wallet__addr {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--text);
  word-break: break-all;
  letter-spacing: 0.01em;
}

a.btn { text-decoration: none; }

/* controls */
.wallet__controls {
  display: flex;
  gap: 10px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.wallet__controls .input { flex: 1; min-width: 220px; }

.wallet__updated {
  margin-top: 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-faint);
  letter-spacing: 0.04em;
}

/* activity */
.wallet__activity {
  margin-top: 26px;
  border-top: 1px solid var(--border);
  padding-top: 20px;
}

.wallet__activity-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.wallet__activity-count { color: var(--text-faint); }

.wallet__empty {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-faint);
  font-style: italic;
  padding: 10px 0;
}

.wallet__tx-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.wallet__tx {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px dashed var(--border);
}

.wallet__tx:last-child { border-bottom: none; }

.wallet__tx-dir {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  border: 1px solid;
}

.wallet__tx-dir--in {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}

.wallet__tx-dir--out {
  color: var(--warn);
  border-color: color-mix(in srgb, var(--warn) 45%, transparent);
  background: color-mix(in srgb, var(--warn) 8%, transparent);
}

.wallet__tx-mid {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.wallet__tx-id {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text);
  text-decoration: none;
  letter-spacing: 0.02em;
  overflow-wrap: anywhere;
}

.wallet__tx-id:hover { color: var(--accent); text-decoration: underline; }

.wallet__tx-time {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-faint);
  font-variant-numeric: tabular-nums;
}

.wallet__tx-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.wallet__tx-amt {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.wallet__tx-amt--in { color: var(--accent); }
.wallet__tx-amt--out { color: var(--warn); }

.wallet__tx-conf {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-faint);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 720px) {
  .wallet__card { padding: 22px 18px 24px; }
  .wallet__clock { flex-direction: column; align-items: flex-start; gap: 8px; }
}
</style>
