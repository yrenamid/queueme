<template>
  <ion-modal :is-open="isOpen" class="custom-modal call-customers-modal" :backdrop-dismiss="false">
  <div id="inter" class="bg-[#283618] text-white p-3 rounded-lg w-full">
      <div class="flex items-center justify-between mb-2">
        <div>
          <h3 class="text-xl font-bold">Call Customers</h3>
          <p class="text-sm font-light opacity-90">Select customers currently waiting and paid, then call them. EWT mirrors the Current Queue countdown.</p>
        </div>
        <font-awesome-icon :icon="['fas','xmark']" class="text-2xl cursor-pointer" @click="$emit('close')" />
      </div>

      <div class="mb-3">
        <div class="flex items-center gap-2 mb-2 w-full">
          <ion-input v-model="search" placeholder="Search by name or queue #" class="bg-white/20 rounded-sm text-white text-sm w-full" style="--highlight-color: none; --padding-start: 8px; --color: white"/>
          <ion-button size="small" fill="clear" class="bg-[#283618] text-white normal-case border border-white/30 flex-shrink-0" @click="load">Refresh</ion-button>
        </div>
  <div class="border border-[#DDA15E] rounded-sm max-h-[60vh] overflow-y-auto w-full">
          <table class="w-full text-sm table-fixed">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wide bg-white/10">
                <th class="px-2 py-2 text-center">
                  <label class="checkbox-wrap" aria-label="Select all">
                    <input type="checkbox" class="big-checkbox" :checked="allSelected" @change="toggleAll($event)" />
                  </label>
                </th>
                <th class="px-2 py-2">Queue #</th>
                <th class="px-2 py-2">Customer</th>
                <th class="px-2 py-2">Status</th>
                <th class="px-2 py-2">Paid</th>
                <th class="px-2 py-2">EWT</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in filtered" :key="row.id" class="border-t border-white/10">
                <td class="px-2 py-2 text-center">
                  <label class="checkbox-wrap" :aria-label="`Select queue ${row.queue_number}`">
                    <input type="checkbox" class="big-checkbox" :value="row.id" v-model="selected" />
                  </label>
                </td>
                <td class="px-2 py-2">{{ row.queue_number }}</td>
                <td class="px-2 py-2">{{ row.customer_name }}</td>
                <td class="px-2 py-2 capitalize">{{ row.status }}</td>
                <td class="px-2 py-2">{{ row.payment_status }}</td>
                <td class="px-2 py-2">{{ remainingFor(row) }}</td>
              </tr>
              <tr v-if="!loading && !filtered.length">
                <td colspan="6" class="text-center text-gray-300 py-4">No eligible waiting customers</td>
              </tr>
              <tr v-if="loading">
                <td colspan="6" class="text-center text-gray-300 py-4">Loading...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 items-center gap-2 mt-3">
        <div class="text-xs text-gray-200 md:col-span-1">Selected: {{ selected.length }}</div>
        <div class="md:col-span-2 flex gap-2 justify-end">
          <ion-button fill="clear" class="bg-gray-500 normal-case w-full md:w-auto" @click="$emit('close')">Cancel</ion-button>
          <ion-button class="bg-[#DDA15E] text-white normal-case w-full md:w-auto" :disabled="!selected.length || submitting" @click="submit">{{ submitting ? 'Calling...' : 'Call Selected' }}</ion-button>
        </div>
      </div>
    </div>
  </ion-modal>
</template>

<script>
import { IonModal, IonButton, IonInput } from '@ionic/vue';
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { listWaitingPaid, callSelected, listQueue } from '@/services/api';
import { useToast } from '@/composables/useToast';
import { onRealtime, connectRealtime } from '@/composables/useRealtime';

