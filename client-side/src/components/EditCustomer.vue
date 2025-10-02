<template>
  <ion-modal class="custom-modal edit-customer-modal" :is-open="isOpen" :backdrop-dismiss="false">
    <div id="inter" class="bg-[#283618] p-3 text-white">
      <div class="flex justify-between items-start mb-2">
        <div>
          <p class="font-bold text-xl">Edit Customer</p>
          <p class="font-light text-sm">Update details and adjust items</p>
        </div>
        <font-awesome-icon :icon="['fas', 'xmark']" @click="close" class="text-2xl" />
      </div>
      <form @submit.prevent="handleSubmit" class="grid md:grid-cols-2 gap-3">
        
        <div class="space-y-3">
          <div>
            <ion-label class="text-sm">Name</ion-label>
            <ion-input v-model="localCustomer.customerName" :maxlength="10" id="inter" class="bg-[#ffffff96] rounded-sm font-light" placeholder="Enter name"></ion-input>
            <div class="text-[11px] text-white/70 text-right mt-1">{{ (localCustomer.customerName || '').length }} / 10</div>
            <p v-if="errors.customerName" class="text-red-600 text-xs mt-1">{{ errors.customerName }}</p>
          </div>
          <div>
            <ion-label class="text-sm">Phone Number</ion-label>
            <ion-input v-model="localCustomer.contactNumber" type="tel" inputmode="tel" id="inter" class="bg-[#ffffff96] rounded-sm font-light" placeholder="Enter phone number"></ion-input>
            <p v-if="errors.contactNumber" class="text-red-600 text-xs mt-1">{{ errors.contactNumber }}</p>
          </div>
          <div>
            <ion-label class="text-sm">Notes</ion-label>
            <ion-textarea id="inter" v-model="localCustomer.notes" :maxlength="40" class="bg-[#ffffff96] rounded-sm font-light" placeholder="e.g. No pickles on burgers, extra ketchup"></ion-textarea>
            <div class="text-[11px] text-white/70 text-right mt-1">{{ (localCustomer.notes || '').length }} / 40</div>
          </div>
          <div v-if="!isServiceBased">
            <ion-label class="text-sm">Service Option</ion-label>
            <div class="text-sm my-2">
              <ion-radio-group v-model="localCustomer.option" class="flex items-center gap-5">
                <ion-radio label-placement="end" value="dineIn">Dine In</ion-radio>
                <ion-radio label-placement="end" value="takeOut">Take Out</ion-radio>
              </ion-radio-group>
            </div>
            <p v-if="errors.option" class="text-red-600 text-xs mt-1">{{ errors.option }}</p>
          </div>
          <div v-if="!isServiceBased && localCustomer.option === 'dineIn'">
            <ion-label class="text-sm">Party Size</ion-label>
            <ion-input type="number" v-model="localCustomer.partySize" class="bg-gray-100 rounded-sm" style="--color: black; --highlight-color: none"></ion-input>
            <p v-if="errors.partySize" class="text-red-600 text-xs mt-1">{{ errors.partySize }}</p>
          </div>
          <div class="flex items-center justify-between">
            <ion-label class="text-sm">Priority customer</ion-label>
            <ion-toggle v-model="localCustomer.isPriority" :disabled="priorityDisabled" color="warning"></ion-toggle>
          </div>
          
          <div class="flex items-center justify-between mt-2">
            <p class="text-sm font-semibold">Total: {{ formatPeso(totalAmount) }}</p>
            <ion-button type="submit" :disabled="!canSubmit" fill="clear" class="bg-[#DDA15E] w-full md:w-auto rounded-sm normal-case text-white font-bold disabled:opacity-60">Save</ion-button>
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
import {
  IonModal,
  IonCheckbox,
  IonInput,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonButton,
  IonTextarea,
  IonToggle,
} from "@ionic/vue";
// Modal to edit a customer's details and adjust selected items/services with pagination and validation.
import { ref, computed, reactive, watch } from "vue";
import { formatPeso } from "../utils/currency";
import { getSettings, listQueue } from '@/services/api';
import { useToast } from '@/composables/useToast';

