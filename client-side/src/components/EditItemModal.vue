<template>
  <ion-modal class="custom-modal" :is-open="isOpen" :backdrop-dismiss="false">
    <div id="poppins" class="bg-[#283618] p-3 text-[#FEFAE0]">
      <div class="flex justify-between mb-3">
        <div>
          <p class="font-bold text-xl">Edit Item</p>
          <p class="font-light text-sm">Update item details and save.</p>
        </div>
        <div>
          <font-awesome-icon
            :icon="['fas', 'xmark']"
            @click="close"
            class="text-3xl"
          />
        </div>
      </div>

      <form @submit.prevent="saveChanges">
        <div class="mb-3">
          <ion-label class="text-sm">Item Name</ion-label>
          <ion-input
            v-model="localItem.name"
            :maxlength="20"
            @ionBlur="touched.name = true"
            class="bg-[#FEFAE0] border border-[#DDA15E] rounded-sm"
            placeholder="e.g. Haircut, Burger Combo"
            style="--padding-start: 8px; --highlight-color: none"
          ></ion-input>
          <div class="text-[11px] text-white/70 text-right mt-1">{{ (localItem.name || '').length }} / 20</div>
          <p v-if="(touched.name || submitAttempted) && errors.name" class="text-red-400 text-xs mt-1">{{ errors.name }}</p>
        </div>

        <div class="mb-3">
          <ion-label class="text-sm">Category</ion-label>
          <ion-select
            v-model="localItem.category"
            @ionBlur="touched.category = true"
            class="w-full border border-[#DDA15E] rounded-sm bg-[#FEFAE0]"
            placeholder="Select Category"
            value="default"
            interface="popover"
            style="--highlight-color: none; --padding-start: 8px"
          >
          <ion-select-option value="Appetizers">Appetizers</ion-select-option>
            <ion-select-option value="Main Courses">Main Courses</ion-select-option>
            <ion-select-option value="Side Dishes">Side Dishes</ion-select-option>
            <ion-select-option value="Snacks">Snacks</ion-select-option>
            <ion-select-option value="Desserts">Desserts</ion-select-option>
            <ion-select-option value="Hot Drinks">Hot Drinks</ion-select-option>
            <ion-select-option value="Cold Drinks">Cold Drinks</ion-select-option>
            <ion-select-option value="Seasonal / Specials">Seasonal / Specials</ion-select-option>

          </ion-select>
          <p v-if="(touched.category || submitAttempted) && errors.category" class="text-red-400 text-xs mt-1">{{ errors.category }}</p>
        </div>

        <div class="mb-3">
          <ion-label class="text-sm">Item Description</ion-label>
          <ion-textarea
            v-model="localItem.description"
            :maxlength="40"
            class="w-full bg-[#FEFAE0] border border-[#DDA15E] rounded-sm"
            placeholder="Enter Short Description here"
            style="--highlight-color: none; --padding-start: 8px"
          ></ion-textarea>
          <div class="text-[11px] text-white/70 text-right mt-1">{{ (localItem.description || '').length }} / 40</div>
        </div>

        <div class="mb-3">
          <ion-label class="text-sm">Price (₱)</ion-label>
          <ion-input
            v-model="localItem.price"
            @ionBlur="touched.price = true"
            type="number"
            inputmode="decimal"
            step="0.01"
            class="w-full bg-[#FEFAE0] border border-[#DDA15E] rounded-sm"
            placeholder="e.g. 150.00"
            style="--highlight-color: none; --padding-start: 8px"
          ></ion-input>
          <p v-if="(touched.price || submitAttempted) && errors.price" class="text-red-400 text-xs mt-1">{{ errors.price }}</p>
        </div>

        <div class="mb-3">
          <ion-label class="text-sm">Duration (in minutes)</ion-label>
          <ion-input
            v-model="localItem.duration"
            @ionBlur="touched.duration = true"
            type="number"
            class="w-full bg-[#FEFAE0] border border-[#DDA15E] rounded-sm"
            placeholder="e.g. 30"
            style="--highlight-color: none; --padding-start: 8px"
          ></ion-input>
        </div>

        

        <ion-button
          type="submit"
          :disabled="!isValid"
          fill="clear"
          class="bg-[#DDA15E] w-full rounded-sm normal-case text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >Save Changes</ion-button>
      </form>
    </div>
  </ion-modal>
</template>

<script>
import {
  IonModal,
  IonInput,
  IonLabel,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonTextarea
} from "@ionic/vue";
import { watch, reactive, ref } from "vue";
import { useCatalogItemValidation } from '@/composables/useCatalogItemValidation';

export default {
  name: "EditItemModal",
  components: {
    IonModal,
    IonInput,
    IonLabel,
    IonButton,
    IonSelect,
    IonSelectOption,
    IonTextarea
  },
  props: {
    isOpen: Boolean,
    item: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ["close", "update-item"],

  setup(props) {
  const localItem = reactive({ name:'', category:'', description:'', price:'', duration:'' });
  const touched = ref({ name: false, category: false, price: false, duration: false });
  const submitAttempted = ref(false);
    watch(()=> props.item, (val)=> { Object.assign(localItem, val || {}); }, { immediate:true, deep:true });
    const { errors, isValid, validate } = useCatalogItemValidation(localItem, { requireCategory:true, requireDuration:true, minPrice:0, minDuration:1 });
    watch(localItem, validate, { deep:true });
    
  return { localItem, errors, isValid, touched, submitAttempted };
  },
  methods: {
    close() {
      this.$emit("close");
    },
    saveChanges() {
      this.submitAttempted = true;
      if(!this.isValid) return;
  this.$emit("update-item", { ...this.localItem, price: Number(this.localItem.price), duration: Number(this.localItem.duration) });
      this.submitAttempted = false;
      this.touched = { name: false, category: false, price: false, duration: false };
      this.close();
    },
  },
};
</script>

<style scoped>
ion-input, ion-textarea, ion-select{
    color: #283618;
}
</style>
