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
      <div class="actions">
        <button
          class="btn btn--primary"
          :disabled="loading"
          @click="sign"
        >
          {{ loading ? 'Signing' : 'Sign' }}<span
            v-if="loading"
            class="dots"
          />
        </button>
      </div>
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
      </div>
      <div
        v-if="signedTxList.length > 1"
        class="multi"
      >
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
import axios from 'axios';
import {
  bitgo,
  getNetwork,
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
import { truncateHex, isValidHex } from '../utils';

function reverseHex(hex) {
  return Buffer.from(hex, 'hex').reverse().toString('hex');
}

export default {
  name: 'SignTx',
  props: {
    chain: { type: String, required: true },
    isTestnet: { type: Boolean, required: true },
    showPrivateKey: { type: Boolean, required: true },
  },
  emits: ['toggle-show-private-key'],
  data() {
    return {
      signedTx: {
        rawtx: '', privatekey: '', redeemScript: '', hex: '',
      },
      signedTxList: [],
      loading: false,
    };
  },
  computed: {
    hexError() {
      const raw = (this.signedTx.rawtx || '').trim();
      if (!raw) return '';
      if (raw.startsWith('[')) {
        try {
          const arr = JSON.parse(raw);
          if (!Array.isArray(arr)) return 'Expected JSON array of hex strings';
          if (!arr.every((s) => isValidHex(s))) return 'Array contains invalid hex';
          return '';
        } catch (e) {
          return 'Invalid JSON array';
        }
      }
      return isValidHex(raw) ? '' : 'Invalid hex';
    },
  },
  methods: {
    copyToClipboard,
    truncateHex,
    fluxExplorer() {
      return this.isTestnet ? TESTNET_FLUX_EXPLORER : MAINNET_FLUX_EXPLORER;
    },
    btcBlockbook() {
      return this.isTestnet ? TESTNET_BTC_BLOCKBOOK : MAINNET_BTC_BLOCKBOOK;
    },
    async sign() {
      this.loading = true;
      try {
        this.signedTx.hex = '';
        this.signedTxList = [];
        const network = getNetwork(this.chain, this.isTestnet);
        const hashType = bitgo.Transaction.SIGHASH_ALL;
        const txhex = this.signedTx.rawtx.trim();
        let txs = [txhex];
        if (txhex.startsWith('[')) {
          txs = JSON.parse(txhex);
        }
        const signedTxs = [];
        for (let t = 0; t < txs.length; t += 1) {
          console.log('Signing tx:', t + 1, '/', txs.length);
          const keyPair = bitgo.ECPair.fromWIF(this.signedTx.privatekey, network);
          const txb = bitgo.TransactionBuilder.fromTransaction(bitgo.Transaction.fromHex(txs[t], network), network);
          let quickLoad = true;
          // eslint-disable-next-line no-unused-vars
          for (let i = 0; i < txb.inputs.length; i += 1) {
            const hash = reverseHex(txb.tx.ins[i].hash.toString('hex'));
            const { index } = txb.tx.ins[i];
            let value;
            if (hasValue(hash + index)) {
              value = Math.round(Number(getValue(hash + index)));
            } else if (quickLoad) {
              quickLoad = false;
              let addr;
              let tx;
              /* eslint-disable no-await-in-loop */
              if (this.chain === 'flux') {
                tx = await axios.get(`${this.fluxExplorer()}/api/tx/${hash}`);
                // eslint-disable-next-line prefer-destructuring
                addr = tx.data.vout[index].scriptPubKey.addresses[0];
              } else {
                tx = await axios.get(`${this.btcBlockbook()}/api/tx/${hash}`);
                // eslint-disable-next-line prefer-destructuring
                addr = tx.data.vout[index].scriptPubKey.addresses[0];
              }
              let utxos = [];
              if (this.chain === 'flux') {
                const utx = await axios.get(`${this.fluxExplorer()}/api/addr/${addr}/utxo`);
                utxos = utx.data.map((x) => normalizeUtxo('flux', x));
              } else {
                const utx = await axios.get(`${this.btcBlockbook()}/api/v2/utxo/${addr}`);
                utxos = utx.data.map((x) => normalizeUtxo('bitcoin', x));
              }
              /* eslint-disable no-loop-func */
              utxos.forEach((u) => { setValue(u.txid + u.vout, u.satoshis); });
              if (hasValue(hash + index)) {
                value = Math.round(Number(getValue(hash + index)));
              } else {
                value = Math.round(Number(tx.data.vout[index].value) * 1e8);
              }
            } else {
              let tx;
              if (this.chain === 'flux') {
                tx = await axios.get(`${this.fluxExplorer()}/api/tx/${hash}`);
              } else {
                tx = await axios.get(`${this.btcBlockbook()}/api/tx/${hash}`);
              }
              value = Math.round(Number(tx.data.vout[index].value) * 1e8);
            }
            txb.sign(
              i,
              keyPair,
              this.chain !== 'bitcoin' ? Buffer.from(this.signedTx.redeemScript, 'hex') : '',
              hashType,
              value,
              this.chain === 'bitcoin' ? Buffer.from(this.signedTx.redeemScript, 'hex') : '',
            );
          }
          const tx = txb.buildIncomplete();
          signedTxs.push(tx.toHex());
        }
        this.signedTxList = signedTxs;
        console.log('All transactions signed');
        saveToStorage();
      } catch (e) {
        console.log(e);
        this.signedTx.hex = e.message;
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
