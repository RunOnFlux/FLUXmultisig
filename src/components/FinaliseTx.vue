<template>
  <section class="panel">
    <header class="panel__head">
      <span class="panel__num">07</span>
      <h2 class="panel__title">
        Finalise transaction
      </h2>
      <button
        class="section-clear"
        type="button"
        title="Clear this section"
        @click="clear"
      >
        <span class="section-clear__glyph">↺</span>
        <span>Clear</span>
      </button>
    </header>
    <p class="panel__desc">
      Combine collected signatures into a final, broadcast-ready transaction.
    </p>
    <div class="panel__body">
      <div class="field">
        <div class="field__head">
          <label class="field__label">Transaction to finalise</label>
          <button
            class="link-btn"
            type="button"
            :disabled="importing"
            @click="importFromFile"
          >
            <span class="link-btn__glyph">↥</span>
            <span>{{ importing ? 'Importing…' : 'Import from file' }}</span>
            <span class="link-btn__ext">.json / .json.gz</span>
          </button>
        </div>
        <textarea
          v-model="finalisedTx.rawtx"
          aria-label="Transaction to finalise"
          class="textarea"
          rows="4"
        />
        <div
          v-if="importError"
          class="field__error"
        >
          Import failed: {{ importError }}
        </div>
      </div>
      <div class="actions">
        <button
          class="btn btn--primary"
          :disabled="loading"
          @click="finalise"
        >
          {{ actionLabel }}<span
            v-if="loading"
            class="dots"
          />
        </button>
        <button
          v-if="finalisedTxList.length"
          class="btn btn--primary"
          :disabled="submitting || loading"
          @click="submit"
        >
          {{ submitActionLabel }}<span
            v-if="submitting"
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
        v-if="finalisedTx.hex"
        class="alert alert--err"
      >
        {{ finalisedTx.hex }}
      </div>
      <div
        v-if="finalisedTxList.length === 1"
        class="kv"
      >
        <div class="kv__row">
          <span class="kv__label">Finalised transaction</span>
          <code class="kv__val">{{ truncateHex(finalisedTxList[0]) }}</code>
          <button
            class="btn btn--ghost btn--micro"
            @click="copyToClipboard(finalisedTxList[0])"
          >
            Copy
          </button>
        </div>
        <div class="kv__row tx-size">
          <span class="kv__label">Size</span>
          <span
            class="tx-size__val"
            :class="{ 'tx-size__val--warn': sizeStats.max > TX_SIZE_WARN_BYTES }"
          >{{ formatBytes(sizeStats.max) }}</span>
        </div>
        <div class="kv__row">
          <span class="kv__label">Export</span>
          <button
            class="btn btn--ghost btn--micro"
            @click="exportJson"
          >
            JSON
          </button>
          <button
            class="btn btn--ghost btn--micro"
            @click="exportGzip"
          >
            .json.gz
          </button>
        </div>
      </div>
      <ProgressBar
        v-if="submitting && submitProgress.total > 1"
        :current="submitProgress.current"
        :total="submitProgress.total"
      />
      <div
        v-if="submitError"
        class="alert alert--err"
      >
        {{ submitError }}
      </div>
      <div
        v-for="(item, index) in submitResults"
        :key="`submit-${index}`"
        class="response-list__row"
      >
        <span class="response-list__label">
          Submit{{ submitResults.length > 1 ? ` ${index}` : '' }}
        </span>
        <span
          class="response-list__status"
          :class="item.ok ? 'response-list__status--ok' : 'response-list__status--fail'"
        >
          <span class="response-list__dot" />
          <span class="response-list__code">{{ item.status || '—' }}</span>
          <span>{{ item.ok ? 'OK' : 'Failed' }}</span>
        </span>
        <button
          class="btn btn--ghost btn--micro"
          @click="copyToClipboard(typeof item.data === 'string' ? item.data : JSON.stringify(item.data))"
        >
          Copy
        </button>
        <template v-if="item.ok && submittedTxids[index]">
          <span class="response-list__explorer-label">Explorer URL</span>
          <button
            class="btn btn--ghost btn--micro"
            @click="copyToClipboard(txExplorerUrl(chain, isTestnet, submittedTxids[index]))"
          >
            Copy
          </button>
          <a
            class="btn btn--ghost btn--micro"
            :href="txExplorerUrl(chain, isTestnet, submittedTxids[index])"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open
          </a>
        </template>
      </div>
      <div
        v-if="finalisedTxList.length > 1"
        class="multi"
      >
        <div class="tx-size tx-size--multi">
          <span>Avg size <strong>{{ formatBytes(sizeStats.avg) }}</strong></span>
          <span>Max <strong>{{ formatBytes(sizeStats.max) }}</strong></span>
          <span>Total <strong>{{ formatBytes(sizeStats.total) }}</strong></span>
          <span
            v-if="sizeStats.oversized"
            class="tx-size__warn"
          >⚠ {{ sizeStats.oversized }} over {{ formatBytes(TX_SIZE_WARN_BYTES) }}</span>
        </div>
        <div class="export-row">
          <button
            class="btn btn--primary"
            @click="copyToClipboard(JSON.stringify(finalisedTxList))"
          >
            Copy all as JSON array
          </button>
          <button
            class="btn btn--ghost"
            @click="exportJson"
          >
            Export JSON
          </button>
          <button
            class="btn btn--ghost"
            @click="exportGzip"
          >
            Export .json.gz
          </button>
        </div>
        <details class="expand">
          <summary class="expand__summary">
            <span class="expand__chevron">›</span>
            {{ finalisedTxList.length }} finalised transactions
            <span class="expand__hint">click to expand</span>
          </summary>
          <div class="expand__body">
            <div
              v-for="(hex, index) in finalisedTxList"
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
import {
  bitgo, getNetwork, txExplorerUrl, type Chain,
} from '../composables/network';
import { broadcastMany, type SubmitResult } from '../composables/broadcast';
import ProgressBar from './ProgressBar.vue';
import { copyToClipboard } from '../composables/copyToast';
import { downloadBlob, gzipBlob, timestampSlug } from '../composables/download';
import { pickFile, readTextFromFile, normalizeTxImport } from '../composables/upload';
import {
  truncateHex,
  hexByteSize,
  formatBytes,
  txSizeStats,
  TX_SIZE_WARN_BYTES,
} from '../utils';

