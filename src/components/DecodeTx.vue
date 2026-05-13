<template>
  <section class="panel">
    <header class="panel__head">
      <span class="panel__num">05</span>
      <h2 class="panel__title">
        Decode transaction
      </h2>
    </header>
    <p class="panel__desc">
      Display a human-readable summary of one transaction or a JSON array of transactions.
    </p>
    <div class="panel__body">
      <div class="field">
        <div class="field__head">
          <label class="field__label">Transaction to decode</label>
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
          v-model="decodeRawHex"
          aria-label="Transaction to decode"
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
      <div class="actions">
        <button
          class="btn btn--primary"
          :disabled="!!hexError"
          @click="decode"
        >
          {{ decodeLabel }}
        </button>
      </div>
      <div
        v-if="decoded.length === 1"
        class="decode-single"
      >
        <pre
          v-if="!decoded[0].error"
          class="output"
        >{{ decoded[0].info }}</pre>
        <pre
          v-else
          class="output output--err"
        >{{ decoded[0].error }}</pre>
      </div>
      <div
        v-if="decoded.length > 1"
        class="decode-multi"
      >
        <div class="decode-multi__head">
          <span class="decode-multi__bar" />
          <span>
            Decoded <strong>{{ decoded.length }}</strong>
            transactions
          </span>
          <span
            v-if="errorCount"
            class="decode-multi__err"
          >· <strong>{{ errorCount }}</strong> failed</span>
        </div>
        <div
          v-for="d in decoded"
          :key="d.index"
          class="decode-multi__block"
        >
          <span class="decode-multi__label">Tx {{ d.index }}</span>
          <pre
            v-if="!d.error"
            class="output"
          >{{ d.info }}</pre>
          <pre
            v-else
            class="output output--err"
          >{{ d.error }}</pre>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { bitgo, getNetwork, type Chain } from '../composables/network';
import { pickFile, readTextFromFile, normalizeTxImport } from '../composables/upload';
import { isValidHex } from '../utils';

interface DecodeOutput { amount: string; address: string }
interface DecodedTx { index: number; info: string; error: string }

interface Data {
  decodeRawHex: string;
  decoded: DecodedTx[];
  importing: boolean;
  importError: string;
}

export default defineComponent({
  name: 'DecodeTx',
  props: {
    chain: { type: String as PropType<Chain>, required: true },
    isTestnet: { type: Boolean, required: true },
  },
  data(): Data {
    return {
      decodeRawHex: '',
      decoded: [],
      importing: false,
      importError: '',
    };
  },
  computed: {
    parsedTxs(): { txs: string[]; error: string } {
      const raw = (this.decodeRawHex || '').trim();
      if (!raw) return { txs: [], error: '' };
      if (raw.startsWith('[')) {
        try {
          const arr = JSON.parse(raw);
          if (!Array.isArray(arr)) return { txs: [], error: 'Expected JSON array of hex strings' };
          if (!arr.every((s) => isValidHex(s))) return { txs: [], error: 'Array contains invalid hex' };
          return { txs: arr, error: '' };
        } catch (_e) {
          return { txs: [], error: 'Invalid JSON array' };
        }
      }
      return isValidHex(raw) ? { txs: [raw], error: '' } : { txs: [], error: 'Invalid hex' };
    },
    hexError(): string {
      return this.parsedTxs.error;
    },
    decodeLabel(): string {
      const n = this.parsedTxs.txs.length;
      if (n > 1) return `Decode ${n} transactions`;
      return 'Decode';
    },
    errorCount(): number {
      return this.decoded.filter((d) => d.error).length;
    },
  },
  methods: {
    async importFromFile(): Promise<void> {
      this.importError = '';
      this.importing = true;
      try {
        const file = await pickFile();
        if (!file) return;
        const text = await readTextFromFile(file);
        this.decodeRawHex = normalizeTxImport(text);
      } catch (e) {
        this.importError = e instanceof Error ? e.message : String(e);
      } finally {
        this.importing = false;
      }
    },
    decodeOne(hex: string): { info: string; error: string } {
      try {
        const network = getNetwork(this.chain, this.isTestnet);
        const tx = bitgo.Transaction.fromHex(hex, network);
        const outputs: DecodeOutput[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tx.outs.forEach((out: any) => {
          // OP_RETURN outputs have no recipient address
          if (out.script[0] === 0x6a) return;
          try {
            outputs.push({
              amount: Number(out.value * 1e-8).toFixed(8),
              address: bitgo.address.fromOutputScript(out.script, network),
            });
          } catch (_e) {
            // Unknown script type; skip
          }
        });
        const unit = this.chain === 'flux' ? 'FLUX' : 'BTC';
        let str = `Spending ${tx.ins.length} input(s).`;
        outputs.forEach((output) => {
          str += `\nSending ${output.amount} ${unit} to ${output.address}`;
        });
        return { info: str, error: '' };
      } catch (e) {
        return { info: '', error: e instanceof Error ? e.message : String(e) };
      }
    },
    decode(): void {
      this.decoded = this.parsedTxs.txs.map((hex, index) => {
        const { info, error } = this.decodeOne(hex);
        return { index, info, error };
      });
    },
  },
});
</script>