export default {
    name: 'EditCustomer',
    components: {
        IonModal,
        IonCheckbox,
        IonInput,
        IonLabel,
        IonRadioGroup,
        IonRadio,
  IonButton,
  IonTextarea,
  IonToggle
    },
    props: {
        isOpen: Boolean,
        customer: {
          type: Object,
          default: () => ({})
        },
        menuItems: { type: Array, default: () => [] },
        isServiceBased: { type: Boolean, default: false }
    },
    emits: ['close', 'update-customer'],

// Initializes component state and handlers
    setup(props){
      const { toast } = useToast();
      const localCustomer = reactive({
        customerName: '',
        contactNumber: '',
        notes: '',
        option: '',
        partySize: '',
        isPriority: false,
      });


      const localItems = ref([]);
      const page = ref(1);
      const pageSize = ref(6);
      const searchTerm = ref('');
  const errors = ref({ customerName: '', contactNumber: '', option: '', partySize: '' });


// Handles reset Local Items
      const resetLocalItems = (src, selected) => {
        const selectedMap = new Map((selected||[]).map(i => [i.id ?? i.name, i]));
        // Handles arr
        const arr = (src || []).filter(i => i.is_available || i.available)
          .map(i => {
            const s = selectedMap.get(i.id ?? i.name);
            const quantity = s ? Number(s.quantity)||1 : 0;
            const checked = !!s;
            return { ...i, checked, quantity };
          });
        localItems.value = arr;
        page.value = 1;
      };

      watch(() => props.customer, (nv) => {
        Object.assign(localCustomer, nv || {});

        if (!props.isServiceBased && nv && typeof nv.option !== 'undefined') {
          localCustomer.option = nv.option;
        }
        resetLocalItems(props.menuItems, (nv||{}).menuItems);
      }, { immediate: true, deep: true });
      watch(() => props.menuItems, (nv) => { resetLocalItems(nv, localCustomer.menuItems); }, { immediate: true });
      watch(() => props.isOpen, (open) => { if (open) resetLocalItems(props.menuItems, localCustomer.menuItems); });

      const filteredItems = computed(() => {
        // Handles q
        const q = (searchTerm.value || '').toLowerCase();
        if (!q) return localItems.value;
        return localItems.value.filter(i => (i.name && i.name.toLowerCase().includes(q)) || (i.description && i.description.toLowerCase().includes(q)));
      });
      const totalPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / pageSize.value)));
      const pagedItems = computed(() => filteredItems.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));

// Handles next Page
      const nextPage = () => { if (page.value < totalPages.value) page.value++; };

// Handles prev Page
      const prevPage = () => { if (page.value > 1) page.value--; };

      const totalAmount = computed(() => {
        return (localItems.value || [])
          .filter(i => i.checked && (i.quantity || 0) > 0)
          .reduce((sum, i) => sum + Number(i.price) * (i.quantity || 0), 0);
      });



  const reserveSlots = ref(0);
  const priorityCount = ref(0);

// Handles refresh Priority State
      async function refreshPriorityState(){
  try { const s = await getSettings(); reserveSlots.value = Number(s?.reserve_slots || 0); } catch(e){ console.error('[EditCustomer] getSettings', e); }
        try {
          const rows = await listQueue();
          priorityCount.value = (rows || []).filter(r => r.is_priority && ['pending','waiting','called'].includes(String(r.status))).length;
        } catch(e){ console.error('[EditCustomer] listQueue', e); }
      }
      watch(() => props.isOpen, (open) => { if (open) refreshPriorityState(); });


