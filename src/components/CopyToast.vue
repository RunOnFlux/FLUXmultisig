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

<script>
import { toastState } from '../composables/copyToast';

export default {
  name: 'CopyToast',
  data() {
    return { toastState };
  },
};
</script>
