<template>
  <div
    class="testnet-stripe"
    role="alert"
  >
    <span class="testnet-stripe__txt">
      <span class="testnet-stripe__mark">▲</span>
      Testnet mode — not real funds
      <span class="testnet-stripe__mark">▲</span>
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({ name: 'TestnetStripe' });
</script>
