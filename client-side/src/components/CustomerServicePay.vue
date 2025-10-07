<template>
  <div class="flex justify-center items-center bg-[#FEFAE0] min-h-screen">
    <div id="poppins" class="px-3">
      <div class="my-4 text-[#283618]">
        <p class="text-4xl font-bold text-center">{{ business }}</p>
        <p class="text-center">Your Queue Status</p>
      </div>

      <div
        class="flex gap-3 justify-between items-center text-[#283618] my-4 bg-white shadow-lg rounded-lg py-2 px-3"
      >
        <div>
          <p class="text-xs font-medium">
            Now Serving:
            <span class="font-bold text-sm text-[#bc6c25]">{{
              nowServing
            }}</span>
          </p>
          <p class="text-xs font-medium">
            <span>
              <font-awesome-icon
                :icon="['fas', 'users']"
                class="text-sm me-1" /></span
            >Current queue:
            <span class="font-bold text-sm">{{ currentInQueue }} people</span>
          </p>
        </div>
        <div>
          <p>
            <span>
              <font-awesome-icon
                :icon="['fas', 'clock']"
                class="text-sm text-gray-400 me-2" /></span
            ><span class="text-xs">{{ time }}</span>
          </p>
          <p>
            <span>
              <font-awesome-icon
                :icon="['fas', 'calendar']"
                class="text-sm text-gray-400 me-2" /></span
            ><span class="text-xs">{{ date }}</span>
          </p>
        </div>
      </div>

      <div
        style="--background: transparent"
        class="bg-[#283618] rounded-lg p-2 mt-1 text-[#FEFAE0]"
      >
        <div class="mb-3 mt-1 text-center">
          <p class="font-light text-lg">Queue Number</p>
          <p v-if="!displayQueueNo" class="text-3xl font-bold text-[#E4E05D]">Pending</p>
          <p v-else class="font-bold text-4xl">{{ displayQueueNo }}</p>
        </div>
        <div
          class="mb-3 bg-[#d9d9d910] border border-[#DDA15E] rounded-lg px-3 pt-1 pb-2"
        >
          <div class="flex justify-between items-center mt-2 mb-3">
            <div>
              <p class="font-semibold">Status:</p>
            </div>
            <div class="flex items-center gap-2">
              <p
                :class="{
                  'border border-[#DDA15E] bg-yellow-200 text-[#BC6C25] rounded-full px-2 font-semibold text-sm':
                    statusLabel === 'Pending Payment' || statusLabel === 'Processing',
                  'bg-[#BDF0BC] text-[#5C985B] rounded-full px-3 font-semibold text-sm flex gap-1':
                    statusLabel.includes('Paid') || statusLabel === 'Payment Complete',
                  'bg-[#FEFAE0] text-[#5C985B] rounded-full px-8 font-semibold text-sm':
                    statusLabel === 'Served',
                }"
              >
                <span v-if="statusLabel.includes('Paid') || statusLabel === 'Payment Complete'"
                  ><font-awesome-icon :icon="['fas', 'check']"
                /></span>
                <span>{{ statusLabel }}</span>
              </p>
              <span
                v-if="isPriority"
                class="border border-[#DDA15E] bg-[#FEFAE0] text-[#BC6C25] rounded-full px-2 py-0.5 text-xs font-semibold"
                >Priority</span
              >
            </div>
          </div>
          <div
            class="flex justify-between items-center mb-3 border-t border-[#283618]"
          >
            <div>
              <p class="font-semibold">Total Amount:</p>
            </div>
            <div>
              <p>{{ formatPeso(totalAmount) }}</p>
            </div>
          </div>
          <div class="flex justify-between items-center mb-3">
            <div>
              <p class="font-semibold">Estimated Wait Time:</p>
            </div>
            <div>
              <p>
                <span>
                  <font-awesome-icon :icon="['fas', 'clock']" class="text-yellow-200 me-2" />
                </span>
                <span v-if="myEWT !== null">{{ formattedEWT }}</span>
                <span v-else>-</span>
              </p>
            </div>
          </div>
          <div class="flex justify-between items-center mb-3">
            <div>
              <p class="font-semibold">Customers Ahead:</p>
            </div>
            <div>
              <p>
                <span>
                  <font-awesome-icon :icon="['fas', 'users']" class="text-yellow-200 me-2" />
                </span>
                <span v-if="myAhead !== null">{{ myAhead }}</span>
                <span v-else>-</span>
              </p>
            </div>
          </div>
        </div>

        <div>
          <p class="font-semibold">Selected Items</p>
          <div
            v-for="(item, index) in displayServices"
            :key="index"
            class="flex justify-between items-center my-2"
          >
            <div class="text-sm">
              <p class="text-gray-200">{{ item.name }}</p>
              <p class="font-medium text-xs text-gray-400" v-if="item.quantity != null">Qty: {{ item.quantity }}</p>
            </div>
            <div class="text-sm font-semibold text-right">
              <p>{{ formatPeso(item.price) }}</p>
            </div>
          </div>
          <div
            class="flex justify-between items-center mt-1 mb-5 border-t border-white"
          >
            <p>Total Amount:</p>
            <p>{{ formatPeso(totalAmount) }}</p>
          </div>

          <div class="flex justify-between items-center">
            <p>Email</p>
            <p>{{ customer.customerEmail }}</p>
          </div>
          <div class="flex justify-between items-center mb-3">
            <p>Phone Number</p>
            <p>{{ customer.customerNumber }}</p>
          </div>
        </div>

        <div class="w-full">
          <ion-button
            @click="onlinePayment"
            v-if="String(myStatus).toLowerCase() === 'pending_payment'"
            id="poppins"
            fill="clear"
            class="normal-case rounded-sm border border-[#DDA15E] text-white w-full font-bold"
            >Pay Online</ion-button
          >
          <ion-button
            id="poppins"
            @click="payCash"
            v-if="String(myStatus).toLowerCase() === 'pending_payment'"
            fill="clear"
            class="normal-case rounded-sm text-[#283618] w-full font-bold mt-2 bg-[#FEFAE0]"
            >Pay Cash</ion-button
          >
          <div
            id="poppins"
            v-if="statusLabel === 'Processing'"
            fill="clear"
            class="normal-case rounded-sm bg-[#E4E05D] text-[#BC6C25] w-full mt-2 flex items-center justify-center gap-3 py-3"
          >
            <font-awesome-icon :icon="['fas', 'clock']" class="text-xl" />
            <p class="text-xs">Waiting for cashier to confirm payment</p>
          </div>
          <ion-button
            id="poppins"
            @click="goBack"
            v-if="String(myStatus).toLowerCase() === 'waiting' || String(myStatus).toLowerCase() === 'delayed'"
            fill="clear"
            class="normal-case rounded-sm bg-[#E33F3F] text-white w-full font-bold mt-2"
            >Cancel Queue</ion-button
          >
          <ion-button
            id="poppins"
            @click="handlePreCallDelay"
            v-if="showDelayButton"
            fill="clear"
            :disabled="hasDelayed || !allowDelay"
            class="normal-case rounded-sm w-full font-bold mt-2 py-1"
            :class="[(hasDelayed || !allowDelay) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#C99658] text-[#FEFAE0]']"
            >{{ hasDelayed ? 'Delay Requested' : 'Delay My Turn' }}</ion-button
          >
          <ion-button
            id="poppins"
            @click="handleRateService"
            v-if="statusLabel === 'Served'"
            fill="clear"
            class="normal-case rounded-sm bg-[#FEFAE0] text-[#283618] w-full font-bold mt-2 py-1"
            >Rate Service</ion-button
          >
          <ion-button
            id="poppins"
            @click="handleJoinNextQueue"
            v-if="statusLabel === 'Served'"
            fill="clear"
            class="normal-case rounded-sm bg-[#FEFAE0] text-[#283618] w-full font-bold mt-2 py-1"
            >Join Next Queue</ion-button
          >
        </div>
      </div>
    </div>

    <RateServiceModal
      :is-open="showRateService"
      :customer="customer"
      @close="showRateService = false"
    />
    <RequestMoreTime
      :isOpen="showRequestMoreTime"
      :customer="customer"
      @close="showRequestMoreTime = false"
      @submit="handlePreCallDelaySubmit"
    />
  </div>
