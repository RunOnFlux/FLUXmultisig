<template>
  <div
    class="progress"
    role="progressbar"
    :aria-valuenow="current"
    :aria-valuemin="0"
    :aria-valuemax="total"
  >
    <div
      class="progress__bar"
      :style="{ width: percent + '%' }"
    />
    <span class="progress__label">{{ current }} / {{ total }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ProgressBar',
  props: {
    current: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  computed: {
    percent(): number {
      if (!this.total) return 0;
      return Math.min(100, Math.max(0, (this.current / this.total) * 100));
    },
  },
});
</script>
