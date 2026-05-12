<template>
  <transition name="toast">
    <div
      v-if="toastState.visible"
      class="copy-toast"
      role="status"
      aria-live="polite"
    >
      <span class="copy-toast__check">✓</span>
      Copied to clipboard
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { toastState } from '../composables/copyToast';

export default defineComponent({
  name: 'CopyToast',
  data() {
    return { toastState };
  },
});
</script>
