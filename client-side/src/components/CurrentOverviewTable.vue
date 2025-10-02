<template>
  <div id="poppins" class="border p-3 col-span-2 border-[#28361822] rounded-lg shadow-lg">
    <div class="flex justify-between items-center">
      <p class="text-2xl font-bold text-[#283618]">Current Queue Overview</p>
      <div class="flex flex-col items-end gap-1">
        <div class="text-sm text-[#283618]/80">{{ formattedNow }}</div>
        <div class="w-full md:w-96">
          <div class="flex items-center gap-2 border rounded-lg border-[#4B5D0E66] bg-white px-3 py-2 shadow-sm focus-within:border-[#283618]">
            <span class="text-[#283618]/70">🔍</span>
            <ion-input
              v-model="searchQuery"
              placeholder="Search by queue # or customer name"
              inputmode="text"
              class="flex-1"
              style="--background: transparent; --color: #111827; --placeholder-color: #6b7280; --padding-start: 0; --padding-end: 0; font-size: 0.95rem"
            ></ion-input>
            <button v-if="searchQuery" @click="searchQuery = ''" class="text-[#283618]/60 hover:text-[#283618]" aria-label="Clear search">✕</button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="flex justify-between items-center gap-5 mt-8">
      <div class="w-100">
        <ion-segment class="bg-[#4B5D0E29] rounded-sm p-1">
          <ion-segment-button
            @click="customerTab = 'current'"
            :class="[
              customerTab === 'current'
                ? 'bg-white font-bold text-[#283618] rounded-sm'
                : 'font-medium text-[#283618]/80 hover:text-[#283618] hover:bg-white/60 border border-transparent hover:border-white rounded-sm',
            ]"
            style="--indicator-color: transparent"
          >
            <ion-label>Current Queue</ion-label>
          </ion-segment-button>
          <ion-segment-button
            @click="customerTab = 'completed'"
            :class="[
              customerTab === 'completed'
                ? 'bg-white font-bold text-[#283618] rounded-sm'
                : 'font-medium text-[#283618]/80 hover:text-[#283618] hover:bg-white/60 border border-transparent hover:border-white rounded-sm',
            ]"
            style="--indicator-color: transparent"
          >
            <ion-label>Completed</ion-label>
          </ion-segment-button>
          <ion-segment-button
            @click="customerTab = 'cancelled'"
            :class="[
              customerTab === 'cancelled'
                ? 'bg-white font-bold text-[#283618] rounded-sm'
                : 'font-medium text-[#283618]/80 hover:text-[#283618] hover:bg-white/60 border border-transparent hover:border-white rounded-sm',
            ]"
            style="--indicator-color: transparent"
          >
            <ion-label>Cancelled</ion-label>
          </ion-segment-button>
        </ion-segment>
      </div>
      <div>
        <ion-button @click="handleShowAddCustomer" :disabled="addDisabled" class="normal-case bg-[#283618] text-white rounded-sm" :title="addDisabled ? 'Max queue length reached' : ''"
          >+Add Customer</ion-button
        >
      </div>
    </div>

    <div v-if="customerTab === 'current'">
      <div class="my-8 border-gray-200 shadow-sm rounded-lg">
        <div class="table-scroll-wrapper overflow-x-auto">
        <table class="queue-table w-full min-w-max border">
          <thead class="border-gray-400 text-[#283618]">
            <tr class="bg-gray-200">
              <th class="!p-3 text-sm font-semibold tracking-wide text-left">
                Queue #
              </th>
              <th class="!p-3 text-sm font-semibold tracking-wide text-left">
                Customer Name
              </th>
              <th class="!p-3 text-sm font-semibold tracking-wide text-left">
                Order
              </th>
              <th class="!p-3 text-sm font-semibold tracking-wide text-left">
                Est. Wait (HH:MM:SS)
              </th>
              <th class="!p-3 text-sm font-semibold tracking-wide text-left">
                Notes
              </th>
              <th class="!p-3 text-sm font-semibold tracking-wide text-left">
                Status
              </th>
              <th class="!p-3 text-sm font-semibold tracking-wide text-center">
                Action
              </th>
            </tr>
          </thead>
          <tbody class="border-gray-400 text-[#283618]">
            <tr v-for="(customer, index) in pagedCurrentCustomers" :key="customer.id || customer.queueNo || index">
              <td class="!p-3 text-sm font-light">
                <span v-if="customer.isPriority" class="text-yellow-500 mr-1">
                  <font-awesome-icon :icon="['fas', 'star']" />
                </span>
                {{ customer.queueNo }}
              </td>
              <td class="!p-3 text-sm font-light">{{ customer.customerName }}</td>
              <td class="!p-3 text-sm font-light">
                <span v-for="(item, i) in customer.menuItems" :key="i">
                  {{ item.name }} x{{ item.quantity || 1 }}
                  <span v-if="i < customer.menuItems.length - 1">, </span>
                </span>
              </td>
              <td class="!p-3 text-sm font-light">
                <span>{{ remainingFor(customer) }}</span>
              </td>
              
              <td class="!p-3 text-sm font-light">{{ customer.notes }}</td>
              <td class="!p-3">
                <div class="flex items-center gap-2">
                  <span 
                    :class="[
                      customer.status === 'Pending' ? ' bg-yellow-100 text-yellow-700' :
                      customer.status === 'In Progress' ? 'bg-green-100 text-green-700' :
                      customer.status === 'Delayed' ? 'bg-orange-100 text-orange-700' :
                      'text-blue-700 bg-blue-100'
                    ]"
                    class="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                    >{{ customer.status }}</span>
                  <span v-if="customer.paid" class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">Paid</span>
                </div>
              </td>
              <td class="!p-3">
                <span class=" flex items-center justify-center gap-2">
                  <font-awesome-icon @click="handleOrderDetails(customer)" :icon="['fas', 'eye']" class="text-sm bg-[#FEFAE080] hover:opacity-75 border border-[#00000033] py-1 px-3 rounded-lg cursor-pointer"/>
                  <font-awesome-icon
                    :icon="['fas', 'check']"
                    @click="isServeDisabled(customer) ? null : completeCustomer(customer)"
                    :class="[
                      'text-sm bg-[#FEFAE080] border border-green-300 py-1 px-3 rounded-lg',
                      isServeDisabled(customer) ? 'opacity-40 cursor-not-allowed' : 'text-[#40CF3E] hover:opacity-75 cursor-pointer'
                    ]"
                    :title="isServeDisabled(customer) ? 'Approve payment and call the order before serving' : 'Mark as served'"
                  />
                  
                  <span v-if="String(customer.status).toLowerCase() === 'delayed'" class="relative group" aria-label="Customer requested delay">
                    <font-awesome-icon :icon="['fas', 'clock']" class="text-orange-600 text-base cursor-default" />
                    <span class="absolute z-10 hidden group-hover:block -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-[#283618] text-[10px] px-2 py-1 rounded shadow border">Customer requested delay</span>
                  </span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
      <div class="flex items-center justify-between mt-2" v-if="filteredCustomers.length > 0">
        <div class="text-xs text-[#283618]/70">Page {{ currentPageCurrent }} of {{ currentTotalPages }}</div>
        <div class="flex items-center gap-1 flex-wrap">
          <ion-button size="small" fill="clear" :disabled="currentPageCurrent <= 1" @click="currentPageCurrent = Math.max(1, currentPageCurrent - 1)">Prev</ion-button>
          <ion-button v-for="page in currentPages" :key="'c'+page" size="small" :fill="page === currentPageCurrent ? 'solid' : 'clear'" @click="currentPageCurrent = page">{{ page }}</ion-button>
          <ion-button size="small" fill="clear" :disabled="currentPageCurrent >= currentTotalPages" @click="currentPageCurrent = Math.min(currentTotalPages, currentPageCurrent + 1)">Next</ion-button>
        </div>
      </div>
      <div v-else-if="searchQuery" class="text-sm text-gray-500 mt-2">No matching results</div>
    </div>
    <div v-else-if="customerTab === 'completed'">
      <div class="my-8">
        <div class="table-scroll-wrapper overflow-x-auto">
        <table class="queue-table w-full min-w-max rounded-lg">
          <thead class="border-gray-400 text-[#283618]">
            <tr class="bg-gray-200">
              <th class="!p-3 text-sm tracking-wide text-left font-semibold">
                Queue #
              </th>
              <th class="!p-3 text-sm tracking-wide text-left font-semibold">
                Customer Name
              </th>
              <th class="!p-3 text-sm tracking-wide text-left font-semibold">
                Party Size
              </th>
              <th class="!p-3 text-sm tracking-wide text-left font-semibold">
                Status
              </th>
              <th class="!p-3 text-sm tracking-wide text-left font-semibold">
                Payment
              </th>
              <th class="!p-3 text-sm tracking-wide text-left font-semibold">
                Joined At
              </th>
              <th class="!p-3 text-sm tracking-wide text-left font-semibold">
                Completed at
              </th>
            </tr>
          </thead>
          <tbody class="border-gray-400 text-[#283618]">
            <tr v-for="(customer, index) in pagedCompletedCustomers" :key="index">
              <td class="!p-3 text-sm font-light">{{ customer.queueNo }}</td>
              <td class="!p-3 text-sm font-light">{{ customer.customerName }}</td>
              <td class="!p-3 text-sm font-light">{{ customer.partySize || '-' }}</td>
              <td class="!p-3 text-sm font-light ">
                <span class="border border-blue-300 text-[#1E589A] rounded-xl px-2 font-medium">{{ customer.status }}</span>
              </td>
              <td class="!p-3 text-sm font-light">
                <span class="bg-[#38C536] text-white rounded-xl px-2 font-medium">{{ customer.payment }}</span>
              </td>
              <td class="!p-3 text-sm font-light">{{ customer.joinedAt }}</td>
              <td class="!p-3 text-sm font-light">{{ customer.completedAt }}</td>
            </tr>
          </tbody>
        </table>
        </div>
        
        <div class="flex items-center justify-between mt-2" v-if="filteredCompleted.length > 0">
          <div class="text-xs text-[#283618]/70">Page {{ currentPageCompleted }} of {{ completedTotalPages }}</div>
          <div class="flex items-center gap-1 flex-wrap">
            <ion-button size="small" fill="clear" :disabled="currentPageCompleted <= 1" @click="currentPageCompleted = Math.max(1, currentPageCompleted - 1)">Prev</ion-button>
            <ion-button v-for="page in completedPages" :key="'d'+page" size="small" :fill="page === currentPageCompleted ? 'solid' : 'clear'" @click="currentPageCompleted = page">{{ page }}</ion-button>
            <ion-button size="small" fill="clear" :disabled="currentPageCompleted >= completedTotalPages" @click="currentPageCompleted = Math.min(completedTotalPages, currentPageCompleted + 1)">Next</ion-button>
          </div>
        </div>
        <div v-else-if="searchQuery" class="text-sm text-gray-500 mt-2">No matching results</div>
      </div>
    </div>
    <div v-else-if="customerTab === 'cancelled'">
      <div class="my-8">
        <div class="table-scroll-wrapper overflow-x-auto">
        <table class="queue-table w-full min-w-max rounded-lg">
          <thead class="border-gray-400 text-[#283618]">
            <tr class="bg-gray-200">
              <th class="!p-3 text-sm tracking-wide text-left font-semibold">
                Queue #
              </th>
              <th class="!p-3 text-sm tracking-wide text-left font-semibold">
                Customer Name
              </th>
              <th class="!p-3 text-sm tracking-wide text-left font-semibold">
                Party Size
              </th>
              <th class="!p-3 text-sm tracking-wide text-left font-semibold">
                Status
              </th>
              <th class="!p-3 text-sm tracking-wide text-left font-semibold">
                Payment
              </th>
              <th class="!p-3 text-sm tracking-wide text-left font-semibold">
                Time in Queue
              </th>
              <th class="!p-3 text-sm tracking-wide text-left font-semibold">
                Cancelled at
              </th>
            </tr>
          </thead>
          <tbody class="border-gray-400 text-[#283618]">
            <tr v-for="(customer, index) in pagedCancelledCustomers" :key="index">
              <td class="!p-3 text-sm font-light">{{ customer.queueNo }}</td>
              <td class="!p-3 text-sm font-light">{{ customer.customerName }}</td>
              <td class="!p-3 text-sm font-light">{{ customer.partySize || '-' }}</td>
              <td class="!p-3 text-sm font-light ">
                <span class="border border-red-300 text-red-700 rounded-xl px-2 font-medium">{{ customer.status }}</span>
              </td>
              <td class="!p-3 text-sm font-light">
                <span class="bg-gray-300 text-gray-800 rounded-xl px-2 font-medium">{{ customer.payment }}</span>
              </td>
              <td class="!p-3 text-sm font-light">{{ customer.waitTime }}</td>
              <td class="!p-3 text-sm font-light">{{ customer.completedAt }}</td>
            </tr>
          </tbody>
        </table>
        </div>
        
        <div class="flex items-center justify-between mt-2" v-if="filteredCancelled.length > 0">
          <div class="text-xs text-[#283618]/70">Page {{ currentPageCancelled }} of {{ cancelledTotalPages }}</div>
          <div class="flex items-center gap-1 flex-wrap">
            <ion-button size="small" fill="clear" :disabled="currentPageCancelled <= 1" @click="currentPageCancelled = Math.max(1, currentPageCancelled - 1)">Prev</ion-button>
            <ion-button v-for="page in cancelledPages" :key="'x'+page" size="small" :fill="page === currentPageCancelled ? 'solid' : 'clear'" @click="currentPageCancelled = page">{{ page }}</ion-button>
            <ion-button size="small" fill="clear" :disabled="currentPageCancelled >= cancelledTotalPages" @click="currentPageCancelled = Math.min(cancelledTotalPages, currentPageCancelled + 1)">Next</ion-button>
          </div>
        </div>
        <div v-else-if="searchQuery" class="text-sm text-gray-500 mt-2">No matching results</div>
      </div>
    </div>

    
    
    <AddCustomerVue
      :is-open="showAddCustomer"
      :menu-items="menuItems"
      :is-service-based="isServiceBased"
      @close="handleCloseAddCustomer"
      @add-customer="addCustomer"/>

  <OrderDetails
  :is-open="showOrderDetails"
  :order="selectedOrder"
  :menu-items="menuItems"
  :is-service-based="isServiceBased"
  @close="showOrderDetails = false"
  @update-customer="handleUpdateCustomer"
  @status-changed="handleStatusChanged"/>
  </div>

