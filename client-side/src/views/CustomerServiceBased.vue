<template>
  <ion-page>
    <ion-content>
      <CustomerFrontPage
        v-if="step === 1"
        :business-name="businessName"
        :in-queue="inQueue"
        :is-full="isFull"
        @continue="step = 2"
      />

      <keep-alive>
        <CustomerInfo
          v-if="step === 2"
          :customer-email="customerEmail"
          :customer-number="customerNumber"
          :business-name="businessName"
          :server-error="serverError"
          @continue="handleCustomerInfo"
        />
      </keep-alive>

      <keep-alive>
        <CustomerSelectServices
          v-if="step === 3"
          :customer-email="customerEmail"
          :customer-number="customerNumber"
          :services="services"
          :business-name="businessName"
          :preselected="customer.services"
          @continue="handleServiceSelect"
          @update-customer="updateCustomer"
          @go-back="step = 2"
        />
      </keep-alive>

      <CustomerPayOrder
        v-if="step === 4"
        :customer="customer"
        :business="businessName"
        @go-back="step = 1"
      />
    </ion-content>
  </ion-page>
</template>

<script>
import { IonPage, IonContent } from "@ionic/vue";
import { ref, onMounted, watch, computed, onUnmounted } from "vue";
import { useToast } from "@/composables/useToast";
import api, { fetchPublicBusinessById, fetchPublicServices, publicJoinQueue } from "../services/api";
import { useRoute } from "vue-router";
import CustomerFrontPage from "../components/CustomerFrontPage.vue";
import CustomerInfo from "../components/CustomerInfo.vue";
import CustomerSelectServices from "../components/CustomerSelectServices.vue";
import CustomerPayOrder from "../components/CustomerServicePay.vue";

