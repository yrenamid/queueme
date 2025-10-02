<template>
  <div class="flex justify-center items-center mt-6">
    <div id="poppins" class="text-[#FEFAE0] w-full max-w-[720px] px-4">
      <p class="text-4xl font-bold text-center">{{ businessName }}</p>
      <p class="text-center">Select your items</p>
  <div style="--background: transparent" class="bg-[#fefae0] text-[#283618] rounded-lg p-3 md:p-4 mt-3 shadow-xl">
        <div class="mb-3">
          <p class="font-bold text-xl">Select Items</p>
          <p class="font-light text-xs">Choose what you’d like to order</p>
        </div>

        <form @submit.prevent="submitBtn">
          <div v-for="(item, index) in localItems" :key="index" class="mb-3 p-3 rounded-lg bg-[#454D28] text-white flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex-1 min-w-0">
              <ion-checkbox v-model="item.checked" @ionChange="toggleItem(item)" label-placement="end">
                <p class="font-semibold text-base">{{ item.name }}</p>
                <p class="font-light text-xs opacity-80 overflow-hidden text-ellipsis max-w-[260px] md:max-w-full">{{ item.description }}</p>
              </ion-checkbox>
            </div>
            <div class="flex items-center justify-between sm:justify-end gap-3">
              <p class="text-sm md:text-base min-w-[72px] text-right">{{ formatPeso(item.price) }}</p>
              <div class="bg-transparent border border-gray-500 rounded-md flex items-center">
                <ion-button @click="decreaseQuantity(item)" size="small" fill="clear" class="text-white px-2">-</ion-button>
                <span class="w-8 text-center text-white text-sm md:text-base font-medium">{{ item.quantity || 0 }}</span>
                <ion-button @click="increaseQuantity(item)" size="small" fill="clear" class="text-white px-2">+</ion-button>
              </div>
            </div>
          </div>

          <div class="mb-3">
            <ion-label>Notes</ion-label>
            <ion-textarea id="inter" v-model="form.notes" style="--padding-start: 8px; --highlight-color: none" class="bg-transparent border border-[#283618] rounded-sm font-light min-h-[84px]" placeholder="e.g. No pickles of burgers, extra ketchup"></ion-textarea>
          </div>

          <ion-radio-group v-model="form.option" @ionBlur="touched.option = true">
            <div class="mb-4 flex justify-center gap-8">
              <ion-radio label-placement="end" value="dineIn">Dine In</ion-radio>
              <ion-radio label-placement="end" value="takeOut">Take Out</ion-radio>
            </div>
            <p v-if="(touched.option || submitAttempted) && validationErrors.option" class="text-red-600 text-xs text-center mb-2">{{ validationErrors.option }}</p>
          </ion-radio-group>

          <div v-if="form.option === 'dineIn'" class="flex justify-start mb-3">
            <div><ion-label>Party Size: </ion-label></div>
            <div class="flex-1">
        <ion-input v-model="form.partySize" @ionBlur="touched.partySize = true" type="number" min="1" max="10" class="ms-2 rounded-lg bg-gray-100" style="--color: black; --padding-start: 8px; --highlight-color: none; --background: #cfd7b2; --border-radius: 8px;"></ion-input>
        <p v-if="(touched.partySize || submitAttempted) && validationErrors.partySize" class="text-red-600 text-xs mt-1 ms-2">{{ validationErrors.partySize }}</p>
            </div>
          </div>

          <div class="w-full space-y-2">
            
            <div class="sticky bottom-2 md:static md:bottom-auto">
              <div class="flex items-center justify-between bg-[#283618] text-white rounded-md px-3 py-2 shadow-lg">
                <span class="text-sm md:text-base font-medium">Total</span>
                <span class="text-lg md:text-xl font-bold">{{ formatPeso(runningTotal) }}</span>
              </div>
              <ion-button :disabled="!canSubmit" type="submit" id="poppins" fill="clear" class="normal-case rounded-sm bg-[#283618] text-white w-full font-bold py-2 mt-2 disabled:opacity-60">Submit</ion-button>
              <ion-button id="poppins" @click="goBack" fill="clear" class="normal-case rounded-sm border border-[#283618] text-[#283618] w-full font-bold py-2">Back</ion-button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { IonLabel, IonInput, IonCheckbox, IonButton, IonRadioGroup, IonRadio, IonTextarea } from "@ionic/vue";