</template>

<script>
import{IonSegment, IonSegmentButton, IonButton, IonInput, IonLabel} from '@ionic/vue'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import AddCustomerVue from "../components/AddCustomerModal.vue";
import OrderDetails from '../components/OrderDetails.vue'
import Swal from 'sweetalert2';
import { useCatalog } from '@/composables/useCatalog';
import { useToast } from '@/composables/useToast';
import { listQueue as apiListQueue, joinQueue as apiJoinQueue, updateQueueStatus as apiUpdateQueueStatus } from '@/services/api';
import { connectRealtime, onRealtime } from '@/composables/useRealtime';
import { formatHMS } from '@/utils/time';

export default{
  name: 'CurrentOverviewTable',
  components: {IonSegment, IonSegmentButton, IonButton, IonInput, IonLabel, AddCustomerVue, OrderDetails},
  props: { 
    isServiceBased: { type: Boolean, default: false },
    settingsSummary: { type: Object, default: null }
  },
  emits: ['summary','baselines'],
  // setup: state, realtime bindings, pagination and actions for current/completed/cancelled queues
  setup(props, { emit }) {
  const { toast } = useToast();

  // Handles savedTab
  const savedTab = (typeof window !== 'undefined') ? localStorage.getItem('overviewActiveTab') : null;
  const customerTab = ref(savedTab === 'completed' || savedTab === 'cancelled' ? savedTab : 'current');
  const showAddCustomer = ref(false);

    const showOrderDetails = ref(false);
  const selectedOrder = ref({})
  const completedCustomer = ref([])
  const cancelledCustomer = ref([])
    const searchQuery = ref('')
  const now = ref(new Date())
  let timer

  const unsubs = []
  

  const customerInfo = ref([])


  const pinnedMap = new Map(); // id -> { rowSnapshot, expiresAtMs }

  const lastActiveMap = new Map(); // id -> { rowSnapshot, lastSeenMs }
  const ACTIVE_LEASE_MS = 120000; // 2 minutes lease

  const PAGE_SIZE = 5
  const currentPageCurrent = ref(1)
  const currentPageCompleted = ref(1)
  const currentPageCancelled = ref(1)

  // Handles businessId
  const businessId = (typeof window !== 'undefined') ? localStorage.getItem('businessId') : null;
  const CACHE_KEY = `currentQueueCache:${businessId || 'anon'}`;

// Handles load Cache
  function loadCache(){
    try { const raw = sessionStorage.getItem(CACHE_KEY); if (raw) customerInfo.value = JSON.parse(raw) || []; }
    catch (e) { console.debug('[overview] cache load skipped', e); }
  }

// Handles save Cache
  function saveCache(){
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(customerInfo.value || [])); }
    catch (e) { console.debug('[overview] cache save skipped', e); }
  }

  try { if (CACHE_KEY !== 'currentQueueCache') sessionStorage.removeItem('currentQueueCache'); }
  catch (_) { console.debug('[overview] legacy cache key removal skipped'); }
  let refreshTimer = null
  let pollTimer = null
  let completing = false

