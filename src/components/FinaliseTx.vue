<template>
  <section class="panel">
    <header class="panel__head">
      <span class="panel__num">07</span>
      <h2 class="panel__title">
        Finalise transaction
      </h2>
    </header>
    <p class="panel__desc">
      Combine collected signatures into a final, broadcast-ready transaction.
    </p>
    <div class="panel__body">
      <div class="field">
        <label class="field__label">Transaction to finalise</label>
        <textarea
          v-model="finalisedTx.rawtx"
          aria-label="Transaction to finalise"
          class="textarea"
          rows="4"
        />
      </div>
      <div class="actions">
        <button
          class="btn btn--primary"
          @click="finalise"
        >
          Finalise
        </button>
      </div>
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
      </div>
      <div
        v-if="finalisedTxList.length > 1"
        class="multi"
      >
        <button
          class="btn btn--primary"
          @click="copyToClipboard(JSON.stringify(finalisedTxList))"
        >
          Copy all as JSON array
        </button>
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

<script>
import { bitgo, getNetwork } from '../composables/network';
import { copyToClipboard } from '../composables/copyToast';
import { truncateHex } from '../utils';

export default {
  name: 'FinaliseTx',
  props: {
    chain: { type: String, required: true },
    isTestnet: { type: Boolean, required: true },
  },
  data() {
    return {
      finalisedTx: { rawtx: '', hex: '' },
      finalisedTxList: [],
    };
  },
  methods: {
    copyToClipboard,
    truncateHex,
    finalise() {
      try {
        this.finalisedTx.hex = '';
        this.finalisedTxList = [];
        const network = getNetwork(this.chain, this.isTestnet);
        const txhex = this.finalisedTx.rawtx.trim();
        let txs = [txhex];
        if (txhex.startsWith('[')) {
          txs = JSON.parse(txhex);
        }
        const finalizedTxs = [];
        for (let t = 0; t < txs.length; t += 1) {
          console.log('Finalizing tx:', t + 1, '/', txs.length);
          const txb = bitgo.TransactionBuilder.fromTransaction(bitgo.Transaction.fromHex(txs[t], network), network);
          const tx = txb.build();
          finalizedTxs.push(tx.toHex());
        }
        this.finalisedTxList = finalizedTxs;
        console.log('All transactions finalized');
      } catch (e) {
        console.log(e);
        this.finalisedTx.hex = e.message;
      }
    },
  },
};
</script>