import { formatPeso } from "@/utils/currency";

export default {
  name: "CustomerSelectItems",
  components: { IonLabel, IonInput, IonCheckbox, IonButton, IonRadioGroup, IonRadio, IonTextarea },
  props: {
    businessName: { type: String, default: '' },
    customerEmail: String,
    customerNumber: String,
    menuItems: { type: Array, default: () => [] },
    preselected: { type: Array, default: () => [] },
  },
  emits: ["continue", "go-back", "update-customer"],
  // data+methods: manages item selection, quantities, and validation; emits updates
  data() {
    return {
      form: { customerEmail: this.customerEmail || "", customerNumber: this.customerNumber || "", menuItems: [], option: "", notes: "", partySize: "" },
      localItems: [],
      touched: { option: false, partySize: false },
      submitAttempted: false,
    };
  },
  watch: {
    menuItems: {
      immediate: true,
      handler(nv) {
        const selMap = new Map((this.preselected || []).map(i => [i.id, i]));
        this.localItems = (nv || []).map(i => {
          const s = selMap.get(i.id);
          return { ...i, checked: !!s, quantity: s ? Math.max(1, Number(s.quantity || 1)) : 0 };
        });
      }
    },
    preselected: {
      deep: true,
      handler(nv) {

        const selMap = new Map((nv || []).map(i => [i.id, i]));
        this.localItems = (this.localItems || []).map(i => {
          const s = selMap.get(i.id);
          return s ? { ...i, checked: true, quantity: Math.max(1, Number(s.quantity || 1)) } : i;
        });
      }
    }
  },
  methods: {
    formatPeso,
    async submitBtn() {
      this.submitAttempted = true;
      try {
        if (!this.canSubmit) {
          return;
        }

        const selected = this.localItems.filter(i => i.checked);
        const payload = {
          menuItems: selected.map(i => ({ ...i, quantity: Math.max(1, Number(i.quantity || 1)) })),
          waitTime: "50 mins",
          notes: this.form.notes,
          partySize: this.form.partySize,
          option: this.form.option,
        };
        this.$emit("update-customer", payload);
        this.$emit("continue", payload);
  } catch (error) { console.debug('[select-items] submit failed', error); }
    },
    decreaseQuantity(item) { if (item.quantity && item.quantity > 0) { item.quantity--; } if (item.quantity === 0) { item.checked = false; } },
    increaseQuantity(item) { if (!item.quantity) { item.quantity = 1; } else { item.quantity++; } item.checked = true; },
    toggleItem(item) { if (item.checked && !item.quantity) { item.quantity = 1; } else if (!item.checked) { item.quantity = 0; } },
    goBack() { this.$emit("go-back"); },
  },
  computed: {
    runningTotal() {
      return (this.localItems || [])
        .filter(i => i.checked && (Number(i.quantity) || 0) > 0)
        .reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
    },
    hasSelection() {
      return (this.localItems || []).some(i => i.checked && (Number(i.quantity) || 0) > 0);
    },
    validationErrors() {
      const errors = { option: '', partySize: '' };
      

      if (!this.form.option) {
        errors.option = 'Please select Dine In or Take Out';
      }
      

      if (this.form.option === 'dineIn') {
        const partySize = Number(this.form.partySize);
        if (!this.form.partySize || isNaN(partySize) || partySize < 1) {
          errors.partySize = 'Party size is required for dine-in';
        } else if (partySize > 10) {
          errors.partySize = 'Party size cannot exceed 10 people';
        }
      }
      
      return errors;
    },
    canSubmit() {
      const hasErrors = Object.values(this.validationErrors).some(error => error);
      return this.hasSelection && !hasErrors;
    }
  },
};
</script>

<style scoped>
ion-radio {
  --color: #283618 !important; 
}

ion-radio::part(container) {
  border: 2px solid #283618 !important; 
  border-radius: 50%;
}
</style>
