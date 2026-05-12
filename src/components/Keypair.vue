<template>
  <section class="panel">
    <header class="panel__head">
      <span class="panel__num">01</span>
      <h2 class="panel__title">
        Keypair generation
      </h2>
    </header>
    <p class="panel__desc">
      Generate a fresh elliptic-curve keypair for use in a multi-signature address.
    </p>
    <div class="panel__body">
      <div class="actions">
        <button
          class="btn btn--primary"
          @click="generateKeypair"
        >
          Generate keypair
        </button>
      </div>
      <div class="kv">
        <div class="kv__row">
          <span class="kv__label">Public key</span>
          <code class="kv__val">{{ keypair.publickey || '—' }}</code>
          <button
            v-if="keypair.publickey"
            class="btn btn--ghost btn--micro"
            @click="copyToClipboard(keypair.publickey)"
          >
            Copy
          </button>
        </div>
        <div class="kv__row">
          <span class="kv__label">Private key</span>
          <code class="kv__val">{{ keypair.privatekey ? (showPrivateKey ? keypair.privatekey : '••••••••••••••••••••••') : '—' }}</code>
          <button
            v-if="keypair.privatekey"
            class="btn btn--ghost btn--micro"
            @click="$emit('toggle-show-private-key')"
          >
            {{ showPrivateKey ? 'Hide' : 'Show' }}
          </button>
          <button
            v-if="keypair.privatekey"
            class="btn btn--ghost btn--micro"
            @click="copyToClipboard(keypair.privatekey)"
          >
            Copy
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

interface Keypair { publickey: string; privatekey: string }

export default defineComponent({
  name: 'KeypairSection',
  props: {
    chain: { type: String as PropType<Chain>, required: true },
    isTestnet: { type: Boolean, required: true },
    showPrivateKey: { type: Boolean, required: true },
  },
  emits: ['toggle-show-private-key'],
  data(): { keypair: Keypair } {
    return {
      keypair: { publickey: '', privatekey: '' },
    };
  },
  methods: {
    copyToClipboard,
    generateKeypair(): void {
      const network = getNetwork(this.chain, this.isTestnet);
      const keyPair = bitgo.ECPair.makeRandom({ network });
      this.keypair.publickey = keyPair.getPublicKeyBuffer().toString('hex');
      this.keypair.privatekey = keyPair.toWIF();
    },
  },
});
</script>
