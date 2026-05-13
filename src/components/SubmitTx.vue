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
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import axios from 'axios';
import ProgressBar from './ProgressBar.vue';
import {
  TESTNET_FLUX_EXPLORER,
  MAINNET_BTC_BLOCKBOOK,
  TESTNET_BTC_BLOCKBOOK,
  type Chain,
} from '../composables/network';
import { copyToClipboard } from '../composables/copyToast';
import { pickFile, readTextFromFile, normalizeTxImport } from '../composables/upload';

interface SubmitResult { ok: boolean; status: number | null; data: unknown }
interface Progress { current: number; total: number }
interface Data {
  submitedTx: { rawtx: string; hex: string };
  submitedTxList: SubmitResult[];
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
    async importFromFile(): Promise<void> {
      this.importError = '';
      this.importing = true;
      try {
        const file = await pickFile();
        if (!file) return;
        const text = await readTextFromFile(file);
        this.submitedTx.rawtx = normalizeTxImport(text);
      } catch (e) {
        this.importError = e instanceof Error ? e.message : String(e);
      } finally {
        this.importing = false;
      }
    },
    clear(): void {
      this.submitedTx = { rawtx: '', hex: '' };
      this.submitedTxList = [];
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
        const txhex = this.submitedTx.rawtx.trim();
        let txs: string[] = [txhex];
        if (txhex.startsWith('[')) {
          txs = JSON.parse(txhex);
        }
        this.progress.total = txs.length;
        let completed = 0;
        const bumpProgress = () => {
          completed += 1;
          this.progress.current = completed;
        };
        const rawPromises = txs.map((tx, index) => {
          if (this.chain === 'flux' && !this.isTestnet) {
            console.log('Submitting tx:', index + 1, '/', txs.length);
            return axios({
              method: 'post',
              url: 'https://api.runonflux.io/daemon/sendrawtransaction/',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              data: { hexstring: tx, allowhighfees: true },
            });
          }
          if (this.chain === 'flux' && this.isTestnet) {
            console.log('Submitting tx:', index + 1, '/', txs.length);
            return axios({
              method: 'post',
              url: `${TESTNET_FLUX_EXPLORER}/api/tx/send`,
              data: { rawtx: tx },
            });
          }
          console.log('Submitting tx:', index + 1, '/', txs.length);
          const url = this.isTestnet
            ? `${TESTNET_BTC_BLOCKBOOK}/api/v2/sendtx/`
            : `${MAINNET_BTC_BLOCKBOOK}/api/v2/sendtx/`;
          return axios({ method: 'post', url, data: tx });
        });
        // Bump the counter every time a request settles, regardless of order.
        const promises = rawPromises.map((p) => p.finally(bumpProgress));
        const results = await Promise.allSettled(promises);
        this.submitedTxList = results.map((result): SubmitResult => {
          if (result.status === 'fulfilled') {
            const body = result.value.data;
            const fluxStyleError = body && typeof body === 'object' && (body as { status?: string }).status === 'error';
            return {
              ok: !fluxStyleError,
              status: result.value.status,
              data: body,
            };
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const err = result.reason as any;
          const httpStatus = (err && err.response && err.response.status) || null;
          const errData = (err && err.response && err.response.data) || (err && err.message) || String(err);
          return { ok: false, status: httpStatus, data: errData };
        });
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
