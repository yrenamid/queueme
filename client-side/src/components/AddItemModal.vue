<template>
  <ion-modal class="custom-modal" :is-open="isOpen" :backdrop-dismiss="false">
    <div id="poppins" class="bg-[#283618] p-3 text-[#FEFAE0]">
      <div class="flex justify-between">
        <div class="mb-3">
          <p class="font-bold text-xl">Add Menu Item</p>
          <p class="font-light text-sm">Enter details below to list a new service or product.</p>
        </div>
        <div>
          <font-awesome-icon :icon="['fas', 'xmark']" @click="close" class="text-3xl" />
        </div>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="mb-3">
          <ion-label class="text-sm">Item Name</ion-label>
          <ion-input v-model="form.name" :maxlength="20" @ionBlur="touched.name = true" class="bg-transparent border border-[#DDA15E] rounded-sm" placeholder="e.g. Haircut, Burger Combo" style="--padding-start: 8px; --highlight-color: none"></ion-input>
          <div class="text-[11px] text-white/70 text-right mt-1">{{ (form.name || '').length }} / 20</div>
          <p v-if="(touched.name || submitAttempted) && errors.name" class="text-red-400 text-xs mt-1">{{ errors.name }}</p>
        </div>

        <div class="mb-3">
          <ion-label class="text-sm">Category</ion-label>
          <ion-select v-model="form.category" @ionBlur="touched.category = true" interface="popover" class="w-full border border-[#DDA15E] rounded-sm" placeholder="Select Category" style="--highlight-color: none; --padding-start: 8px">
            <ion-select-option v-for="c in categories" :key="c" :value="c">{{ c }}</ion-select-option>
          </ion-select>
          <p v-if="(touched.category || submitAttempted) && errors.category" class="text-red-400 text-xs mt-1">{{ errors.category }}</p>
        </div>

        <div class="mb-3">
          <ion-label class="text-sm">Item Description</ion-label>
          <ion-textarea v-model="form.description" :maxlength="40" class="w-full border border-[#DDA15E] rounded-sm" placeholder="Enter Short Description here" style="--highlight-color: none; --padding-start: 8px"></ion-textarea>
          <div class="text-[11px] text-white/70 text-right mt-1">{{ (form.description || '').length }} / 40</div>
        </div>

        <div class="mb-3">
          <ion-label class="text-sm">Price (₱)</ion-label>
          <ion-input v-model="form.price" @ionBlur="touched.price = true" type="number" inputmode="decimal" step="0.01" class="w-full border border-[#DDA15E] rounded-sm" placeholder="e.g. 150.00" style="--highlight-color: none; --padding-start: 8px"></ion-input>
          <p v-if="(touched.price || submitAttempted) && errors.price" class="text-red-400 text-xs mt-1">{{ errors.price }}</p>
        </div>

        <div class="mb-3">
          <ion-label class="text-sm">Duration (in minutes)</ion-label>
          <ion-input v-model="form.duration" @ionBlur="touched.duration = true" type="number" class="w-full border border-[#DDA15E] rounded-sm" placeholder="e.g. 30" style="--highlight-color: none; --padding-start: 8px"></ion-input>
        </div>

        <div class="mb-3 flex items-center gap-3">
          <ion-label class="text-sm">Available</ion-label>
          <ion-toggle v-model="form.available" class="modern-toggle" color="tertiary" />
        </div>

        <ion-button type="submit" :disabled="!isValid" fill="clear" class="bg-[#DDA15E] w-full rounded-sm normal-case text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed">Submit</ion-button>
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
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonToggle
} from "@ionic/vue";
import { ref } from 'vue';
import { useCatalogItemValidation } from '@/composables/useCatalogItemValidation';

export default {
  name: "AddItemModal",
  components: { IonModal, IonInput, IonLabel, IonButton, IonTextarea, IonSelect, IonSelectOption, IonToggle },
  props: {
    isOpen: Boolean,
  },
  setup(){
    const categories = ['Meals','Drinks','Snacks','Desserts','Sides','Specials'];
    const form = ref({ name: '', category: null, description:'', price:'', duration:'', available: true });
    const touched = ref({ name: false, category: false, price: false, duration: false });
    const submitAttempted = ref(false);
    const { errors, isValid } = useCatalogItemValidation(form.value, { requireCategory: true, requireDuration: true, minPrice:0, minDuration:1 });
  return { form, categories, errors, isValid, touched, submitAttempted };
  },
  methods: {
    handleSubmit(){
      this.submitAttempted = true;
      if(!this.isValid) return;
    const payload = { ...this.form, price: Number(this.form.price), duration: Number(this.form.duration), available: this.form.available };
      this.$emit('add-item', payload);
    Object.assign(this.form, { name:'', category:null, description:'', price:'', duration:'', available:true });
    this.submitAttempted = false;
    this.touched = { name: false, category: false, price: false, duration: false };
      this.$emit('close');
    },
    close() {
      this.$emit("close");
    },
  },
};
</script>

<style scoped>
.custom-modal ion-toggle.modern-toggle { --width: 46px; --height: 26px; --handle-width: 22px; --handle-height: 22px; --handle-box-shadow: 0 1px 2px rgba(0,0,0,0.25); --track-background: rgba(255,255,255,0.18); --track-background-checked: #DDA15E; --background: rgba(255,255,255,0.18); --background-checked: #DDA15E; --handle-background: #FEFAE0; --handle-background-checked: #FEFAE0; }
.custom-modal ion-toggle.modern-toggle::part(track) { border-radius: 9999px; transition: background-color .2s ease; }
.custom-modal ion-toggle.modern-toggle::part(handle) { border-radius: 9999px; transition: transform .2s ease; }
</style>
