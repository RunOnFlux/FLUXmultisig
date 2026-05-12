<template>
  <section class="panel">
    <header class="panel__head">
      <span class="panel__num">05</span>
      <h2 class="panel__title">
        Decode transaction
      </h2>
    </header>
    <p class="panel__desc">
      Display a human-readable summary of a transaction hex.
    </p>
    <div class="panel__body">
      <div class="field">
        <label class="field__label">Transaction to decode</label>
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
      </div>
      <div class="actions">
        <button
          class="btn btn--primary"
          @click="decode"
        >
          Decode
        </button>
      </div>
      <pre
        v-if="decodedInfoString"
        class="output"
      >{{ decodedInfoString }}</pre>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { bitgo, getNetwork, type Chain } from '../composables/network';
import { isValidHex } from '../utils';

interface DecodeOutput { amount: string; address: string }

export default defineComponent({
  name: 'DecodeTx',
  props: {
    chain: { type: String as PropType<Chain>, required: true },
    isTestnet: { type: Boolean, required: true },
  },
  data(): { decodeRawHex: string; decodedInfoString: string } {
    return {
      decodeRawHex: '',
      decodedInfoString: '',
    };
  },
  computed: {
    hexError(): string {
      const raw = (this.decodeRawHex || '').trim();
      if (!raw) return '';
      return isValidHex(raw) ? '' : 'Invalid hex';
    },
  },
  methods: {
    decode(): void {
      try {
        this.decodedInfoString = '';
        const network = getNetwork(this.chain, this.isTestnet);
        const tx = bitgo.Transaction.fromHex(this.decodeRawHex, network);
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
        let str = `\nSpending ${tx.ins.length} input(s).\n`;
        outputs.forEach((output) => {
          str += `Sending ${output.amount} ${unit} to ${output.address}\n`;
        });
        this.decodedInfoString = str;
      } catch (e) {
        console.log(e);
        this.decodedInfoString = e instanceof Error ? e.message : String(e);
      }
    },
  },
});
</script>
