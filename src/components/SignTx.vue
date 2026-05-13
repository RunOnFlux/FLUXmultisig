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
        <label class="field__label">My multisig {{ chain === 'flux' ? 'redeem script' : 'witness script' }}</label>
        <textarea
          v-model="signedTx.redeemScript"
          :aria-label="chain === 'flux' ? 'Redeem Script' : 'Witness Script'"
          class="textarea"
          rows="3"
        />
        <div class="script-store">
          <select
            v-if="savedScripts.length"
            class="input input--small"
            :value="''"
            @change="onLoadSaved(($event.target as HTMLSelectElement).value)"
          >
            <option
              value=""
              disabled
            >
              Load saved…
            </option>
            <option
              v-for="r in savedScripts"
              :key="r.id"
              :value="r.id"
            >
              {{ r.label }}
            </option>
          </select>
          <button
            v-if="signedTx.redeemScript && isValidRedeem"
            class="btn btn--ghost btn--micro"
            @click="saveCurrentScript"
          >
            {{ matchedSaved ? `Rename "${matchedSaved.label}"…` : 'Save…' }}
          </button>
          <button
            v-if="matchedSaved"
            class="btn btn--ghost btn--micro"
            @click="deleteMatched"
          >
            Delete
          </button>
        </div>
      </div>
      <div class="field">
        <label class="field__label">Transaction to sign</label>
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
        <button
          class="btn btn--primary"
          @click="copyToClipboard(JSON.stringify(signedTxList))"
        >
          Copy all as JSON array
        </button>
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
interface Data { signedTx: SignState; signedTxList: string[]; loading: boolean; progress: Progress; storeRev: number }

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
    onLoadSaved(id: string) {
      if (!id) return;
      const found = this.savedScripts.find((r) => r.id === id);
      if (found) this.signedTx.redeemScript = found.script;
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
    deleteMatched() {
      if (!this.matchedSaved) return;
      // eslint-disable-next-line no-alert
      if (!window.confirm(`Delete saved script "${this.matchedSaved.label}"?`)) return;
      removeRedeemScript(this.matchedSaved.id);
      this.storeRev += 1;
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
