<template>
  <section class="panel">
    <header class="panel__head">
      <span class="panel__num">02</span>
      <h2 class="panel__title">
        Multisig address
      </h2>
    </header>
    <p class="panel__desc">
      Combine N public keys and a required-signature threshold to derive a multisignature address.
    </p>
    <div class="panel__body">
      <div
        v-for="n in inputs"
        :key="n"
        class="field"
      >
        <label class="field__label">Public key {{ n }}</label>
        <input
          v-model="publickeys[n-1]"
          class="input"
        >
      </div>
      <div class="actions actions--row">
        <button
          class="btn btn--ghost"
          @click="addPubKey"
        >
          + Add public key
        </button>
      </div>
      <div class="field field--inline">
        <label class="field__label">Signatures needed</label>
        <input
          v-model="reqsig"
          class="input input--small"
        >
      </div>
      <div class="actions">
        <button
          class="btn btn--primary"
          @click="generateMultisig"
        >
          Generate multisig address
        </button>
      </div>
      <div class="kv">
        <div class="kv__row">
          <span class="kv__label">Address</span>
          <code class="kv__val">{{ multisig.address || '—' }}</code>
          <button
            v-if="multisig.address"
            class="btn btn--ghost btn--micro"
            @click="copyToClipboard(multisig.address)"
          >
            Copy
          </button>
        </div>
        <div class="kv__row">
          <span class="kv__label">Redeem script</span>
          <code class="kv__val">{{ multisig.redeemScript || '—' }}</code>
          <button
            v-if="multisig.redeemScript"
            class="btn btn--ghost btn--micro"
            @click="copyToClipboard(multisig.redeemScript)"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { bitgo, getNetwork } from '../composables/network';
import { copyToClipboard } from '../composables/copyToast';

const STORAGE_KEY = 'fluxmultisig:multisigSetup';

export default {
  name: 'MultisigSection',
  props: {
    chain: { type: String, required: true },
    isTestnet: { type: Boolean, required: true },
  },
  data() {
    return {
      publickeys: [],
      inputs: 1,
      reqsig: 1,
      multisig: { address: '', redeemScript: '' },
    };
  },
  watch: {
    publickeys: {
      handler() { this.saveSetup(); },
      deep: true,
    },
    inputs() { this.saveSetup(); },
    reqsig() { this.saveSetup(); },
  },
  mounted() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (Array.isArray(data.publickeys)) this.publickeys = data.publickeys;
        if (Number.isFinite(data.inputs)) this.inputs = data.inputs;
        if (data.reqsig !== undefined) this.reqsig = data.reqsig;
      }
    } catch (e) {
      console.log('Failed to load multisig setup:', e);
    }
  },
  methods: {
    copyToClipboard,
    saveSetup() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          publickeys: this.publickeys,
          inputs: this.inputs,
          reqsig: this.reqsig,
        }));
      } catch (e) {
        console.log('Failed to save multisig setup:', e);
      }
    },
    addPubKey() {
      this.inputs += 1;
    },
    generateMultisig() {
      try {
        const filteredPK = this.publickeys.filter((el) => el != null && el !== '' && el !== undefined);
        const pubKeysBuffer = filteredPK.map((hex) => Buffer.from(hex, 'hex'));
        const network = getNetwork(this.chain, this.isTestnet);
        if (this.chain === 'flux') {
          const redeemScript = bitgo.script.multisig.output.encode(Number(this.reqsig), pubKeysBuffer);
          const scriptPubKey = bitgo.script.scriptHash.output.encode(bitgo.crypto.hash160(redeemScript));
          this.multisig.address = bitgo.address.fromOutputScript(scriptPubKey, network);
          this.multisig.redeemScript = redeemScript.toString('hex');
        } else {
          const witnessScript = bitgo.script.multisig.output.encode(Number(this.reqsig), pubKeysBuffer);
          const scriptPubKey = bitgo.script.witnessScriptHash.output.encode(bitgo.crypto.sha256(witnessScript));
          this.multisig.address = bitgo.address.fromOutputScript(scriptPubKey, network);
          this.multisig.redeemScript = witnessScript.toString('hex');
        }
      } catch (e) {
        console.log(e);
        this.multisig.address = e.message;
        this.multisig.redeemScript = e.message;
      }
    },
  },
};
</script>