export default {
  name: 'CallCustomersModal',
  components: { IonModal, IonButton, IonInput },
  props: { 
    isOpen: { type: Boolean, default: false },
    baselines: { type: Object, default: () => ({}) },
    isServiceBased: { type: Boolean, default: false }
  },
  emits: ['close', 'called'],

  setup(props, { emit }) {
    const loading = ref(false);
    const submitting = ref(false);
    const rows = ref([]);
    const search = ref('');
    const selected = ref([]);
    const { toast } = useToast();
  const now = ref(new Date());

  const localStarts = ref({}); // 
  const CACHE_KEY = 'callModalLocalStarts';
  const frozenSeconds = ref({}); 
  const FROZEN_KEY = 'callModalFrozenSeconds';


  const loadStartsFromCache = () => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && typeof obj === 'object') localStarts.value = obj;
      }
    } catch (err) {

      console.debug('[call-modal] loadStartsFromCache failed', err);
    }
  };

  const saveStartsToCache = () => {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(localStarts.value || {}));
    } catch (err) {

      console.debug('[call-modal] saveStartsToCache failed', err);
    }
  };

  const loadFrozenFromCache = () => {
    try {
      const raw = sessionStorage.getItem(FROZEN_KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && typeof obj === 'object') frozenSeconds.value = obj;
      }
    } catch (err) {
      console.debug('[call-modal] loadFrozenFromCache failed', err);
    }
  };

  const saveFrozenToCache = () => {
    try {
      sessionStorage.setItem(FROZEN_KEY, JSON.stringify(frozenSeconds.value || {}));
    } catch (err) {
      console.debug('[call-modal] saveFrozenToCache failed', err);
    }
  };
    let timer;
  let offStatus;
  let offUpdated;


    const load = async () => {
      loading.value = true;
      try {
        if (props.isServiceBased) {
          const raw = await listQueue({ status: 'waiting,delayed' });
          rows.value = (raw || []).map(r => ({
            id: r.id,
            queue_number: r.queue_number,
            customer_name: r.customer_name,
            status: r.status,
            payment_status: r.payment_status,
            estimated_wait_time: r.estimated_wait_time,
          }));
        } else {
          const list = await listWaitingPaid();
          rows.value = list;
        }
      } catch (e) {
        console.error('[call modal load]', e);
      } finally {
        loading.value = false;
      }
    };

    const filtered = computed(() => {
      const q = search.value.trim().toLowerCase();
      if (!q) return rows.value;
      return rows.value.filter(r => String(r.queue_number).includes(q) || String(r.customer_name).toLowerCase().includes(q));
    });

    const allSelected = computed(() => filtered.value.length && filtered.value.every(r => selected.value.includes(r.id)));


    const toggleAll = (evt) => {
      if (evt.target.checked) selected.value = filtered.value.map(r => r.id);
      else selected.value = [];
    };


    const getRemainingSeconds = (id) => {
      if (!id) return 0;
      if (frozenSeconds.value?.[id] != null) return Number(frozenSeconds.value[id]) || 0;
      const parentBaseline = props.baselines?.[id];
      if (parentBaseline && parentBaseline.initialEwt != null && parentBaseline.initialStart != null) {
        const rawMin = Number(parentBaseline.initialEwt) - ((now.value.getTime() - Number(parentBaseline.initialStart)) / 60000);
        return Math.max(0, Math.ceil(rawMin * 60));
      }
      const r = rows.value.find(rr => Number(rr.id) === Number(id));
      const baseMin = r?.estimated_wait_time != null ? Number(r.estimated_wait_time) : 0;
      let start = localStarts.value[id];
      if (!start) {
        start = Date.now();
        localStarts.value[id] = start;
      }
      const rawMin = baseMin - ((now.value.getTime() - Number(start)) / 60000);
      return Math.max(0, Math.ceil(rawMin * 60));
    };

    const remainingFor = (row) => {
      if (!row) return '00:00:00';
      const toHMS = (s) => {
        const secs = Math.max(0, Math.floor(s));
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const sec = secs % 60;
        const pad = (n)=> (n<10?`0${n}`:`${n}`);
        return `${pad(h)}:${pad(m)}:${pad(sec)}`;
      };
      const secs = getRemainingSeconds(row.id);
      return toHMS(secs);
    };


    const submit = async () => {
      if (!selected.value.length) return;
      submitting.value = true;
      try {
        const result = await callSelected(selected.value);
        const updated = result.updated || [];
        const skipped = result.skipped || [];
        if (updated.length) toast(`Called ${updated.length} customer(s)`);
        if (skipped.length) toast(`${skipped.length} skipped (not eligible)`, 'warn');
        if (result.capacity) {
          const cap = result.capacity;
          toast(`Capacity: staff=${cap.staff}, in-use=${cap.in_use}, remaining=${cap.remaining}`);
        }
        try {
          const ids = updated.map(u => (typeof u === 'number' ? u : Number(u?.id))).filter(Boolean);
          for (const id of ids) {
            const idx = rows.value.findIndex(r => Number(r.id) === Number(id));
            if (idx >= 0) {
              rows.value[idx] = { ...rows.value[idx], status: 'called' };
              const freezeSec = getRemainingSeconds(id);
              frozenSeconds.value[id] = freezeSec;
              delete localStarts.value[id];
            }
          }
          saveFrozenToCache();
        } catch (_) { /* ignore */ }
        selected.value = [];
        emit('called', { updated, skipped });
      } catch (e) {
        console.error('[call selected]', e);
        toast(e.message || 'Failed to call selected', 'error');
      } finally {
        submitting.value = false;
      }
    };

    watch(() => props.isOpen, (open) => {
      if (open) {
        selected.value = [];
        search.value='';
        load();
        timer = setInterval(()=> now.value = new Date(), 1000);

        loadStartsFromCache();
        loadFrozenFromCache();
        try {
          connectRealtime();
        } catch (e) {
          console.debug('[call-modal] realtime connect failed (open watcher)', e);
        }
        try {
          offStatus = onRealtime('queue:status', (ev) => {
            if (!ev) return;
            const id = Number(ev.id);
            if (!id) return;

            const status = String(ev.status||'').toLowerCase();
            if (status === 'delayed') {
              const idx = rows.value.findIndex(r => Number(r.id) === id);
              if (idx >= 0) {
                const eta = (ev.estimated_wait_time != null ? Number(ev.estimated_wait_time) : rows.value[idx].estimated_wait_time);
                rows.value[idx] = { ...rows.value[idx], status: 'delayed', estimated_wait_time: eta };

                if (props.baselines?.[id]) {
                  delete localStarts.value[id];
                } else {

                  localStarts.value[id] = Date.now();
                }
              }
            } else if (status === 'called') {
              const idx = rows.value.findIndex(r => Number(r.id) === id);
              if (idx >= 0) {
                rows.value[idx] = { ...rows.value[idx], status: 'called' };
                try {
                  const freezeSec = getRemainingSeconds(id);
                  frozenSeconds.value[id] = freezeSec;
                  delete localStarts.value[id];
                  saveFrozenToCache();
                } catch (_) { /* ignore */ }
              }
            }
          });
          offUpdated = onRealtime('queue:updated', (ev) => {
            if (!ev) return;
            const id = Number(ev.id);
            if (!id) return;
            const idx = rows.value.findIndex(r => Number(r.id) === id);
            if (idx >= 0 && ev.estimated_wait_time != null) {
              if (frozenSeconds.value?.[id] != null || String(rows.value[idx].status).toLowerCase() === 'called') {
                return;
              }
              const newEta = Number(ev.estimated_wait_time);
              rows.value[idx] = { ...rows.value[idx], estimated_wait_time: newEta };

              if (props.baselines?.[id]) {
                delete localStarts.value[id];
                return;
              }
            }
          });
        } catch (err) {

          console.debug('[call-modal] realtime subscribe failed', err);
        }
      } else {
        if (timer) clearInterval(timer);
        if (offStatus) {
          try {
            offStatus();
          } catch (e) {
            console.debug('[call-modal] offStatus cleanup failed', e);
          }
          offStatus = null;
        }
        if (offUpdated) {
          try {
            offUpdated();
          } catch (e) {
            console.debug('[call-modal] offUpdated cleanup failed', e);
          }
          offUpdated = null;
        }

        try { saveStartsToCache(); } catch (err) { console.debug('[call-modal] saveStartsToCache failed on close', err); }
        try { saveFrozenToCache(); } catch (err) { console.debug('[call-modal] saveFrozenToCache failed on close', err); }
      }
    });
    onMounted(() => {
      if (!props.isOpen) return;
      load();
      timer = setInterval(() => (now.value = new Date()), 1000);
      loadStartsFromCache();
      loadFrozenFromCache();
      try {
        connectRealtime();
      } catch (e) {

        console.debug('[call-modal] realtime connect failed', e);
      }
    });
    onBeforeUnmount(() => {
      if (timer) clearInterval(timer);
      if (offStatus) {
        try {
          offStatus();
        } catch (e) {
          console.debug('[call-modal] offStatus cleanup failed (unmount)', e);
        }
        offStatus = null;
      }
      if (offUpdated) {
        try {
          offUpdated();
        } catch (e) {
          console.debug('[call-modal] offUpdated cleanup failed (unmount)', e);
        }
        offUpdated = null;
      }
      saveStartsToCache();
      saveFrozenToCache();
    });


    watch(() => props.baselines, (b) => {
      try {
        if (!b) return;
        for (const k of Object.keys(b)) {
          if (b[k] && b[k].initialEwt != null && b[k].initialStart != null) {
            delete localStarts.value[k];
          }
        }
      } catch (err) {

        console.debug('[call-modal] baseline sync failed', err);
      }
    }, { deep: true });

    return { loading, submitting, rows, filtered, search, selected, allSelected, toggleAll, load, submit, remainingFor };
  }
};
</script>

<style scoped>
.custom-modal { display: flex; align-items: center; justify-content: center; }
.call-customers-modal::part(content) {
  width: 96vw;
  max-width: 1000px;
  margin: 0 auto;
  max-height: 90vh;
  height: auto;
}
</style>
<style scoped>

.checkbox-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px; 
  border-radius: 6px;
}

.big-checkbox {
  width: 20px;
  height: 20px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  border: 2px solid rgba(255,255,255,0.85);
  border-radius: 4px;
  background: transparent;
  display: inline-block;
  position: relative;
  cursor: pointer;
  outline: none;
}

.big-checkbox:hover {
  box-shadow: 0 0 0 2px rgba(255,255,255,0.15);
}

.big-checkbox:focus {
  box-shadow: 0 0 0 3px rgba(221,161,94,0.5); 
}

.big-checkbox:checked {
  background-color: #DDA15E; 
  border-color: #DDA15E;
}

.big-checkbox:checked::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 1px;
  width: 6px;
  height: 12px;
  border: solid #1B1B1B; 
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
</style>
