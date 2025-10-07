<template>
  <ion-modal class="custom-modal add-customer-modal" :is-open="isOpen" :backdrop-dismiss="false">
    <div id="inter" class="bg-[#283618] p-3 text-white">
      <div class="flex justify-between items-start mb-2">
        <div>
          <p class="font-bold text-xl">Add Customer</p>
          <p class="font-light text-sm">Provide details and select items</p>
        </div>
        <font-awesome-icon :icon="['fas', 'xmark']" @click="close" class="text-2xl" />
      </div>
      
      <form @submit.prevent="handleSubmit" class="grid md:grid-cols-2 gap-3">
        
        <div class="space-y-3">
          <div>
            <ion-label class="text-sm">Name</ion-label>
            <ion-input ref="firstField" v-model="form.customerName" :maxlength="10" @ionBlur="touched.customerName = true" @ionInput="clearFieldServerError('customerName')" id="inter" class="bg-[#ffffff96] rounded-sm font-light" placeholder="Enter name"></ion-input>
            <div class="text-[11px] text-white/70 text-right mt-1">{{ (form.customerName || '').length }} / 10</div>
            <p v-if="(touched.customerName || submitAttempted) && errors.customerName" class="text-red-600 text-xs mt-1">{{ errors.customerName }}</p>
          </div>
          <div>
            <ion-label class="text-sm">Phone Number</ion-label>
            <ion-input v-model="form.contactNumber" @ionBlur="touched.contactNumber = true" @ionInput="clearFieldServerError('contactNumber')" type="tel" inputmode="tel" id="inter" class="bg-[#ffffff96] rounded-sm font-light" placeholder="Enter phone number"></ion-input>
            <p v-if="(touched.contactNumber || submitAttempted) && errors.contactNumber" class="text-red-600 text-xs mt-1">{{ errors.contactNumber }}</p>
          </div>
          <div>
            <ion-label class="text-sm">Notes</ion-label>
            <ion-textarea id="inter" v-model="form.notes" :maxlength="40" class="bg-[#ffffff96] rounded-sm font-light" placeholder="e.g. No pickles on burgers, extra ketchup"></ion-textarea>
            <div class="text-[11px] text-white/70 text-right mt-1">{{ (form.notes || '').length }} / 40</div>
          </div>
          <div v-if="!isServiceBased">
            <ion-label class="text-sm">Service Option</ion-label>
            <div class="text-sm my-2">
              <ion-radio-group v-model="form.option" color="warning" @ionBlur="touched.option = true" @ionChange="clearFieldServerError('option')" class="flex items-center gap-5">
                <ion-radio label-placement="end" value="dineIn">Dine In</ion-radio>
                <ion-radio label-placement="end" value="takeOut">Take Out</ion-radio>
              </ion-radio-group>
            </div>
            <p v-if="(touched.option || submitAttempted) && errors.option" class="text-red-600 text-xs mt-1">{{ errors.option }}</p>
          </div>
          <div v-if="!isServiceBased && form.option === 'dineIn'">
            <ion-label class="text-sm">Party Size</ion-label>
            <ion-input type="number" v-model="form.partySize" @ionBlur="touched.partySize = true" @ionInput="clearFieldServerError('partySize')" class="bg-gray-100 rounded-sm" style="--color: black; --highlight-color: none"></ion-input>
            <p v-if="(touched.partySize || submitAttempted) && errors.partySize" class="text-red-600 text-xs mt-1">{{ errors.partySize }}</p>
          </div>
          <div class="flex items-center justify-between">
            <ion-label class="text-sm">Priority customer</ion-label>
            <ion-toggle v-model="form.isPriority" color="warning"></ion-toggle>
          </div>
          <div v-if="form.isPriority && reserveSlots > 0" class="text-xs mt-1" :class="priorityCapReached ? 'text-red-200' : 'text-white/70'">
            Priority active: {{ priorityCount }} / {{ reserveSlots }}
            <span v-if="priorityCapReached"> • Only {{ reserveSlots }} priority customer(s) allowed at a time.</span>
          </div>
          <div class="flex items-center justify-between mt-2">
            <p class="text-sm font-semibold">Total: {{ formatPeso(totalAmount) }}</p>
            <ion-button type="submit" :disabled="!canSubmit" :title="priorityCapReached ? ('Only ' + reserveSlots + ' priority customer(s) allowed at a time.') : ''" fill="clear" class="bg-[#DDA15E] w-full md:w-auto rounded-sm normal-case text-white font-bold disabled:opacity-60">Submit</ion-button>
          </div>
        </div>

        
        <div class="border border-[#DDA15E] rounded-sm p-2 max-h-[420px] overflow-y-auto">
          <div class="flex items-center justify-between mb-2">
            <p class="font-semibold text-sm">{{ isServiceBased ? 'Select Services' : 'Select Items' }}</p>
            <p class="text-[11px] opacity-80">Choose from available {{ isServiceBased ? 'services' : 'items' }}</p>
          </div>
          <div class="mb-2">
            <ion-input v-model="searchTerm" placeholder="Search..." class="bg-white/20 rounded-sm text-white" style="--highlight-color: none; --color: white; --padding-start: 8px"></ion-input>
          </div>
          <div v-for="(item, index) in pagedItems" :key="index" class="mb-2 flex justify-between items-center gap-2 py-1 px-2 rounded-sm border border-white/20">
            <div>
              <ion-checkbox label-placement="end" v-model="item.checked" @ionChange="toggleItem(item)">
                <p class="font-semibold text-sm">{{ item.name }}</p>
                <p class="font-light text-xs text-gray-400 w-60 overflow-hidden text-ellipsis">{{ item.description }}</p>
              </ion-checkbox>
            </div>
            <div class="flex flex-col items-end gap-1">
              <p class="text-sm">{{ formatPeso(item.price) }}</p>
              <div class="flex bg-transparent border border-gray-500 rounded-sm items-center">
                <ion-button size="small" fill="clear" class="text-white" @click="decreaseQuantity(item)">-</ion-button>
                <span class="text-center text-white text-xs font-light">{{ item.quantity || 0 }}</span>
                <ion-button size="small" fill="clear" class="text-white" @click="increaseQuantity(item)">+</ion-button>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between mt-2 text-xs" v-if="totalPages > 1">
            <ion-button size="small" fill="clear" class="bg-[#283618] text-white normal-case" @click="prevPage" :disabled="page===1">Prev</ion-button>
            <span>Page {{ page }} / {{ totalPages }}</span>
            <ion-button size="small" fill="clear" class="bg-[#283618] text-white normal-case" @click="nextPage" :disabled="page===totalPages">Next</ion-button>
          </div>
        </div>
      </form>
    </div>
  </ion-modal>
