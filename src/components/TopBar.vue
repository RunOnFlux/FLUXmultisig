<template>
  <header class="topbar">
    <div class="topbar__inner">
      <div class="topbar__brand">
        <span class="topbar__mark">FLUX</span>
        <span class="topbar__slash">//</span>
        <span class="topbar__sub">Multisig</span>
      </div>
      <div class="topbar__toggles">
        <button
          class="pill pill--theme"
          :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="$emit('toggle-theme')"
        >
          <span class="pill__glyph">{{ theme === 'dark' ? '☾' : '☀' }}</span>
          {{ theme === 'dark' ? 'Dark' : 'Light' }}
        </button>
        <button
          class="pill"
          :class="{ 'pill--warn': isTestnet }"
          @click="$emit('toggle-testnet')"
        >
          <span class="pill__dot" />
          {{ isTestnet ? 'Testnet' : 'Mainnet' }}
        </button>
        <button
          class="pill"
          @click="$emit('toggle-chain')"
        >
          <span class="pill__dot pill__dot--accent" />
          {{ chain === 'flux' ? 'Flux' : 'Bitcoin' }}
        </button>
      </div>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { Chain } from '../composables/network';

export default defineComponent({
  name: 'TopBar',
  props: {
    chain: { type: String as PropType<Chain>, required: true },
    isTestnet: { type: Boolean, required: true },
    theme: { type: String as PropType<'dark' | 'light'>, required: true },
  },
  emits: ['toggle-theme', 'toggle-testnet', 'toggle-chain'],
});
</script>
