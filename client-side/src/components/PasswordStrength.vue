<template>
  <div v-if="password" class="flex items-center gap-2" aria-live="polite">
    <div class="bar-container" role="progressbar" :aria-valuenow="percent" aria-valuemin="0" aria-valuemax="100">
      <div class="bar-fill" :style="{ width: percent + '%', background: color }"></div>
    </div>
    <span class="label" :style="{ color }">{{ label }}</span>
  </div>
  <div v-else class="sr-only">No password entered yet</div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'PasswordStrength',
  props: {
    password: { type: String, default: '' },
  },
  setup(props) {
    const score = computed(() => {
      const p = String(props.password || '');
      let s = 0;
      if (p.length >= 8) s++;
      if (/[a-z]/.test(p)) s++;
      if (/[A-Z]/.test(p)) s++;
      if (/[0-9]/.test(p)) s++;
      if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) s++;
      if (s > 5) s = 5;
      return s; // 0..5
    });
    const percent = computed(() => Math.min(100, Math.max(0, (score.value / 5) * 100)));
    const label = computed(() => {
      const s = score.value;
      return s >= 5 ? 'Very strong' : s === 4 ? 'Strong' : s === 3 ? 'Good' : s === 2 ? 'Fair' : s === 1 ? 'Weak' : '';
    });
    const color = computed(() => {
      const s = score.value;
      return s >= 5 ? '#16a34a'  : s === 4 ? '#22c55e'  : s === 3 ? '#eab308'  : s === 2 ? '#f59e0b'  : s === 1 ? '#ef4444'  : '#6b7280' ;
    });
    return { score, percent, label, color };
  }
}
</script>

<style scoped>
.bar-container {
  height: 6px;
  border-radius: 9999px;
  background: rgba(255,255,255,0.1);
  overflow: hidden;
  flex: 1 1 auto;
}
.bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}
.label { font-size: 0.75rem; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
</style>