</template>

<script>
// Customer status page: shows queue status, EWT countdown, items/services, and payment/delay actions.
import { IonButton } from "@ionic/vue";
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchPublicQueueLive, fetchPublicMyStatus, requestMoreTime, initiatePayment, fetchPublicBusinessById } from "@/services/api";
import api from "@/services/api";
import { formatPeso } from "@/utils/currency";
import RequestMoreTime from "./RequestMoreTime.vue";
import RateServiceModal from "./RateServiceModal.vue";
import { connectRealtime, onRealtime } from "@/composables/useRealtime";
import { useToast } from "@/composables/useToast";
import { formatHMS } from "@/utils/time";

export default {
  name: "CustomerServicePay",
  components: {
    IonButton,
    RateServiceModal,
    RequestMoreTime,
  },
  props: {
    customer: {
      type: Object,
      default: () => null,
    },
    business: { type: String, default: '' },
  },
  emits: ["continue", "go-back"],

// Initializes component state and handlers
  setup(props, { emit }) {
  const route = useRoute();
  const router = useRouter();
    const nowServing = ref("-");
    const currentInQueue = ref("0");
    const myAhead = ref(null);
    const myEWT = ref(null);
    const myStatus = ref('pending');
  const isPriority = ref(Boolean(props.customer?.isPriority || props.customer?.is_priority) || false);
  const allowDelay = ref(true);
  const hasDelayed = ref(false);
    const paymentStatus = ref((() => {
      const s = String(props.customer?.status || '').toLowerCase();
      if (s.includes('payment complete') || s.includes('served')) return 'paid';
      return 'pending';
    })());
    const displayQueueNo = ref(props.customer?.queueNo ?? null);
  const displayServices = ref(Array.isArray(props.customer?.services) ? [...props.customer.services] : []);
  let ewtTimer = null;
  const ewtSeconds = ref(null);
  const lastAppliedEwtMinutes = ref(null);
  const frozenAtCallSeconds = ref(null);


// Handles baseline Key
  const baselineKey = () => {
    const business_id = Number(route.params.business_id);
    const id = props.customer?.id ? Number(props.customer.id) : undefined;
    const queue_number = props.customer?.queueNo ? Number(props.customer.queueNo) : undefined;
    return `ewtBaseline:${business_id}:${id ?? queue_number ?? 'unknown'}`;
  };

// Handles save Baseline
  const saveBaseline = (minutes, startedAtMs) => {
    try {
      const key = baselineKey();
      const payload = { minutes: Number(minutes), startedAtMs: Number(startedAtMs), frozenAtCallSeconds: frozenAtCallSeconds.value != null ? Number(frozenAtCallSeconds.value) : null };
      localStorage.setItem(key, JSON.stringify(payload));
  } catch(err) { console.debug('[service-pay] saveBaseline failed', err); }
  };

// Handles load Baseline
  const loadBaseline = () => {
    try {
      const raw = localStorage.getItem(baselineKey());
      if (!raw) return false;
      const obj = JSON.parse(raw);
      if (!obj || !isFinite(obj.minutes) || !isFinite(obj.startedAtMs)) return false;
      if (obj.frozenAtCallSeconds != null && isFinite(obj.frozenAtCallSeconds)) {
        frozenAtCallSeconds.value = Math.max(0, Math.round(Number(obj.frozenAtCallSeconds)));
      }
      lastAppliedEwtMinutes.value = Number(obj.minutes);
      const elapsedSec = Math.max(0, Math.floor((Date.now() - Number(obj.startedAtMs)) / 1000));
      const totalSec = Math.max(0, Math.round(Number(obj.minutes) * 60));
      ewtSeconds.value = Math.max(0, totalSec - elapsedSec);
      if (ewtTimer) clearInterval(ewtTimer);
      ewtTimer = setInterval(() => {
        const st = String(myStatus.value || '').toLowerCase();
        const canTick = st === 'waiting' || st === 'delayed';
        if (!canTick) return;
        if (ewtSeconds.value == null) return;
        ewtSeconds.value = Math.max(0, ewtSeconds.value - 1);
        myEWT.value = Math.ceil((ewtSeconds.value || 0) / 60);
      }, 1000);
      return true;
  } catch(err) { console.debug('[service-pay] loadBaseline failed', err); return false; }
  };

// Handles clear Baseline
  const clearBaseline = () => { try { localStorage.removeItem(baselineKey()); } catch(err) { console.debug('[service-pay] clearBaseline skipped', err); } };
    const formattedEWT = computed(() => {
      if (frozenAtCallSeconds.value != null) return formatHMS(frozenAtCallSeconds.value);
      if (ewtSeconds.value != null) return formatHMS(ewtSeconds.value);
      if (myEWT.value != null) return formatHMS(Math.round(Number(myEWT.value) * 60));
      return '00:00:00';
    });
  const showRateService = ref(false);
    const showRequestMoreTime = ref(false);
  const { toast } = useToast();

    const time = ref("");
    const date = ref("");


    // Handles updateDateTime
    const updateDateTime = () => {
      const now = new Date();


      time.value = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });


      date.value = now.toLocaleDateString([], {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };


// Handles apply Ewt Baseline
    const applyEwtBaseline = (mins) => {
      if (mins == null || isNaN(Number(mins))) return;
      frozenAtCallSeconds.value = null; 
      ewtSeconds.value = Math.max(0, Math.round(Number(mins) * 60));
      myEWT.value = Math.ceil((ewtSeconds.value || 0) / 60);
      lastAppliedEwtMinutes.value = Number(mins);
      if (ewtTimer) clearInterval(ewtTimer);
      ewtTimer = setInterval(() => {
        const st = String(myStatus.value || '').toLowerCase();
        const canTick = st === 'waiting' || st === 'delayed';
        if (!canTick) return;
        if (ewtSeconds.value == null) return;
        ewtSeconds.value = Math.max(0, ewtSeconds.value - 1);
        myEWT.value = Math.ceil((ewtSeconds.value || 0) / 60);
      }, 1000);

      saveBaseline(mins, Date.now());
    };


// Handles apply Ewt Baseline If Changed
    const applyEwtBaselineIfChanged = (mins) => {
      const m = Number(mins);
      if (!isFinite(m)) return;
      const statusNow = String(myStatus.value || '').toLowerCase();
      if (statusNow === 'called' || statusNow === 'served') return;
      if (lastAppliedEwtMinutes.value != null && Number(lastAppliedEwtMinutes.value) === m) return;
      applyEwtBaseline(m);
    };

    const statusLabel = computed(() => {
      const s = String(myStatus.value || '').toLowerCase();
      const pay = String(paymentStatus.value || '').toLowerCase();
      if (s === 'served') return 'Served';
      if (s === 'pending_payment') return 'Pending Payment';
      if (s === 'called') return pay === 'paid' ? 'Called – Paid' : 'Called';
      if (s === 'waiting' || s === 'queued' || s === 'in-queue') return pay === 'paid' ? 'Waiting – Paid' : 'Waiting';
      if (s === 'delayed') return 'Delayed';
      if (s === 'processing') return 'Processing';
      return 'Pending';
    });

    const unsubscribers = [];


    onMounted(() => {
  try { connectRealtime(); } catch(err) { console.debug('[service-pay] realtime connect failed', err); }

      loadBaseline();
      const business_id = Number(route.params.business_id);
      const id = props.customer?.id ? Number(props.customer.id) : undefined;
      const queue_number = props.customer?.queueNo ? Number(props.customer.queueNo) : undefined;

      try {
        const key = `delayUsed:${business_id}:${id ?? queue_number ?? 'unknown'}`;
        if (localStorage.getItem(key) === '1') hasDelayed.value = true;
  } catch(err) { console.debug('[service-pay] subscribe queue:status failed', err); }

      (async () => {
        try {
          if (business_id && (id || queue_number != null)) {
            const mine = await fetchPublicMyStatus({ business_id, id, queue_number });
            if (mine) {
              myAhead.value = Number(mine.ahead);
              if (mine.queue_number != null) displayQueueNo.value = Number(mine.queue_number);
              if (mine.payment_status) paymentStatus.value = String(mine.payment_status);
              const s = String(mine.status || 'pending');
              myStatus.value = s;
              if (mine.is_priority != null) isPriority.value = Boolean(mine.is_priority);
              if (mine.allow_delay != null) allowDelay.value = !!mine.allow_delay;
              if (Array.isArray(mine.order_items) && mine.order_items.length) {
                displayServices.value = mine.order_items.map((it) => ({
                  name: it.name ?? it.item_name ?? 'Service',
                  quantity: Number(it.quantity ?? it.qty ?? 1),
                  price: Number(it.price ?? 0),
                }));
              } else if (mine.order_total != null) {
                displayServices.value = [{ name: 'Total', quantity: 1, price: Number(mine.order_total) }];
              }
              if (String(s).toLowerCase() === 'called') {
                if (ewtTimer) { clearInterval(ewtTimer); ewtTimer = null; }
                if (ewtSeconds.value != null) {
                  frozenAtCallSeconds.value = Math.max(0, Math.round(ewtSeconds.value));
                } else if (mine.estimated_wait_time != null) {
                  frozenAtCallSeconds.value = Math.max(0, Math.round(Number(mine.estimated_wait_time) * 60));
                }
                saveBaseline(lastAppliedEwtMinutes.value ?? Number(mine.estimated_wait_time ?? 0), Date.now());
              } else if (mine.estimated_wait_time != null) {
                applyEwtBaselineIfChanged(Number(mine.estimated_wait_time));
              }
              
              
              if (lastAppliedEwtMinutes.value == null && mine.estimated_wait_time != null) {
                myEWT.value = Number(mine.estimated_wait_time);
              }
            }
          }
    } catch(e) { console.debug('[service-pay] initial hydrate error (harmless)', e); }
      })();
      try {
        unsubscribers.push(onRealtime('queue:status', (ev) => {
          if (!ev) return;
          if (Number(ev.business_id) !== business_id) return;
          if (id && Number(ev.id) !== Number(id) && queue_number == null) return;
          if (queue_number != null && Number(ev.queue_number) !== Number(queue_number) && !id) return;
          if (id && queue_number != null && (Number(ev.id) !== Number(id) && Number(ev.queue_number) !== Number(queue_number))) return;
          if (ev.queue_number != null) displayQueueNo.value = Number(ev.queue_number);
          if (ev.payment_status) paymentStatus.value = String(ev.payment_status);
          if (ev.status) myStatus.value = String(ev.status);
          if (ev.is_priority != null) isPriority.value = Boolean(ev.is_priority);
            if (String(ev.status||'').toLowerCase() === 'delayed') {
            hasDelayed.value = true;
            try { const key = `delayUsed:${business_id}:${id ?? queue_number ?? 'unknown'}`; localStorage.setItem(key, '1'); } catch(err) { console.debug('[service-pay] could not persist delayUsed', err); }
          }
          const s = String(ev.status || '').toLowerCase();
          if (s === 'called') toast('You are being called now', 'info');
          if (s === 'called') {
            if (ewtTimer) { clearInterval(ewtTimer); ewtTimer = null; }
            if (ewtSeconds.value != null) {
              frozenAtCallSeconds.value = Math.max(0, Math.round(ewtSeconds.value));
            } else if (ev.estimated_wait_time != null) {
              frozenAtCallSeconds.value = Math.max(0, Math.round(Number(ev.estimated_wait_time) * 60));
            }
            saveBaseline(lastAppliedEwtMinutes.value ?? Number(ev.estimated_wait_time ?? 0), Date.now());
          }
          if (s === 'served') {
            toast('Thank you! Served complete', 'success');

            hasDelayed.value = false;
            clearBaseline();
            try { const key = `delayUsed:${business_id}:${id ?? queue_number ?? 'unknown'}`; localStorage.removeItem(key); } catch(err) { console.debug('[service-pay] could not clear delayUsed', err); }
          }
          if (s === 'cancelled') toast('Your queue has been cancelled', 'error');

          if (s !== 'called' && ev.estimated_wait_time != null) applyEwtBaselineIfChanged(Number(ev.estimated_wait_time));
        }));
  } catch(err) { console.debug('[service-pay] subscribe queue:status setup failed', err); }
      try {
        unsubscribers.push(onRealtime('queue:updated', (ev) => {
          if (!ev) return;
          if (Number(ev.business_id) !== business_id) return;
          if (id && Number(ev.id) !== Number(id) && queue_number == null) return;
          if (queue_number != null && Number(ev.queue_number) !== Number(queue_number) && !id) return;
          if (id && queue_number != null && (Number(ev.id) !== Number(id) && Number(ev.queue_number) !== Number(queue_number))) return;
          if (Array.isArray(ev.order_items) && ev.order_items.length) {
            displayServices.value = ev.order_items.map((it) => ({
              name: it.name ?? it.item_name ?? 'Service',
              quantity: Number(it.quantity ?? it.qty ?? 1),
              price: Number(it.price ?? 0),
            }));
          }
          if (ev.queue_number != null) displayQueueNo.value = Number(ev.queue_number);
          if (ev.is_priority != null) isPriority.value = Boolean(ev.is_priority);
          if (ev.estimated_wait_time != null) {
            if (String(paymentStatus.value).toLowerCase() === 'paid') {
              applyEwtBaselineIfChanged(Number(ev.estimated_wait_time));
            } else {
              myEWT.value = Number(ev.estimated_wait_time);
            }
          }
        }));
  } catch(err) { console.debug('[service-pay] subscribe queue:updated setup failed', err); }
      updateDateTime(); 
      const interval = setInterval(updateDateTime, 1000); // update every sec
      const poll = setInterval(async () => {
        const business_id = Number(route.params.business_id);
        if (business_id) {
          try {
            const live = await fetchPublicQueueLive(business_id);
            if (live) {
              nowServing.value = String(live.nowServing ?? '-');
              currentInQueue.value = String(live.inQueue ?? '0');
            }
          } catch (e) { console.debug('[queue-live][service] poll failed', e); }

          try {
            const queue_number = props.customer?.queueNo ? Number(props.customer.queueNo) : undefined;
            const id = props.customer?.id ? Number(props.customer.id) : undefined;
            if (id || queue_number != null) {
              const mine = await fetchPublicMyStatus({ business_id, id, queue_number });
              if (mine) {
                myAhead.value = Number(mine.ahead);
                if (mine.queue_number != null) displayQueueNo.value = Number(mine.queue_number);
                if (mine.payment_status) paymentStatus.value = String(mine.payment_status);
                if (Array.isArray(mine.order_items) && mine.order_items.length) {
                  displayServices.value = mine.order_items.map((it) => ({
                    name: it.name ?? it.item_name ?? 'Service',
                    quantity: Number(it.quantity ?? it.qty ?? 1),
                    price: Number(it.price ?? 0),
                  }));
                } else if (mine.order_total != null) {
                  displayServices.value = [{ name: 'Total', quantity: 1, price: Number(mine.order_total) }];
                }
                if (next === 'called') {
                  if (ewtTimer) { clearInterval(ewtTimer); ewtTimer = null; }
                  if (ewtSeconds.value != null) {
                    frozenAtCallSeconds.value = Math.max(0, Math.round(ewtSeconds.value));
                  } else if (mine.estimated_wait_time != null) {
                    frozenAtCallSeconds.value = Math.max(0, Math.round(Number(mine.estimated_wait_time) * 60));
                  }
                  saveBaseline(lastAppliedEwtMinutes.value ?? Number(mine.estimated_wait_time ?? 0), Date.now());
                } else if (mine.estimated_wait_time != null) {
                  applyEwtBaselineIfChanged(Number(mine.estimated_wait_time));
                } else {
                  myEWT.value = Number(mine.estimated_wait_time);
                }
                const prev = String(myStatus.value || '').toLowerCase();
                const next = String(mine.status || 'pending').toLowerCase();
                myStatus.value = next;
                if (mine.allow_delay != null) allowDelay.value = !!mine.allow_delay;
                if (next === 'delayed') {
                  hasDelayed.value = true;
                  try { const key = `delayUsed:${business_id}:${id ?? queue_number ?? 'unknown'}`; localStorage.setItem(key, '1'); } catch(err) { console.debug('[service-pay] could not persist delayUsed', err); }
                }
                if (mine.is_priority != null) isPriority.value = Boolean(mine.is_priority);
                if (prev !== next) {
                  if (next === 'called') toast('You are being called now', 'info');
                  if (next === 'served') {
                    toast('Thank you! Served complete', 'success');
                    hasDelayed.value = false;
                    clearBaseline();
                    try { const key = `delayUsed:${business_id}:${id ?? queue_number ?? 'unknown'}`; localStorage.removeItem(key); } catch(err) { console.debug('[service-pay] could not remove delayUsed', err); }
                  }
                  if (next === 'cancelled') toast('Your queue has been cancelled', 'error');
                }
              }
            }
          } catch (e) { console.debug('[my-status][service] poll failed', e); }
        }
      }, 5000);
  onUnmounted(() => { clearInterval(interval); clearInterval(poll); if (ewtTimer) clearInterval(ewtTimer); unsubscribers.forEach((u) => { try { u(); } catch(err) { console.debug('[service-pay] unsubscribe failed', err); } }); }); // cleanup
    });


    watch(myStatus, (s) => {
      const val = String(s).toLowerCase();
      if (val === 'called') {
        if (ewtTimer) { clearInterval(ewtTimer); ewtTimer = null; }
        if (ewtSeconds.value != null && frozenAtCallSeconds.value == null) {
          frozenAtCallSeconds.value = Math.max(0, Math.round(ewtSeconds.value));
          saveBaseline(lastAppliedEwtMinutes.value ?? 0, Date.now());
        }
      }
      if (val === 'cancelled') {
        clearBaseline();
  try { localStorage.removeItem('publicFlow_service'); } catch (err) { console.debug('[service-pay] clear publicFlow_service failed', err); }
  try { localStorage.removeItem('publicFlow_food'); } catch (err) { console.debug('[service-pay] clear publicFlow_food failed', err); }
        emit('go-back');
      }
    });

    const totalAmount = computed(() => {
      if (!displayServices.value) return 0;
      return displayServices.value.reduce((sum, item) => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        return sum + qty * price;
      }, 0);
    });

    const submitBtn = async () => {

      emit("continue");
    };


    const handleRateService = () => {
      showRateService.value = true;
      console.log("clicked");
    };


    const handleJoinNextQueue = async () => {
      try { localStorage.removeItem('publicFlow_food'); } catch(err) { console.debug('[service-pay] clear publicFlow_food failed', err); }
      try { localStorage.removeItem('publicFlow_service'); } catch(err) { console.debug('[service-pay] clear publicFlow_service failed', err); }
      const business_id = Number(route.params.business_id);
      try {
        const meta = await fetchPublicBusinessById(business_id);
        if (meta && meta.slug) {
          router.replace({ path: `/customer/${meta.slug}`, query: { t: String(Date.now()) } });
          return;
        }
      } catch(_) { console.debug('[service-pay] route fallback without slug'); }
      const path = window.location.pathname.includes('/customer/food/')
        ? `/customer/food/${business_id}`
        : `/customer/service/${business_id}`;
      router.replace({ path, query: { t: String(Date.now()) } });
    };


    const handlePreCallDelay = () => {
      if (!allowDelay.value) return;
      if (hasDelayed.value) return;
      if (String(myStatus.value||'').toLowerCase() !== 'waiting') return; // guard
      showRequestMoreTime.value = true;
    };


    const handlePreCallDelaySubmit = async ({ minutes }) => {
      const business_id = Number(route.params.business_id);
      const id = props.customer?.id ? Number(props.customer.id) : undefined;
      const queue_number = props.customer?.queueNo ? Number(props.customer.queueNo) : undefined;
      if (!business_id) return;
  try { await requestMoreTime({ business_id, id, queue_number, minutes }); hasDelayed.value = true; } catch (e) { console.debug('[request-more-time][service] failed', e); }
    };


    const goBack = async () => {
      const ok = window.confirm('Cancel your queue? This cannot be undone.');
      if (!ok) return;
      try {
        const business_id = Number(route.params.business_id);
        const id = props.customer?.id ? Number(props.customer.id) : undefined;
        const queue_number = props.customer?.queueNo ? Number(props.customer.queueNo) : undefined;
        if (business_id && (id || queue_number != null)) {
          await api.post('/public/cancel', { business_id, id, queue_number });
        }
  } catch (e) { console.debug('[service-pay] cancel request failed', e); }
  try { localStorage.removeItem('publicFlow_service'); } catch (err) { console.debug('[service-pay] clear publicFlow_service failed', err); }
  try { localStorage.removeItem('publicFlow_food'); } catch (err) { console.debug('[service-pay] clear publicFlow_food failed', err); }
      emit("go-back");
    };

    return {
      totalAmount,
      nowServing,
      currentInQueue,
      myAhead,
  myEWT,
  formattedEWT,
      showRateService,
      submitBtn,
      goBack,
      handleRateService,
  handleJoinNextQueue,
      time,
      date,
      showRequestMoreTime,
  handlePreCallDelay,
  handlePreCallDelaySubmit,
      formatPeso,
      myStatus,
      paymentStatus,
      displayQueueNo,
      displayServices,
      statusLabel,
      isPriority,
      toast,
      allowDelay,
      hasDelayed,
      showDelayButton: computed(() => {
        const s = String(myStatus.value||'').toLowerCase();
        return s === 'waiting' || s === 'delayed';
      }),
    };
  },
  methods: {
    onlinePayment() {
      const business_id = Number(this.$route.params.business_id);
      const id = this.customer?.id ? Number(this.customer.id) : undefined;
      const queue_number = this.customer?.queueNo ? Number(this.customer.queueNo) : undefined;
      const win = window.open('', '_blank');
      initiatePayment({ business_id, id, queue_number })
        .then((resp) => {
          const url = resp?.payment_url;
          if (url) {
            if (win && !win.closed) {
              try { win.location.href = url; return; } catch (err) { console.debug('[pay][service][open] nav failed', err); }
            }
            window.location.href = url;
          } else {
            if (win && !win.closed) try { win.close(); } catch(err) { console.debug('[pay][service][open] close failed', err); }
          }
        })
        .catch((err) => { console.debug('[pay][service][initiate] failed', err); if (win && !win.closed) try { win.close(); } catch(e) { console.debug('[pay][service][open] close failed', e); } });
      this.$emit('continue');
    },
    payCash() {
      try {
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.inset = '0';
        modal.style.background = 'rgba(0,0,0,0.5)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '10000';
        modal.innerHTML = `
          <div style="background:#fff;color:#283618;padding:16px;border-radius:8px;max-width:420px;width:90%;box-shadow:0 10px 24px rgba(0,0,0,0.2)">
            <h3 style="margin:0 0 8px;font-weight:700">Pay Cash</h3>
            <p style="margin:0 0 12px;line-height:1.4">Please proceed to the counter to complete your payment. Show your queue number to the cashier.</p>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
              <button id="cash-ok" style="background:#283618;color:#fff;padding:8px 12px;border:none;border-radius:4px;cursor:pointer">OK</button>
            </div>
          </div>`;
        document.body.appendChild(modal);

        const close = () => { try { document.body.removeChild(modal); } catch(err) { console.debug('[service-pay] modal remove failed', err); } };
        modal.querySelector('#cash-ok')?.addEventListener('click', close);
      } catch(err) { console.debug('[service-pay] modal create failed', err); }
      this.$emit('continue');
    },
  },
};
</script>

<style scoped>
#div {
  color: #d9d9d910;
}
</style>
