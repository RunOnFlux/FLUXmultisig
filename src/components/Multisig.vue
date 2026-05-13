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
          <button
            v-if="multisig.redeemScript && isValidScript"
            class="btn btn--ghost btn--micro"
            @click="saveCurrentScript"
          >
            {{ savedLabel ? `Saved as ${savedLabel}` : 'Save…' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { bitgo, getNetwork, type Chain } from '../composables/network';
import { copyToClipboard } from '../composables/copyToast';
import { saveRedeemScript, findByScript } from '../composables/redeemScriptStore';

const STORAGE_KEY = 'fluxmultisig:multisigSetup';

interface MultisigState { address: string; redeemScript: string }

interface Data {
  publickeys: string[];
  inputs: number;
  reqsig: number | string;
  multisig: MultisigState;
}

export default defineComponent({
  name: 'MultisigSection',
  props: {
    chain: { type: String as PropType<Chain>, required: true },
    isTestnet: { type: Boolean, required: true },
  },
  data(): Data {
    return {
      publickeys: [],
      inputs: 1,
      reqsig: 1,
      multisig: { address: '', redeemScript: '' },
    };
  },
  computed: {
    isValidScript(): boolean {
      const rs = this.multisig.redeemScript;
      if (!rs) return false;
      try {
        const buf = Buffer.from(rs, 'hex');
        const decoded = bitgo.script.multisig.output.decode(buf);
        return !!decoded && Array.isArray(decoded.pubKeys);
      } catch (_e) {
        return false;
      }
    },
    savedLabel(): string {
      if (!this.multisig.redeemScript) return '';
      const found = findByScript(this.multisig.redeemScript, this.chain, this.isTestnet);
      return found ? found.label : '';
    },
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
    saveCurrentScript() {
      const script = this.multisig.redeemScript;
      if (!script) return;
      const existing = findByScript(script, this.chain, this.isTestnet);
      const suggested = existing ? existing.label : (this.multisig.address || '');
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
        address: this.multisig.address || undefined,
      });
      this.$forceUpdate();
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
        const msg = e instanceof Error ? e.message : String(e);
        this.multisig.address = msg;
        this.multisig.redeemScript = msg;
      }
    },
  },
});
</script>
