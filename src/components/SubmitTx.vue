<template>
  <section class="panel">
    <header class="panel__head">
      <span class="panel__num">08</span>
      <h2 class="panel__title">
        Submit transaction
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
      Broadcast one or more finalized transactions to the network.
    </p>
    <div class="panel__body">
      <div class="field">
        <div class="field__head">
          <label class="field__label">Transaction to submit</label>
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
          v-model="submitedTx.rawtx"
          aria-label="Transaction to submit"
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
          @click="submit"
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
        v-if="submitedTx.hex"
        class="alert alert--err"
      >
        {{ submitedTx.hex }}
      </div>
      <div
        v-for="(item, index) in submitedTxList"
        :key="index"
        class="response-list__row"
      >
        <span class="response-list__label">
          Response{{ submitedTxList.length > 1 ? ` ${index}` : '' }}
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
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import ProgressBar from './ProgressBar.vue';
import {
  bitgo,
  getNetwork,
  txExplorerUrl,
  type Chain,
} from '../composables/network';
import { broadcastMany, type SubmitResult } from '../composables/broadcast';
import { copyToClipboard } from '../composables/copyToast';
import { pickFile, readTextFromFile, normalizeTxImport } from '../composables/upload';

interface Progress { current: number; total: number }
interface Data {
  submitedTx: { rawtx: string; hex: string };
  submitedTxList: SubmitResult[];
  submittedTxids: string[];
  loading: boolean;
  progress: Progress;
  importing: boolean;
  importError: string;
}

export default defineComponent({
  name: 'SubmitTx',
  components: { ProgressBar },
  props: {
    chain: { type: String as PropType<Chain>, required: true },
    isTestnet: { type: Boolean, required: true },
  },
  data(): Data {
    return {
      submitedTx: { rawtx: '', hex: '' },
      submitedTxList: [],
      submittedTxids: [],
      loading: false,
      progress: { current: 0, total: 0 },
      importing: false,
      importError: '',
    };
  },
  computed: {
    actionLabel(): string {
      if (!this.loading) return 'Submit';
      if (this.progress.total > 1) return `Submitting ${this.progress.current}/${this.progress.total}`;
      return 'Submitting';
    },
  },
  methods: {
    copyToClipboard,
    txExplorerUrl,
    async importFromFile(): Promise<void> {
      this.importError = '';
      this.importing = true;
      try {
        const file = await pickFile();
        if (!file) return;
        this.submitedTx.rawtx = normalizeTxImport(await readTextFromFile(file));
      } catch (e) {
        this.importError = e instanceof Error ? e.message : String(e);
      } finally {
        this.importing = false;
      }
    },
    clear(): void {
      this.submitedTx = { rawtx: '', hex: '' };
      this.submitedTxList = [];
      this.submittedTxids = [];
      this.loading = false;
      this.progress = { current: 0, total: 0 };
      this.importing = false;
      this.importError = '';
    },
    async submit(): Promise<void> {
      this.loading = true;
      this.progress = { current: 0, total: 0 };
      try {
        this.submitedTx.hex = '';
        this.submitedTxList = [];
        this.submittedTxids = [];
        const txhex = this.submitedTx.rawtx.trim();
        let txs: string[] = [txhex];
        if (txhex.startsWith('[')) {
          txs = JSON.parse(txhex);
        }
        this.progress.total = txs.length;
        // Pre-compute txids client-side so the Explorer URL works even when
        // the broadcast endpoint returns a non-txid body (e.g. Flux daemon
        // wraps the result in { status, data }).
        const network = getNetwork(this.chain, this.isTestnet);
        this.submittedTxids = txs.map((tx) => {
          try {
            return bitgo.Transaction.fromHex(tx, network).getId();
          } catch (_e) {
            return '';
          }
        });
        this.submitedTxList = await broadcastMany(
          this.chain,
          this.isTestnet,
          txs,
          (current) => { this.progress.current = current; },
        );
        const okCount = this.submitedTxList.filter((x) => x.ok).length;
        console.log(`Submitted ${okCount}/${this.submitedTxList.length} transactions`);
      } catch (e) {
        console.log(e);
        this.submitedTx.hex = e instanceof Error ? e.message : String(e);
      } finally {
        this.loading = false;
      }
    },
  },
});
</script>