export default {
  name: "CustomerFoodPage",
  components: {
    CustomerFrontPage,
    CustomerInfo,
    IonPage,
    IonContent,
  CustomerSelectServices,
  CustomerPayOrder,
  },

// Initializes component state and handlers
  setup() {
  const { toast } = useToast();
  const step = ref(1);
  const serverError = ref('');
    const customerEmail = ref("");
    const customerNumber = ref("");
    const businessName = ref("");
    const inQueue = ref();
    const maxQueue = ref();
    const isFull = computed(() => {
      const q = Number(inQueue.value || 0);
      const cap = Number(maxQueue.value || 0);
      return cap > 0 && q >= cap;
    });
    const route = useRoute();

    const customer = ref({
      queueNo: "",
      customerName: "",
      status: "",
      waitTime: "",
      services: [],
      notes: "",
    });

    const services = ref([]);

    let pollTimer = null;

    // Handles fetchSummary
    const fetchSummary = async (business_id) => {
      try {
        const summary = await api.get(`/public/queue-summary`, { params: { business_id, _t: Date.now() } });
        if (summary?.data?.success) {
          const d = summary.data.data || {};
          inQueue.value = d.inQueue;
          const cap = d.maxQueue ?? d.maxQueueLength ?? d.maxQueueSize ?? d.max ?? d.capacity;
          const n = Number(cap);
          maxQueue.value = Number.isFinite(n) && n > 0 ? n : undefined;
        }
  } catch(e) { console.debug('[customer-service] failed reading storage', e); }
    };

    onMounted(async () => {

      const persisted = localStorage.getItem('publicFlow_service');
      if (persisted) {
        try {
          const obj = JSON.parse(persisted);
          if (obj.step) step.value = Number(obj.step);
          if (obj.customer) customer.value = { ...customer.value, ...obj.customer };
          if (obj.customerEmail) customerEmail.value = obj.customerEmail;
          if (obj.customerNumber) customerNumber.value = obj.customerNumber;
          if (obj.businessName) businessName.value = obj.businessName;
  } catch(_) { console.debug('[customer-service] parse error reading persisted flow'); }
      }
      const business_id = Number(route.params.business_id);
      if (business_id) {
        try {
          const meta = await fetchPublicBusinessById(business_id);
          businessName.value = meta?.name || '';
  } catch(e) { console.debug('[customer-service] error restoring state', e); }
        await fetchSummary(business_id);
        pollTimer = setInterval(() => fetchSummary(business_id), 10000);
      }
      try {
        const list = await fetchPublicServices(business_id);
        services.value = (list || []).map((s) => ({
          id: s.id,
          name: s.name,
          price: String(s.price ?? ''),
          description: s.description || '',
          duration: String(s.duration || ''),
          available: Boolean(s.is_available ?? s.available ?? true),
          
          checked: false,
        }));
      } catch(e) {
        
        void e;
      }
    });


    // Handles updateCustomer
    const updateCustomer = (data) => {
      customer.value = {
        ...customer.value,
        ...data,
      };
    };


// Handles handle Customer Info
    const handleCustomerInfo = (data) => {
  serverError.value = '';
      customer.value.customerName = data.customerName;
      customer.value.customerEmail = data.customerEmail;
      customer.value.customerNumber = data.customerNumber;
      customerEmail.value = data.customerEmail;
      customerNumber.value = data.customerNumber;
      step.value = 3;
    };


// Handles handle Service Select
    const handleServiceSelect = async (data) => {
      Object.assign(customer.value, data);

      try {
        const business_id = Number(route.params.business_id);
        await fetchSummary(business_id);
        if (isFull.value) {
          toast('Queue is currently full. Please try again later.', 'error');
          step.value = 1;
          return;
        }
        // Handles order_items
        const order_items = (data.services || []).map((i) => ({ id: i.id, name: i.name, price: Number(i.price)||0, quantity: Number(i.quantity)||1, duration: i.duration ? Number(i.duration) : undefined }));
        const order_total = order_items.reduce((s, i) => s + (Number(i.price)||0) * (Number(i.quantity)||1), 0);
        const resp = await publicJoinQueue({
          business_id,
          customer_name: customer.value.customerName,
          customer_email: customer.value.customerEmail,
          customer_phone: customer.value.customerNumber,
          order_items,
          order_total,
          notes: customer.value.notes || undefined,
        });
        if (resp && resp.queue_number != null) {
          customer.value.id = Number(resp.id);
          customer.value.queueNo = String(resp.queue_number);

          customer.value.status = 'Waiting';

          if (!Array.isArray(customer.value.menuItems)) customer.value.menuItems = order_items;
          step.value = 4;
          try {
            const snapshot = JSON.parse(localStorage.getItem('publicFlow_service') || '{}');
            snapshot.step = step.value;
            snapshot.customer = { ...(snapshot.customer||{}), id: customer.value.id, queueNo: customer.value.queueNo };
            localStorage.setItem('publicFlow_service', JSON.stringify(snapshot));
          } catch(err) { console.debug('[customer-service] operation failed', err); }
        }
  } catch(e) {
    console.debug('[publicJoinQueue][service] failed', e);
    // Handles respMsg
    const respMsg = (e && e.response && e.response.data && (e.response.data.message || e.response.data.error)) ? String(e.response.data.message || e.response.data.error) : '';
    const raw = respMsg || String(e?.message || '');
    const lower = raw.toLowerCase();
    let msg = raw || 'Failed to join queue. Please try again.';

        if (lower.includes('phone or email already registered') || (lower.includes('already registered') && (lower.includes('phone') || lower.includes('email')))) {
          msg = 'Phone or email already registered';
        } else if (lower.includes('already in the current queue') || lower.includes('this contact is already in the current queue')) {
          msg = 'This contact is already in the current queue';
        } else if (lower.includes('valid ph phone') || lower.includes('invalid phone')) {
          msg = 'Enter a valid PH phone (11 digits starting with 09)';
        } else if (lower.includes('email must not contain spaces') || lower.includes('email cannot contain spaces')) {
          msg = 'Email cannot contain spaces';
        } else if (lower.includes('queue is full')) {
          msg = 'Queue is currently full. Please try again later.';
        }
        toast(msg.replace(/^Server\s+\d+:\s*/i, ''), 'error');
        step.value = msg.includes('Queue is currently full') ? 1 : 2; // Return to front page if capacity issue; else back to info form
      }
    };

    onUnmounted(() => { if (pollTimer) clearInterval(pollTimer); });


    watch([step, customer, customerEmail, customerNumber, businessName], () => {
      const snapshot = {
        step: step.value,
        customer: customer.value,
        customerEmail: customerEmail.value,
        customerNumber: customerNumber.value,
        businessName: businessName.value,
      };
  try { localStorage.setItem('publicFlow_service', JSON.stringify(snapshot)); } catch(err) { console.debug('[customer-service] failed to persist publicFlow_service', err); }
    }, { deep: true });

    return {
      customerNumber,
      customerEmail,
      step,
      businessName,
      inQueue,
      isFull,
      services,
      customer,
      updateCustomer,
      handleCustomerInfo,
      handleServiceSelect,
      toast,
      serverError,
    };
  },
};
</script>

<style scoped>
ion-content {
  --background: #283618 !important;
}
</style>
