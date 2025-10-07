<template>
  <ion-modal class="custom-modal" :is-open="isOpen" :backdrop-dismiss="false">
    <div id="poppins" class="bg-[#283618] p-3 text-white">
      <div class="flex justify-between">
        <div class="mb-4">
          <div class="flex gap-4">
            <p class="font-bold text-2xl">Order Details</p>
            <div class="flex items-center">
              <p
                :class="{
                    'border border-[#DDA15E] rounded-full px-2 py-0.5 text-yellow-100 leading-none flex items-center':
                      displayStatus === 'Pending',
                    'border border-[#00DE2D] rounded-full px-2 py-0.5 text-green-100 leading-none flex items-center':
                      displayStatus === 'In Progress' || displayStatus === 'Paid',
                  }"
                >
                  <span class="text-xs text-center">{{ displayStatus }}</span>
                </p>
            </div>
            <font-awesome-icon
              @click="canEditCustomer ? handleShowEditCustomer() : null"
              :icon="['fas', 'pen-to-square']"
              :class="['text-xl font-thin', canEditCustomer ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed pointer-events-none']"
            />
          </div>
          <p class="font-light text-xs text-gray-400">
            Queue #{{ order.queueNo }} - {{ order.customerName }}
          </p>
        </div>
        <div>
          <font-awesome-icon
            :icon="['fas', 'xmark']"
            @click="close"
            class="text-3xl"
          />
        </div>
      </div>
      <div class="mb-4 flex justify-between">
        <div>
          <p class="text-xs text-gray-400">Contact Information</p>
          <p class="text-sm">{{ order.contactNumber }}</p>
          <p class="text-sm">{{ order.email }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400">Estimated Wait</p>
          <p class="text-sm">
            <span v-if="order">{{ remainingFor(order) }}</span>
            <span v-else class="text-gray-400">-</span>
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-400">Party Size</p>
          <p class="text-sm">{{ order.partySize || "-" }}</p>
        </div>
      </div>

      <p class="text-xs text-gray-400">Order Items</p>
      <div class="border-b border-white">
        <div
          v-for="(item, index) in order.menuItems"
          :key="index"
          class="mb-2 flex justify-between items-center"
        >
          <div>
            <p class="order-name font-light text-sm">{{ item.name }}</p>
            <p class="quantity text-gray-400 text-xs font-medium">
              Qty: {{ item.quantity || 1 }}
            </p>
          </div>
          <div>
            <p class="text-sm">
              {{
                formatCurrency(
                  (Number(item.price) || 0) * (Number(item.quantity) || 1)
                )
              }}
            </p>
          </div>
        </div>
      </div>
      <div class="flex justify-between items-center">
        <p class="text-sm">Total:</p>
        <p class="total-amount">{{ formatCurrency(totalAmount) }}</p>
      </div>
      <div class="my-4">
        <p class="text-sm text-xs text-gray-400">Notes</p>
        <p class="text-sm">{{ order.notes }}</p>
      </div>
      
      <div v-if="(!isServiceBased && order.status === 'Pending' && !isPaid) || (isServiceBased && (order.status === 'Pending Payment') && !isPaid)" class="my-3">
        <label class="block text-xs text-gray-300 mb-1">Payment Method <span class="text-red-300">*</span></label>
        <select v-model="paymentMethod" :class="['pm-select', !paymentMethod ? 'placeholder' : '']">
          <option disabled value="">Select method</option>
          <option value="cash">Cash</option>
          <option value="online">Online</option>
        </select>
      </div>
      <div v-if="(!isServiceBased && order.status === 'Pending') || (isServiceBased && (order.status === 'In Progress' || order.status === 'Pending Payment'))" class="flex justify-between items-center gap-3">
        <template v-if="isPaid">
          <ion-button
            fill="clear"
            class="bg-[#606C38] w-full rounded-sm normal-case text-white font-bold"
            disabled
            >Paid</ion-button
          >
        </template>
        <template v-else>
          <ion-button
            fill="clear"
            class="bg-[#E33F3F] w-full rounded-sm normal-case text-white font-bold"
            :disabled="isPaid"
            v-if="(!isServiceBased && order.status === 'Pending') || (isServiceBased && order.status === 'In Progress')"
            @click="onCancel"
            >Cancel Order</ion-button
          >
          <ion-button
            fill="clear"
            class="bg-[#606C38] w-full rounded-sm normal-case text-white font-bold"
            :disabled="isPaid || !paymentMethod || (isServiceBased && order.status !== 'Pending Payment')"
            v-if="(!isServiceBased && order.status === 'Pending') || (isServiceBased && order.status === 'Pending Payment')"
            @click="onApprove"
            >Approve Payment</ion-button
          >
        </template>
      </div>
    </div>
  </ion-modal>

  

  <EditCustomerOrder
    :is-open="showEditCustomer"
    :customer="selectedCustomer"
    :menu-items="menuItems"
    :is-service-based="isServiceBased"
    @update-customer="updateCustomer"
    @close="showEditCustomer = false"
  />
</template>

<script>
import { IonModal, IonButton } from "@ionic/vue";
import { computed, ref, watch } from "vue";
import Swal from 'sweetalert2';
import { approvePayment, cancelOrder, updateQueueDetails, updateQueueStatus } from '@/services/api';
import EditCustomerOrder from "./EditCustomer.vue";

export default {
  name: "OrderDetails",
  components: {
    IonModal,
    IonButton,
    EditCustomerOrder,
  },
  props: {
    isOpen: Boolean,
    order: {
      type: Object,
      default: () => ({}),
    },
    menuItems: {
      type: Array,
      default: () => [],
    },
    isServiceBased: { type: Boolean, default: false }
  },
  emits: ["close", "update-customer", "status-changed"],
  setup(props, { emit }) {
  const showEditCustomer = ref(false);
  const paymentApproved = ref(false);
  const paymentMethod = ref('');
    const selectedCustomer = ref({});
    const now = ref(new Date());
    let timer;

    const totalAmount = computed(() => {
      if (!props.order || !props.order.menuItems) return 0;
      return props.order.menuItems.reduce((sum, item) => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        return sum + price * qty;
      }, 0);
    });


    const formatCurrency = (value) => {
      if (value === undefined || value === null) return "₱0.00";
      return "₱" + Number(value).toFixed(2);
    };

    const handleShowEditCustomer = () => {
      selectedCustomer.value = props.order;
      showEditCustomer.value = true;
    };


    const updateCustomer = async (updateCustomer) => {
      try {
        if (props.order && props.order.id) {
          const order_items = (updateCustomer.menuItems || []).map(i => ({ id: i.id, name: i.name, price: Number(i.price), quantity: Number(i.quantity)||1, duration: i.duration != null ? Number(i.duration) : undefined }));
          const order_total = order_items.reduce((s,i)=> s + Number(i.price)*(Number(i.quantity)||1), 0);
          await updateQueueDetails(props.order.id, {
            customer_name: updateCustomer.customerName,
            customer_phone: updateCustomer.contactNumber,
            notes: updateCustomer.notes,
            order_items,
            order_total,
            party_size: (updateCustomer.partySize != null ? Number(updateCustomer.partySize) : undefined),

            is_priority: typeof updateCustomer.isPriority === 'boolean' ? updateCustomer.isPriority : undefined
          });
        }
        emit("update-customer", updateCustomer);
        showEditCustomer.value = false;
  Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Order updated successfully', timer: 1500, timerProgressBar: true, showConfirmButton: false });
      } catch (e) {
  Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: e.message || 'Update failed', timer: 2000, timerProgressBar: true, showConfirmButton: false });
      }
    };

  const displayStatus = computed(() => paymentApproved.value ? 'Paid' : (props.order?.status || ''));
  const isPaid = computed(() => paymentApproved.value || !!(props.order && props.order.paid));
  watch(() => props.isOpen, (open) => { if (open) { paymentApproved.value = false; paymentMethod.value = ''; } });


    const normalizedStatus = computed(() => {
      const raw = String(props.order?.status || '').toLowerCase();
      if (raw === 'in progress' || raw === 'called') return 'called';
      if (raw === 'waiting') return 'waiting';
      if (raw === 'pending payment' || raw === 'pending_payment') return 'pending_payment';
      if (raw === 'delayed') return 'delayed';
      if (raw === 'served' || raw === 'completed') return 'served';
      if (raw === 'pending') return 'pending';
      return raw;
    });



    const canEditCustomer = computed(() => {
      const st = normalizedStatus.value;
      if (props.isServiceBased) return st === 'pending_payment';

      return !(st === 'waiting' || st === 'called' || st === 'delayed' || st === 'served');
    });


    const remainingFor = (row) => {
      if (!row) return '00:00:00';

      if (typeof row.frozenWaitSeconds === 'number') {
        const fs = Math.max(0, Math.floor(row.frozenWaitSeconds));
        const h = Math.floor(fs / 3600), m = Math.floor((fs % 3600) / 60), s = fs % 60;
        const pad = (n)=> (n<10?`0${n}`:`${n}`);
        return `${pad(h)}:${pad(m)}:${pad(s)}`;
      }
      const base = (row.initialEwt != null ? Number(row.initialEwt) : (typeof row.etaBase === 'number' ? row.etaBase : null));
      const start = Number(row.initialStart || 0);
      if (base == null) return '00:00:00';


      const toHMS = (s) => {
        const secs = Math.max(0, Math.floor(s));
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const sec = secs % 60;
        const pad = (n)=> (n<10?`0${n}`:`${n}`);
        return `${pad(h)}:${pad(m)}:${pad(sec)}`;
      };

      const st = String(row.status||'').toLowerCase();
      if (st === 'in progress') return toHMS(Math.round(base * 60));
      if (!start) return toHMS(Math.round(base * 60));
      const raw = base - ((now.value.getTime() - start) / 60000);
      return toHMS(Math.max(0, Math.ceil(raw * 60)));
    };
    
    watch(() => props.isOpen, (open) => { if (open) { timer = setInterval(()=> now.value = new Date(), 1000); } else { if (timer) clearInterval(timer); } });

    return {
      totalAmount,
      formatCurrency,
      handleShowEditCustomer,
      updateCustomer,
      showEditCustomer,
      selectedCustomer,
      paymentApproved,
  paymentMethod,
  isPaid,
  remainingFor,
      displayStatus,
    normalizedStatus,
    canEditCustomer,
      onApprove: async () => {
        try {
          if (props.order && props.order.id) {
            if (!paymentMethod.value) {
              Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Please select a payment method', timer: 1500, timerProgressBar: true, showConfirmButton: false, zIndex: 20000 });
              return;
            }
            if (props.isServiceBased) {

              const st = normalizedStatus.value;
              if (st !== 'pending_payment') {
                Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Approve is available only at Pending Payment', timer: 1600, timerProgressBar: true, showConfirmButton: false });
                return;
              }
              await updateQueueStatus(props.order.id, { status: 'served', payment_status: 'paid', payment_method: paymentMethod.value });
            } else {
              await approvePayment(props.order.id, paymentMethod.value);
            }
          }
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Payment approved', timer: 1500, timerProgressBar: true, showConfirmButton: false });
          paymentApproved.value = true;
          if (props.order) {
            if (props.isServiceBased) {
              emit('status-changed', { id: props.order.id, status: 'served', paid: true });
            } else emit('status-changed', { id: props.order.id, status: 'waiting' });
          }
        } catch (e) {
          Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: e.message || 'Failed to approve', timer: 2000, timerProgressBar: true, showConfirmButton: false });
        }
      },
      onCancel: async () => {
        if (isPaid.value) {
          Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Paid orders cannot be cancelled', timer: 1800, timerProgressBar: true, showConfirmButton: false, zIndex: 20000 });
          return;
        }
        try {
          const res = await Swal.fire({
            title: 'Cancel this order?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, cancel',
            cancelButtonText: 'No',
            heightAuto: false
          });
          if (!res.isConfirmed) return;
          if (props.order && props.order.id) await cancelOrder(props.order.id);
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Order cancelled', timer: 1500, timerProgressBar: true, showConfirmButton: false });
          if (props.order) emit('status-changed', { id: props.order.id, status: 'cancelled' });
        } catch (e) {
          Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: e.message || 'Failed to cancel', timer: 2000, timerProgressBar: true, showConfirmButton: false });
        }
      }
    };
  },
  methods: {
    close() {
      this.$emit("close");
    },
  },
};
</script>

<style scoped>
ion-radio {
  --color: #dda15e;
  --border-color: #dda15e;
  --color-checked: #dda15e;
}

ion-checkbox {
  --color: #ffffff;
  --border-color: #ffffff;
}
</style>
