<template>
  <section class="panel">
    <header class="panel__head">
      <span class="panel__num">06</span>
      <h2 class="panel__title">
        Sign transaction
      </h2>
    </header>
    <p class="panel__desc">
      Sign a transaction from a multisig address with your private key.
      <span class="muted">(Fee is 0 satoshis on Flux.)</span>
    </p>
    <div class="panel__body">
      <div class="field">
        <label class="field__label">My private key</label>
        <div class="input-wrap">
          <input
            v-model="signedTx.privatekey"
            :type="showPrivateKey ? 'text' : 'password'"
            class="input"
          >
          <button
            class="btn btn--ghost btn--micro"
            @click="$emit('toggle-show-private-key')"
          >
            {{ showPrivateKey ? 'Hide' : 'Show' }}
          </button>
        </div>
      </div>
      <div class="field">
        <div class="field__head">
          <label class="field__label">My multisig {{ chain === 'flux' ? 'redeem script' : 'witness script' }}</label>
          <div class="field__head-actions">
            <button
              v-if="matchedSaved"
              class="match-chip"
              type="button"
              :title="`Loaded from saved: ${matchedSaved.label} — click to open library`"
              @click="libraryOpen = !libraryOpen"
            >
              <span class="match-chip__dot" />
              <span class="match-chip__from">using</span>
              <span class="match-chip__name">{{ matchedSaved.label }}</span>
            </button>
            <button
              v-else-if="isValidRedeem"
              class="save-now-btn"
              type="button"
              title="Save this redeem script to your local library"
              @click="saveCurrentScript"
            >
              <span class="save-now-btn__glyph">+</span>
              <span>Save now</span>
            </button>
            <button
              class="ab-toggle"
              :class="{ 'ab-toggle--open': libraryOpen }"
              :aria-pressed="libraryOpen"
              :aria-label="libraryOpen ? 'Hide saved scripts' : 'Show saved scripts'"
              type="button"
              @click="libraryOpen = !libraryOpen"
            >
              <svg
                class="ab-toggle__icon"
                viewBox="0 0 16 16"
                width="13"
                height="13"
                fill="none"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linecap="square"
                stroke-linejoin="miter"
                aria-hidden="true"
              >
                <rect
                  x="3"
                  y="2"
                  width="10.5"
                  height="12"
                />
                <line
                  x1="3"
                  y1="5"
                  x2="5.2"
                  y2="5"
                />
                <line
                  x1="3"
                  y1="8"
                  x2="5.2"
                  y2="8"
                />
                <line
                  x1="3"
                  y1="11"
                  x2="5.2"
                  y2="11"
                />
                <line
                  x1="7"
                  y1="6"
                  x2="11.5"
                  y2="6"
                />
                <line
                  x1="7"
                  y1="9"
                  x2="11.5"
                  y2="9"
                />
              </svg>
              <span class="ab-toggle__label">Saved</span>
              <span
                v-if="savedScripts.length"
                class="ab-toggle__count"
              >{{ savedScripts.length }}</span>
            </button>
          </div>
        </div>
        <textarea
          v-model="signedTx.redeemScript"
          :aria-label="chain === 'flux' ? 'Redeem Script' : 'Witness Script'"
          class="textarea"
          rows="3"
        />
        <transition name="lib-fade">
          <div
            v-if="libraryOpen"
            class="lib"
          >
            <div class="lib__head">
              <span class="lib__title">
                <span class="lib__bar" />
                My saved scripts
              </span>
              <span class="lib__count">
                <strong>{{ savedScripts.length }}</strong>
                <span class="lib__count-unit">{{ savedScripts.length === 1 ? 'saved' : 'saved' }}</span>
              </span>
            </div>
            <div
              v-if="!savedScripts.length"
              class="lib__empty"
            >
              <span class="lib__empty-mark">·</span>
              No saved scripts yet. Save the redeem script above to recall it later.
            </div>
            <ul
              v-else
              class="lib__list"
            >
              <li
                v-for="r in savedScripts"
                :key="r.id"
                class="lib__row"
                :class="{ 'lib__row--active': matchedSaved && matchedSaved.id === r.id }"
                tabindex="0"
                role="button"
                :aria-pressed="matchedSaved && matchedSaved.id === r.id"
                @click="loadById(r.id)"
                @keydown.enter.prevent="loadById(r.id)"
                @keydown.space.prevent="loadById(r.id)"
              >
                <span class="lib__mark" />
                <span class="lib__label">{{ r.label }}</span>
                <span
                  v-if="r.address"
                  class="lib__addr"
                >{{ truncateAddress(r.address) }}</span>
                <span
                  v-else
                  class="lib__addr lib__addr--bare"
                >{{ shortScript(r.script) }}</span>
                <button
                  class="lib__del"
                  :aria-label="`Delete ${r.label}`"
                  @click.stop="deleteById(r.id)"
                >
                  ×
                </button>
              </li>
            </ul>
            <div class="lib__foot">
              <button
                class="lib__save"
                :disabled="!isValidRedeem"
                @click="saveCurrentScript"
              >
                <span class="lib__save-glyph">{{ matchedSaved ? '✎' : '+' }}</span>
                <span>{{ matchedSaved ? `Rename ${matchedSaved.label}` : 'Save current' }}</span>
              </button>
              <span
                v-if="!isValidRedeem && !savedScripts.length"
                class="lib__hint"
              >paste a valid redeem script above</span>
              <span
                v-else-if="!isValidRedeem"
                class="lib__hint"
              >current script invalid</span>
            </div>
          </div>
        </transition>
      </div>
      <div class="field">
        <div class="field__head">
          <label class="field__label">Transaction to sign</label>
          <button
            class="link-btn"
            type="button"
            :disabled="importing"
            @click="importToSignField"
          >
            <span class="link-btn__glyph">↥</span>
            <span>{{ importing ? 'Importing…' : 'Import from file' }}</span>
            <span class="link-btn__ext">.json / .json.gz</span>
          </button>
        </div>
        <textarea
          v-model="signedTx.rawtx"
          aria-label="Transaction to sign"
          class="textarea"
          rows="4"
        />
        <div
          v-if="hexError"
          class="field__error"
        >
          {{ hexError }}
        </div>
        <div
          v-if="importError"
          class="field__error"
        >
          Import failed: {{ importError }}
        </div>
      </div>
      <div
        v-if="signatureStatus.length"
        class="sig-status"
      >
        <div class="sig-status__head">
          Signatures present
        </div>
        <div
          v-for="(g, i) in signatureStatusGroups"
          :key="i"
          class="sig-status__row"
        >
          <span class="sig-status__label">{{ groupLabel(g) }}</span>
          <template v-if="g.status.valid">
            <span class="sig-status__count">
              <strong>{{ g.status.sigs }}</strong> / {{ g.status.threshold }} of {{ g.status.pubkeys }}
            </span>
            <span
              v-if="g.status.sigs >= g.status.threshold"
              class="sig-status__complete"
            >✓ complete</span>
            <span
              v-else
              class="sig-status__hint"
            >{{ g.status.threshold - g.status.sigs }} more needed</span>
          </template>
          <span
            v-else
            class="sig-status__err"
          >unparseable</span>
        </div>
      </div>
      <div class="actions">
        <button
          class="btn btn--primary"
          :disabled="loading"
          @click="sign"
        >
          {{ actionLabel }}<span
            v-if="loading"
            class="dots"
          />
        </button>
      </div>
      <ProgressBar
        v-if="loading && progress.total > 1"
        :current="progress.current"
        :total="progress.total"
      />
      <div
        v-if="signedTx.hex"
        class="alert alert--err"
      >
        {{ signedTx.hex }}
      </div>
      <div
        v-if="signedTxList.length === 1"
        class="kv"
      >
        <div class="kv__row">
          <span class="kv__label">Signed transaction</span>
          <code class="kv__val">{{ truncateHex(signedTxList[0]) }}</code>
          <button
            class="btn btn--ghost btn--micro"
            @click="copyToClipboard(signedTxList[0])"
          >
            Copy
          </button>
        </div>
        <div class="kv__row tx-size">
          <span class="kv__label">Size</span>
          <span
            class="tx-size__val"
            :class="{ 'tx-size__val--warn': signedSizeStats.max > TX_SIZE_WARN_BYTES }"
          >{{ formatBytes(signedSizeStats.max) }}</span>
        </div>
        <div class="kv__row">
          <span class="kv__label">Export</span>
          <button
            class="btn btn--ghost btn--micro"
            @click="exportSignedJson"
          >
            JSON
          </button>
          <button
            class="btn btn--ghost btn--micro"
            @click="exportSignedGzip"
          >
            .json.gz
          </button>
        </div>
      </div>
      <div
        v-if="signedTxList.length > 1"
        class="multi"
      >
        <div class="tx-size tx-size--multi">
          <span>Avg size <strong>{{ formatBytes(signedSizeStats.avg) }}</strong></span>
          <span>Max <strong>{{ formatBytes(signedSizeStats.max) }}</strong></span>
          <span>Total <strong>{{ formatBytes(signedSizeStats.total) }}</strong></span>
          <span
            v-if="signedSizeStats.oversized"
            class="tx-size__warn"
          >⚠ {{ signedSizeStats.oversized }} over {{ formatBytes(TX_SIZE_WARN_BYTES) }}</span>
        </div>
        <div class="export-row">
          <button
            class="btn btn--primary"
            @click="copyToClipboard(JSON.stringify(signedTxList))"
          >
            Copy all as JSON array
          </button>
          <button
            class="btn btn--ghost"
            @click="exportSignedJson"
          >
            Export JSON
          </button>
          <button
            class="btn btn--ghost"
            @click="exportSignedGzip"
          >
            Export .json.gz
          </button>
        </div>
        <details class="expand">
          <summary class="expand__summary">
            <span class="expand__chevron">›</span>
            {{ signedTxList.length }} signed transactions
            <span class="expand__hint">click to expand</span>
          </summary>
          <div class="expand__body">
            <div
              v-for="(hex, index) in signedTxList"
              :key="index"
              class="kv__row"
            >
              <span class="kv__label">Tx {{ index }}</span>
              <code class="kv__val">{{ truncateHex(hex) }}</code>
              <span
                class="tx-size__val"
                :class="{ 'tx-size__val--warn': hexByteSize(hex) > TX_SIZE_WARN_BYTES }"
              >{{ formatBytes(hexByteSize(hex)) }}</span>
              <button
                class="btn btn--ghost btn--micro"
                @click="copyToClipboard(hex)"
              >
                Copy
              </button>
            </div>
          </div>
        </details>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import axios from 'axios';