// Handles is Serve Disabled
  const isServeDisabled = (row) => {
    const s = String(row?.status || '').toLowerCase();

    return s !== 'in progress' && s !== 'called';
  }





    const catalog = useCatalog(props.isServiceBased ? 'service' : 'food');
    const menuItems = catalog.items; // reactive list from API

// Handles to Items Array
    function toItemsArray(val) {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try { const parsed = JSON.parse(val || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
      }
      if (val && typeof val === 'object') return Array.isArray(val) ? val : [];
      return [];
    }

// Handles load Current
    async function loadCurrent() {
  const rows = await apiListQueue({ status: ['pending','waiting','called','pending_payment','delayed'] });
      try {
        const prevMap = new Map((customerInfo.value || []).map(c => [c.id, c]))
          // Handles mapped
          const mapped = (rows || []).map((r) => {
          // Handles etaBase
          const etaBase = (r.estimated_wait_time != null && !isNaN(Number(r.estimated_wait_time))) ? Number(r.estimated_wait_time) : null;
            // Handles statusLabel
            const statusLabel = (r.status === 'called' ? 'In Progress' : r.status === 'waiting' ? 'Waiting' : r.status === 'pending_payment' ? 'Pending Payment' : r.status === 'delayed' ? 'Delayed' : r.status === 'pending' ? 'Pending' : r.status);
          const prev = prevMap.get(r.id);

          let initialEwt = (etaBase != null ? etaBase : null);
          const stLower = String(statusLabel).toLowerCase();

          // Handles canTickNow
          const canTickNow = ((stLower === 'waiting') || (stLower === 'delayed')) && (props.isServiceBased ? true : (String(r.payment_status).toLowerCase() === 'paid'));
          let initialStart = canTickNow ? Date.now() : null;

            let frozenWaitSeconds = null;
          if (prev) {
            const prevStatus = String(prev.status || '').toLowerCase();
            const currStatus = String(statusLabel || '').toLowerCase();
            const sameStatus = prevStatus === currStatus;
            // Handles prevCanTick
            const prevCanTick = ((prevStatus === 'waiting') || (prevStatus === 'delayed')) && (props.isServiceBased ? true : !!prev.paid);

            if (sameStatus && prev.initialEwt != null && (etaBase == null || Number(prev.initialEwt) === Number(etaBase))) {
              initialEwt = prev.initialEwt;
              initialStart = (canTickNow && prevCanTick && prev.initialStart != null) ? prev.initialStart : (canTickNow ? Date.now() : null);
            } else {

              initialEwt = (etaBase != null ? etaBase : null);
              initialStart = canTickNow ? Date.now() : null;
            }

              if (currStatus === 'in progress') {
                if (typeof prev.frozenWaitSeconds === 'number') {
                  frozenWaitSeconds = Math.max(0, Math.round(prev.frozenWaitSeconds));
                } else if (prev.initialEwt != null && prev.initialStart != null && prevCanTick) {
                  // Handles elapsedMin
                  const elapsedMin = (Date.now() - Number(prev.initialStart)) / 60000;
                  const remSec = Math.max(0, Math.ceil((Number(prev.initialEwt) - elapsedMin) * 60));
                  frozenWaitSeconds = remSec;
                }
              } else if (typeof prev.frozenWaitSeconds === 'number') {

                frozenWaitSeconds = Math.max(0, Math.round(prev.frozenWaitSeconds));
              }
          } else {

            initialEwt = (etaBase != null ? etaBase : null);
            initialStart = canTickNow ? Date.now() : null;
          }
          return {
            id: r.id,
            queueNo: String(r.queue_number).padStart(4, '0'),
            customerName: r.customer_name,
            menuItems: toItemsArray(r.order_items),
            etaBase,
            initialEwt,
            initialStart,
            ewt: etaBase,
            status: statusLabel,
            contactNumber: r.customer_phone,
            email: r.customer_email,
            notes: r.notes || '',
            isPriority: !!r.is_priority,
            paid: r.payment_status === 'paid',
            partySize: r.party_size || null,
              frozenWaitSeconds,

          }
        });

        const typeFiltered = mapped;

        try {
          const nowMs = Date.now();
          for (const [pid, pin] of pinnedMap.entries()) {
            if (!pin || (pin.expiresAtMs && nowMs > pin.expiresAtMs)) { pinnedMap.delete(pid); continue; }
            if (!typeFiltered.some(c => c.id === pid)) {
              typeFiltered.push({ ...pin.rowSnapshot });
            }
          }
        } catch (_) {
          console.debug('[overview] pinnedMap sweep skipped');
        }

        try {
          const nowMs = Date.now();
          for (const r of typeFiltered) {
            if (r && r.id != null) lastActiveMap.set(Number(r.id), { rowSnapshot: { ...r }, lastSeenMs: nowMs });
          }
          for (const [aid, rec] of lastActiveMap.entries()) {
            if (!rec) { lastActiveMap.delete(aid); continue; }
            if (nowMs - (rec.lastSeenMs || 0) > ACTIVE_LEASE_MS) { lastActiveMap.delete(aid); continue; }
            if (!typeFiltered.some(c => c.id === aid)) {
              typeFiltered.push({ ...rec.rowSnapshot });
            }
          }
        } catch (_) {
          console.debug('[overview] lastActiveMap merge skipped');
        }
  if (mapped.length === 0) {

          try {
            const raw = sessionStorage.getItem(CACHE_KEY);
            if (raw) {
              const cached = JSON.parse(raw)||[];
              if (cached.length) customerInfo.value = cached;
            }
          } catch (e) {
            console.debug('[overview] cache restore unavailable', e);
          }
        } else {

          const optimistic = customerInfo.value.filter((c) => c.optimistic === true);
          const merged = typeFiltered.slice();
          for (const opt of optimistic) {
            const dup = merged.some((c) => (opt.id != null && c.id === opt.id) || (opt.queueNo && c.queueNo === opt.queueNo));
            if (!dup) merged.unshift(opt);
          }
          customerInfo.value = merged;
          saveCache();

          try {
            if (showOrderDetails.value && selectedOrder.value) {
              const cur = selectedOrder.value;
              // Handles byId
              const byId = (cur.id != null) ? customerInfo.value.find(c => c.id === cur.id) : null;
              // Handles byQn
              const byQn = (!byId && cur.queueNo) ? customerInfo.value.find(c => c.queueNo === cur.queueNo) : null;
              const updated = byId || byQn;
              if (updated) selectedOrder.value = updated;
            }
          } catch (_) {
            console.debug('[overview] selectedOrder sync skipped');
          }
        }
      } catch (e) {

        console.error('[CurrentOverview] map current failed', e);
      }
    }

// Handles load Served
    async function loadServed() {
  const served = await apiListQueue({ status: 'served' });
      // Handles servedMapped
      const servedMapped = (served || []).map(r => ({
        id: r.id,
        queueNo: String(r.queue_number).padStart(4, '0'),
        customerName: r.customer_name,
        partySize: r.party_size || '-',
        status: 'Completed',
        payment: (r.payment_status === 'paid' ? 'Paid' : 'Pending'),
        waitTime: (r.actual_wait_time ? `${r.actual_wait_time} mins` : '-'),
        joinedAt: r.waiting_at ? new Date(r.waiting_at).toLocaleString() : (r.created_at ? new Date(r.created_at).toLocaleString() : '-'),
        completedAt: r.served_at ? new Date(r.served_at).toLocaleString() : (r.updated_at ? new Date(r.updated_at).toLocaleString() : '-')
      }));

      completedCustomer.value = servedMapped;

      if (currentPageCompleted.value > Math.max(1, Math.ceil(completedCustomer.value.length / PAGE_SIZE))) {
        currentPageCompleted.value = Math.max(1, Math.ceil(completedCustomer.value.length / PAGE_SIZE))
      }
    }

// Handles load Cancelled
    async function loadCancelled() {
  const canc = await apiListQueue({ status: 'cancelled' });
      // Handles cancelledMapped
      const cancelledMapped = (canc || []).map(r => ({
        id: r.id,
        queueNo: String(r.queue_number).padStart(4, '0'),
        customerName: r.customer_name,
        partySize: r.party_size || '-',
        status: 'Cancelled',
        payment: (r.payment_status === 'paid' ? 'Paid' : 'Pending'),
        waitTime: (r.actual_wait_time ? `${r.actual_wait_time} mins` : '-'),
        completedAt: r.updated_at ? new Date(r.updated_at).toLocaleString() : '-'
      }));

      cancelledCustomer.value = cancelledMapped;

      if (Array.isArray(customerInfo.value) && customerInfo.value.length) {
        const cancelledIds = new Set(cancelledMapped.map(c => c.id));
        if (cancelledIds.size) {
          customerInfo.value = customerInfo.value.filter(c => !cancelledIds.has(c.id));
          try { saveCache(); }
          catch (_) { console.debug('[overview] unable to persist cache after cancellation'); }

          try {
            for (const id of cancelledIds.values()) { lastActiveMap.delete(Number(id)); pinnedMap.delete(Number(id)); }
          } catch (e) {
            console.debug('[overview] unable to cleanup maps after cancellation', e);
          }
        }
      }

      if (currentPageCancelled.value > Math.max(1, Math.ceil(cancelledCustomer.value.length / PAGE_SIZE))) {
        currentPageCancelled.value = Math.max(1, Math.ceil(cancelledCustomer.value.length / PAGE_SIZE))
      }
    }
    onMounted(async () => {
  timer = setInterval(() => { now.value = new Date() }, 1000)

  try { loadCache(); }
  catch (e) { console.debug('[overview] initial cache unavailable', e); }

      try {
        await catalog.load();
      } catch(e) {
        console.debug('[overview] catalog preload failed', e);
      }

    try {
  const rows = await apiListQueue({ status: ['pending','waiting','called','pending_payment','delayed'] });
        try {
          const prevMap = new Map((customerInfo.value || []).map(c => [c.id, c]))
          // Handles mappedRows
          const mappedRows = (rows || []).map((r) => {
            // Handles etaBase
            const etaBase = (r.estimated_wait_time != null && !isNaN(Number(r.estimated_wait_time))) ? Number(r.estimated_wait_time) : null;
            // Handles statusLabel
            const statusLabel = (r.status === 'called' ? 'In Progress' : r.status === 'waiting' ? 'Waiting' : r.status === 'delayed' ? 'Delayed' : r.status === 'pending' ? 'Pending' : r.status);
            const prev = prevMap.get(r.id);

            let initialEwt = (etaBase != null ? etaBase : null);
            const stLower = String(statusLabel).toLowerCase();
            // Handles canTickNow
            const canTickNow = ((stLower === 'waiting') || (stLower === 'delayed')) && (props.isServiceBased ? true : (String(r.payment_status).toLowerCase() === 'paid'));
            let initialStart = canTickNow ? Date.now() : null;
            let frozenWaitSeconds = null;
            if (prev) {
              const prevStatus = String(prev.status || '').toLowerCase();
              const currStatus = String(statusLabel || '').toLowerCase();
              const sameStatus = prevStatus === currStatus;
              // Handles prevCanTick
              const prevCanTick = ((prevStatus === 'waiting') || (prevStatus === 'delayed')) && (props.isServiceBased ? true : !!prev.paid);
              if (sameStatus && prev.initialEwt != null && (etaBase == null || Number(prev.initialEwt) === Number(etaBase))) {
                initialEwt = prev.initialEwt;
                initialStart = (canTickNow && prevCanTick && prev.initialStart != null) ? prev.initialStart : (canTickNow ? Date.now() : null);
              } else {
                initialEwt = (etaBase != null ? etaBase : null);
                initialStart = canTickNow ? Date.now() : null;
              }
              if (currStatus === 'in progress') {
                if (typeof prev.frozenWaitSeconds === 'number') {
                  frozenWaitSeconds = Math.max(0, Math.round(prev.frozenWaitSeconds));
                } else if (prev.initialEwt != null && prev.initialStart != null && prevCanTick) {
                  // Handles elapsedMin
                  const elapsedMin = (Date.now() - Number(prev.initialStart)) / 60000;
                  const remSec = Math.max(0, Math.ceil((Number(prev.initialEwt) - elapsedMin) * 60));
                  frozenWaitSeconds = remSec;
                }
              } else if (typeof prev.frozenWaitSeconds === 'number') {
                frozenWaitSeconds = Math.max(0, Math.round(prev.frozenWaitSeconds));
              }
            }
            return {
              id: r.id,
              queueNo: String(r.queue_number).padStart(4, '0'),
              customerName: r.customer_name,
              menuItems: toItemsArray(r.order_items),
              etaBase,
              initialEwt,
              initialStart,
              ewt: etaBase,
              status: statusLabel,
              contactNumber: r.customer_phone,
              email: r.customer_email,
              notes: r.notes || '',
              isPriority: !!r.is_priority,
              paid: r.payment_status === 'paid',
              frozenWaitSeconds,

            }
          });
          const typeFiltered = mappedRows; 
          if (mappedRows.length === 0) {

            try {
              const raw = sessionStorage.getItem(CACHE_KEY);
              if (raw) {
                const cached = JSON.parse(raw)||[];
                if (cached.length) customerInfo.value = cached;
              }
            } catch (e) { console.debug('[overview] cache restore skipped', e); }
          } else {

            const merged = typeFiltered.slice();
            try {
              const raw = sessionStorage.getItem(CACHE_KEY);
              if (raw) {
                const cached = JSON.parse(raw) || [];
                const optimistic = cached.filter((c) => c && c.optimistic === true);
                for (const opt of optimistic) {
                  if (!merged.some((c) => (c.id && opt.id && c.id === opt.id) || (c.queueNo && opt.queueNo && c.queueNo === opt.queueNo))) {
                    merged.unshift(opt);
                  }
                }
              }
            } catch (e) { console.debug('[overview] optimistic cache merge skipped', e); }
            customerInfo.value = merged;
            saveCache();
          }
  } catch (e) { console.error('[CurrentOverview] initial map failed', e); }

        try {
          const served = await apiListQueue({ status: 'served' });
          // Handles servedMapped
          const servedMapped = (served || []).map(r => ({
            id: r.id,
            queueNo: String(r.queue_number).padStart(4, '0'),
            customerName: r.customer_name,
            partySize: r.party_size || '-',
            status: 'Completed',
            payment: (r.payment_status === 'paid' ? 'Paid' : 'Pending'),
            joinedAt: r.waiting_at ? new Date(r.waiting_at).toLocaleString() : '-',
            completedAt: r.served_at ? new Date(r.served_at).toLocaleString() : (r.updated_at ? new Date(r.updated_at).toLocaleString() : '-')
          }));

          completedCustomer.value = servedMapped;
  } catch(e) { console.debug('[overview] served list refresh failed', e); }

        try {
          const canc = await apiListQueue({ status: 'cancelled' });
          // Handles cancelledMapped
          const cancelledMapped = (canc || []).map(r => ({
            id: r.id,
            queueNo: String(r.queue_number).padStart(4, '0'),
            customerName: r.customer_name,
            partySize: r.party_size || '-',
            status: 'Cancelled',
            payment: (r.payment_status === 'paid' ? 'Paid' : 'Pending'),
            waitTime: (r.actual_wait_time ? `${r.actual_wait_time} mins` : '-'),
            completedAt: r.updated_at ? new Date(r.updated_at).toLocaleString() : '-'
          }));

          cancelledCustomer.value = cancelledMapped;
  } catch(e) { console.debug('[overview] cancelled list refresh failed', e); }
      } catch (e) { console.debug('[overview] initial load error', e); }

      try { connectRealtime(); } catch (e) { console.debug('[overview] realtime connect skipped', e); }

// Handles refresh All
      const refreshAll = async () => {
        try { await loadCurrent(); } catch (e) { console.debug('[overview] loadCurrent refresh failed', e); }
        try { await loadServed(); } catch (e) { console.debug('[overview] loadServed refresh failed', e); }
        try { await loadCancelled(); } catch (e) { console.debug('[overview] loadCancelled refresh failed', e); }
      };


      try {
  unsubs.push(onRealtime('queue:joined', (payload) => {
          try {
            const bizIdStr = businessId ? String(businessId) : null;
            const evtBizStr = payload && payload.business_id != null ? String(payload.business_id) : null;
            if (bizIdStr && evtBizStr && bizIdStr !== evtBizStr) {
              console.debug('[overview] queue:joined ignored for different business');
            } else {
              const newId = payload && payload.id != null ? Number(payload.id) : null;
              const newQn = payload && payload.queue_number != null ? String(payload.queue_number).padStart(4, '0') : null;
              // Handles exists
              const exists = (customerInfo.value || []).some((c) => (newId != null && c.id === newId) || (newQn && c.queueNo === newQn));
              if (!exists) {

                const items = Array.isArray(payload?.order_items) ? payload.order_items : [];
                customerInfo.value.unshift({
                  id: newId,
                  queueNo: newQn || '----',
                  customerName: payload?.customer_name || '(New customer)',
                  menuItems: items,
                  etaBase: null,
                  initialEwt: null,
                  initialStart: Date.now(),
                  ewt: null,
                  status: payload?.status === 'waiting' ? 'Waiting' : payload?.status === 'called' ? 'In Progress' : payload?.status === 'delayed' ? 'Delayed' : 'Pending',
                  contactNumber: payload?.customer_phone || '',
                  email: payload?.customer_email || '',
                  notes: payload?.notes || '',
                  isPriority: !!payload?.is_priority,
                  paid: String(payload?.payment_status || 'pending') === 'paid',
                  partySize: (payload?.party_size != null ? Number(payload.party_size) : null),
                  optimistic: true
                });
                currentPageCurrent.value = 1;
                try { saveCache(); } catch (_) { console.debug('[overview] cache write skipped'); }
              }
            }
          } catch (_) {
            console.debug('[overview] queue:joined optimistic insert skipped');
          }
          clearTimeout(refreshTimer);
          refreshTimer = setTimeout(refreshAll, 200);
        }));
      } catch (e) { console.debug('[overview] queue:joined subscription failed', e); }
  try { unsubs.push(onRealtime('queue:status', (payload) => {
        try {
          if (!payload || payload.business_id == null) return;
          const bizIdStr = businessId ? String(businessId) : null;
          const evtBizStr = String(payload.business_id);
          if (bizIdStr && evtBizStr && bizIdStr !== evtBizStr) return;

          if (String(payload.status||'').toLowerCase() === 'delayed') {
            // Handles idx
            const idx = (customerInfo.value||[]).findIndex(c => c.id === Number(payload.id));
            if (idx >= 0) {
              const row = customerInfo.value[idx];
              // Handles newEta
              const newEta = (payload.estimated_wait_time!=null?Number(payload.estimated_wait_time):row.etaBase);
              const paid = row.paid || String(payload.payment_status||'').toLowerCase() === 'paid';
              customerInfo.value[idx] = {
                ...row,
                status: 'Delayed',
                etaBase: newEta,
                initialEwt: newEta,
                initialStart: paid ? (row.initialStart || Date.now()) : row.initialStart,
                ewt: newEta
              };
              try { saveCache(); }
              catch(_) { console.debug('[overview] cache write skipped'); }

              pinnedMap.set(Number(payload.id), { rowSnapshot: customerInfo.value[idx], expiresAtMs: Date.now() + 10000 });

              lastActiveMap.set(Number(payload.id), { rowSnapshot: { ...customerInfo.value[idx] }, lastSeenMs: Date.now() });
            } else if (payload.id != null) {

              const snap = {
                id: Number(payload.id),
                queueNo: payload.queue_number != null ? String(payload.queue_number).padStart(4,'0') : '----',
                customerName: '(Updating...)',
                menuItems: [],
                etaBase: payload.estimated_wait_time != null ? Number(payload.estimated_wait_time) : null,
                initialEwt: payload.estimated_wait_time != null ? Number(payload.estimated_wait_time) : null,
                initialStart: (String(payload.payment_status||'').toLowerCase() === 'paid') ? Date.now() : null,
                ewt: payload.estimated_wait_time != null ? Number(payload.estimated_wait_time) : null,
                status: 'Delayed',
                contactNumber: '', email: '', notes: '', isPriority: false, paid: false,
                partySize: null
              };
              customerInfo.value.unshift(snap);
              pinnedMap.set(Number(payload.id), { rowSnapshot: snap, expiresAtMs: Date.now() + 10000 });
              lastActiveMap.set(Number(payload.id), { rowSnapshot: { ...snap }, lastSeenMs: Date.now() });
            }
          } else if (String(payload.status||'').toLowerCase() === 'called') {

            // Handles idx
            const idx = (customerInfo.value||[]).findIndex(c => c.id === Number(payload.id));
            if (idx >= 0) {
              const row = customerInfo.value[idx];
              let frozen = row.frozenWaitSeconds;
              if (typeof frozen !== 'number') {

                const canTick = props.isServiceBased ? true : !!row.paid;
                if (row.initialEwt != null && row.initialStart != null && canTick) {
                  // Handles elapsedMin
                  const elapsedMin = (Date.now() - Number(row.initialStart)) / 60000;
                  frozen = Math.max(0, Math.ceil((Number(row.initialEwt) - elapsedMin) * 60));
                } else if (row.etaBase != null) {
                  frozen = Math.max(0, Math.round(Number(row.etaBase) * 60));
                } else {
                  frozen = 0;
                }
              }
              customerInfo.value[idx] = { ...row, status: 'In Progress', frozenWaitSeconds: frozen, initialStart: null };
              try { saveCache(); }
              catch(_) { console.debug('[overview] cache write skipped'); }

              lastActiveMap.set(Number(payload.id), { rowSnapshot: { ...customerInfo.value[idx] }, lastSeenMs: Date.now() });
            }
          } else if (String(payload.status||'').toLowerCase() === 'served' || String(payload.status||'').toLowerCase() === 'cancelled') {

            try { lastActiveMap.delete(Number(payload.id)); pinnedMap.delete(Number(payload.id)); }
            catch(_) { console.debug('[overview] status cleanup skipped'); }
          }
        } catch(_) { console.debug('[overview] queue:status processing skipped'); }
        refreshAll();
      })); } catch (e) { console.debug('[overview] queue:status subscription failed', e); }

  try {
    unsubs.push(onRealtime('queue:updated', (ev) => {
      try {
        if (!ev || ev.business_id == null) return;
        const bizIdStr = businessId ? String(businessId) : null;
        const evtBizStr = String(ev.business_id);
        if (bizIdStr && evtBizStr && bizIdStr !== evtBizStr) return;
        const idNum = Number(ev.id);
        if (!idNum) return;
        // Handles idx
        const idx = (customerInfo.value || []).findIndex(c => c.id === idNum);
        if (idx >= 0 && ev.estimated_wait_time != null) {
          const row = customerInfo.value[idx];
          const eta = Number(ev.estimated_wait_time);
          const st = String(row.status || '').toLowerCase();
          // Handles canTick
          const canTick = ((st === 'waiting') || (st === 'delayed')) && (props.isServiceBased ? true : !!row.paid);
          customerInfo.value[idx] = {
            ...row,
            etaBase: eta,
            initialEwt: eta,
            initialStart: canTick ? Date.now() : null,
            ewt: eta
          };
          try { saveCache(); }
          catch(_) { console.debug('[overview] cache write skipped'); }

          try { lastActiveMap.set(idNum, { rowSnapshot: { ...customerInfo.value[idx] }, lastSeenMs: Date.now() }); }
          catch(_) { console.debug('[overview] lease refresh skipped'); }

          
          try {
            if (showOrderDetails.value && selectedOrder.value && (Number(selectedOrder.value.id) === idNum || String(selectedOrder.value.queueNo) === String(row.queueNo))) {
              const cur = selectedOrder.value;
              const merged = {
                ...cur,
                etaBase: eta,
                initialEwt: eta,
                initialStart: canTick ? Date.now() : null
              };
              selectedOrder.value = merged;
            }
          } catch (_) { console.debug('[overview] selectedOrder ETA sync skipped'); }
        }
      } catch (_) { console.debug('[overview] queue:updated processing skipped'); }
    }));
  } catch (_) { console.debug('[overview] queue:updated subscription failed'); }
  try { unsubs.push(onRealtime('settings:updated', refreshAll)); } catch (e) { console.debug('[overview] settings subscription failed', e); }

      try {
        if (pollTimer) clearInterval(pollTimer);
        pollTimer = setInterval(async () => {
          try { await loadCurrent(); }
          catch (_) { console.debug('[overview] poll loadCurrent failed'); }
        }, 5000);
      } catch (_) { console.debug('[overview] poll setup failed'); }
  });
  onUnmounted(()=>{
    if (timer) clearInterval(timer);
    if (refreshTimer) clearTimeout(refreshTimer);
    if (pollTimer) clearInterval(pollTimer);
    try {
      unsubs.forEach(fn => {
        try { fn(); }
        catch (e) { console.debug('[overview] unsubscribe failed', e); }
      });
    } catch (e) {
      console.debug('[overview] unsubscribe sweep failed', e);
    }
  })

  const formattedNow = computed(() => now.value.toLocaleString())



// Handles remaining Seconds
  const remainingSeconds = (row) => {
    if (!row) return 0;
    // Handles base
    const base = (row.initialEwt != null ? Number(row.initialEwt) : (typeof row.etaBase === 'number' ? row.etaBase : null));
    if (base == null) return 0;

    const st = String(row.status || '').toLowerCase();
    const isPaid = !!row.paid;
    const start = Number(row.initialStart || 0);
    if ((st === 'waiting' || st === 'delayed') && ((props.isServiceBased ? true : isPaid)) && start) {
      const raw = base - ((now.value.getTime() - start) / 60000);
      return Math.max(0, Math.ceil(raw * 60));
    }

    if (typeof row.frozenWaitSeconds === 'number') return Math.max(0, Math.round(row.frozenWaitSeconds));
    return Math.max(0, Math.round(Number(base) * 60));
  };
  // Handles remainingFor
  const remainingFor = (row) => formatHMS(remainingSeconds(row));



// Handles is Today Date
  function isTodayDate(d) {
    if (!d) return false;
    // Handles dt
    const dt = (d instanceof Date) ? d : new Date(d);
    if (isNaN(dt.getTime())) return false;
    const nd = new Date();
    return dt.getFullYear() === nd.getFullYear() && dt.getMonth() === nd.getMonth() && dt.getDate() === nd.getDate();
  }

// Handles build Summary
  function buildSummary() {

    // Handles waiting
    const waiting = (customerInfo.value || []).filter(c => String(c.status).toLowerCase() === 'waiting');
    const waitsSec = waiting.map(remainingSeconds).filter(v => typeof v === 'number' && !isNaN(v));
    const avgSec = waitsSec.length ? Math.round(waitsSec.reduce((a,b)=>a+b,0) / waitsSec.length) : 0;

    const avgWait = Math.round(avgSec / 60);
    // Handles completedToday
    const completedToday = (completedCustomer.value || []).filter(c => isTodayDate(c.completedAt)).length;
    // Handles cancelledToday
    const cancelledToday = (cancelledCustomer.value || []).filter(c => isTodayDate(c.completedAt)).length;
    // Handles waitingPaid
    const waitingPaid = (customerInfo.value || []).filter(c => (String(c.status).toLowerCase() === 'waiting') && !!c.paid).length;

    const totalCustomers = completedToday + cancelledToday;
    return { totalCustomers, avgWait, completedToday, cancelledToday, waitingPaid };
  }

// Handles emit Summary
  function emitSummary() { try { emit('summary', buildSummary()) } catch (_) { console.debug('[overview] summary emit skipped'); } }


// Handles build Baselines
  function buildBaselines() {
    const map = {};
    for (const row of (customerInfo.value || [])) {
      if (!row || row.id == null) continue;
      map[row.id] = { initialEwt: row.initialEwt, initialStart: row.initialStart, status: row.status };
    }
    return map;
  }

// Handles emit Baselines
  function emitBaselines() { try { emit('baselines', buildBaselines()) } catch (_) { console.debug('[overview] baselines emit skipped'); } }


  watch(customerTab, (tab) => {
    try { localStorage.setItem('overviewActiveTab', tab); }
    catch (e) { console.debug('[overview] active tab persist skipped', e); }
  });

  watch(customerInfo, () => { emitSummary(); emitBaselines(); }, { deep: true })
  watch(completedCustomer, emitSummary, { deep: true })
  watch(cancelledCustomer, emitSummary, { deep: true })
  watch(now, emitSummary)


  // Handles addCustomer
  const addCustomer = async (form) => {

    const durationMap = new Map((menuItems.value || []).map(m => [m.id, (m.duration != null ? Number(m.duration) : null)]));
    // Handles order_items
    const order_items = (form.selectedItems || []).map((i) => ({
      id: i.id,
      name: i.name,
      price: Number(i.price),
      quantity: i.quantity || 1,
      duration: durationMap.get(i.id) ?? null
    }));
    const order_total = order_items.reduce((sum, i) => sum + Number(i.price) * (i.quantity||1), 0);

    try {
      const result = await apiJoinQueue({
        customer_name: form.customerName,
        customer_email: form.email || null,
        customer_phone: form.contactNumber || null,
        order_items,
        order_total,
        party_size: form.partySize || null,
        is_priority: !!form.isPriority,
        notes: form.notes || null
      });

      const qnStr = String(result.queue_number).padStart(4, '0');
      // Handles dup
      const dup = (customerInfo.value || []).some(c => (c.id && c.id === result.id) || (c.queueNo && c.queueNo === qnStr));
      if (!dup) customerInfo.value.unshift({
        id: result.id,
        queueNo: qnStr,
        customerName: form.customerName,
        menuItems: order_items,
        etaBase: null,
        etaUpdated: Date.now(),
        joinedAtMs: Date.now(),
        ewt: null,
  status: props.isServiceBased ? 'Waiting' : 'Pending',
        contactNumber: form.contactNumber,
        email: form.email,
        notes: form.notes,
        partySize: form.partySize,
        quantity: form.quantity,
        isPriority: !!(result.is_priority),
        paid: false,
        optimistic: true
      });
      currentPageCurrent.value = 1

  try { saveCache(); }
  catch (e) { console.debug('[overview] cache write skipped', e); }
      toast('Customer added successfully');
      showAddCustomer.value = false; // Close modal only on success
    } catch (e) {

      // Handles apiMsg
      const apiMsg = (e && e.response && e.response.data && (e.response.data.message || e.response.data.error)) ? String(e.response.data.message || e.response.data.error) : '';
      const raw = apiMsg || String(e?.message || 'Failed to add customer');
      toast(raw.replace(/^Server\s+\d+:\s*/i, ''), 'error');
    }


  }


  const selected = computed(() => menuItems.value.filter(i => i.checked))




// Handles handle Show Add Customer
    const handleShowAddCustomer = ()=>{
      showAddCustomer.value = true;
    } 
// Handles handle Close Add Customer
    const handleCloseAddCustomer = () => {
      showAddCustomer.value = false;
    }


// Handles handle Order Details
    const handleOrderDetails = async (customer) =>{
      const needsHydration = !customer || customer.optimistic === true || !customer.customerName || !Array.isArray(customer.menuItems) || customer.menuItems.length === 0;
      let target = customer;
      if (needsHydration) {
  try { await loadCurrent(); }
  catch (_) { console.debug('[overview] hydrate current failed'); }
        if (customer) {
          // Handles byId
          const byId = (customer.id != null) ? customerInfo.value.find(c => c.id === customer.id) : null;
          // Handles byQn
          const byQn = (!byId && customer.queueNo) ? customerInfo.value.find(c => c.queueNo === customer.queueNo) : null;
          target = byId || byQn || customer;
        }
      }
      selectedOrder.value = target;
      showOrderDetails.value = true
    } 


// Handles complete Customer
    const completeCustomer = async (row) =>{
      if (completing) return;
      if (!row || isServeDisabled(row)) {
        const s = String(row?.status || '').toLowerCase()
        const msg = s === 'waiting' ? 'Please call the order before serving' : 'Cannot mark as served while not called';
  return Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: msg, timer: 1600, showConfirmButton: false })
      }

      const index = customerInfo.value.findIndex(c => (row && (c.id === row.id || c.queueNo === row.queueNo)));
      const customer = index >= 0 ? customerInfo.value[index] : null
      if (!customer) return;
      const res = await Swal.fire({
        title: props.isServiceBased ? 'Set to Pending Payment?' : 'Mark as served?',
        text: props.isServiceBased ? 'Customer will proceed to payment. Entry stays in Current until payment completes.' : 'This will move the order to Completed.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: props.isServiceBased ? 'Yes' : 'Yes, served',
        cancelButtonText: 'No',
        heightAuto: false
      });
      if (!res.isConfirmed) return;
      completing = true
      try {
        if (props.isServiceBased) {

          await apiUpdateQueueStatus(customer.id, { status: 'pending_payment' });

          customerInfo.value[index] = { ...customer, status: 'Pending Payment' };
          try { saveCache(); }
          catch(_) { console.debug('[overview] cache write skipped'); }
          completing = false;
          return Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Set to Pending Payment', timer: 1500, timerProgressBar: true, showConfirmButton: false });
        } else {

          await apiUpdateQueueStatus(customer.id, { status: 'served' })
        }
      } catch (e) {
        completing = false
  return Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: e?.message || 'Failed to mark as served', timer: 2000, timerProgressBar: true, showConfirmButton: false })
      }
      if (!props.isServiceBased) {
        const moved = { ...customer, status: 'Completed', payment: customer.paid ? 'Paid' : 'Pending', completedAt: new Date().toLocaleString() };
        completedCustomer.value.push(moved)
        customerInfo.value.splice(index, 1)

  try { saveCache(); }
  catch(_) { console.debug('[overview] cache write skipped'); }

  try { await loadServed(); }
  catch(_) { console.debug('[overview] loadServed refresh failed'); }
      }
      completing = false
      if (!props.isServiceBased) Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Order marked as served', timer: 1500, timerProgressBar: true, showConfirmButton: false });
    }

    const filteredCustomers = computed(() =>{
      if(!searchQuery.value){
        return customerInfo.value
      }
      const q = String(searchQuery.value || '').toLowerCase();
      return customerInfo.value.filter(customer =>
        String(customer.customerName || '').toLowerCase().includes(q) || String(customer.queueNo || '').includes(q)
      )
    })


    const currentTotalPages = computed(() => Math.max(1, Math.ceil((filteredCustomers.value?.length || 0) / PAGE_SIZE)))

    const filteredCompleted = computed(() => {
      if (!searchQuery.value) return completedCustomer.value
      const q = String(searchQuery.value || '').toLowerCase()
      return completedCustomer.value.filter(c => String(c.customerName||'').toLowerCase().includes(q) || String(c.queueNo||'').includes(q))
    })
    const filteredCancelled = computed(() => {
      if (!searchQuery.value) return cancelledCustomer.value
      const q = String(searchQuery.value || '').toLowerCase()
      return cancelledCustomer.value.filter(c => String(c.customerName||'').toLowerCase().includes(q) || String(c.queueNo||'').includes(q))
    })
    const completedTotalPages = computed(() => Math.max(1, Math.ceil((filteredCompleted.value?.length || 0) / PAGE_SIZE)))
    const cancelledTotalPages = computed(() => Math.max(1, Math.ceil((filteredCancelled.value?.length || 0) / PAGE_SIZE)))
    const currentPages = computed(() => Array.from({ length: currentTotalPages.value }, (_, i) => i + 1))
    const completedPages = computed(() => Array.from({ length: completedTotalPages.value }, (_, i) => i + 1))
    const cancelledPages = computed(() => Array.from({ length: cancelledTotalPages.value }, (_, i) => i + 1))
    const pagedCurrentCustomers = computed(() => {
      // Handles start
      const start = (currentPageCurrent.value - 1) * PAGE_SIZE
      return filteredCustomers.value.slice(start, start + PAGE_SIZE)
    })
    const pagedCompletedCustomers = computed(() => {
      // Handles start
      const start = (currentPageCompleted.value - 1) * PAGE_SIZE
      return filteredCompleted.value.slice(start, start + PAGE_SIZE)
    })
    const pagedCancelledCustomers = computed(() => {
      // Handles start
      const start = (currentPageCancelled.value - 1) * PAGE_SIZE
      return filteredCancelled.value.slice(start, start + PAGE_SIZE)
    })


    watch(searchQuery, () => { currentPageCurrent.value = 1 })
    watch(filteredCustomers, () => {
      const total = Math.max(1, Math.ceil((filteredCustomers.value?.length || 0) / PAGE_SIZE))
      if (currentPageCurrent.value > total) currentPageCurrent.value = total
      if (currentPageCurrent.value < 1) currentPageCurrent.value = 1
    })
    watch([searchQuery, () => completedCustomer.value.length], () => {
      const total = Math.max(1, Math.ceil((filteredCompleted.value?.length || 0) / PAGE_SIZE))
      if (currentPageCompleted.value > total) currentPageCompleted.value = total
      if (currentPageCompleted.value < 1) currentPageCompleted.value = 1
    })
    watch([searchQuery, () => cancelledCustomer.value.length], () => {
      const total = Math.max(1, Math.ceil((filteredCancelled.value?.length || 0) / PAGE_SIZE))
      if (currentPageCancelled.value > total) currentPageCancelled.value = total
      if (currentPageCancelled.value < 1) currentPageCancelled.value = 1
    })
    watch(customerTab, () => {

      if (customerTab.value === 'current') currentPageCurrent.value = 1
      if (customerTab.value === 'completed') currentPageCompleted.value = 1
      if (customerTab.value === 'cancelled') currentPageCancelled.value = 1
    })