interface Progress { current: number; total: number }

interface Data {
  finalisedTx: { rawtx: string; hex: string };
  finalisedTxList: string[];
  loading: boolean;
  progress: Progress;
  importing: boolean;
  importError: string;
  submitting: boolean;
  submitProgress: Progress;
  submitResults: SubmitResult[];
  submittedTxids: string[];
  submitError: string;
}

export default defineComponent({
  name: 'FinaliseTx',
  components: { ProgressBar },
  props: {
    chain: { type: String as PropType<Chain>, required: true },
    isTestnet: { type: Boolean, required: true },
  },
  data(): Data {
    return {
      finalisedTx: { rawtx: '', hex: '' },
      finalisedTxList: [],
      loading: false,
      progress: { current: 0, total: 0 },
      importing: false,
      importError: '',
      submitting: false,
      submitProgress: { current: 0, total: 0 },
      submitResults: [],
      submittedTxids: [],
      submitError: '',
    };
  },
  computed: {
    actionLabel(): string {
      if (!this.loading) return 'Finalise';
      if (this.progress.total > 1) return `Finalising ${this.progress.current}/${this.progress.total}`;
      return 'Finalising';
    },
    submitActionLabel(): string {
      if (!this.submitting) return 'Submit';
      if (this.submitProgress.total > 1) return `Submitting ${this.submitProgress.current}/${this.submitProgress.total}`;
      return 'Submitting';
    },
    sizeStats() {
      return txSizeStats(this.finalisedTxList);
    },
    TX_SIZE_WARN_BYTES() {
      return TX_SIZE_WARN_BYTES;
    },
  },
  methods: {
    copyToClipboard,
    truncateHex,
    formatBytes,
    hexByteSize,
    txExplorerUrl,
    async importFromFile(): Promise<void> {
      this.importError = '';
      this.importing = true;
      try {
        const file = await pickFile();
        if (!file) return;
        const text = await readTextFromFile(file);
        this.finalisedTx.rawtx = normalizeTxImport(text);
      } catch (e) {
        this.importError = e instanceof Error ? e.message : String(e);
      } finally {
        this.importing = false;
      }
    },
    exportFilename(ext: string): string {
      const env = this.isTestnet ? 'testnet' : 'mainnet';
      return `finalised-tx-${this.chain}-${env}-${timestampSlug()}.${ext}`;
    },
    exportJson(): void {
      if (!this.finalisedTxList.length) return;
      const payload = JSON.stringify(this.finalisedTxList, null, 2);
      downloadBlob(
        new Blob([payload], { type: 'application/json' }),
        this.exportFilename('json'),
      );
    },
    async exportGzip(): Promise<void> {
      if (!this.finalisedTxList.length) return;
      const payload = JSON.stringify(this.finalisedTxList);
      const blob = await gzipBlob(payload);
      downloadBlob(blob, this.exportFilename('json.gz'));
    },
    clear(): void {
      this.finalisedTx = { rawtx: '', hex: '' };
      this.finalisedTxList = [];
      this.loading = false;
      this.progress = { current: 0, total: 0 };
      this.importing = false;
      this.importError = '';
      this.submitting = false;
      this.submitProgress = { current: 0, total: 0 };
      this.submitResults = [];
      this.submittedTxids = [];
      this.submitError = '';
    },
    async finalise(): Promise<void> {
      this.loading = true;
      this.progress = { current: 0, total: 0 };
      // Reset any prior submit results when starting a fresh finalise pass.
      this.submitResults = [];
      this.submittedTxids = [];
      this.submitError = '';
      try {
        this.finalisedTx.hex = '';
        this.finalisedTxList = [];
        const network = getNetwork(this.chain, this.isTestnet);
        const txhex = this.finalisedTx.rawtx.trim();
        let txs: string[] = [txhex];
        if (txhex.startsWith('[')) {
          txs = JSON.parse(txhex);
        }
        this.progress.total = txs.length;
        const finalizedTxs: string[] = [];
        for (let t = 0; t < txs.length; t += 1) {
          this.progress.current = t + 1;
          // Yield so the progress bar can repaint between sync iterations.
          if (t > 0) await new Promise<void>((r) => { setTimeout(r, 0); });
          console.log('Finalizing tx:', t + 1, '/', txs.length);
          const txb = bitgo.TransactionBuilder.fromTransaction(bitgo.Transaction.fromHex(txs[t], network), network);
          const tx = txb.build();
          finalizedTxs.push(tx.toHex());
        }
        this.finalisedTxList = finalizedTxs;
        console.log('All transactions finalized');
      } catch (e) {
        console.log(e);
        this.finalisedTx.hex = e instanceof Error ? e.message : String(e);
      } finally {
        this.loading = false;
      }
    },
    async submit(): Promise<void> {
      if (!this.finalisedTxList.length) return;
      this.submitting = true;
      this.submitError = '';
      this.submitResults = [];
      this.submittedTxids = [];
      this.submitProgress = { current: 0, total: this.finalisedTxList.length };
      try {
        const network = getNetwork(this.chain, this.isTestnet);
        this.submittedTxids = this.finalisedTxList.map((hex) => {
          try {
            return bitgo.Transaction.fromHex(hex, network).getId();
          } catch (_e) {
            return '';
          }
        });
        this.submitResults = await broadcastMany(
          this.chain,
          this.isTestnet,
          this.finalisedTxList,
          (current) => { this.submitProgress.current = current; },
        );
        const okCount = this.submitResults.filter((x) => x.ok).length;
        console.log(`Submitted ${okCount}/${this.submitResults.length} transactions`);
      } catch (e) {
        console.log(e);
        this.submitError = e instanceof Error ? e.message : String(e);
      } finally {
        this.submitting = false;
      }
    },
  },
});
</script>
