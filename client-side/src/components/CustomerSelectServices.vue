<template>
  <div class="flex justify-center items-center mt-6">
    <div id="poppins" class="text-[#FEFAE0] w-full max-w-[720px] px-4">
      <p class="text-4xl font-bold text-center">{{ businessName }}</p>
      <p class="text-center">Select your services</p>
  <div style="--background: transparent" class="bg-[#fefae0] text-[#283618] rounded-lg p-3 md:p-4 mt-3 shadow-xl">
        <div class="mb-3">
          <p class="font-bold text-xl">Select Services</p>
          <p class="font-light text-xs">Choose what you’d like to avail</p>
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
            <ion-textarea id="inter" v-model="form.notes" style="--padding-start: 8px; --highlight-color: none" class="bg-transparent border border-[#283618] rounded-sm font-light min-h-[84px]" placeholder="e.g. Any special instructions"></ion-textarea>
          </div>

          <p v-if="submitAttempted && !hasSelection" class="text-red-600 text-xs mb-2">Please select at least one service.</p>

          <div class="w-full space-y-2">
            <div class="sticky bottom-2 md:static md:bottom-auto">
              <div class="flex items-center justify-between bg-[#283618] text-white rounded-md px-3 py-2 shadow-lg">
                <span class="text-sm md:text-base font-medium">Total</span>
                <span class="text-lg md:text-xl font-bold">{{ formatPeso(runningTotal) }}</span>
              </div>
              <ion-button :disabled="!hasSelection" type="submit" id="poppins" fill="clear" class="normal-case rounded-sm bg-[#283618] text-white w-full font-bold py-2 mt-2 disabled:opacity-60">Submit</ion-button>
              <ion-button id="poppins" @click="goBack" fill="clear" class="normal-case rounded-sm border border-[#283618] text-[#283618] w-full font-bold py-2">Back</ion-button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { IonLabel, IonCheckbox, IonButton, IonTextarea } from "@ionic/vue";
import { formatPeso } from "@/utils/currency";

export default {
  name: "CustomerSelectServices",
  components: { IonLabel, IonCheckbox, IonButton, IonTextarea },
  props: {
    businessName: { type: String, default: '' },
    customerEmail: String,
    customerNumber: String,
    services: { type: Array, default: () => [] },
    preselected: { type: Array, default: () => [] },
  },
  emits: ["continue", "go-back", "update-customer"],
  data() {
    return {
      form: { customerEmail: this.customerEmail || "", customerNumber: this.customerNumber || "", services: [], notes: "" },
      localItems: [],
      submitAttempted: false,
    };
  },
  watch: {
    services: {
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
      try {
        this.submitAttempted = true;
        const selected = this.localItems.filter(i => i.checked);
        if (selected.length === 0) {
          return;
        }
        const payload = {
          services: selected.map(i => ({ ...i, quantity: Math.max(1, Number(i.quantity || 1)) })),
          notes: this.form.notes,
        };
        this.$emit("update-customer", payload);
        this.$emit("continue", payload);
      } catch (error) { console.log(error); }
    },
    decreaseQuantity(item) { if (item.quantity && item.quantity > 0) { item.quantity--; } if (item.quantity === 0) { item.checked = false; } },
    increaseQuantity(item) { if (!item.quantity) { item.quantity = 1; } else { item.quantity++; } item.checked = true; },
    toggleItem(item) { if (item.checked && !item.quantity) { item.quantity = 1; } else if (!item.checked) { item.quantity = 0; } },
    goBack() { this.$emit("go-back"); },
  },
  computed: {
    hasSelection() {
      return (this.localItems || []).some(i => i.checked && (Number(i.quantity) || 0) > 0);
    },
    runningTotal() {
      return (this.localItems || [])
        .filter(i => i.checked && (Number(i.quantity) || 0) > 0)
        .reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
    }
  },
};
</script>

<style scoped>
</style>