// Handles can Be Priority
      function canBePriority(){
        if (!localCustomer.isPriority) return true;
        if (reserveSlots.value <= 0) return false;

        const currentlyPriority = !!(props.customer && props.customer.isPriority);
        if (currentlyPriority) return true;
        return priorityCount.value < reserveSlots.value;
      }

      const priorityDisabled = computed(() => {
        if (reserveSlots.value <= 0) return true;
        const currentlyPriority = !!(props.customer && props.customer.isPriority);
        if (currentlyPriority) return false; // allow turning off/on when already priority
        return priorityCount.value >= reserveSlots.value;
      });


      watch(() => localCustomer.isPriority, (nv) => {
        if (nv && !canBePriority()) {
          localCustomer.isPriority = false;
          toast('Priority slots are full', 'error');
        }
      });


// Handles validate
      const validate = () => {
        errors.value = { customerName: '', contactNumber: '', option: '', partySize: '' };
  if (!localCustomer.customerName?.trim()) errors.value.customerName = 'Customer name is required';
  else if (String(localCustomer.customerName).trim().length > 10) errors.value.customerName = 'Name must be at most 10 characters';
        const phone = String(localCustomer.contactNumber || '').replace(/\D/g, '');
        if (!phone) errors.value.contactNumber = 'Contact number is required';
        else if (!(phone.length === 11 && phone.startsWith('09'))) errors.value.contactNumber = 'Enter a valid PH phone (11 digits starting with 09)';
        if (!props.isServiceBased && !localCustomer.option) errors.value.option = 'Select dine-in or take-out';
        if (!props.isServiceBased && localCustomer.option === 'dineIn') {
          const ps = Number(localCustomer.partySize || 0);
          if (!ps || ps < 1) errors.value.partySize = 'Party size must be at least 1';
        }
        return Object.values(errors.value).every(v => !v);
      };

  const canSubmit = computed(() => validate() && totalAmount.value > 0 && canBePriority());

      return {
        localCustomer,
        formatPeso,
        localItems,
        searchTerm,
        filteredItems,
        pagedItems,
        page,
        totalPages,
        nextPage,
        prevPage,
        totalAmount,
        errors,
        canSubmit,
        priorityDisabled,
        toast,

        
      };
    },
    methods: {
      close() {
        this.$emit('close')
      },
      handleSubmit(){
        if (!this.canSubmit) {
          if (this.localCustomer.isPriority) this.toast('Priority slots are full', 'error');
          return;
        }

        // Handles uiItems
        const uiItems = (this.localItems || [])
          .filter(i => i.checked && (i.quantity || 0) > 0)
          .map(i => ({ id: i.id, name: i.name, price: Number(i.price)||0, quantity: Math.max(1, Number(i.quantity||1)), ...(i.duration != null ? { duration: Number(i.duration) } : {}) }));

        const uiPayload = {
          customerName: this.localCustomer.customerName,
          contactNumber: this.localCustomer.contactNumber,
          notes: this.localCustomer.notes || undefined,

          partySize: (!this.isServiceBased && this.localCustomer.option === 'dineIn') ? Number(this.localCustomer.partySize || 0) : null,
          isPriority: !!this.localCustomer.isPriority,
          menuItems: uiItems,
          option: this.localCustomer.option
        };
        this.$emit('update-customer', uiPayload);
        this.$emit('close');
      },
        
      increaseQuantity(item) {
        if (!item.quantity) item.quantity = 1;
        else item.quantity++;
        item.checked = true;
      },

      decreaseQuantity(item) {
        const q = Number(item.quantity||0);
        if (q > 0) item.quantity = q - 1;
        if (item.quantity <= 0) { item.quantity = 0; item.checked = false; }
      },
      toggleItem(item){
        if (item.checked && (!item.quantity || item.quantity === 0)) {
          item.quantity = 1;
        } else if (!item.checked) {
          item.quantity = 0;
        }
      }

    }
}
</script>

<style scoped>
ion-radio{
  --color: #DDA15E;
  --color-checked: #DDA15E;
}
</style>

<style>
.edit-customer-modal::part(content) {
  max-width: 820px;
  width: 100%;
  max-height: 90vh;
  height: auto;
}
</style>