import ProgressBar from './ProgressBar.vue';
import {
  bitgo,
  getNetwork,
  type Chain,
  MAINNET_FLUX_EXPLORER,
  TESTNET_FLUX_EXPLORER,
  MAINNET_BTC_BLOCKBOOK,
  TESTNET_BTC_BLOCKBOOK,
  normalizeUtxo,
} from '../composables/network';
import {
  getValue, hasValue, setValue, saveToStorage,
} from '../composables/utxoCache';
import { copyToClipboard } from '../composables/copyToast';
import { downloadBlob, gzipBlob, timestampSlug } from '../composables/download';
import { pickFile, readTextFromFile, normalizeTxImport } from '../composables/upload';
import {
  listRedeemScriptsFor,
  saveRedeemScript,
  removeRedeemScript,
  findByScript,
  type SavedRedeemScript,
} from '../composables/redeemScriptStore';
import {
  truncateHex,
  isValidHex,
  hexByteSize,
  formatBytes,
  txSizeStats,
  TX_SIZE_WARN_BYTES,
} from '../utils';

function reverseHex(hex: string): string {
  return Buffer.from(hex, 'hex').reverse().toString('hex');
}

interface SignState { rawtx: string; privatekey: string; redeemScript: string; hex: string }
type Phase = 'fetching' | 'signing' | '';
interface Progress { current: number; total: number; phase: Phase }
interface SigStatus { sigs: number; threshold: number; pubkeys: number; valid: boolean }
interface SigStatusGroup { start: number; end: number; status: SigStatus }
interface Data {
  signedTx: SignState;
  signedTxList: string[];
  loading: boolean;
  progress: Progress;
  storeRev: number;
  importing: boolean;
  importError: string;
  libraryOpen: boolean;
}

