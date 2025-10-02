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
                <th class="px-2 py-2"><input type="checkbox" :checked="allSelected" @change="toggleAll($event)" /></th>
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
                  <input type="checkbox" :value="row.id" v-model="selected" />
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

// Initializes component state and handlers
  setup(props, { emit }) {
    const loading = ref(false);
    const submitting = ref(false);
    const rows = ref([]);
    const search = ref('');
    const selected = ref([]);
    const { toast } = useToast();
  const now = ref(new Date());

  const localStarts = ref({}); // { [id]: startedAtMs }
  const CACHE_KEY = 'callModalLocalStarts';

// Handles load Starts From Cache
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

// Handles save Starts To Cache
  const saveStartsToCache = () => {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(localStarts.value || {}));
    } catch (err) {

      console.debug('[call-modal] saveStartsToCache failed', err);
    }
  };
    let timer;
  let offStatus;
  let offUpdated;


// Handles load
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

// Handles toggle All
    const toggleAll = (evt) => {
      if (evt.target.checked) selected.value = filtered.value.map(r => r.id);
      else selected.value = [];
    };


// Handles remaining For
    const remainingFor = (row) => {
      if (!row) return '00:00:00';
      

// Handles to HMS
      const toHMS = (s) => {
        const secs = Math.max(0, Math.floor(s));
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const sec = secs % 60;
        // Handles pad
        const pad = (n)=> (n<10?`0${n}`:`${n}`);
        return `${pad(h)}:${pad(m)}:${pad(sec)}`;
      };


      const parentBaseline = props.baselines?.[row.id];
      if (parentBaseline && parentBaseline.initialEwt != null && parentBaseline.initialStart != null) {
        const raw = Number(parentBaseline.initialEwt) - ((now.value.getTime() - Number(parentBaseline.initialStart)) / 60000);
        return toHMS(Math.max(0, Math.ceil(raw * 60)));
      }


      const base = row.estimated_wait_time;
      if (base == null) return '00:00:00';
      
      let start = localStarts.value[row.id];
      if (!start) {

        start = Date.now();
        localStarts.value[row.id] = start;
      }
      
      const raw = Number(base) - ((now.value.getTime() - Number(start)) / 60000);
      return toHMS(Math.max(0, Math.ceil(raw * 60)));
    };


    // Handles submit
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
        emit('called', { updated, skipped });
        emit('close');
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
        try {
          connectRealtime();
        } catch (e) {

        }
        try {
          offStatus = onRealtime('queue:status', (ev) => {
            if (!ev) return;
            const id = Number(ev.id);
            if (!id) return;

            if (String(ev.status||'').toLowerCase() === 'delayed') {
              const idx = rows.value.findIndex(r => Number(r.id) === id);
              if (idx >= 0) {
                // Handles eta
                const eta = (ev.estimated_wait_time != null ? Number(ev.estimated_wait_time) : rows.value[idx].estimated_wait_time);
                rows.value[idx] = { ...rows.value[idx], status: 'delayed', estimated_wait_time: eta };

                if (props.baselines?.[id]) {
                  delete localStarts.value[id];
                } else {

                  localStarts.value[id] = Date.now();
                }
              }
            }
          });
          offUpdated = onRealtime('queue:updated', (ev) => {
            if (!ev) return;
            const id = Number(ev.id);
            if (!id) return;
            const idx = rows.value.findIndex(r => Number(r.id) === id);
            if (idx >= 0 && ev.estimated_wait_time != null) {
              rows.value[idx] = { ...rows.value[idx], estimated_wait_time: Number(ev.estimated_wait_time) };

              if (props.baselines?.[id]) {
                delete localStarts.value[id];
              } else {

                localStarts.value[id] = Date.now();
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

          }
          offStatus = null;
        }
        if (offUpdated) {
          try {
            offUpdated();
          } catch (e) {

          }
          offUpdated = null;
        }

        try { saveStartsToCache(); } catch (err) { console.debug('[call-modal] saveStartsToCache failed on close', err); }
      }
    });
    onMounted(() => {
      if (!props.isOpen) return;
      load();
      timer = setInterval(() => (now.value = new Date()), 1000);
      loadStartsFromCache();
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

        }
        offStatus = null;
      }
      if (offUpdated) {
        try {
          offUpdated();
        } catch (e) {

        }
        offUpdated = null;
      }
      saveStartsToCache();
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