// Handles handle Update Customer
    const handleUpdateCustomer = (updateCustomer) =>{

      selectedOrder.value = { ...selectedOrder.value, ...updateCustomer };

      const idx = customerInfo.value.findIndex(c => (selectedOrder.value.id && c.id === selectedOrder.value.id) || c.queueNo === selectedOrder.value.queueNo);
      if (idx !== -1) {
        const row = customerInfo.value[idx];
        row.customerName = updateCustomer.customerName ?? row.customerName;
        row.contactNumber = updateCustomer.contactNumber ?? row.contactNumber;
        row.notes = updateCustomer.notes ?? row.notes;
        if (Array.isArray(updateCustomer.menuItems)) row.menuItems = updateCustomer.menuItems;
        if (typeof updateCustomer.isPriority === 'boolean') row.isPriority = updateCustomer.isPriority;
        if (updateCustomer.option) row.option = updateCustomer.option;
        if (updateCustomer.partySize != null) row.partySize = updateCustomer.partySize;
      }
    }


// Handles handle Status Changed
  const handleStatusChanged = ({ id, status, paid }) => {

      const idx = customerInfo.value.findIndex(c => c.id === id || c.queueNo === selectedOrder.value.queueNo);
      if (idx !== -1) {
        if (status === 'served' || status === 'cancelled') {

          const removed = customerInfo.value.splice(idx, 1)[0]
          if (removed) {
            if (status === 'cancelled') {
              cancelledCustomer.value.push({
                ...removed,
                status: 'Cancelled',
                payment: removed.paid ? 'Paid' : 'Pending',
                completedAt: new Date().toLocaleString()
              })
            } else if (status === 'served') {
              completedCustomer.value.push({
                ...removed,
                status: 'Completed',
                payment: removed.paid ? 'Paid' : 'Pending',
                completedAt: new Date().toLocaleString()
              })
            }
          }
          try { saveCache(); }
          catch (_) { console.debug('[overview] cache write skipped'); }
        } else {

          customerInfo.value[idx].status = (status === 'called') ? 'In Progress' : (status === 'waiting') ? 'Waiting' : (status === 'delayed') ? 'Delayed' : (status === 'pending') ? 'Pending' : (status === 'pending_payment' ? 'Pending Payment' : status)
          if (status === 'waiting' || paid === true) customerInfo.value[idx].paid = true

          if (status === 'waiting') customerInfo.value[idx].etaUpdated = Date.now()
        }
      }

      if (status === 'served' || status === 'cancelled') {
        showOrderDetails.value = false
      } else if (status === 'waiting') {

        selectedOrder.value = { ...selectedOrder.value, paid: true };
      } else if (status === 'pending_payment') {

        selectedOrder.value = { ...selectedOrder.value, status: 'Pending Payment' };
      }
    }

    const waitingPaidCount = computed(() => (customerInfo.value || []).filter(c => (String(c.status).toLowerCase() === 'waiting') && !!c.paid).length)
    const waitingCount = computed(() => (customerInfo.value || []).filter(c => {
      const s = String(c.status).toLowerCase();
      return s === 'waiting' || s === 'delayed';
    }).length)
    const addDisabled = computed(() => {
      const maxLen = Number(props.settingsSummary?.maxQueueLength || 0);
      if (!maxLen) return false; // no limit configured

      return (props.isServiceBased ? waitingCount.value : waitingPaidCount.value) >= maxLen;
    })

    return{
      customerInfo,
      customerTab,
      showAddCustomer,
      menuItems,
      selected,
      showOrderDetails,
      selectedOrder,
  completedCustomer,
  cancelledCustomer,
      completeCustomer,
      filteredCustomers,
      filteredCompleted,
      filteredCancelled,
    addDisabled,

    PAGE_SIZE,
    currentPageCurrent,
    currentPageCompleted,
    currentPageCancelled,
    currentTotalPages,
    completedTotalPages,
    cancelledTotalPages,
    currentPages,
    completedPages,
    cancelledPages,
    pagedCurrentCustomers,
    pagedCompletedCustomers,
    pagedCancelledCustomers,
      searchQuery,
  formattedNow,
      addCustomer,
      handleShowAddCustomer,
  handleCloseAddCustomer,
      handleOrderDetails,
      handleUpdateCustomer,
      handleStatusChanged,
      isServeDisabled,
      remainingFor
    }
  }
}
</script>