export default defineComponent({
  name: 'SignTx',
  components: { ProgressBar },
  props: {
    chain: { type: String as PropType<Chain>, required: true },
    isTestnet: { type: Boolean, required: true },
    showPrivateKey: { type: Boolean, required: true },
  },
  emits: ['toggle-show-private-key'],
  data(): Data {
    return {
      signedTx: {
        rawtx: '', privatekey: '', redeemScript: '', hex: '',
      },
      signedTxList: [],
      loading: false,
      progress: { current: 0, total: 0, phase: '' },
      storeRev: 0,
      importing: false,
      importError: '',
      libraryOpen: false,
    };
  },
  computed: {
    actionLabel(): string {
      if (!this.loading) return 'Sign';
      const verb = this.progress.phase === 'fetching' ? 'Fetching utxos' : 'Signing';
      if (this.progress.total > 1) return `${verb} ${this.progress.current}/${this.progress.total}`;
      return verb;
    },
    signatureStatus(): SigStatus[] {
      const raw = (this.signedTx.rawtx || '').trim();
      const rs = (this.signedTx.redeemScript || '').trim();
      if (!raw || !rs) {
        console.log('[sig-status] hidden: rawtx or redeemScript empty', { rawLen: raw.length, rsLen: rs.length });
        return [];
      }
      let txs: string[] = [raw];
      if (raw.startsWith('[')) {
        try {
          const arr = JSON.parse(raw);
          if (!Array.isArray(arr)) {
            console.log('[sig-status] hidden: rawtx parsed as JSON but not an array');
            return [];
          }
          txs = arr;
        } catch (e) {
          console.log('[sig-status] hidden: rawtx looks like JSON array but failed to parse', e);
          return [];
        }
      }
      let threshold = 0;
      let pubkeys = 0;
      try {
        const buf = Buffer.from(rs, 'hex');
        const decoded = bitgo.script.multisig.output.decode(buf);
        if (!decoded || !Array.isArray(decoded.pubKeys)) {
          console.log('[sig-status] hidden: redeem script does not decode as multisig');
          return [];
        }
        threshold = decoded.m;
        pubkeys = decoded.pubKeys.length;
        console.log('[sig-status] redeem script parsed', { m: threshold, n: pubkeys });
      } catch (e) {
        console.log('[sig-status] hidden: redeem script does not decode as multisig', e);
        return [];
      }
      const network = getNetwork(this.chain, this.isTestnet);
      const results: SigStatus[] = [];
      txs.forEach((txHex, txIdx) => {
        try {
          const tx = bitgo.Transaction.fromHex(txHex, network);
          const inputSigCounts: number[] = [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tx.ins.forEach((input: any, inputIdx: number) => {
            let count = 0;
            if (this.chain === 'bitcoin') {
              // Segwit: witness is `[<empty>, sig1, sig2, ..., witnessScript]`
              const witness = input.witness || [];
              const middle = witness.slice(1, -1);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              count = middle.filter((b: any) => b && b.length > 0).length;
              console.log(`[sig-status] tx ${txIdx} input ${inputIdx} witness count`, count, 'witness len:', witness.length);
            } else {
              // P2SH multisig scriptSig: `OP_0 sig1 sig2 ... redeemScript`
              const decompiled = bitgo.script.decompile(input.script);
              if (decompiled && decompiled.length >= 2) {
                const middle = decompiled.slice(1, -1);
                // Real sigs are DER-encoded buffers; placeholders are empty
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                count = middle.filter((item: any) => Buffer.isBuffer(item) && item.length > 1).length;
              }
              console.log(`[sig-status] tx ${txIdx} input ${inputIdx} script decompiled len:`, decompiled ? decompiled.length : 0, 'count:', count);
            }
            inputSigCounts.push(count);
          });
          // Worst-case across inputs — they all must reach threshold.
          const sigs = inputSigCounts.length ? Math.min(...inputSigCounts) : 0;
          console.log(`[sig-status] tx ${txIdx} -> sigs=${sigs} threshold=${threshold} pubkeys=${pubkeys}`);
          results.push({
            sigs, threshold, pubkeys, valid: true,
          });
        } catch (e) {
          console.log(`[sig-status] tx ${txIdx} parse error`, e);
          results.push({
            sigs: 0, threshold, pubkeys, valid: false,
          });
        }
      });
      console.log('[sig-status] results', results);
      return results;
    },
    savedScripts(): SavedRedeemScript[] {
      // read storeRev so this recomputes after save/delete
      const rev = this.storeRev;
      return rev >= 0 ? listRedeemScriptsFor(this.chain, this.isTestnet) : [];
    },
    matchedSaved(): SavedRedeemScript | undefined {
      const rev = this.storeRev;
      if (rev < 0) return undefined;
      const rs = (this.signedTx.redeemScript || '').trim();
      if (!rs) return undefined;
      return findByScript(rs, this.chain, this.isTestnet);
    },
    isValidRedeem(): boolean {
      const rs = (this.signedTx.redeemScript || '').trim();
      if (!rs) return false;
      try {
        const decoded = bitgo.script.multisig.output.decode(Buffer.from(rs, 'hex'));
        return !!decoded && Array.isArray(decoded.pubKeys);
      } catch (_e) {
        return false;
      }
    },
    signatureStatusGroups(): SigStatusGroup[] {
      const list = this.signatureStatus;
      if (!list.length) return [];
      const key = (s: SigStatus): string => `${s.valid}|${s.sigs}|${s.threshold}|${s.pubkeys}`;
      const groups: SigStatusGroup[] = [];
      let start = 0;
      for (let i = 1; i <= list.length; i += 1) {
        if (i === list.length || key(list[i]) !== key(list[start])) {
          groups.push({ start, end: i - 1, status: list[start] });
          start = i;
        }
      }
      return groups;
    },
    signedSizeStats() {
      return txSizeStats(this.signedTxList);
    },
    TX_SIZE_WARN_BYTES() {
      return TX_SIZE_WARN_BYTES;
    },
    hexError(): string {
      const raw = (this.signedTx.rawtx || '').trim();
      if (!raw) return '';
      if (raw.startsWith('[')) {
        try {
          const arr = JSON.parse(raw);
          if (!Array.isArray(arr)) return 'Expected JSON array of hex strings';
          if (!arr.every((s) => isValidHex(s))) return 'Array contains invalid hex';
          return '';
        } catch (_e) {
          return 'Invalid JSON array';
        }
      }
      return isValidHex(raw) ? '' : 'Invalid hex';
    },
  },
  methods: {
    copyToClipboard,
    truncateHex,
    formatBytes,
    hexByteSize,
    loadById(id: string): void {
      const found = this.savedScripts.find((r) => r.id === id);
      if (found) this.signedTx.redeemScript = found.script;
    },
    deleteById(id: string): void {
      const target = this.savedScripts.find((r) => r.id === id);
      if (!target) return;
      // eslint-disable-next-line no-alert
      if (!window.confirm(`Delete saved script "${target.label}"?`)) return;
      removeRedeemScript(id);
      this.storeRev += 1;
    },
    truncateAddress(addr: string): string {
      if (!addr || addr.length <= 14) return addr;
      return `${addr.slice(0, 7)}…${addr.slice(-5)}`;
    },
    shortScript(script: string): string {
      if (!script) return '';
      return `${script.slice(0, 6)}…${script.slice(-4)}`;
    },
    async importToSignField(): Promise<void> {
      this.importError = '';
      this.importing = true;
      try {
        const file = await pickFile();
        if (!file) return;
        const text = await readTextFromFile(file);
        this.signedTx.rawtx = normalizeTxImport(text);
      } catch (e) {
        this.importError = e instanceof Error ? e.message : String(e);
      } finally {
        this.importing = false;
      }
    },
    saveCurrentScript() {
      const script = (this.signedTx.redeemScript || '').trim();
      if (!script) return;
      const existing = findByScript(script, this.chain, this.isTestnet);
      const suggested = existing ? existing.label : '';
      // eslint-disable-next-line no-alert
      const label = window.prompt(
        'Label for this redeem script:\n\n'
        + 'Note: this is saved only in this browser\'s local storage. '
        + 'Always keep an external backup of your redeem script — '
        + 'clearing browser data will delete it from here.',
        suggested,
      );
      if (!label) return;
      saveRedeemScript({
        label: label.trim(),
        script,
        chain: this.chain,
        isTestnet: this.isTestnet,
      });
      this.storeRev += 1;
    },
    exportFilename(ext: string): string {
      const env = this.isTestnet ? 'testnet' : 'mainnet';
      return `signed-tx-${this.chain}-${env}-${timestampSlug()}.${ext}`;
    },
    exportSignedJson() {
      if (!this.signedTxList.length) return;
      const payload = JSON.stringify(this.signedTxList, null, 2);
      downloadBlob(
        new Blob([payload], { type: 'application/json' }),
        this.exportFilename('json'),
      );
    },
    async exportSignedGzip() {
      if (!this.signedTxList.length) return;
      const payload = JSON.stringify(this.signedTxList);
      const blob = await gzipBlob(payload);
      downloadBlob(blob, this.exportFilename('json.gz'));
    },
    groupLabel(g: SigStatusGroup): string {
      if (this.signatureStatus.length <= 1) return '';
      if (g.start === g.end) return `Tx ${g.start}`;
      return `Tx ${g.start} - Tx ${g.end}`;
    },
    fluxExplorer(): string {
      return this.isTestnet ? TESTNET_FLUX_EXPLORER : MAINNET_FLUX_EXPLORER;
    },
    btcBlockbook(): string {
      return this.isTestnet ? TESTNET_BTC_BLOCKBOOK : MAINNET_BTC_BLOCKBOOK;
    },
    async fetchInputValues(txs: string[]): Promise<void> {
      const network = getNetwork(this.chain, this.isTestnet);
      for (let t = 0; t < txs.length; t += 1) {
        this.progress.current = t + 1;
        // eslint-disable-next-line no-await-in-loop
        if (t > 0) await new Promise<void>((r) => { setTimeout(r, 0); });
        const tx = bitgo.Transaction.fromHex(txs[t], network);
        let quickLoad = true;
        /* eslint-disable no-await-in-loop, @typescript-eslint/no-explicit-any */
        for (let i = 0; i < tx.ins.length; i += 1) {
          const hash = reverseHex(tx.ins[i].hash.toString('hex'));
          const { index } = tx.ins[i];
          // eslint-disable-next-line no-continue
          if (hasValue(hash + index)) continue;
          if (quickLoad) {
            quickLoad = false;
            const baseTx = this.chain === 'flux'
              ? await axios.get(`${this.fluxExplorer()}/api/tx/${hash}`)
              : await axios.get(`${this.btcBlockbook()}/api/tx/${hash}`);
            const addr = baseTx.data.vout[index].scriptPubKey.addresses[0];
            const utx = this.chain === 'flux'
              ? await axios.get(`${this.fluxExplorer()}/api/addr/${addr}/utxo`)
              : await axios.get(`${this.btcBlockbook()}/api/v2/utxo/${addr}`);
            const utxos: { txid: string; vout: number; satoshis: number }[] = utx.data.map((x: any) => normalizeUtxo(this.chain, x));
            utxos.forEach((u) => { setValue(u.txid + u.vout, u.satoshis); });
            if (!hasValue(hash + index)) {
              setValue(hash + index, Math.round(Number(baseTx.data.vout[index].value) * 1e8));
            }
          } else {
            const baseTx = this.chain === 'flux'
              ? await axios.get(`${this.fluxExplorer()}/api/tx/${hash}`)
              : await axios.get(`${this.btcBlockbook()}/api/tx/${hash}`);
            setValue(hash + index, Math.round(Number(baseTx.data.vout[index].value) * 1e8));
          }
        }
        /* eslint-enable no-await-in-loop, @typescript-eslint/no-explicit-any */
      }
    },
    async signAllLocally(txs: string[]): Promise<string[]> {
      const network = getNetwork(this.chain, this.isTestnet);
      const hashType = bitgo.Transaction.SIGHASH_ALL;
      let keyPair;
      try {
        keyPair = bitgo.ECPair.fromWIF(this.signedTx.privatekey, network);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (/checksum/i.test(msg)) throw new Error('Invalid private key checksum');
        throw e;
      }
      const out: string[] = [];
      for (let t = 0; t < txs.length; t += 1) {
        this.progress.current = t + 1;
        // eslint-disable-next-line no-await-in-loop
        if (t > 0) await new Promise<void>((r) => { setTimeout(r, 0); });
        console.log('Signing tx:', t + 1, '/', txs.length);
        const txb = bitgo.TransactionBuilder.fromTransaction(
          bitgo.Transaction.fromHex(txs[t], network),
          network,
        );
        for (let i = 0; i < txb.inputs.length; i += 1) {
          const hash = reverseHex(txb.tx.ins[i].hash.toString('hex'));
          const { index } = txb.tx.ins[i];
          const value = Math.round(Number(getValue(hash + index) || 0));
          txb.sign(
            i,
            keyPair,
            this.chain !== 'bitcoin' ? Buffer.from(this.signedTx.redeemScript, 'hex') : '',
            hashType,
            value,
            this.chain === 'bitcoin' ? Buffer.from(this.signedTx.redeemScript, 'hex') : '',
          );
        }
        out.push(txb.buildIncomplete().toHex());
      }
      return out;
    },
    async sign(): Promise<void> {
      this.loading = true;
      this.progress = { current: 0, total: 0, phase: '' };
      try {
        this.signedTx.hex = '';
        this.signedTxList = [];
        const txhex = this.signedTx.rawtx.trim();
        let txs: string[] = [txhex];
        if (txhex.startsWith('[')) {
          txs = JSON.parse(txhex);
        }
        this.progress.total = txs.length;

        // Phase 1 — fetch any utxo values we don't already have cached.
        // Each tx yields to the event loop so the progress label can repaint.
        this.progress.phase = 'fetching';
        this.progress.current = 0;
        await this.fetchInputValues(txs);

        // Phase 2 — sign each tx locally from cached values. No network here.
        this.progress.phase = 'signing';
        this.progress.current = 0;
        this.signedTxList = await this.signAllLocally(txs);

        console.log('All transactions signed');
        saveToStorage();
      } catch (e) {
        console.log(e);
        this.signedTx.hex = e instanceof Error ? e.message : String(e);
      } finally {
        this.loading = false;
      }
    },
  },
});
</script>