</template>

<script>
import { IonModal, IonCheckbox, IonInput, IonLabel, IonRadioGroup, IonRadio, IonButton, IonTextarea, IonToggle } from "@ionic/vue";
import { ref, computed, watch, nextTick } from "vue";
import { getSettings, listQueue } from '@/services/api';
import { formatPeso } from "@/utils/currency";


export default {
  name: "AddCustomer",
  components: { IonModal, IonCheckbox, IonInput, IonLabel, IonRadioGroup, IonRadio, IonButton, IonTextarea, IonToggle },
  emits: ["close", "add-customer"],
  props: {
    isOpen: Boolean,
    menuItems: Array,
    isServiceBased: { type: Boolean, default: false },
    
  },

  setup(props) {
    const firstField = ref(null);
    const form = ref({ customerName: "", contactNumber: "", selectedItems: [], notes: "", option: "", partySize: "", isPriority: false });
    const errors = ref({ customerName: '', contactNumber: '', option: '', partySize: '' });
    const touched = ref({ customerName: false, contactNumber: false, option: false, partySize: false });
    const submitAttempted = ref(false);
  const reserveSlots = ref(0);
  
    const priorityCount = ref(0);
    const page = ref(1);
    const pageSize = ref(6);
    const localItems = ref([]);


    const resetLocal = (src) => { const arr = (src || []).filter(i => i.is_available || i.available).map(i => ({ ...i, checked: false, quantity: 0 })); localItems.value = arr; page.value = 1; };
    watch(() => props.menuItems, (nv) => { resetLocal(nv); }, { immediate: true });
    watch(
      () => props.isOpen,
      async (open) => {
        if (!open) return;
        resetLocal(props.menuItems);
        await nextTick();
        
        try {
          firstField.value?.$el?.setFocus?.();
        } catch (err) {
          console.debug('[add-customer] focus attempt failed (non-fatal)', err);
        }
      }
    );
    
    const searchTerm = ref('');
    const filteredItems = computed(() => { const q = (searchTerm.value || '').toLowerCase(); if (!q) return localItems.value; return localItems.value.filter(i => (i.name && i.name.toLowerCase().includes(q)) || (i.description && i.description.toLowerCase().includes(q))); });
    const totalPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / pageSize.value)));
    const pagedItems = computed(() => filteredItems.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));


    const nextPage = () => { if (page.value < totalPages.value) page.value++; };

    const prevPage = () => { if (page.value > 1) page.value--; };
    const totalAmount = computed(() => (localItems.value || []).filter(i => i.checked && (i.quantity || 0) > 0).reduce((sum, i) => sum + Number(i.price) * (i.quantity || 0), 0));

    async function refreshPriorityState(){
      try {
          const s = await getSettings();
          reserveSlots.value = Number(s?.reserve_slots || 0);
        } catch (e) {
          console.debug('[add-customer] failed to load settings (reserve slots unchanged)', e);
        }
      try {
        const rows = await listQueue({ status: 'pending,waiting,called' });
        priorityCount.value = (rows || []).filter(r => r.is_priority && ['pending','waiting','called'].includes(String(r.status))).length;
      } catch (e) {
        console.debug('[add-customer] failed to fetch queue for priority count (preserving last known value)', e);
      }
    }
    watch(() => props.isOpen, (open) => { if (open) refreshPriorityState(); });
    watch(() => form.value.isPriority, (on) => { if (on) refreshPriorityState(); });

    function canBePriority(){ if (!form.value.isPriority) return true; if (reserveSlots.value <= 0) return false; return priorityCount.value < reserveSlots.value; }
  const validate = () => { errors.value = { customerName: '', contactNumber: '', option: '', partySize: '' }; if (!form.value.customerName || !String(form.value.customerName).trim()) errors.value.customerName = 'Customer name is required'; else if (String(form.value.customerName).trim().length > 10) errors.value.customerName = 'Name must be at most 10 characters'; const phone = String(form.value.contactNumber || '').replace(/\D/g, ''); if (!phone) errors.value.contactNumber = 'Contact number is required'; else if (!(phone.length === 11 && phone.startsWith('09'))) errors.value.contactNumber = 'Enter a valid PH phone (11 digits starting with 09)'; if (!props.isServiceBased && !form.value.option) errors.value.option = 'Select dine-in or take-out'; if (!props.isServiceBased && form.value.option === 'dineIn') { const ps = Number(form.value.partySize || 0); if (!ps || ps < 1) errors.value.partySize = 'Party size must be at least 1'; } return Object.values(errors.value).every(v => !v); };
    const priorityCapReached = computed(() => form.value.isPriority && reserveSlots.value > 0 && priorityCount.value >= reserveSlots.value);
    const canSubmit = computed(() => validate() && totalAmount.value > 0 && canBePriority());
    function clearFieldServerError(){  }
    return { form, formatPeso, localItems, searchTerm, filteredItems, pagedItems, page, totalPages, nextPage, prevPage, totalAmount, errors, reserveSlots, priorityCount, canSubmit, priorityCapReached, firstField, refreshPriorityState, touched, submitAttempted, clearFieldServerError };
  },
  methods: {
    async handleSubmit(){
      try {
        await this.refreshPriorityState();
      } catch (e) {
        void e;
      }
      this.submitAttempted = true;
      if (!this.canSubmit) { return; }
      const selectedItems = (this.localItems || [])
        .filter(i => i.checked && (i.quantity || 0) > 0)
        .map(i => ({ id: i.id, name: i.name, price: i.price, quantity: Math.max(1, Number(i.quantity||1)) }));
      this.form.selectedItems = selectedItems;
      

      this.$emit('add-customer', this.form);

    },
    increaseQuantity(item){ if (!item.quantity) item.quantity = 1; else item.quantity++; item.checked = true; },
    decreaseQuantity(item){ if (item.quantity && item.quantity > 0) item.quantity--; if (item.quantity === 0) item.checked = false; },
    toggleItem(item){ if (item.checked && (!item.quantity || item.quantity === 0)) item.quantity = 1; else if (!item.checked) item.quantity = 0; },
    close(){ 

      this.form = { customerName: '', contactNumber: '', selectedItems: [], notes: '', option: '', partySize: '', isPriority: false };
      this.submitAttempted = false;
      this.touched = { customerName: false, contactNumber: false, option: false, partySize: false };
      
      this.$emit('close'); 
    }
  }
};
</script>

<style scoped>
.add-customer-modal::part(content) {
  max-width: 820px;
  width: 100%;
  max-height: 90vh;
  height: auto;
}

.add-customer-modal ion-radio::part(container) {
  border: 2px solid #FEFAE0;
  width: 18px;
  height: 18px;
}
.add-customer-modal ion-radio.radio-checked::part(container) {
  background: #DDA15E;
  border-color: #DDA15E;
}
.add-customer-modal ion-radio::part(mark) {
  background: #283618;
}

.add-customer-modal ion-toggle {
  --background: rgba(255,255,255,0.18);
  --handle-background: #FEFAE0;
  --background-checked: #DDA15E;
  --handle-background-checked: #FEFAE0;
}
</style>