<style scoped>
/* Horizontal scroll container for tables */
.table-scroll-wrapper {
  overflow-x: auto;
}

/* Preserve current UI styles, but avoid wrapping so columns stay intact */
.queue-table {
  border-collapse: separate;
  border-spacing: 0;
  white-space: nowrap;
}

/* Keep header aligned while horizontally scrolling (sticky inside the scroller) */
.queue-table thead th {
  position: sticky;
  top: 0;
  z-index: 1; /* sit above rows */
}

/* Keep first column (Queue #) visible while horizontally scrolling */
.queue-table td:first-child {
  position: sticky;
  left: 0;
  z-index: 1;
  /* subtle themed tint to distinguish sticky column */
  background-color: rgba(254, 250, 224, 0.9); /* #FEFAE0 at ~90% */
  min-width: 5.5rem; /* space for star icon + 4-digit number */
  box-shadow: 2px 0 0 rgba(0, 0, 0, 0.06); /* subtle divider on the right */
}
.queue-table thead th:first-child {
  position: sticky;
  left: 0;
  z-index: 3; /* higher than body cells and other headers */
  /* inherit header bg (row has bg-gray-200), don't force white here */
  box-shadow: 2px 0 0 rgba(0, 0, 0, 0.06);
}

/* Ensure last column (Action) remains accessible without wrapping */
.queue-table th:last-child,
.queue-table td:last-child {
  white-space: nowrap;
}

/* Make scrollbars visible but subtle on WebKit */
.table-scroll-wrapper::-webkit-scrollbar {
  height: 8px;
}
.table-scroll-wrapper::-webkit-scrollbar-thumb {
  background: rgba(40, 54, 24, 0.35); /* themed subtle green */
  border-radius: 4px;
}
.table-scroll-wrapper::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.06);
}

/* Firefox scrollbar (uses CSS Scrollbar spec) */
.table-scroll-wrapper {
  scrollbar-color: rgba(40, 54, 24, 0.35) rgba(0, 0, 0, 0.06);
  scrollbar-width: thin;
}
</style>
