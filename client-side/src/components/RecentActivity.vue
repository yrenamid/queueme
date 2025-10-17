<template>
  <div class="border border-gray-200 rounded-lg p-3 shadow-lg text-[#283618]">
    <div class="flex items-center justify-between mb-1">
      <p class="text-2xl font-semibold">Recent Activity</p>
      <button type="button" @click="clearAll" class="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100">Clear</button>
    </div>
    <p class="text-sm text-[#283618d2] mb-3">Last queue activity in your business</p>
    <ul class="space-y-2 max-h-64 overflow-y-auto">
      <li v-for="(item, idx) in items" :key="idx" class="text-sm flex justify-between items-start gap-3">
        <div class="truncate">
          <span class="font-medium">#{{ item.queue_number || item.id }}</span>
          <span class="mx-1">•</span>
          <span>{{ item.text }}</span>
          <span v-if="item.customer_name" class="opacity-80">— {{ item.customer_name }}</span>
        </div>
        <div class="text-right shrink-0">
          <div class="text-xs opacity-80">{{ formatDateTime(item.time) }}</div>
          <div class="text-[10px] opacity-60">{{ timeAgo(item.time) }}</div>
        </div>
      </li>
    </ul>
    <div v-if="!items.length" class="text-sm opacity-70">No recent activity</div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { connectRealtime, onRealtime } from '@/composables/useRealtime';
import { getRecentActivity as apiGetRecentActivity } from '@/services/api';

export default {
  name: 'RecentActivity',
  setup() {
  const items = ref([]);
    const businessId = (typeof window !== 'undefined') ? localStorage.getItem('businessId') : null;
  const STORAGE_KEY = `recentActivity:${businessId || 'anon'}`;
  const CLEARED_AT_KEY = `${STORAGE_KEY}:clearedAt`;
    const MAX_ITEMS = 10;
  let offJoin, offStatus; let tick;
  const recentKeys = new Map(); 
  const DEDUP_MS = 5000;
  const seenPaid = new Set();



    function persist() {
      try {
        const toSave = items.value.slice(0, MAX_ITEMS).map(it => ({
          id: it.id,
          queue_number: it.queue_number,
          customer_name: it.customer_name,
          text: it.text,
          time: it.time
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) { console.debug('[recent-activity] failed to read activity storage', err); }
    }



    function push(text, payload) {
      if (businessId && payload && String(payload.business_id) !== String(businessId)) return;
      const qn = payload?.queue_number != null ? Number(payload.queue_number) : undefined;
      const id = payload?.id != null ? Number(payload.id) : undefined;
      const key = `${String(qn||'')}-${String(id||'')}-${text}`;
  const now = Date.now();
  const windowMs = (text === 'Payment Confirmed') ? 30000 : DEDUP_MS;
  const last = recentKeys.get(key) || 0;
  if (now - last < windowMs) return; 
      recentKeys.set(key, now);
      const newItem = { text, time: now, ...payload };
      if (text === 'Payment Confirmed') {
        const foundCompleted = items.value.find(it => (it.queue_number === newItem.queue_number) && it.text === 'Completed' && Math.abs(Number(it.time) - now) <= 3000);
        if (foundCompleted) return;
      }
      items.value.unshift(newItem);
      if (items.value.length > MAX_ITEMS) items.value = items.value.slice(0, MAX_ITEMS);
      persist();
    }

    async function clearAll() {
      items.value = [];
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(CLEARED_AT_KEY, String(Date.now()));
      } catch (err) { console.debug('[recent-activity] failed to clear storage', err); }
      try {
        await fetch('/api/analytics/activity/clear', { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` } });
      } catch (err) {
        console.debug('[recent-activity] backend clear not available', err);
      }
    }

    function timeAgo(ts) {
      const diff = Math.floor((Date.now() - ts) / 1000);
      if (diff < 5) return 'just now';
      if (diff < 60) return diff + 's ago';
      const m = Math.floor(diff/60); if (m < 60) return m + 'm ago';
      const h = Math.floor(m/60); return h + 'h ago';
    }

    function formatDateTime(ts) {
      try {
        return new Date(ts).toLocaleString();
      } catch (_) {
        return '';
      }
    }

    onMounted(async () => {

      try {
        const legacy = 'recentActivity';
        if (STORAGE_KEY !== legacy) localStorage.removeItem(legacy);
  } catch (err) { console.debug('[recent-activity] error while updating activity', err); }

      let clearedAt = 0;
      try {
        clearedAt = Number(localStorage.getItem(CLEARED_AT_KEY) || '0') || 0;
      } catch (err) { console.debug('[recent-activity] failed reading clearedAt', err); }

      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            items.value = parsed
              .filter(it => !clearedAt || Number(it.time) >= clearedAt)
              .slice(0, MAX_ITEMS)
              .map(it => ({
              id: it.id,
              queue_number: it.queue_number,
              customer_name: it.customer_name,
              text: it.text,
              time: Number(it.time) || Date.now()
            }));
          }
        }
  } catch (err) { console.debug('[recent-activity] parse error while reading activity', err); }

      try {
        const backendItems = await apiGetRecentActivity();
        if (Array.isArray(backendItems)) {
          const filteredBackend = backendItems.filter(it => !clearedAt || Number(it.time) >= clearedAt);
          const merged = [...filteredBackend, ...items.value];

          const byKey = new Map();
          for (const it of merged) {
            const qn = it.queue_number != null ? Number(it.queue_number) : undefined;
            const key = `${String(qn||'')}-${String(it.id||'')}-${it.text}`;
            const prev = byKey.get(key);
            if (!prev || Number(it.time) > Number(prev.time)) byKey.set(key, it);
          }
          items.value = Array.from(byKey.values()).sort((a,b)=>b.time - a.time).slice(0, MAX_ITEMS);
          persist();
        }
  } catch (err) { console.debug('[recent-activity] failed to fetch history from backend', err); }
      connectRealtime();
  offJoin = onRealtime('queue:joined', (d) => push('Added', d));
      offStatus = onRealtime('queue:status', (d) => {
        const s = String(d?.status || '').toLowerCase();
    if (s === 'served') push('Completed', d);
        else if (s === 'cancelled') push('Cancelled', d);
        else if (s === 'called') push('Called', d);
    else if (s === 'pending_payment') push('Pending Payment', d);

    const ps = String(d?.payment_status || '').toLowerCase();
    if (ps === 'paid' && s !== 'served') {
      const qid = d?.id != null ? Number(d.id) : null;
      if (qid != null && seenPaid.has(qid)) {
        // already logged for this queue id in this session
      } else {
        if (qid != null) seenPaid.add(qid);
        push('Payment Confirmed', d);
      }
    }
  });
      tick = setInterval(()=> items.value = [...items.value], 1000);
    });
    onBeforeUnmount(() => { if (offJoin) offJoin(); if (offStatus) offStatus(); if (tick) clearInterval(tick); });

    return { items, timeAgo, formatDateTime, clearAll };
  }
};
</script>

<style scoped>
</style>
